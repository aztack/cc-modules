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
    ['cc-modules:clicked']() {
      Editor.log('cc-modules:clicked'); // Printed in Cocos Creator Console
      Editor.Ipc.sendToPanel('cc-modules', 'changeText', 'Wow!');
    }
  }
};