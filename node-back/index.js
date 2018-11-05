/*
 * Fresa nodejs demo
 * 1. serves a minimal html view
 * 2. serves device list
 * 3. serves param map
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const stat = require('serve-handler');
const http = require('http');
const CacherClient = require('./cacher-client');
const GreeterClient = require('./greeter-client');

// ===== Utils =====
function mapToList(m) {
  // frontend doesn't like maps
  return Object.keys(m).map(key => ({ key, value: m[key] }));
}

function sendjson(response, o) {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(o));
}

// ===== Core =====
const greeter = new GreeterClient();
const cacher = new CacherClient();

// ===== HTTP =====
// very simple http server that serves
// 1. static
// 2. /devices -> device list as json
// 3. /device/<addr> -> selects device
// 4. /params -> param map as json
const server = http.createServer((request, response) => {
  const { url } = request;
  if (url === '/devices') {
    greeter.search(() => {
      sendjson(response, mapToList(greeter.devices));
    });
  } else if (url.startsWith('/device/')) {
    const addr = url.slice(8);
    // connect to the addr
    cacher.connect(addr, greeter.devices[addr].config);
    // respond with addr and config
    sendjson(response, { key: addr, value: greeter.devices[addr] });
  } else if (url === '/params') {
    sendjson(response, mapToList(cacher.params));
  } else if (url.startsWith('/param/')) {
    const parts = url.slice(7).split('/');
    sendjson(response, {});
    cacher.setStr(parts[0], parts[1]);
  } else {
    stat(request, response, { public: 'public' });
  }
});

server.listen(3000, () => {
  console.log('View server running at 3000');
});
