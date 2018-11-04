/**
 * Req/Sub Client: Template for client to use with servers here
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const nng = require('nanomsg');

class ReqsubClient {
  constructor({ config, reqCb, subCb }) {
    this.config = config || {};
    this.req = nng.socket('req');
    this.sub = nng.socket('sub');

    // queue of pending messages to send
    this.queue = [];

    this.req.on('data', (buf) => {
      // todo: I am hoping the .shift is thread safe here, actually not even
      // how javascript threads work, anyway we may find bugs here later
      this.queue.shift();
      if (this.queue.length > 0) {
        const next = this.queue[0];
        this.req.send(next);
      }
      if (reqCb) {
        reqCb(buf);
      }
    });

    this.sub.on('data', (buf) => {
      if (subCb) {
        subCb(buf);
      }
    });
  }

  // connect method of nanomsg lib is async so wait before calling cb
  connect({ addr, reqPort, subPort }, cb) {
    if (addr) {
      // allow empty ports
      if (reqPort) {
        this.req.connect(`ws://${addr}:${reqPort}`);
      }
      if (subPort) {
        this.sub.connect(`ws://${addr}:${subPort}`);
      }
    }

    if (cb) {
      // todo: this number is magical, need better way
      setTimeout(cb, 50);
    }
  }

  // send thru req
  send(data) {
    // if queue is backed up too much, fail silently
    if (this.queue.length < 5) {
      // todo: may need to revisit for concurrency
      // rant: this is stupid, the js wrapper should make nanomsg handle this
      this.queue.push(data);
      if (this.queue.length === 1) {
        this.req.send(data);
      }
    }
  }

  // close method of nanomsg lib is async so wait before calling cb
  close(cb) {
    this.req.close();
    this.sub.close();

    if (cb) {
      // todo: this number is magical, need better way
      setTimeout(cb, 10);
    }
  }
}

module.exports = ReqsubClient;
