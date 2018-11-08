const proto = require('../lib/proto.js');

describe('proto', () => {
  describe('#packs', () => {
    it('packs dict to bytes', (done) => {
      const ans1 = proto.pack([[100, 5]]);
      const expect = Buffer.from([92, 64, 5]);
      if (Buffer.compare(ans1, expect)) {
        done();
      } else {
        done(new Error(ans1));
      }
    });
    it('handles lists as values', (done) => {
      const ans1 = proto.pack([[100, [5, 6]]]);
      const expect = Buffer.from([93, 64, 92, 5, 6]);
      if (Buffer.compare(ans1, expect)) {
        done();
      } else {
        done(new Error(ans1));
      }
    });
    it('handles multiple', (done) => {
      const ans1 = proto.pack([[100, [5, 6]], [101, 5]]);
      const expect = Buffer.from([93, 64, 92, 5, 6, 92, 65, 5]);
      if (Buffer.compare(ans1, expect)) {
        done();
      } else {
        done(new Error(ans1));
      }
    });
  });
  describe('#unpacks', () => {
    it('streams', (done) => {
      const src = [[100, [8, 9]], [101, [5, 6]], [999999, [true, 'asdf']]];
      let cnt = 0;
      const unpacker = new proto.Unpacker(((pair) => {
        if (pair[0] !== src[cnt][0]
            || pair[1][0] !== src[cnt][1][0]
            || pair[1][1] !== src[cnt][1][1]) {
          done(new Error(pair));
        }
        cnt += 1;
        if (cnt === src.length) {
          done();
        }
      }));
      unpacker.feed(proto.pack(src));
    });
    it('keeps length 1 list', (done) => {
      const src = [[100, [8]]];
      const cnt = 0;
      const unpacker = new proto.Unpacker(((pair) => {
        if (pair[0] !== src[cnt][0]
            || pair[1][0] !== src[cnt][1][0]) {
          done(new Error(pair));
        } else {
          done();
        }
      }));
      unpacker.feed(proto.pack(src));
    });
  });
});
