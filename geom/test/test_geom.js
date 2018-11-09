const Geom = require('../lib/geom')

const config = {
  GeomCmdPort: 9990,
  GeomDatPort: 9991,
};

describe('geom', () => {
  describe('#constructs', () => {
    it('contructs and closes', (done) => {
      const s = new Geom({ config }, (() => {
        s.close(() => {
          done();
        });
      }));
    });
  });
});
