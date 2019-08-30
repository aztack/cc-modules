const { read, write, extract, pkgName } = require_('utils.js');
const $gitlab = require_('gitlab.js');
const $fs = require('fs');

const vm = (el) => {
  return new Vue({
    el,
    name: 'cc-modules-panel',
    template: read('panel/panel.html'),
    data () {
      return {
        gitlab: {
          endpoint: localStorage.getItem('endpoint'),
          apiVer: localStorage.getItem('apiVer'),
          privateToken: localStorage.getItem('privateToken'),
          nsId: localStorage.getItem('nsId'),
          ns:localStorage.getItem('ns'),
          moduleDirectory: localStorage.getItem('moduleDirectory') || 'scripts/cc_modules',
        },
        settingsSaved: false,
        items: [],
        branches: {},
        tags: {}
      }
    },
    created() {
      if (CC_DEBUG) {
        window.g = this;
        window.lab = $gitlab;
      }
    },
    compiled() {
      if (!!localStorage.getItem('privateToken')) {
        this.clickSection('#gitlabSettings');
      }
      Object.assign($gitlab.GITLAB, this.gitlab);
      this.getProjects();
    },
    methods: {
      saveSettings() {
        const self = this;
        const fields = Object.keys(this.gitlab);
        const emptyField = fields.find(f => this.gitlab[f] == '');
        if (emptyField) {
          alert(`${emptyField} can not be empty!`);
          return;
        }
        fields.forEach(f => localStorage.setItem(f, this.gitlab[f]))
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
        $gitlab.groups()
          .then(data => data.projects.filter(p => {
            return p.name.indexOf('comp-') === 0 || p.name.indexOf('util-') === 0;
          }))
          .then(all => all.map(p => {
            this.getTags(p.id, p.name);
            this.getMaster(p.id);
            return {
              name: p.name,
              desc: p.description,
              id: p.id
            };
          }))
          .then(all => this.items = all.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
          }))
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
        const tag = e.target.parentNode.dataset.tag;
        const modDir = this.gitlab.moduleDirectory;
        $gitlab.downloadArchive(projectId, tag).then(buf => {
          const srcZip = write(`cache/${projectName}-${tag}.zip`, buf);
          const destDir = Editor.url(`db://assets/${modDir}`);
          if (!$fs.existsSync(destDir)) {
            $fs.mkdirSync(destDir);
          }
          let commit = this.tags[projectId].find(t => t.name === tag).commit;
          if (!commit) {
            commit = this.branches[projectId].commit;
          }
          const sha = commit.id;
          extract(srcZip, destDir).on('close', () => {

            const from = `${destDir}/${projectName}-${tag}-${sha}`;
            const to = `${destDir}/${projectName}`;
            const assetsTo = `db://assets/${modDir}/${projectName}`;
            if ($fs.existsSync(to)) {
              const ver = this.getCurrentVersion(projectName);
              if (confirm(`Bakup ${modDir}/${projectName} to ${projectName}-${ver}, delete it yourself.`)) {
                const bak = `${to}-${ver}`;
                const assetsBak = `db://assets/${modDir}/${projectName}-${ver}`;
                $fs.renameSync(to, bak);
                Editor.assetdb.refresh(assetsBak);
              } else return
            }
            $fs.renameSync(from, to);
            Editor.assetdb.refresh(assetsTo);
            // alert('Done!');
          });
        });
      },
      getTags(projectId, projectName) {
        return $gitlab.tags(projectId)
          .then(all => {
            const tags = [{name: 'master'}].concat(all.filter(p => ({name: p.name})));
            Vue.set(this.tags, projectId, tags);
            this.setCurrentVersion(projectId, projectName);
          });
      },
      setCurrentVersion(projectId, projectName) {
        const tags = this.tags[projectId];
        const cur = this.getCurrentVersion(projectName);
        tags.current = cur;
        const ver = `v${cur}`
        setTimeout(() => {
          const uiSelect = document.querySelector(`::shadow #project-tags-${projectId}`);
          uiSelect.value = ver;
        }, 0);
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
      getCurrentVersion(name) {
        const url = Editor.url(`db://assets/${this.gitlab.moduleDirectory}/${name}/package.json`);
        if (!$fs.existsSync(url)) return 'unknown';
        try {
          const pkg = JSON.parse($fs.readFileSync(url).toString());
          return pkg.version || 'unknown';
        } catch (e) {
          return 'unknown';
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
      this.vm.refresh();
    }
  }
});

function require_(relativePath) {
  return Editor.require(`packages://cc-modules/${relativePath}`);
}