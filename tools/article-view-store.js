const fs = require('node:fs');
const path = require('node:path');

function createArticleViewStore(file, slugs) {
  const known = new Set(slugs);
  function read() {
    let values;
    try { values = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (error) {
      if (error.code === 'ENOENT') return {};
      throw error; // Never silently reset a damaged or inaccessible counter file.
    }
    if (!values || typeof values !== 'object' || Array.isArray(values)
      || Object.values(values).some(value => !Number.isSafeInteger(value) || value < 0)) {
      throw new Error('Invalid article view storage');
    }
    return values;
  }
  read();
  return {
    has: slug => known.has(slug),
    all() {
      const values = read();
      return Object.fromEntries([...known].map(slug => [slug, values[slug] || 0]));
    },
    increment(slug) {
      if (!known.has(slug)) throw new Error('Unknown article');
      // Synchronous read/write keeps increments serial within this server process.
      const values = read();
      const count = (values[slug] || 0) + 1;
      if (!Number.isSafeInteger(count)) throw new Error('Article view counter overflow');
      values[slug] = count;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const temporary = file + '.tmp';
      fs.writeFileSync(temporary, JSON.stringify(values, null, 2) + '\n', { flush: true });
      fs.renameSync(temporary, file);
      return count;
    },
  };
}

module.exports = { createArticleViewStore };
