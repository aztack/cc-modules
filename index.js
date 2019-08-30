'use strict';
/**
 * Package Entry
 * @see https://docs.cocos.com/creator/manual/zh/extension/your-first-extension.html
 */
module.exports = {
  load() {
    Editor.log(`Loading Package "cc-modules" from ${__dirname}`);
  },
  unload() {
    Editor.log('Unloading Package "cc-modules"');
  },
  /**
   * Package Message Handlers
   * @see https://docs.cocos.com/creator/manual/zh/extension/entry-point.html#ipc-消息注册
   */
  messages: {
    ['asset-db:assets-deleted'](e) {
      Editor.Ipc.sendToPanel('cc-modules', 'assetsDeleted', e);
    }
  }
};