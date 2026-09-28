const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '..');
const targetDir = path.resolve(sourceDir, 'Mobile', 'MobileApp');
const assetsDir = path.join(targetDir, 'assets');
const wwwDir = path.join(assetsDir, 'www');
const pubspecPath = path.join(targetDir, 'pubspec.yaml');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    const src = path.join(from, element);
    const dest = path.join(to, element);
    const stat = fs.lstatSync(src);
    if (stat.isDirectory()) copyFolderSync(src, dest);
    else if (!stat.isSymbolicLink()) fs.copyFileSync(src, dest);
  });
}

function findAssetDirs(dir, baseDir, list = []) {
  const files = fs.readdirSync(dir);
  let hasFiles = false;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) findAssetDirs(fullPath, baseDir, list);
    else hasFiles = true;
  }
  if (hasFiles) {
    let relPath = path.relative(baseDir, dir).replace(/\\/g, '/');
    if (!relPath.endsWith('/')) relPath += '/';
    list.push(relPath);
  }
  return list;
}

console.log('=== NBB: sync web assets → Flutter ===');

if (!fs.existsSync(pubspecPath)) {
  console.error('Flutter project belum ada di Mobile/MobileApp.');
  process.exit(1);
}

if (fs.existsSync(wwwDir)) fs.rmSync(wwwDir, { recursive: true, force: true });
fs.mkdirSync(wwwDir, { recursive: true });

copyFolderSync(path.join(sourceDir, 'Views', 'Mobile'), path.join(wwwDir, 'Views', 'Mobile'));
copyFolderSync(path.join(sourceDir, 'wwwroot'), path.join(wwwDir, 'wwwroot'));

fs.writeFileSync(
  path.join(wwwDir, 'index.html'),
  `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=Views/Mobile/login.html"/><title>NBB</title></head><body>Loading…</body></html>`
);

const assetDirs = findAssetDirs(wwwDir, assetsDir);
const assetsYaml =
  '  assets:\n' + assetDirs.map((d) => `    - assets/${d}`).join('\n') + '\n';

// Rewrite flutter: assets section without touching dependencies
let pubspec = fs.readFileSync(pubspecPath, 'utf8');
if (!/webview_flutter:/.test(pubspec)) {
  pubspec = pubspec.replace(
    /(dependencies:\r?\n(?:  .+\r?\n)*)/,
    (m) => (m.includes('webview_flutter') ? m : m.replace(/dependencies:\r?\n/, 'dependencies:\n  webview_flutter: ^4.13.0\n'))
  );
}

if (/^flutter:[\s\S]*$/m.test(pubspec)) {
  // Keep flutter header + uses-material-design, replace assets list
  pubspec = pubspec.replace(
    /\nflutter:[\s\S]*$/m,
    `\nflutter:\n  uses-material-design: true\n${assetsYaml}`
  );
} else {
  pubspec += `\nflutter:\n  uses-material-design: true\n${assetsYaml}`;
}

fs.writeFileSync(pubspecPath, pubspec);
console.log('Synced', assetDirs.length, 'asset folders.');
console.log('Done.');
