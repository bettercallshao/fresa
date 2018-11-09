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
    this.dec = new msp.Decoder();
    this.params = {};

    this.req.on('data', (buf) => {
      this.fromBuf(buf);
    });

    this.sub.on('data', (buf) => {
      this.fromBuf(buf);
    });

    this.dec.on('data', (list) => {
      this.fromList(list);
    });
  }

  fromBuf(buf) {
    this.dec.decode(buf);
  }

  fromList([key, val]) {
    this.params[key] = val;
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

  setStr(keyStr, valueStr) {
    const key = parseInt(keyStr, 10);
    let t = null;
    const paramCfg = this.config.Params;
    for (const { Key, Type } of paramCfg) {
      if (Key === key) {
        t = Type;
        break;
      }
    }

    let value = valueStr;
    if (!t) {
      return;
    } if (t === 'i') {
      value = parseInt(value, 10);
    } else if (t === 'b') {
      value = value === 'true';
    } else if (t === 'f') {
      value = parseFloat(value);
    }

    this.req.send(msp.encode([key, value]));
  }
}

module.exports = Client;
