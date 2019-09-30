const fs = require('fs-extra');
const { resolve } = require('path');
const pwd = (...args) => resolve(process.cwd(), ...args);
const binPwd = (...args) => resolve(__dirname, ...args);
const exec = require('child_process').exec;

module.exports = argv => {
  const loadTestFiles = dir => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const nextDir = resolve(dir, file);
      const stat = fs.statSync(nextDir);
      if (stat && stat.isDirectory()) {
        loadTestFiles(nextDir);
      } else {
        let isMatch = false;
        argv.forEach(str => {
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

  loadTestFiles(pwd());
};
