const { ReppubServer } = require('fresa-core');

describe('import', () => {
  describe('#fresa-core', () => {
    it('reppub-server', (done) => {
      const s = new ReppubServer({});
      s.bind({ repPort: 9990, pubPort: 9991 }, () => {
        s.close(() => {
          done();
        });
      });
    });
  });
});
