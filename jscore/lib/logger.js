/**
 * Logger: Log server
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const fs = require('fs');
const path = require('path');
const msp = require('msgpack-lite');
const ReppubServer = require('./reppub-server.js');

class Logger extends ReppubServer {
  constructor(config, cb) {
    super({ config });

    // chain decoder to rep incoming traffic
    this.decoder = new msp.Decoder();
    this.decoder.on('data', this.unpCb.bind(this));

    if (config.LogToFile) {
      this.fileSize = 0;
      this.makeNewFile();
    }

    this.bind({
      repPort: config.LoggerCmdPort,
      pubPort: config.LoggerDatPort,
    }, cb);
  }

  // todo: detect when file size is too large and start a new file
  makeNewFile() {
    const fname = path.join(this.config.LogPath, 'log.txt');
    this.ostream = fs.createWriteStream(fname, { flags: 'a' });
  }

  // reply logic: just broadcast whatever we receive
  repCb(buf) {
    this.rep.send('');
    this.pub.send(buf);
    this.decoder.decode(buf);
  }

  unpCb(list) {
    const [verblevel, prefix, tvalue, line] = list;
    const time = new Date(tvalue);
    const data = `[${verblevel}][${prefix}][${time.toISOString()}] ${line}`;

    if (this.config.LogToConsole) {
      console.log(String(data));
    }

    if (this.config.LogToFile) {
      this.ostream.write(data);
      this.ostream.write('\n');
    }
  }

  close(cb) {
    if (this.config.LogToFile) {
      this.ostream.end();
    }
    super.close(cb);
  }
}

module.exports = Logger;
