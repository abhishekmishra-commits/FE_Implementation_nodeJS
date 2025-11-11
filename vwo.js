const { init } = require('vwo-fme-node-sdk');

let vwoClient;

async function initializeVwo() {
  if (!vwoClient) {
    vwoClient = await init({
      accountId: '995166',
      sdkKey: '89534224fb2eba29d9a51c6a2a50c5b6',
      pollInterval: 6000,
      logger: {
        level: 'DEBUG',
      },
    });
  }
  return vwoClient;
}
module.exports = initializeVwo;