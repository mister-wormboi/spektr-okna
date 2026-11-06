<?php
declare(strict_types=1);
require __DIR__ . '/lib/app.php';

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('spektr_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/admin/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Strict']);
session_start();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if (!in_array($method, ['GET', 'POST'], true)) { header('Allow: GET, POST'); respond(405, ['error' => 'Метод не поддерживается.']); }
    if ($method === 'GET' && ($_GET['action'] ?? '') === 'session') respond(200, ['admin' => current_admin(), 'csrf' => $_SESSION['csrf']]);
    $input = $method === 'POST' ? body() : [];
    $action = $method === 'POST' ? ($input['action'] ?? '') : ($_GET['action'] ?? '');
    if ($method === 'POST') csrf();
    if ($method === 'POST' && $action === 'login') {
        $login = $input['login'] ?? '';
        $password = $input['password'] ?? '';
        if (!is_string($login) || !is_string($password) || strlen($login) > 64 || strlen($password) > 1000) respond(422, ['error' => 'Проверьте логин и пароль.']);
        $result = login_attempt(trim($login), $password);
        $status = $result['status']; unset($result['status']);
        respond($status, $result);
    }
    if (!current_admin()) respond(401, ['error' => 'Войдите в админку.']);
    if ($method === 'POST' && $action === 'logout') {
        $_SESSION = []; session_destroy();
        setcookie('spektr_admin', '', ['expires' => time() - 3600, 'path' => '/admin/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Strict']);
        respond(200, ['ok' => true]);
    }
    if ($method === 'GET' && $action === 'sections') {
        $result = [];
        foreach (sections() as $key => $value) $result[] = ['id' => $key, ...$value, 'count' => (int)db()->query('SELECT COUNT(*) FROM ' . table($key))->fetchColumn()];
        respond(200, ['sections' => $result]);
    }
    $section = $method === 'GET' ? ($_GET['section'] ?? '') : ($input['section'] ?? '');
    if (!is_string($section)) respond(422, ['error' => 'Выберите раздел.']);
    $table = table($section);
    if ($method === 'GET' && $action === 'pages') {
        $rows = db()->query("SELECT id, path, title, is_published, updated_at FROM $table ORDER BY path")->fetchAll();
        respond(200, ['pages' => $rows]);
    }
    if ($method === 'GET' && $action === 'page') respond(200, ['page' => find_page($table, (int)($_GET['id'] ?? 0))]);
    if ($method === 'POST' && in_array($action, ['save', 'delete'], true)) {
        $id = (int)($input['id'] ?? 0);
        if ($action === 'delete' && $id <= 0) respond(422, ['error' => 'Выберите запись для удаления.']);
        $page = $action === 'save' ? validate_page(is_array($input['page'] ?? null) ? $input['page'] : [], $section) : [];
        db()->beginTransaction();
        if ($id > 0) {
            $existing = find_page($table, $id, true);
            if (!is_string($input['version'] ?? null) || !hash_equals($existing['version'], $input['version'])) {
                db()->rollBack();
                respond(409, ['error' => 'Эта запись уже изменилась в другой вкладке. Ваши правки сохранены в форме. Скопируйте их и загрузите свежую версию страницы.']);
            }
        }
        if ($action === 'delete') {
            $query = db()->prepare("DELETE FROM $table WHERE id = ?");
            $query->execute([$id]);
        } elseif ($id > 0) {
            $query = db()->prepare("UPDATE $table SET path = ?, title = ?, seo_title = ?, seo_description = ?, canonical_url = ?, content = ?, is_published = ? WHERE id = ?");
            $query->execute([...array_values($page), $id]);
        } else {
            $query = db()->prepare("INSERT INTO $table (path, title, seo_title, seo_description, canonical_url, content, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $query->execute(array_values($page));
            $id = (int)db()->lastInsertId();
        }
        db()->commit();
        respond(200, $action === 'delete' ? ['ok' => true] : ['page' => find_page($table, $id)]);
    }
    respond(404, ['error' => 'Действие не найдено.']);
} catch (PDOException $e) {
    if (isset($GLOBALS['spektr_pdo']) && $GLOBALS['spektr_pdo']->inTransaction()) $GLOBALS['spektr_pdo']->rollBack();
    $code = (int)($e->errorInfo[1] ?? 0);
    if ($code === 1062) respond(409, ['error' => 'Страница с таким адресом уже существует. Выберите другой адрес.']);
    error_log('Spektr admin database error: ' . $e->getCode());
    respond(503, ['error' => 'База данных недоступна. Проверьте запуск MySQL и настройки подключения.', 'code' => 'database_unavailable']);
} catch (Throwable $e) {
    if (isset($GLOBALS['spektr_pdo']) && $GLOBALS['spektr_pdo']->inTransaction()) $GLOBALS['spektr_pdo']->rollBack();
    error_log('Spektr admin error: ' . get_class($e));
    respond(500, ['error' => 'Не удалось выполнить действие. Правки в форме сохранены. Проверьте журнал PHP.']);
}
