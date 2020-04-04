const { read, write, extract} = require_('utils.js');
const $gitlab = require_('gitlab.js');
const $shell = require_('node_modules/shelljs');
const $fs = require('fs');
const NA = 'N/A';
const UNKNOWN = 'unknown';

const vm = (el) => {
  return new Vue({
    el,
    name: 'cc-modules-panel',
    template: read('panel/panel.html'),
    data () {
      return {
        gitlab: $gitlab.GITLAB,
        settingsSaved: false,
        items: [],
        groupedItems: {},
        branches: {},
        tags: {},
        errorMsg: ''
      }
    },
    created() {
        window.ccmodules = this;
        window.gitlab = $gitlab;
    },
    compiled() {
      if (!!this.gitlab.privateToken) {
        this.clickSection('#gitlabSettings');
      }
      this.getProjects();
    },
    methods: {
      $t(key) {
        return Editor.T('cc-modules.' + key);
      },
      saveSettings() {
        const self = this;
        const fields = Object.keys(this.gitlab);
        const emptyField = fields.find(f => this.gitlab[f] == '');
        if (emptyField) {
          alert(`${emptyField} can not be empty!`);
          return;
        }
        write('settings.json', JSON.stringify(this.gitlab, 0, 2));
        this.settingsSaved = true;
        setTimeout(() => {
          self.settingsSaved = false;
          this.clickSection('#gitlabSettings');
        }, 1000);
      },
      refresh() {
        this.getProjects();
      },
      getProjects() {
        return $gitlab.groups()
          .then(data => {
            if (data && data.projects) {
              const prefixes = this.gitlab.prefixes.split(',');
              return data.projects.filter(p => prefixes.indexOf(p.name.split('-')[0]) >= 0);
            } else {
              throw data.message;
            }
          })
          .then(all => all.map(p => {
            this.errorMsg = '';
            this.getTags(p.id, p.name);
            this.getMaster(p.id);
            return {
              name: p.name,
              desc: p.description,
              id: p.id,
              url: p.web_url
            };
          }))
          .then(all => {
            this.items = all.sort((a, b) => {
              if (a.name < b.name) return -1;
              if (a.name > b.name) return 1;
              return 0;
            });

            this.groupedItems = this.items.reduce((all, it) => {
              const [prefix, _] = it.name.split('-');
              if (!all[prefix]) all[prefix] = [];
              all[prefix].push(it);
              return all;
            }, {});
          })
          .catch(err => {
            this.errorMsg = err;
          });
      },
      onPropChange(e) {
        const key = e.target.dataset.key;
        this.gitlab[key] = $gitlab[key] = e.target.value;
      },
      clickSection(id) {
        this.$el.querySelector(`${id} .header`).click();
      },
      hasSettings() {
        const values = Object.values(this.gitlab);
        return values.filter(v => v != null).length === values.length;
      },
      download(e, projectId, projectName) {
        const tag = e.target.closest('li').querySelector('ui-select').value
        if (tag === NA || tag === UNKNOWN) {
          alert('Please select a valid tag!');
          return;
        }
        const modDir = this.gitlab.moduleDirectory;
        $gitlab.downloadArchive(projectId, tag).then(buf => {
          const srcZip = write(`cache/${projectName}-${tag}.zip`, buf);
          const destDir = Editor.url(`db://assets/${modDir}`);
          if (!$fs.existsSync(destDir)) {
            $fs.mkdirSync(destDir);
          }
          const to = `${destDir}/${projectName}`;
          if ($fs.existsSync(to)) {
            confirm(`Please delete existing module first!`);
            return;
          }
          let commit = this.tags[projectId].find(t => t.name === tag).commit;
          if (!commit) {
            commit = this.branches[projectId].commit;
          }
          const sha = commit.id;
          extract(srcZip, destDir).then(() => {
            const from = `${destDir}/${projectName}-${tag}-${sha}`;
            // $fs.renameSync(from, to);
            setTimeout(() => {
              $shell.mv(from, to);
              setTimeout(() => {
                this.refreshAssets('cc_modules');
              }, 100);
              this.getProjects();
            }, 1000)
          });
        });
      },
      refreshAssets(dir = '') {
        Editor.assetdb.refresh(`db://assets/${dir}`);
      },
      getTags(projectId, projectName) {
        return $gitlab.tags(projectId)
          .then(all => {
            const versions = all.filter(p => ({name: p.name}));
            let finalTags = [{name: NA},{name: UNKNOWN}];
            let cur = this.getCurrentVersion(projectName, projectId);

            if (cur.match(/[0-9.]+/)) {
              finalTags = [];
              cur = 'v' + cur;
              if (!versions.find(tag => tag.name === cur)) {
                finalTags.push({name: cur});
              }
              finalTags.push({name: 'master'});
              finalTags = finalTags.concat(versions);
            } else if (cur === 'N/A') {
              finalTags = [{name: NA}, {name: 'master'}].concat(versions);
            } else if (cur === UNKNOWN) {
              finalTags = [{name: 'master'}, {name: UNKNOWN}].concat(versions);
            }
            Vue.set(this.tags, projectId, finalTags);
            setTimeout(() => {
              const uiSelect = document.querySelector(`::shadow #project-tags-${projectId}`);
              uiSelect.value = cur;
            }, 0);
            
          });
      },
      getMaster(projectId) {
        return $gitlab.branches(projectId)
          .then(master => {
            Vue.set(this.branches, projectId, master);
          });
      },
      onTagChanged(e, project) {
        const tag = e.target.selectedText;
        e.target.closest('li').querySelector('a').dataset.tag = tag;
      },
      getCurrentVersion(name, projectId) {
        const url = Editor.url(`db://assets/${this.gitlab.moduleDirectory}/${name}/package.json`);
        if (!$fs.existsSync(url)) return NA;
        try {
          const pkg = JSON.parse($fs.readFileSync(url).toString());
          if (pkg.version) {
            return pkg.version
          } else {
            return UNKNOWN;
          }
        } catch (e) {
          return UNKNOWN;
        }
      }
    }
  });
}

Editor.Panel.extend({
  style: read('panel/style.css'),
  template: read('panel/index.html'),
  $: {
    root: '#cc-modules-panel'
  },
  ready () {
    this.vm = vm(this.$root);
  },
  messages: {
    assetsDeleted(e) {
      if (this.vm) this.vm.refresh();
    }
  }
});

function require_(relativePath) {
  return Editor.require(`packages://cc-modules/${relativePath}`);
}