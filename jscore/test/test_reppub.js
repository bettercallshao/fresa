const ReppubServer = require('../lib/reppub-server.js');

describe('reppub-server', () => {
  describe('#constructs', () => {
    it('contructs, binds, and closes', (done) => {
      const s = new ReppubServer({});
      s.bind({ repPort: 9990, pubPort: 9991 }, () => {
        s.close(() => {
          done();
        });
      });
    });
  });
});
