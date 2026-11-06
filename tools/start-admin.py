#!/usr/bin/env python3
"""Start the local PHP server from any working directory."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys

parser = argparse.ArgumentParser(description='Локальный сайт и PHP-админка «Спектра».')
parser.add_argument('--port', type=int, default=8002)
args = parser.parse_args()
if not 1024 <= args.port <= 65535:
    parser.error('Порт должен быть от 1024 до 65535.')
php = shutil.which('php')
if not php:
    sys.exit('PHP не найден. На Mac установите его: brew install php\nЗатем повторите запуск этого скрипта.')
check = subprocess.run([php, '-r', 'exit(PHP_VERSION_ID >= 80100 && extension_loaded("pdo_mysql") && extension_loaded("session") ? 0 : 1);'])
if check.returncode:
    sys.exit('Нужен PHP 8.1+ с расширениями pdo_mysql и session.')
root = Path(__file__).resolve().parent.parent
os.chdir(root)
print(f'Сайт:    http://127.0.0.1:{args.port}/\nАдминка: http://127.0.0.1:{args.port}/admin/\nОстановка: Ctrl+C', flush=True)
os.execv(php, [php, '-S', f'127.0.0.1:{args.port}', '-t', str(root), str(root / 'tools/php-router.php')])
