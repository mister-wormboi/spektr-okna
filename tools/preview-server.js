// Local preview with byte ranges, required for interactive video seeking.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createArticleViewStore } = require('./article-view-store');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.mp4': 'video/mp4', '.png': 'image/png', '.svg': 'image/svg+xml' };
function createServer({ views } = {}) {
  if (!views) {
    const articles = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8')).articles;
    const directory = process.env.SPEKTR_DATA_DIR ? path.resolve(process.env.SPEKTR_DATA_DIR) : path.join(root, '.data');
    views = createArticleViewStore(path.join(directory, 'article-views.json'), articles.map(a => a.slug));
  }
  return http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/article-views' || pathname.startsWith('/api/article-views/')) {
    const respond = (status, value, extra = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
      res.end(JSON.stringify(value));
    };
    try {
      if (pathname === '/api/article-views') {
        if (req.method !== 'GET') { respond(405, { error: 'Method not allowed' }, { Allow: 'GET' }); return; }
        respond(200, { views: views.all() }); return;
      }
      const slug = pathname.slice('/api/article-views/'.length);
      if (!views.has(slug)) { respond(404, { error: 'Unknown article' }); return; }
      if (req.method !== 'POST') { respond(405, { error: 'Method not allowed' }, { Allow: 'POST' }); return; }
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) {
        respond(403, { error: 'Origin not allowed' }); return;
      }
      req.resume();
      respond(200, { slug, views: views.increment(slug) });
    } catch { respond(503, { error: 'View storage unavailable' }); }
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  let file;
  try {
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (relative.split('/').some(part => part.startsWith('.'))) { res.writeHead(403).end(); return; }
    file = path.resolve(root, '.' + relative);
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const stat = fs.statSync(file);
    if (!stat.isFile()) { res.writeHead(404).end(); return; }
    let start = 0, end = stat.size - 1, status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end(); return; }
      if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end(); return; }
      status = 206;
    }
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404).end(); }
  });
}

module.exports = { createServer };
if (require.main === module) createServer().listen(Number(process.argv[2]) || 8001, '127.0.0.1');
