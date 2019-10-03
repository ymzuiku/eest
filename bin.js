#!/usr/bin/env node

const fs = require('fs-extra');
const { resolve } = require('path');
const pwd = (...args) => resolve(process.cwd(), ...args);
const argv = process.argv.splice(2);

let [root, ...matchs] = argv;
let isWatch = false;

argv.forEach(v => {
  if (v === '--watch' || v === '-w') {
    isWatch = true;
  }
});

if (matchs.length === 0) {
  matchs = ['spec.js'];
}

const createDescribe = require('./createDescribe');

const ignores = ['node_modules', '.git', '.cache', '.vscode', '.idea'];
const cache = {};

let errorPathCache;
if (fs.existsSync('node_modules')) {
  errorPathCache = pwd('node_modules/_eestErrorCache.json');
} else if (fs.existsSync('.vscode')) {
  errorPathCache = pwd('.vscode/_eestErrorCache.json');
} else {
  errorPathCache = pwd('_eestErrorCache.json');
}

let lastErrors;

function getLastErrors() {
  if (lastErrors) {
    return lastErrors;
  }
  if (!fs.existsSync(errorPathCache)) {
    lastErrors = {};
  } else {
    lastErrors = fs.readJSONSync(errorPathCache) || {};
  }

  return lastErrors;
}

function updateLastErrors(errorFiles) {
  fs.writeFileSync(errorPathCache, JSON.stringify(errorFiles));
}

let config;
if (fs.existsSync(pwd('eest.config.js'))) {
  config = require(pwd('eest.config.js'));
}

function requireSpec(url) {
  require(url)(
    createDescribe({
      url,
      argv,
      getLastErrors,
      updateLastErrors,
      isWatch,
    }),
    { url, cache }
  );
}

const loadTestFiles = dir => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return;
    }
    files.forEach(file => {
      if (ignores.indexOf(file) > -1) {
        return;
      }

      const nextDir = resolve(dir, file);

      const stat = fs.statSync(nextDir);
      if (stat && stat.isDirectory()) {
        loadTestFiles(nextDir);
      } else {
        let isMatch = false;
        matchs.forEach(str => {
          if (file.indexOf(str) > -1) {
            isMatch = true;
          }
        });
        if (isMatch) {
          requireSpec(nextDir);
        }
      }
    });
  });
};

async function start() {
  if (typeof config === 'function') {
    await config(cache);
  }
  const historyErrors = new Set(Object.values(getLastErrors()));
  if (historyErrors.size > 0) {
    historyErrors.forEach(url => requireSpec(url));
  } else {
    loadTestFiles(pwd(root));
  }
}
start();
