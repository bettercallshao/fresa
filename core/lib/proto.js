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
  const outs = [];

  // iterate over all pairs
  pairs.forEach(([key, val]) => {
    // concat the val to same list or append simple element
    let unit = [key];
    if (Array.isArray(val)) {
      unit = unit.concat(val);
    } else {
      unit.push(val);
    }

    // keep all results in a list and concat all at the end
    outs.push(msp.encode(unit));
  });

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
      if (!Array.isArray(list) || list.length < 2) {
        // todo: report error
      } else if (list.length === 2) {
        cb(list);
      } else {
        cb([list[0], list.slice(1)]);
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
