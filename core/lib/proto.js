/**
 * Proto helper
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const msp = require('msgpack-lite');

/**
 * expect input is list of lists
 * - we pack as a series of msgpack chunks
 * - each chunck is a list
 * - first el of list is the key
 * - the rest are values (one for single param, more for patterns)
 */
function pack(pairs) {
  // iterate over all pairs
  const outs = pairs.map(pair => msp.encode(pair));

  return Buffer.concat(outs);
}

/**
 * Unpacker object with callback
 *
 * todo: we never terminates the decoder stream with .end()
 */
class Unpacker {
  constructor(cb) {
    this.decoder = new msp.Decoder();
    this.decoder.on('data', (list) => {
      if (!Array.isArray(list) || list.length !== 2) {
        // todo: report error
      } else {
        cb(list);
      }
    });
  }

  feed(buf) {
    this.decoder.decode(buf);
  }
}

module.exports = {
  pack,
  Unpacker,
};
