const fs = require('fs');
const Logger = require('../lib/logger.js');
const Client = require('../lib/logger-client.js');

describe('logger', () => {
  describe('#constructs', () => {
    it('contructs and closes', (done) => {
      const s = new Logger({
        LoggerCmdPort: 9990, LoggerDatPort: 9991, LogToFile: false, LogToConsole: false,
      }, (() => {
        s.close(() => {
          done();
        });
      }));
    });
  });
  describe('#logs', () => {
    it('creates file', (done) => {
      const fpath = '/tmp/log.txt';
      if (fs.existsSync(fpath)) {
        fs.unlinkSync(fpath);
      }
      const s = new Logger({
        LoggerCmdPort: 9990, LoggerDatPort: 9991, LogToFile: true, LogPath: '/tmp', LogToConsole: false,
      }, (() => {
        s.close(() => {
          if (fs.existsSync(fpath)) {
            done();
          } else {
            done(new Error());
          }
        });
      }));
    });
    it('handles client', (done) => {
      const fpath = '/tmp/log.txt';
      if (fs.existsSync(fpath)) {
        fs.unlinkSync(fpath);
      }
      const s = new Logger({
        LoggerCmdPort: 9990, LoggerDatPort: 9991, LogToFile: true, LogPath: '/tmp', LogToConsole: false,
      }, (() => {
        setTimeout(() => {
          s.close(() => {
            if (fs.existsSync(fpath)) {
              const stats = fs.statSync(fpath);
              if (stats.size === 94) {
                done();
              } else {
                done(new Error(stats.size));
              }
            } else {
              done(new Error());
            }
          });
        }, 200);
      }));
      // get a client to log some
      const c = new Client({ config: { LoggerCmdPort: 9990 }, addr: 'localhost', prefix: 'test' }, (() => {
        setTimeout(() => {
          c.log('0123456789');
          c.log('1234567890');
          setTimeout(() => {
            c.close();
          }, 50);
        }, 100);
      }));
    });
  });
});
