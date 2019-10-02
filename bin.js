#!/usr/bin/env node

const fs = require('fs-extra');
const { resolve } = require('path');
const pwd = (...args) => resolve(process.cwd(), ...args);
const argv = process.argv.splice(2);

const [root, ...matchs] = argv;

if (!matchs) {
  throw new Error('need input match files names');
}

const ignores = ['node_modules', '.git', '.cache', '.vscode', '.idea'];

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
          require(nextDir);
        }
      }
    });
  });
};

loadTestFiles(pwd(root));
