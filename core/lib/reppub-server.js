/**
 * Rep/Pub Server: Template for particular servers here
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const nng = require('nanomsg');

class ReppubServer {
  constructor({ config, logger }) {
    this.config = config || {};
    this.logger = logger || console;
    this.rep = nng.socket('rep');
    this.pub = nng.socket('pub');

    this.rep.on('data', (buf) => {
      this.repCb(buf);
    });
  }

  // bind method of nanomsg lib is async so wait before calling cb
  bind({ repPort, pubPort }, cb) {
    const repUrl = `ws://*:${repPort}`;
    const pubUrl = `ws://*:${pubPort}`;
    this.rep.bind(repUrl);
    this.pub.bind(pubUrl);
    this.logger.log(`Server started: ${this.config.VersionStr}, REP: ${repUrl}, PUB: ${pubUrl}`);

    if (cb) {
      // todo: this number is magical, need better way
      setTimeout(cb, 50);
    }
  }

  // close method of nanomsg lib is async so wait before calling cb
  close(cb) {
    this.rep.close();
    this.pub.close();
    this.logger.log('Server stopped');

    if (cb) {
      // todo: this number is magical, need better way
      setTimeout(cb, 10);
    }
  }

  static repCb() {
    throw new Error('repCb not implemented');
  }
}

module.exports = ReppubServer;
