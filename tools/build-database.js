// Export the current site into a MySQL bootstrap file. No npm packages required.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sections = {
  home: 'Главная', about: 'О компании', articles: 'Статьи',
  calculator: 'Калькулятор', catalog: 'Каталог', contacts: 'Контакты',
  information: 'Полезная информация', request: 'Переход к заявке',
  reviews: 'Отзывы', solutions: 'Примеры работ',
  ustanovka_okon: 'Установка окон', window_inside: 'Устройство окна'
};
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
function pages(directory = root) {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en')).flatMap(entry => {
    if (entry.name.startsWith('.') || ['node_modules', 'database'].includes(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? pages(full) : entry.name === 'index.html' ? [full] : [];
  });
}
function plain(value) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—', laquo: '«', raquo: '»', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
  return value.replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, name) => {
    if (name[0] !== '#') return entities[name] ?? match;
    return String.fromCodePoint(name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1)));
  }).replace(/\s+/g, ' ').trim();
}
function loadRecords() {
  const seo = json('content/seo.json');
  const articles = json('content/articles.json').articles;
  const branches = json('content/branches.json');
  const window = {};
  vm.runInNewContext(read('assets/js/products-data.js'), { window, Intl }, { timeout: 3000 });
  const catalog = Object.fromEntries(Object.entries(window).map(([key, value]) => [key.replace(/^SPEKTR_/, '').toLowerCase(), value]));
  return pages().map(file => {
    const source = fs.readFileSync(file, 'utf8');
    const relative = path.relative(root, file).split(path.sep).join('/');
    const route = '/' + relative.replace(/index\.html$/, '');
    const section = route === '/' ? 'home' : route.split('/')[1].replaceAll('-', '_');
    if (!sections[section]) throw new Error(`Нет таблицы для страницы ${route}`);
    const main = source.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '';
    const seoTitle = plain(source.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Спектр');
    const description = plain(source.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '');
    const canonical = plain(source.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1] || new URL(route, seo.siteUrl).href);
    const content = { main_html: main };
    const redirect = source.match(/http-equiv="refresh"\s+content="[^;]+;\s*url=([^"]+)"/i)?.[1];
    if (redirect) {
      const target = new URL(plain(redirect), new URL(route, seo.siteUrl));
      content.redirect_to = target.origin === new URL(seo.siteUrl).origin ? target.pathname + target.search + target.hash : target.href;
      delete content.main_html;
    }
    if (route === '/') {
      content.site = { name: seo.name, url: seo.siteUrl, telephone: seo.telephone };
      content.header_html = source.match(/<header\b[^>]*class="site-header[^"]*"[\s\S]*?<\/header>/i)?.[0] || '';
      content.footer_html = source.match(/<footer\b[^>]*class="site-footer[^"]*"[\s\S]*?<\/footer>/i)?.[0] || '';
      // Shared collections live on their own page; the home page references them.
      content.collections = { catalog: '/catalog/', reviews: '/reviews/', branches: '/contacts/', photos: '/solutions/' };
    }
    if (route === '/catalog/') content.catalog = catalog;
    if (route === '/solutions/') content.photos = json('content/project-photos.json').photos;
    if (route === '/reviews/') content.reviews = json('content/reviews.json');
    if (route === '/contacts/') content.branches = branches;
    if (section === 'contacts' && route !== '/contacts/') {
      content.branch_ids = branches.filter(branch => branch.slug === route.split('/')[2]).map(branch => branch.id);
    }
    if (route === '/articles/') content.article_slugs = articles.map(article => article.slug);
    const article = articles.find(item => route === `/articles/${item.slug}/`);
    if (article) {
      content.article = article;
      // A local counter file is runtime data, not a portable initial value.
      content.views = 0;
    }
    return {
      table: `page_${section}`, path: route,
      title: plain(main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || seoTitle),
      content, seo_title: seoTitle, seo_description: description, canonical_url: canonical
    };
  });
}
// init.sql enables NO_BACKSLASH_ESCAPES, so JSON backslashes remain untouched.
const literal = value => "'" + String(value).replaceAll("'", "''") + "'";
function buildSql(records = loadRecords()) {
  const sql = [
    '-- Generated by node tools/build-database.js; edit site sources, not this file.',
    '-- MySQL 8.0+. Select an existing database before importing this file.',
    '-- Reimport only adds missing paths. It preserves edits and administrator accounts.',
    'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;',
    'SET @spektr_previous_sql_mode = @@SESSION.sql_mode;',
    "SET SESSION sql_mode = IF(FIND_IN_SET('NO_BACKSLASH_ESCAPES', @@SESSION.sql_mode), @@SESSION.sql_mode, CONCAT_WS(',', NULLIF(@@SESSION.sql_mode, ''), 'NO_BACKSLASH_ESCAPES'));", ''
  ];
  for (const [section, label] of Object.entries(sections)) {
    sql.push(`CREATE TABLE IF NOT EXISTS \`page_${section}\` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  path VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSON NOT NULL,
  seo_title VARCHAR(255) NOT NULL,
  seo_description TEXT NOT NULL,
  canonical_url VARCHAR(512) NOT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_path (path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=${literal(label)};`, '');
  }
  sql.push(`CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  login VARCHAR(64) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  password_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_login (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`, '', 'START TRANSACTION;', '');
  for (const row of records) {
    const values = [row.path, row.title, JSON.stringify(row.content), row.seo_title, row.seo_description, row.canonical_url];
    sql.push(`-- ${row.path}\nINSERT INTO \`${row.table}\` (path, title, content, seo_title, seo_description, canonical_url)\nVALUES (${values.map(literal).join(', ')})\nON DUPLICATE KEY UPDATE id = id;`, '');
  }
  sql.push('COMMIT;', 'SET SESSION sql_mode = @spektr_previous_sql_mode;', '');
  return sql.join('\n');
}
if (require.main === module) {
  const records = loadRecords();
  fs.mkdirSync(path.join(root, 'database'), { recursive: true });
  fs.writeFileSync(path.join(root, 'database/init.sql'), buildSql(records));
  console.log(`database/init.sql: ${Object.keys(sections).length} таблиц страниц + admins, ${records.length} страниц.`);
}
module.exports = { loadRecords, buildSql };
