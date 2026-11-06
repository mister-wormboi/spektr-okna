<?php
declare(strict_types=1);
// Local PHP development server. Never serves source, SQL, credentials or dotfiles.
$root = dirname(__DIR__);
$route = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$parts = explode('/', $route);
$private = ['.git', '.data', 'tools', 'tests', 'database', 'docs', 'content', 'templates', 'node_modules'];
foreach ($parts as $part) {
    if (($part !== '' && ($part[0] === '.' || in_array($part, $private, true))) || str_contains($part, "\0") || str_contains($part, '\\')) {
        http_response_code(404); exit('Not found');
    }
}
$target = realpath($root . '/' . ltrim($route, '/'));
if ($target === false || ($target !== $root && !str_starts_with($target, $root . DIRECTORY_SEPARATOR))) { http_response_code(404); exit('Not found'); }
if ($route === '/admin') { header('Location: /admin/', true, 302); exit; }
if (is_dir($target)) {
    if (file_exists($target . '/index.php') && $route === '/admin/') $target .= '/index.php';
    else $target .= '/index.html';
}
if (!is_file($target)) { http_response_code(404); exit('Not found'); }
$relative = substr($target, strlen($root) + 1);
if (str_ends_with($target, '.php')) {
    if (!in_array($relative, ['admin/index.php', 'admin/api.php'], true)) { http_response_code(404); exit('Not found'); }
    require $target; return true;
}
if (str_starts_with($relative, 'admin/') && !in_array($relative, ['admin/admin.js', 'admin/admin.css'], true)) { http_response_code(404); exit('Not found'); }
if (!preg_match('/\.(html|css|js|svg|png|webp|jpg|jpeg|gif|ico|woff2?|ttf|mp4|xml|txt)$/i', $target)) { http_response_code(404); exit('Not found'); }
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) { header('Allow: GET, HEAD'); http_response_code(405); exit; }
// PHP's built-in static server does not provide the video ranges the site needs.
if (str_ends_with($target, '.mp4')) {
    $size = filesize($target); $start = 0; $end = $size - 1;
    header('Content-Type: video/mp4'); header('Accept-Ranges: bytes');
    if (isset($_SERVER['HTTP_RANGE'])) {
        if (!preg_match('/^bytes=(\d*)-(\d*)$/D', $_SERVER['HTTP_RANGE'], $match) || ($match[1] === '' && $match[2] === '')) {
            header("Content-Range: bytes */$size"); http_response_code(416); exit;
        }
        if ($match[1] === '') $start = max(0, $size - (int)$match[2]);
        else { $start = (int)$match[1]; if ($match[2] !== '') $end = min($end, (int)$match[2]); }
        if ($start > $end || $start >= $size) { header("Content-Range: bytes */$size"); http_response_code(416); exit; }
        http_response_code(206); header("Content-Range: bytes $start-$end/$size");
    }
    header('Content-Length: ' . ($end - $start + 1));
    if ($_SERVER['REQUEST_METHOD'] === 'HEAD') exit;
    $handle = fopen($target, 'rb'); fseek($handle, $start); $remaining = $end - $start + 1;
    while ($remaining > 0 && !feof($handle) && !connection_aborted()) {
        $chunk = fread($handle, min(65536, $remaining));
        if ($chunk === false || $chunk === '') break;
        echo $chunk; $remaining -= strlen($chunk);
    }
    fclose($handle); exit;
}
return false;
