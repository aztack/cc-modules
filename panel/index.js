const { read, pkgName } = require_('utils.js');
const $gitlab = require_('gitlab.js');

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
        },
        settingsSaved: false,
        items: []
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
      getProjects() {
        $gitlab.groups()
          .then(data => data.projects.filter(p => p.name.indexOf('comp-') === 0))
          .then(all => all.map(p => ({name: p.name, desc: p.description})))
          .then(all => this.items = all)
      },
      onPropChange(e) {
        const key = e.target.dataset.key;
        this.gitlab[key] = $gitlab[key] = e.target.value;
      },
      clickSection(id) {
        this.$el.querySelector(`${id} .header`).click();
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
  }
});

function require_(relativePath) {
  return Editor.require(`packages://cc-modules/${relativePath}`);
}