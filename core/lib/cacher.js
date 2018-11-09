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

  apply(keys, values) {
    if (keys.length !== values.length) {
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
    // there are two thing in the list
    const [key, value] = lin;

    if (key === 0) {
      // we are asked to return values
      if (value === 0) {
        // return all keys present in separate messages
        const values = Array.from(this.params);
        this.rep.send(pack(values));
      } else {
        // return a predefined series
        const keys = this.series.get(value);
        if (keys) {
          const values = keys.map(key => this.params.get(key));
          this.rep.send(pack([[value, values]]));
        } else if (this.params.has(value)) {
          // return single param
          this.rep.send(pack([[value, this.params.get(value)]]));
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
        lout = this.apply(keys, value);
      } else if (this.params.has(key)) {
        // we are asked to change a single param value
        lout = this.apply([key], [value]);
      } else if (key > 255) {
        // we allow numbers greater than 255 to be defined runtime
        lout = this.apply([key], [value]);
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
