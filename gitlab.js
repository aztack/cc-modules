const $fs = require('fs');

const gitlab = {
  GITLAB: {
    endpoint: localStorage.getItem('endpoint'),
    apiVer: localStorage.getItem('apiVer') || 'api/v4',
    privateToken: localStorage.getItem('privateToken'),
    nsId: localStorage.getItem('nsId'),
    ns:localStorage.getItem('ns'),
    prefixes: localStorage.getItem('prefixes') || 'comp,util',
    moduleDirectory: localStorage.getItem('moduleDirectory') || 'scripts/cc_modules'
  },
  init(endpoint, privateToken, api) {
    this.GITLAB.endpoint = endpoint;
    this.GITLAB.privateToken = privateToken;
    this.GITLAB.apiVer = api;
  },
  setMainNamespace(nsId) {
    this.GITLAB.nsId = nsId;
    return this;
  },
  getProjectsOfNamespace(nameFilter) {
    const nsUrl = this.urlOfProject('');
  },
  urlOfProject(name) {
    return `${this.GITLAB.endpoint}/${this.GITLAB.ns}/${name}`;
  },
  urlOfRawFile(filename, branch) {
    if (!branch) branch = 'master'
    return `${this.GITLAB.endpoint}/${this.GITLAB.ns}/raw/${branch}/${filename}`;
  },
  urlOfArchive(projectId, sha, ext) {
    if (typeof ext === 'undefined') ext = '.zip'
    return this.apiUrl(`projects/${projectId}/repository/archive${ext}?sha=${sha}`);
  },
  fetchRaw() {

  },
  fetch(url, type) {
    return window.fetch(url, {
      headers: {
        'PRIVATE-TOKEN': this.GITLAB.privateToken
      }
    }).then(res => {
      if (typeof res[type] === 'function') {
        return res[type]();
      } else {
        return res.text();
      }
    });
  },
  fetchJson(url) {
    return this.fetch(url, 'json');
  },
  fetchText(url) {
    return this.fetch(url, 'text');
  },
  apiUrl(path, rest) {
    const url =`${this.GITLAB.endpoint}/${this.GITLAB.apiVer}/${path}`;
    if (rest) {
      if (Array.isArray(rest)) {
        return [url].concat(rest).join('/')
      } else if (typeof rest === 'string') {
        return [url, rest].join('/');
      }
    }
    return url;
  },
  // gitlab apis
  groups (id) {
    id = id || this.GITLAB.nsId;
    const url = this.apiUrl('groups', id);
    return this.fetchJson(url);
  },
  branches (id, branch) {
    if (typeof branch === 'undefined') branch = 'master';
    const url = this.apiUrl('projects', [id, 'repository/branches', branch]);
    return this.fetchJson(url);
  },
  tags (id) {
    id = id || this.GITLAB.nsId;
    const url = this.apiUrl('projects', [id, 'repository/tags']);
    return this.fetchJson(url);
  },
  downloadArchive(id, sha) {
    if (typeof sha === 'undefined') sha = 'master';
    const url = this.urlOfArchive(id, sha);
    return new Promise((resolve, reject) => {
      this.fetch(url, 'blob').then(blob => {
        var fileReader = new FileReader();
        fileReader.onload = function () {
          const buf = Buffer(new Uint8Array(this.result));
          resolve(buf);
        };
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(blob);
      });
    });
  }
};
module.exports = gitlab;