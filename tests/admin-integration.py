#!/usr/bin/env python3
"""HTTP integration test against a disposable MySQL database, never the site's DB."""
import argparse
import getpass
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent


def run():
    parser = argparse.ArgumentParser(description='Проверка PHP-админки в отдельной временной базе.')
    parser.add_argument('--user', default='root')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=3306)
    args = parser.parse_args()
    php, mysql = shutil.which('php'), shutil.which('mysql')
    if not php or not mysql:
        sys.exit('Для HTTP-проверки нужны PHP CLI и клиент mysql. Проверка не выполнена.')
    password = getpass.getpass('Пароль MySQL для теста (Enter, если пустой): ')
    database = 'spektr_admin_test_' + secrets.token_hex(6)
    admin_password = secrets.token_urlsafe(24)

    def sql_text(value):
        return "CONVERT(X'" + value.encode('utf-8').hex() + "' USING utf8mb4)"

    with tempfile.TemporaryDirectory(prefix='spektr-admin-test-') as temp:
        directory = Path(temp)
        defaults = directory / 'mysql.cnf'
        defaults.touch(mode=0o600)
        escaped = password.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r')
        defaults.write_text('[client]\npassword="' + escaped + '"\n', encoding='utf-8')
        command = [mysql, f'--defaults-extra-file={defaults}', '--default-character-set=utf8mb4', f'--host={args.host}', f'--port={args.port}', f'--user={args.user}']

        def sql(source, selected=None):
            result = subprocess.run(command + ([selected] if selected else []), input=source, text=True, capture_output=True)
            if result.returncode:
                lines = [line for line in result.stderr.splitlines() if line.startswith('ERROR ')]
                raise RuntimeError('\n'.join(lines) or 'MySQL test error')

        process = None
        created = False
        try:
            sql(f'CREATE DATABASE `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
            created = True
            sql((ROOT / 'database/init.sql').read_text(encoding='utf-8'), database)
            hashed = subprocess.run([php, '-r', 'echo password_hash(stream_get_contents(STDIN), PASSWORD_BCRYPT);'], input=admin_password, text=True, capture_output=True, check=True).stdout
            sql("INSERT INTO admins (login,password_hash) VALUES ('integration'," + sql_text(hashed) + ');', database)
            with socket.socket() as probe:
                probe.bind(('127.0.0.1', 0))
                port = probe.getsockname()[1]
            environment = dict(os.environ, SPEKTR_DB_NAME=database, SPEKTR_DB_USER=args.user, SPEKTR_DB_HOST=args.host, SPEKTR_DB_PORT=str(args.port), SPEKTR_DB_PASSWORD=password, SPEKTR_DB_SOCKET='', SPEKTR_ADMIN_STATE_DIR=str(directory / 'login'))
            sessions = directory / 'sessions'
            sessions.mkdir()
            log = (directory / 'php.log').open('w+')
            process = subprocess.Popen([php, '-d', f'session.save_path={sessions}', '-S', f'127.0.0.1:{port}', '-t', str(ROOT), str(ROOT / 'tools/php-router.php')], cwd=ROOT, env=environment, stdout=log, stderr=log)
            opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
            base = f'http://127.0.0.1:{port}'
            csrf_token = ''

            def http(route, payload=None, token=True, headers=None):
                extra = headers or {}
                data = None
                if payload is not None:
                    data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
                    extra = {**extra, 'Content-Type': 'application/json'}
                    if token:
                        extra['X-CSRF-Token'] = csrf_token
                request = urllib.request.Request(base + route, data=data, headers=extra)
                try:
                    response = opener.open(request, timeout=10)
                except urllib.error.HTTPError as error:
                    response = error
                source = response.read()
                return response.status, json.loads(source) if 'application/json' in response.headers.get('Content-Type', '') else source

            def api(action, payload=None, suffix='', token=True):
                if payload is None:
                    return http('/admin/api.php?action=' + action + suffix)
                return http('/admin/api.php', {'action': action, **payload}, token)

            for attempt in range(50):
                try:
                    status, session = api('session')
                    assert status == 200
                    break
                except (urllib.error.URLError, ConnectionError):
                    if process.poll() is not None:
                        raise RuntimeError('PHP server failed to start')
                    time.sleep(.1)
            else:
                raise RuntimeError('PHP server startup timed out')
            csrf_token = session['csrf']
            assert api('pages', suffix='&section=about')[0] == 401
            assert api('login', {'login':'integration', 'password':admin_password}, token=False)[0] == 403
            assert api('login', {'login':'integration', 'password':'incorrect'})[0] == 401
            status, authenticated = api('login', {'login':'integration', 'password':admin_password})
            assert status == 200 and authenticated['admin']['login'] == 'integration'
            csrf_token = authenticated['csrf']
            assert len(api('sections')[1]['sections']) == 12
            assert api('pages', suffix='&section=admins')[0] == 404
            page = {'path':'/about/integration-test/', 'title':"Проверка O'Brien", 'seo_title':'SEO title', 'seo_description':'Тестовое описание', 'canonical_url':'https://spektr-okna.ru/about/integration-test/', 'content':{'main_html':'<main><h1>Тест</h1></main>', 'nested':{}}, 'is_published':False}
            status, saved = api('save', {'section':'about', 'id':0, 'page':page})
            assert status == 200, saved
            first = saved['page']
            assert first['content']['nested'] == {} and first['title'] == page['title']
            assert api('save', {'section':'about', 'id':0, 'page':page})[0] == 409
            page['title'] = 'Обновлённый заголовок'
            page['seo_title'] = 'Updated SEO'
            page['seo_description'] = 'Updated description'
            page['content']['main_html'] = '<main>Updated</main>'
            status, updated = api('save', {'section':'about', 'id':first['id'], 'version':first['version'], 'page':page})
            assert status == 200, updated
            current = updated['page']
            for key in page:
                assert current[key] == page[key], key
            assert api('save', {'section':'about', 'id':first['id'], 'version':first['version'], 'page':page})[0] == 409
            assert api('delete', {'section':'about', 'id':first['id'], 'version':first['version']})[0] == 409
            assert api('delete', {'section':'about', 'id':current['id'], 'version':current['version']})[0] == 200
            assert api('page', suffix='&section=about&id=' + str(current['id']))[0] == 404
            for route in ['/database/init.sql', '/.data/admin-config.php', '/admin/lib/app.php', '/tools/setup-database.py']:
                assert http(route)[0] == 404, route
            video = next((ROOT / 'assets').glob('*.mp4'), None)
            if video:
                status, chunk = http('/assets/' + video.name, headers={'Range':'bytes=0-15'})
                assert status == 206 and len(chunk) == 16
            assert api('logout', {})[0] == 200
            assert api('sections')[0] == 401
            print('OK: login, CSRF, CRUD, duplicate paths, stale edits, private files, video ranges and logout.')
        finally:
            if process:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
            if created:
                # The name is generated above, never accepted from arguments/configuration.
                sql(f'DROP DATABASE `{database}`;')


if __name__ == '__main__':
    run()
