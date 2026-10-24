// Requires sharp. Preserve the original files in an external backup directory.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const backup = path.resolve(process.argv[2] || root);
if (backup === root || backup.startsWith(root + path.sep) || !fs.statSync(backup).isDirectory()) {
  throw new Error('Pass an existing backup directory outside the project.');
}
const gallery = path.join(root, 'assets/solutions');
async function preserve(relative, buffer) {
  const target = path.join(backup, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) {
    if (!fs.readFileSync(target).equals(buffer)) throw new Error(`Backup differs: ${relative}`);
    return;
  }
  fs.writeFileSync(target, buffer, { flag: 'wx' });
}
async function optimize() {
  const report = [];
  for (const name of fs.readdirSync(gallery).filter(name => name.endsWith('.webp')).sort()) {
    const source = path.join(backup, 'assets/solutions', name);
    const original = fs.readFileSync(fs.existsSync(source) ? source : path.join(gallery, name));
    for (const thumb of [false, true]) {
      const relative = path.join('assets/solutions', thumb ? 'thumbs' : '', name);
      const file = path.join(root, relative);
      const preserved = path.join(backup, relative);
      const before = fs.readFileSync(fs.existsSync(preserved) ? preserved : file);
      const dimensions = await sharp(before).metadata();
      await preserve(relative, before);
      // Preview comes from the larger source, not another lossy preview.
      let pipeline = sharp(thumb ? original : before);
      if (thumb) pipeline = pipeline.resize(dimensions.width, dimensions.height, { fit: 'fill' });
      const encoded = await pipeline.webp({ quality: thumb ? 68 : 78, effort: 6, smartSubsample: true }).toBuffer();
      const check = await sharp(encoded).metadata();
      if (check.width !== dimensions.width || check.height !== dimensions.height) throw new Error(`Dimensions changed: ${relative}`);
      const smaller = encoded.length < before.length;
      if (smaller) fs.writeFileSync(file, encoded);
      report.push({ file: relative, before: before.length, after: smaller ? encoded.length : before.length, width: check.width, height: check.height });
    }
  }
  fs.writeFileSync(path.join(backup, 'photo-optimization.json'), JSON.stringify(report, null, 2));
  const totals = report.reduce((sum, file) => ({ before: sum.before + file.before, after: sum.after + file.after }), { before: 0, after: 0 });
  console.log(JSON.stringify({ files: report.length, ...totals, saved: totals.before - totals.after, backup }, null, 2));
}
optimize().catch(error => { console.error(error); process.exitCode = 1; });
