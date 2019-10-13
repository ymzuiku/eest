#!/usr/bin/env node

const fs = require('fs-extra');
const { resolve } = require('path');
const pwd = (...args) => resolve(process.cwd(), ...args);
const argv = process.argv.splice(2);
const { log } = require('./log');

// let [root, matchs] = argv;
let root = argv[0];
let matchs = argv[1].split(',').map(v => v.trim());
let isWatch = false;
let isHiddenIt = false;

argv.forEach(v => {
  if (v === '-watch' || v === '-w') {
    isWatch = true;
  }
  if (v === '-hiddenIt') {
    isHiddenIt = true;
  }
});

if (matchs.length === 0) {
  matchs = ['spec.js'];
}

const createDescribe = require('./createDescribe');

const ignores = ['node_modules', '.git', '.cache', '.vscode', '.idea'];
const cache = {};

if (!fs.existsSync('node_modules')) {
  fs.mkdirSync(pwd('node_modules'));
}
const errorPathCache = pwd(`node_modules/_eestErrorCache_${matchs.join('_')}.json`);

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
  const spec = require(url);
  if (typeof spec !== 'function') {
    log.warn(`Path module.exports is no function: ${url}`);
    return;
  }
  spec(
    createDescribe({
      url,
      argv,
      getLastErrors,
      updateLastErrors,
      isWatch,
      isHiddenIt,
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
  let isLoadErrorFiles = false;
  if (historyErrors.size > 0) {
    isLoadErrorFiles = true;
    historyErrors.forEach(url => {
      if (!fs.existsSync(url)) {
        isLoadErrorFiles = false;
      }
    });
  }

  if (isLoadErrorFiles) {
    historyErrors.forEach(url => requireSpec(url));
  } else {
    fs.removeSync(errorPathCache);
    loadTestFiles(pwd(root));
  }
}
start();
