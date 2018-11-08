/**
 * Front demo: Serve static page and let browser do ws
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const express = require('express');
const proxy = require('http-proxy-middleware');

const proxyPort = 8999;
const fresaProxy = proxy('/fresa/', {
  target: `http://localhost:${proxyPort}`,
  ws: true,
});

const app = express();
app.use(fresaProxy);
app.use(express.static('public'));
app.get('*', (req, res) => {
  res.redirect('/index.html');
});

const server = app.listen(8080);
server.on('upgrade', fresaProxy.upgrade);
