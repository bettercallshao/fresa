/**
 * Config helper
 *
 * Copyright (c) Shaoqing Tan. All rights reserved.
 */

const fs = require('fs');
const getRepoInfo = require('git-repo-info');

const fpath = 'config.json';

function getGitStr() {
  const info = getRepoInfo();
  return `${info.sha} ${info.branch}`;
}

function getConfig() {
  try {
    const data = fs.readFileSync(fpath);
    const c = JSON.parse(data);
    // enrich version info with git repo info
    c.VersionStr = `v${c.VersionMajor}.${c.VersionMinor} ${getGitStr()}`;
    return c;
  } catch (_) {
    return {};
  }
}

module.exports = getConfig;
