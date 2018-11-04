const getConfig = require('../lib/config.js');

describe('config', () => {
  describe('#reads', () => {
    it('reads content of config file', (done) => {
      const c = getConfig();
      if (c.Params) {
        done();
      } else {
        done(new Error());
      }
    });
  });
});
