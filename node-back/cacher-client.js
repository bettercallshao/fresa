/**
 * Module for intefacing with cacher
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const nng = require('nanomsg');
const msp = require('msgpack-lite');

class Client {
  constructor() {
    this.ip = '';
    this.config = {};
    this.req = nng.socket('req');
    this.sub = nng.socket('sub');
    this.params = {};

    this.req.on('data', (buf) => {
      // we expect the exact number of params in the config
      this.fromBuf(buf);
    });

    this.sub.on('data', (buf) => {
      this.fromBuf(buf);
    });
  }

  fromBuf(buf) {
    // make the multi object buffer into list
    const list = msp.decode(buf);

    if (list[0] === 0) {
      this.config.Params.forEach((p, i) => {
        this.params[p.Key] = list[i + 1];
      });
    } else {
      const [key, val] = list.slice(0, 2);
      this.params[key] = val;
    }
  }

  close() {
    this.req.close();
    this.sub.close();
  }

  connect(ip, config) {
    this.ip = ip;
    this.config = config;
    this.req.connect(`ws://${ip}:${config.CacherCmdPort}`);
    this.sub.connect(`ws://${ip}:${config.CacherDatPort}`);

    setTimeout(() => {
      // request for all params
      this.req.send(msp.encode([0x0, 0x0]));
    }, 100);
  }
}

module.exports = Client;
