<?php
declare(strict_types=1);

// Only api.php loads this file. Database identifiers always come from this list.
function sections(): array {
    return [
        'home' => ['title' => 'Главная', 'route' => '/'],
        'about' => ['title' => 'О компании', 'route' => '/about/'],
        'articles' => ['title' => 'Статьи', 'route' => '/articles/'],
        'catalog' => ['title' => 'Каталог', 'route' => '/catalog/'],
        'calculator' => ['title' => 'Калькулятор', 'route' => '/calculator/'],
        'contacts' => ['title' => 'Контакты', 'route' => '/contacts/'],
        'reviews' => ['title' => 'Отзывы', 'route' => '/reviews/'],
        'solutions' => ['title' => 'Примеры работ', 'route' => '/solutions/'],
        'information' => ['title' => 'Вопросы и ответы', 'route' => '/information/'],
        'ustanovka_okon' => ['title' => 'Установка окон', 'route' => '/ustanovka-okon/'],
        'window_inside' => ['title' => 'Устройство окна', 'route' => '/window-inside/'],
        'request' => ['title' => 'Заявка', 'route' => '/request/'],
    ];
}

function config(): array {
    static $config;
    if ($config !== null) return $config;
    $local = dirname(__DIR__, 2) . '/.data/admin-config.php';
    $overrides = is_file($local) ? require $local : [];
    if (!is_array($overrides)) throw new RuntimeException('Invalid configuration');
    $defaults = ['host' => '127.0.0.1', 'port' => '3306', 'name' => 'spektr_okna', 'user' => 'root', 'password' => '', 'socket' => ''];
    $defaults = array_replace($defaults, $overrides);
    foreach ($defaults as $key => $value) {
        $env = getenv('SPEKTR_DB_' . strtoupper($key));
        $defaults[$key] = $env === false ? $value : $env;
    }
    $config = $defaults;
    foreach (['host', 'name', 'socket'] as $key) {
        if (preg_match('/[;\x00-\x1f]/', (string)$config[$key])) throw new RuntimeException('Invalid connection settings');
    }
    if (!ctype_digit((string)$config['port'])) throw new RuntimeException('Invalid port');
    return $config;
}

function db(): PDO {
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;
    $c = config();
    $address = $c['socket'] !== '' ? 'unix_socket=' . $c['socket'] : 'host=' . $c['host'] . ';port=' . $c['port'];
    $pdo = new PDO('mysql:' . $address . ';dbname=' . $c['name'] . ';charset=utf8mb4', $c['user'], $c['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $GLOBALS['spektr_pdo'] = $pdo;
    return $pdo;
}

function respond(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function body(): array {
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') respond(415, ['error' => 'Ожидается JSON-запрос.']);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 2_000_000) respond(413, ['error' => 'Содержимое страницы превышает 2 МБ.']);
    $source = file_get_contents('php://input', false, null, 0, 2_000_001);
    if ($source === false || strlen($source) > 2_000_000) respond(413, ['error' => 'Слишком большой запрос.']);
    try { $value = json_decode($source, true, 64, JSON_THROW_ON_ERROR); }
    catch (JsonException $e) { respond(422, ['error' => 'Не удалось прочитать данные запроса.']); }
    if (!is_array($value)) respond(422, ['error' => 'Некорректные данные запроса.']);
    return $value;
}

function csrf(): void {
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($provided) || !hash_equals($_SESSION['csrf'], $provided)) respond(403, ['error' => 'Сеанс страницы устарел. Обновите вкладку.']);
}

function current_admin(): ?array {
    if (empty($_SESSION['admin_id'])) return null;
    if (time() - (int)($_SESSION['last_seen'] ?? 0) > 7200) {
        unset($_SESSION['admin_id'], $_SESSION['last_seen']);
        return null;
    }
    $query = db()->prepare('SELECT id, login FROM admins WHERE id = ? AND is_active = 1');
    $query->execute([$_SESSION['admin_id']]);
    $admin = $query->fetch();
    if (!$admin) { unset($_SESSION['admin_id']); return null; }
    $_SESSION['last_seen'] = time();
    return $admin;
}

function table(string $section): string {
    if (!isset(sections()[$section])) respond(404, ['error' => 'Такого раздела нет.']);
    return '`page_' . $section . '`';
}

function version(array $row): string {
    unset($row['version']);
    return hash('sha256', json_encode($row, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
}

function page_row(array $row): array {
    $row['id'] = (int)$row['id'];
    $row['is_published'] = (bool)$row['is_published'];
    // Preserve empty JSON objects as {}, not [], when the editor saves them.
    $row['content'] = json_decode($row['content'], false, 64, JSON_THROW_ON_ERROR);
    $row['version'] = version($row);
    return $row;
}

function find_page(string $table, int $id, bool $lock = false): array {
    $statement = db()->prepare("SELECT * FROM $table WHERE id = ?" . ($lock ? ' FOR UPDATE' : ''));
    $statement->execute([$id]);
    $row = $statement->fetch();
    if (!$row) respond(404, ['error' => 'Запись уже удалена. Обновите список страниц.']);
    return page_row($row);
}

function validate_page(array $input, string $section): array {
    $result = [];
    foreach (['path' => 255, 'title' => 255, 'seo_title' => 255, 'seo_description' => 5000, 'canonical_url' => 512] as $key => $limit) {
        $value = $input[$key] ?? '';
        if (!is_string($value) || preg_match_all('/./us', $value) === false) respond(422, ['error' => 'Некорректное текстовое поле.']);
        $value = trim($value);
        if (preg_match_all('/./us', $value) > $limit) respond(422, ['error' => "Поле $key слишком длинное."]);
        $result[$key] = $value;
    }
    if ($result['title'] === '') respond(422, ['error' => 'Введите название страницы.']);
    if (!preg_match('~^/(?:[a-z0-9]+(?:-[a-z0-9]+)*/)*$~D', $result['path'])) respond(422, ['error' => 'Адрес должен начинаться и заканчиваться / и содержать латинские буквы, цифры и дефисы.']);
    $base = sections()[$section]['route'];
    if (($section === 'home' && $result['path'] !== '/') || ($section !== 'home' && !str_starts_with($result['path'], $base))) respond(422, ['error' => 'Адрес страницы должен относиться к выбранному разделу: ' . $base]);
    if ($result['canonical_url'] !== '' && (!filter_var($result['canonical_url'], FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($result['canonical_url'], PHP_URL_SCHEME) ?: ''), ['http', 'https'], true))) respond(422, ['error' => 'Canonical должен быть полным HTTP или HTTPS адресом.']);
    if (!isset($input['content']) || !is_array($input['content']) || ($input['content'] !== [] && array_is_list($input['content']))) respond(422, ['error' => 'Содержимое страницы должно быть объектом.']);
    // Decode a second time without associative arrays to retain all nested object types.
    $raw = json_decode(file_get_contents('php://input'), false, 64, JSON_THROW_ON_ERROR);
    if (!isset($raw->page->content) || !is_object($raw->page->content)) respond(422, ['error' => 'Содержимое страницы должно быть объектом.']);
    $result['content'] = json_encode($raw->page->content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if (strlen($result['content']) > 1_800_000) respond(422, ['error' => 'Содержимое страницы слишком большое.']);
    $result['is_published'] = !empty($input['is_published']) ? 1 : 0;
    if ($result['seo_title'] === '') $result['seo_title'] = $result['title'];
    if ($result['canonical_url'] === '') $result['canonical_url'] = 'https://spektr-okna.ru' . $result['path'];
    return $result;
}

// A single locked file per remote address makes login throttling work across sessions.
function login_attempt(string $login, string $password): array {
    $directory = getenv('SPEKTR_ADMIN_STATE_DIR') ?: dirname(__DIR__, 2) . '/.data/admin-login';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Cannot create login state');
    $filename = $directory . '/' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown') . '.json';
    $handle = fopen($filename, 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) throw new RuntimeException('Cannot lock login state');
    try {
        $attempts = json_decode(stream_get_contents($handle) ?: '[]', true);
        $attempts = array_values(array_filter(is_array($attempts) ? $attempts : [], fn($time) => is_int($time) && $time > time() - 900));
        if (count($attempts) >= 10) return ['status' => 429, 'error' => 'Слишком много попыток. Повторите через 15 минут.'];
        $statement = db()->prepare('SELECT id, login, password_hash, is_active FROM admins WHERE login = ?');
        $statement->execute([$login]);
        $admin = $statement->fetch();
        $valid = password_verify($password, $admin['password_hash'] ?? '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
        if (!$admin || !$valid || !(bool)$admin['is_active']) {
            $attempts[] = time();
            $result = ['status' => 401, 'error' => 'Неверный логин или пароль.'];
        } else {
            $attempts = [];
            session_regenerate_id(true);
            $_SESSION['admin_id'] = (int)$admin['id'];
            $_SESSION['last_seen'] = time();
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            $result = ['status' => 200, 'admin' => ['id' => (int)$admin['id'], 'login' => $admin['login']], 'csrf' => $_SESSION['csrf']];
        }
        rewind($handle);
        ftruncate($handle, 0);
        fwrite($handle, json_encode($attempts, JSON_THROW_ON_ERROR));
        return $result;
    } finally { flock($handle, LOCK_UN); fclose($handle); }
}
