#!/usr/bin/env node

const fs = require('fs-extra');
const { resolve } = require('path');
const pwd = (...args) => resolve(process.cwd(), ...args);
const argv = process.argv.splice(2);

const [root, ...matchs] = argv;

if (!matchs) {
  throw new Error('need input match files names');
}

const loadTestFiles = dir => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
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
        require(nextDir);
      }
    }
  });
};

loadTestFiles(pwd(root));
