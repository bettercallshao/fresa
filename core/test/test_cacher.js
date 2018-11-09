const Cacher = require('../lib/cacher.js');
const Client = require('../lib/reqsub-client.js');
const { pack, Unpacker } = require('../lib/proto.js');

const config = {
  CacherCmdPort: 9990,
  CacherDatPort: 9991,
  Params: [
    {
      Key: 100, Name: 'a_int', Type: 'i', Denominator: 10,
    },
    { Key: 101, Name: 'a_binary', Type: 'b' },
    { Key: 102, Name: 'a_string', Type: 's' },
    { Key: 103, Name: 'a_float', Type: 'f' },
  ],
  Series: [
    { Key: -100, Name: 'a_serie', Serie: [101, 102, 103, 100] },
  ],
};

describe('cacher', () => {
  describe('#constructs', () => {
    it('contructs and closes', (done) => {
      const s = new Cacher({ config }, (() => {
        s.close(() => {
          done();
        });
      }));
    });
  });
  describe('#replies', () => {
    it('all, series, single', (done) => {
      const s = new Cacher({ config }, (() => {
        const recv = [];
        const upk = new Unpacker((l) => { recv.push(l); });
        const c = new Client({ reqCb: (buf) => { upk.feed(buf); } });
        c.connect({ addr: 'localhost', reqPort: 9990, subPort: 9991 }, () => {
          c.req.send(pack([[-100, [true, 'js', 4.55, 99]]]));
          setTimeout(() => {
            c.req.send(pack([[0, 102]]));
            setTimeout(() => {
              c.req.send(pack([[0, -100]]));
              setTimeout(() => {
                c.req.send(pack([[0, 0]]));
              }, 20);
            }, 20);
          }, 20);
        });
        setTimeout(() => {
          s.close();
          c.close();
          if (recv[0][0] === 102 && recv[0][1] === 'js'
              && recv[1][0] === -100 && recv[1][1][0] === true
                                     && recv[1][1][1] === 'js'
                                     && recv[1][1][2] === 4.55
                                     && recv[1][1][3] === 99
              && recv[2][0] === 100 && recv[2][1] === 99
              && recv[5][0] === 103 && recv[5][1] === 4.55) {
            done();
          } else {
            done(new Error(recv));
          }
        }, 200);
      }));
    });
  });
  describe('#changes', () => {
    it('single', (done) => {
      const s = new Cacher({ config }, (() => {
        const c = new Client({});
        c.connect({ addr: 'localhost', reqPort: 9990, subPort: 9991 }, () => {
          c.req.send(pack([[100, 88]]));
        });
        setTimeout(() => {
          s.close();
          c.close();
          if (s.params.get(100) === 88) {
            done();
          } else {
            done(new Error(Array.from(s.params)));
          }
        }, 100);
      }));
    });
    it('series', (done) => {
      const s = new Cacher({ config }, (() => {
        const c = new Client({});
        c.connect({ addr: 'localhost', reqPort: 9990, subPort: 9991 }, () => {
          c.req.send(pack([[-100, [true, 'js', 4.55, 99]]]));
        });
        setTimeout(() => {
          s.close();
          c.close();
          if (s.params.get(100) === 99
              && s.params.get(101) === true
              && s.params.get(102) === 'js'
              && s.params.get(103) === 4.55) {
            done();
          } else {
            done(new Error(Array.from(s.params)));
          }
        }, 100);
      }));
    });
  });
});
