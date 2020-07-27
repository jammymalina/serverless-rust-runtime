'use strict';

const { spawnSync } = require('child_process');

const spawn = (command, args, options) => {
  return spawnSync(command, args, {
    stdio: ['ignore', process.stdout, process.stderr],
    ...options,
  });
};

module.exports = spawn;
