/**
 * Logger Client: Make logging easier
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const msp = require('msgpack-lite');
const ReqsubClient = require('./reqsub-client.js');

class LoggerClient extends ReqsubClient {
  constructor({ config, addr, prefix }, cb) {
    super({ config });

    this.prefix = prefix;
    this.connect({ addr, reqPort: config.LoggerCmdPort }, cb);
  }

  log(data, verblevel = 0) {
    this.send(msp.encode([
      verblevel, this.prefix, Date.now(), data,
    ]));
  }

  debug(data) {
    this.log(data, 2);
  }

  info(data) {
    this.log(data, 1);
  }

  warn(data) {
    this.log(data, 0);
  }

  error(data) {
    this.warn(data);
  }
}

module.exports = LoggerClient;
