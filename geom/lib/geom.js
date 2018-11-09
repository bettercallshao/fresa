/**
 * Geom: Geometry server
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const { ReppubServer, ReqsubClient, proto } = require('fresa-core');
const { pack } = proto;

class CacherIf extends ReqsubClient {
  constructor({ addr, config }) {
    super({ config, reqCb: (buf) => { this.fromBuf(buf); }, subCb: (buf) => { this.fromBuf(buf); } });

    this.connect({ addr, reqPort: config.CacherCmdPort, subPort: config.CacherDatPort });

    this.frames = new Map();
  }

  fromBuf(buf) {
  }

  makeFrame(
}

class Geom extends ReppubServer {
  constructor({ addr, config, logger }, cb) {
    super({ config, logger });

    this.addr = addr || 'localhost';
    this.logger = logger || console;

    this.cif = new CacherIf({ addr, config });

    this.bind({
      repPort: config.GeomCmdPort,
      pubPort: config.GeomDatPort,
    }, cb);
  }

  repCb(buf) {
  }

  close(cb) {
    this.cif.close();
    super.close(cb);
  }
}

module.exports = Geom;
