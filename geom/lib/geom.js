/**
 * Geom: Geometry server
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const { ReppubServer, proto } = require('fresa-core');
const { pack } = proto;

class Geom extends ReppubServer {
  constructor({ config, logger }, cb) {
    super({ config, logger });

    this.logger = logger || console;
    this.bind({
      repPort: config.GeomCmdPort,
      pubPort: config.GeomDatPort,
    }, cb);
  }

  repCb(buf) {
  }
}

module.exports = Geom;
