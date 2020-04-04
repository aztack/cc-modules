const pkgName = 'cc-modules';
const unzip = require('extract-zip')
const $fs = require('fs');

function read(relativePath, val) {
  let str = val || '';
  try {
    str = $fs.readFileSync(Editor.url(`packages://${pkgName}/${relativePath}`), 'utf-8');
  } catch (e) {
    console.error(`read file ${relativePath} failed`);
  }
  return str;
}
function write(relativePath, data) {
  const path = Editor.url(`packages://${pkgName}/${relativePath}`);
  $fs.writeFileSync(path, data);
  return path;
}

function extract(srcZip, destDir) {
//  return $fs.createReadStream(srcZip).pipe(unzip.Extract({ path: destDir}));
  return new Promise(function (resolve, reject) {
    unzip(srcZip, {dir: destDir}, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  read,
  write,
  extract,
  pkgName
}