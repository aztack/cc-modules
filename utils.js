const pkgName = 'cc-modules';
const unzip = require('unzip');
const $fs = require('fs');

function read(relativePath) {
  return $fs.readFileSync(Editor.url(`packages://${pkgName}/${relativePath}`), 'utf-8');
}
function write(relativePath, data) {
  const path = Editor.url(`packages://${pkgName}/${relativePath}`);
  $fs.writeFileSync(path, data);
  return path;
}

function extract(srcZip, destDir) {
  return $fs.createReadStream(srcZip).pipe(unzip.Extract({ path: destDir}));
}

module.exports = {
  read,
  write,
  extract,
  pkgName
}