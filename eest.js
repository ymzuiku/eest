#!/usr/bin/env node

const fs = require('fs-extra');
const { resolve } = require('path');
const pwd = (...args) => resolve(process.cwd(), ...args);

let config;
if (fs.existsSync(pwd('eest.config.js'))) {
  config = require(pwd('eest.config.js'));
}

let describeLen = 0;

const allProgress = {
  total: [],
  pass: [],
  fail: [],
  skip: [],
};

/** interface */
function IChecker(assert = () => {}) {}
function IIt(name = '', checker = IChecker) {}
function ITask(it = IIt) {}

/** Create it to describe */
const createIt = progress => async (name, checker) => {
  if (typeof name !== 'string') {
    throw new Error('it name need typeof string');
  }
  if (typeof checker !== 'function') {
    throw new Error('it chekcer need typeof function');
  }
  progress.total.push(name);

  const calcData = {
    _skip: false,
    _fail: true,
    _throw: false,
  };

  // 计算进度
  const calc = () => {
    if (calcData._skip) {
      progress.skip.push(name);
    } else if (calcData._fail) {
      progress.fail.push(name);
    } else {
      progress.pass.push(name);
    }
  };

  const assert = value => {
    if (calcData._throw) return;
    if (!value) {
      calcData._fail = true;
    } else {
      calcData._fail = false;
      calcData._throw = true;
    }
  };

  await checker(assert);
  calc();

  return progress;
};

/** Describe a task */
const describe = async (name, task = ITask) => {
  if (typeof config === 'function' && !global.__configRunLock) {
    global.__configRunLock = true;
    const unSkipThis = await config({
      describeName: name,
      describeTask: task,
      allProgress,
    });

    if (unSkipThis === false) {
      return;
    }
  }

  const start = Date.now();

  if (typeof name !== 'string') {
    throw new Error('describe name need typeof string');
  }
  if (typeof task !== 'function') {
    throw new Error('describe task need typeof function');
  }

  describeLen += 1;

  setTimeout(async () => {
    const progress = {
      total: [],
      pass: [],
      fail: [],
      skip: [],
    };

    await task(createIt(progress));

    setTimeout(() => {
      describeLen -= 1;
      allProgress.total = [...allProgress.total, ...progress.total];
      allProgress.fail = [...allProgress.fail, ...progress.fail];
      allProgress.skip = [...allProgress.skip, ...progress.skip];
      allProgress.pass = [...allProgress.pass, ...progress.pass];

      const isPass = progress.total.length === progress.pass.length + progress.skip.length;

      console.log(' ');
      console.log(`[${name}]:`);
      progress.total.forEach(n => {
        let isFailName = true;
        if (progress.pass.find(v => v == n)) {
          isFailName = false;
        }
        if (progress.skip.find(v => v == n)) {
          isFailName = false;
        }
        console.log(` ${isFailName ? '[x]' : '[o]'} ${n} ${isFailName ? ' <-*' : ''}`);
      });

      if (describeLen === 0 || !isPass) {
        const title = allProgress.fail.length === 0 ? 'SUCCESSFUL' : 'FAILED';
        // const totalStr = allProgress.total.length > 0 ? `total:${allProgress.total.length}` : undefined;
        // const passStr = allProgress.pass.length > 0 ? `pass:${allProgress.pass.length}` : undefined;
        const failStr = allProgress.fail.length > 0 ? `fail:${allProgress.fail.length}` : undefined;
        // const skipStr = allProgress.skip.length > 0 ? `skip:${allProgress.skip.length}` : undefined;

        // const endStr = [totalStr, passStr, failStr, skipStr].filter(Boolean).join(', ');

        console.log(' ');
        console.log(
          `[${title}] pass:${allProgress.pass.length}/${allProgress.total.length}${
            failStr ? `, ${failStr}` : ''
          } - ${(Date.now() - start) / 1000} s`
        );
        console.log(' ');
      }

      if (!isPass) {
        process.exit(0);
      }
    });
  });
};

module.exports = describe;
