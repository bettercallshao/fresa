/**
 * Cacher: Parameter server
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const ReppubServer = require('./reppub-server.js');
const { pack, Unpacker } = require('./proto.js');

class Cacher extends ReppubServer {
  constructor({ config, logger }, cb) {
    super({ config, logger });

    this.logger = logger || console;
    this.initMap();
    this.unpacker = new Unpacker(this.unpCb.bind(this));
    this.bind({
      repPort: config.CacherCmdPort,
      pubPort: config.CacherDatPort,
    }, cb);
  }

  initMap() {
    this.params = new Map();
    if (this.config.Params) {
      this.config.Params.forEach(({ Key }) => {
        this.params.set(Key, null);
      });
    }

    this.series = new Map();
    if (this.config.Series) {
      this.config.Series.forEach(({ Key, Serie }) => {
        this.series.set(Key, Serie);
      });
    }
  }

  repCb(buf) {
    this.unpacker.feed(buf);
  }

  collect(keys) {
    return keys.map(key => this.params.get(key));
  }

  apply(keys, values) {
    if (keys.length === values.length) {
      // this is a normal series / single param
    } else if (keys.length === 1 && !Array.isArray(values)) {
      // this is a series but with only one param
      values = [values];
    } else {
      // this is unknown, fail silently
      return [];
    }

    const lout = [];
    keys.forEach((key, i) => {
      const val = values[i];
      const old = this.params.get(key);
      if (old !== val) {
        // change our account
        this.params.set(key, val);
        // log
        this.logger.log(`${key} <= (${val})`);
        // add to list of changes to publish
        lout.push([key, val]);
      }
    });
    return lout;
  }

  unpCb(lin) {
    // there are at least two thing in the list
    const [key, first] = lin.slice(0, 2);

    if (key === 0) {
      // we are asked to return values, further values are ignored
      if (first === 0) {
        // return all predefined keys in its order
        const predKeys = this.config.Params.map(p => p.Key);
        this.rep.send(pack([[0, this.collect(predKeys)]]));
      } else {
        // return a predefined series
        const keys = this.series.get(first);
        if (keys) {
          this.rep.send(pack([[first, this.collect(keys)]]));
        } else if (this.params.has(first)) {
          // return single param
          this.rep.send(pack([[first, this.params.get(first)]]));
        } else {
          // unknown
          this.rep.send('');
        }
      }
    } else {
      this.rep.send('');
      let lout = [];
      // we are asked to change our value
      if (this.series.has(key)) {
        // we are asked to change a series of values
        const keys = this.series.get(key);
        lout = this.apply(keys, first);
      } else if (this.params.has(key)) {
        // we are asked to change a single param value
        lout = this.apply([key], [first]);
      } else {
        // can't act
      }
      // publish changes if any
      if (lout.length) {
        this.pub.send(pack(lout));
      }
    }
  }
}

module.exports = Cacher;
