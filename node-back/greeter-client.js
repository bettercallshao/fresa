/**
 * Module for intefacing with greeter
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const dgram = require('dgram');

class Client {
  constructor() {
    // state
    this.devices = {};

    // udp broadcast is used per design
    this.udp = dgram.createSocket('udp4');

    // bind and send (dgram package requires to bind first, port number is abitrary)
    this.udp.bind({ port: null }, () => {
      // only do these after bind takes effect
      this.udp.setBroadcast(true);
    });

    // receive config of device as json
    this.udp.on('message', (message, remote) => {
      const config = JSON.parse(message);
      const addr = remote.address;
      const name = `${addr}: ${config.DeviceType}: ${config.VersionStr}`;
      this.devices[addr] = { config, name };
    });
  }

  // broadcast to solicit devices
  search(cb) {
    // clear device list
    this.devices = {};
    // 9000 is the hard-coded greeter port
    this.udp.send(Buffer.from(''), 0, 0, 9000, '255.255.255.255', (err) => {
      if (err) throw err;
    });
    // call back after 0.5 second
    setTimeout(cb, 500);
  }

  close() {
    this.udp.close();
  }
}

module.exports = Client;
