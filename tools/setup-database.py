#!/usr/bin/env python3
"""Create and seed MySQL; passwords are prompted, never put in command arguments."""
import argparse
import getpass
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent


def bcrypt_hash(password):
    php = shutil.which('php')
    if php:
        command = [php, '-r', '$p = stream_get_contents(STDIN); echo password_hash($p, PASSWORD_BCRYPT, ["cost" => 12]);']
        result = subprocess.run(command, input=password, text=True, capture_output=True, check=True)
        value = result.stdout.strip()
    else:
        htpasswd = shutil.which('htpasswd')
        if not htpasswd:
            raise ValueError('Для хеширования нужен PHP CLI или htpasswd (на macOS есть /usr/sbin/htpasswd).')
        result = subprocess.run([htpasswd, '-niB', '-C', '12', 'admin'], input=password + '\n', text=True, capture_output=True, check=True)
        value = result.stdout.strip().split(':', 1)[-1]
    if not re.fullmatch(r'\$2[aby]\$12\$[./A-Za-z0-9]{53}', value):
        raise ValueError('Не удалось получить bcrypt-хеш администратора.')
    return value


def option_value(value):
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t') + '"'


def sql_text(value):
    # Independent of the connection's sql_mode; passwords never enter SQL as plaintext.
    return "CONVERT(X'" + value.encode('utf-8').hex() + "' USING utf8mb4)"


def main():
    parser = argparse.ArgumentParser(description='Создание и наполнение MySQL для сайта «Спектр».')
    parser.add_argument('--database', default='spektr_okna')
    parser.add_argument('--user', default='root', help='Пользователь MySQL; по умолчанию root')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=3306)
    parser.add_argument('--socket', help='Подключиться через Unix socket вместо TCP')
    parser.add_argument('--existing-database', action='store_true', help='Не создавать БД (например, на хостинге)')
    parser.add_argument('--admin-login', default='admin')
    parser.add_argument('--no-admin', action='store_true', help='Только импорт страниц, без создания администратора')
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_]{1,64}', args.database):
        parser.error('Имя БД: 1–64 латинских буквы, цифры или подчёркивания.')
    if not re.fullmatch(r'[A-Za-z0-9_.-]{1,64}', args.admin_login):
        parser.error('Логин: 1–64 латинских буквы, цифры или символы _ . -')
    mysql = shutil.which('mysql')
    if not mysql:
        parser.error('Клиент mysql не найден. Установите MySQL и добавьте его в PATH.')
    if not sys.stdin.isatty():
        parser.error('Запустите скрипт в терминале: пароли вводятся скрыто.')
    seed_file = ROOT / 'database/init.sql'
    if not seed_file.is_file():
        parser.error('Нет database/init.sql. Сначала выполните node tools/build-database.js.')

    db_password = getpass.getpass(f'Пароль MySQL для {args.user} (Enter, если пустой): ')
    # This temporary file is owner-readable only and is removed even on an error.
    with tempfile.TemporaryDirectory(prefix='spektr-mysql-') as directory:
        defaults = Path(directory) / 'client.cnf'
        descriptor = os.open(defaults, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, 'w', encoding='utf-8') as handle:
            handle.write('[client]\npassword=' + option_value(db_password) + '\n')
        command = [mysql, f'--defaults-extra-file={defaults}', '--default-character-set=utf8mb4', f'--user={args.user}', '--batch', '--skip-column-names']
        if args.socket:
            command.extend(['--protocol=SOCKET', f'--socket={args.socket}'])
        else:
            command.extend(['--protocol=TCP', f'--host={args.host}', f'--port={args.port}'])

        def run_sql(sql, database=None):
            result = subprocess.run(command + ([f'--database={database}'] if database else []), input=sql, text=True, capture_output=True)
            if result.returncode:
                # mysql can echo the offending SQL. Avoid exposing content or password hashes.
                errors = [line for line in result.stderr.splitlines() if line.startswith('ERROR ')]
                raise ValueError('\n'.join(errors) or 'Ошибка MySQL. Проверьте службу, доступ и права пользователя.')
            return result.stdout.strip()

        run_sql('SELECT 1;')
        password_hash = None
        if not args.no_admin:
            admin_exists = run_sql(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = "
                + sql_text(args.database) + " AND table_name = 'admins';") == '1'
            if admin_exists:
                admin_exists = run_sql('SELECT COUNT(*) FROM admins WHERE login = ' + sql_text(args.admin_login) + ';', args.database) != '0'
            if admin_exists:
                print(f'Администратор {args.admin_login} уже существует; пароль и состояние сохраняются.')
            else:
                password = getpass.getpass(f'Новый пароль администратора {args.admin_login} (12–72 байта): ')
                if not 12 <= len(password.encode('utf-8')) <= 72 or any(char in password for char in '\r\n\0'):
                    raise ValueError('Пароль должен содержать 12–72 байта UTF-8 без перевода строки и нулевого символа.')
                if password != getpass.getpass('Повтори пароль администратора: '):
                    raise ValueError('Пароли администратора не совпали.')
                password_hash = bcrypt_hash(password)

        if not args.existing_database:
            run_sql(f'CREATE DATABASE IF NOT EXISTS `{args.database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
        run_sql(seed_file.read_text(encoding='utf-8'), args.database)
        if password_hash:
            run_sql('INSERT INTO admins (login, password_hash) VALUES (' + sql_text(args.admin_login) + ', ' + sql_text(password_hash) + ') ON DUPLICATE KEY UPDATE id = id;', args.database)
        print(f'База {args.database} готова. Страницы импортированы; существующие записи сохранены.')
        if password_hash:
            print(f'Создан администратор: {args.admin_login}. Пароль сохранён только как bcrypt-хеш.')
        print('Сайт пока читает локальные файлы. Подключение PHP и админки — отдельный следующий шаг.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f'Ошибка: {error}', file=sys.stderr)
        sys.exit(1)
    except (KeyboardInterrupt, EOFError):
        print('\nОтменено.', file=sys.stderr)
        sys.exit(130)
