/*
 * Greeter: Discovery and config server
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const dgram = require('dgram');

class Greeter {
  constructor({ config, logger }, cb) {
    // remember payload
    this.data = JSON.stringify(config);
    this.logger = logger || console;

    // answer udp requests (the client will use a broadcast to survey)
    this.udp = dgram.createSocket('udp4');

    // call cb when we ready
    this.udp.on('listening', () => {
      this.logger.log(`Server started: ${config.VersionStr}, UDP: ${config.GreeterPort}`);
      if (cb) {
        cb();
      }
    });

    // receive config of device as json
    this.udp.on('message', (message, remote) => {
      this.logger.log(`${remote.address}:${remote.port}`);
      // ignore errors, we can't really do anything
      this.udp.send(this.data, remote.port, remote.address);
    });

    this.udp.bind({ port: config.GreeterPort });
  }

  close(cb) {
    this.udp.close();
    this.logger.log('Server stopped');
    if (cb) {
      cb();
    }
  }
}

module.exports = Greeter;
