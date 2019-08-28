const gitlab = {
  GITLAB: {
    privateToken: '',
    endpoint: '',
    apiVer: 'api/v4',
    ns: '',
    nsId: 0,
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
  fetchRaw() {

  },
  fetch(url, type) {
    return window.fetch(url, {
      headers: {
        'Private-Token': this.GITLAB.privateToken
      }
    }).then(res => {
      if (type === 'json') {
        return res.json();
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
  }
};
module.exports = gitlab;