/**
 * Http: Http proxy for websockets
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const proxy = require('http-proxy-middleware');

// proxies paths /fresa/ws/[port] to ws://localhost:[port]
function getProxy(logger) {
  return proxy('/fresa/ws/', {
    target: '[9000, 9999]',
    ws: true,
    router(req) {
      // 10 is the length of the prefix string
      const port = parseInt(req.url.slice(10), 10);
      // only allow 9000 - 9999
      if (port >= 9000 && port <= 9999) {
        return `http://localhost:${port}`;
      }
      return 'http://localhost:9999';
    },
    logProvider() {
      return logger;
    },
  });
}

// intercepts /fresa/config and serves the config
function getServeConfig(config) {
  return function serveConfig(req, res, next) {
    if (req.url.startsWith('/fresa/config')) {
      res.json(config);
    } else {
      next();
    }
  };
}

module.exports = {
  getProxy,
  getServeConfig,
};
