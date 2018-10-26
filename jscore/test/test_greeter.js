const dgram = require('dgram');
const Greeter = require('../lib/greeter.js');

describe('greeter', () => {
  describe('#constructs', () => {
    it('contructs and closes', (done) => {
      const s = new Greeter({ config: { GreeterPort: 9990 } }, (() => {
        s.close(() => {
          done();
        });
      }));
    });
  });
  describe('#serves', () => {
    it('contructs and closes', (done) => {
      const s = new Greeter({ config: { GreeterPort: 9990, akey: 40 } }, (() => {
        const c = dgram.createSocket('udp4');
        c.bind({ port: null }, () => {
          c.setBroadcast(true);
          c.send(Buffer.from(''), 0, 0, 9990, '255.255.255.255');
        });
        let config = null;
        c.on('message', (message) => {
          config = JSON.parse(message);
        });
        setTimeout(() => {
          s.close();
          c.close();
          if (config.GreeterPort === 9990 && config.akey === 40) {
            done();
          } else {
            done(new Error());
          }
        }, 200);
      }));
    });
  });
});
