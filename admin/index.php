<?php
declare(strict_types=1);
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
?>
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Управление сайтом — Спектр</title>
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="admin.css">
  <script src="admin.js" defer></script>
</head>
<body>
  <div id="notice" class="notice" role="status" aria-live="polite" hidden></div>
  <main class="auth-screen" id="authScreen">
    <div class="auth-brand">СПЕКТР<span>УПРАВЛЕНИЕ САЙТОМ</span></div>
    <form id="loginForm" class="auth-card" method="post" action="api.php">
      <span class="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</span>
      <h1>Всё начинается<br>с одной правки.</h1>
      <p>Войдите, чтобы управлять страницами и записями сайта.</p>
      <noscript><p>Для работы админки включите JavaScript в браузере.</p></noscript>
      <label>Логин<input name="login" autocomplete="username" value="admin" required maxlength="64"></label>
      <label>Пароль<input name="password" type="password" autocomplete="current-password" required></label>
      <p class="form-error" id="loginError" role="alert" hidden></p>
      <button class="button primary" type="submit" id="loginButton">Войти в админку <span aria-hidden="true">↗</span></button>
      <a href="../" class="back-link">← Вернуться на сайт</a>
    </form>
    <div class="auth-foot">СПЕКТР · С 2004 ГОДА</div>
  </main>
  <div class="workspace" id="workspace" hidden>
    <header class="app-header">
      <a class="brand" href="./">СПЕКТР<span>Управление сайтом</span></a>
      <div class="account-actions"><a class="site-link" href="../" target="_blank" rel="noopener">Открыть сайт ↗</a><span class="user-badge" id="userBadge"></span><button class="text-button" id="logoutButton">Выйти</button></div>
    </header>
    <div class="workspace-heading"><div><span class="eyebrow">ВАШ САЙТ ПОД РУКОЙ</span><h1>Содержание сайта<span>.</span></h1></div><p>Выберите раздел, откройте страницу<br>и добавьте то, что важно.</p></div>
    <nav class="section-tabs" id="sectionTabs" aria-label="Разделы сайта"></nav>
    <div class="editor-layout">
      <aside class="page-sidebar" aria-label="Страницы раздела">
        <div class="sidebar-heading"><span>СТРАНИЦЫ</span><span id="pageCount">0</span></div>
        <label class="search-label"><span class="sr-only">Поиск страницы</span><input type="search" id="pageSearch" placeholder="Найти страницу…"></label>
        <div id="pageList" class="page-list"></div>
        <button class="button add-page" id="addPageButton">＋ Добавить страницу</button>
      </aside>
      <section class="editor-panel" id="editorPanel" aria-label="Редактор страницы">
        <div class="empty-state"><span class="empty-mark">↖</span><h2>Выберите страницу</h2><p>Её содержимое появится здесь.</p></div>
      </section>
    </div>
    <footer class="app-footer"><span>СПЕКТР / РЕДАКТОР САЙТА</span><span>Изменения сохраняются в базе данных. Публикация на сайт подключается отдельно.</span></footer>
  </div>
  <dialog id="confirmDialog" class="confirm-dialog"><form method="dialog"><span class="eyebrow">ПРОВЕРИМ ПЕРЕД ДЕЙСТВИЕМ</span><h2 id="confirmTitle">Удалить запись?</h2><p id="confirmText"></p><div class="dialog-actions"><button class="button" value="cancel" autofocus>Отмена</button><button class="button danger" id="confirmAccept" value="accept">Удалить</button></div></form></dialog>
</body>
</html>
