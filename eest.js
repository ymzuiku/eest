#!/usr/bin/env node

const fs = require('fs-extra');
const { resolve } = require('path');
const pwd = (...args) => resolve(process.cwd(), ...args);

let config;
if (fs.existsSync(pwd('eest.config.js'))) {
  config = require(pwd('eest.config.js'));
}

let beforeAllEvents = new Set();
const beforeAll = event => {
  if (!beforeAllEvents.has(event)) {
    beforeAllEvents.add(event);
  }
};

let describeLen = 0;

const allProgress = {
  total: [],
  pass: [],
  fail: [],
  skip: [],
};

/** interface */
const IExpect = {
  eq: (a, b) => {},
  pass: (isPass = true) => {},
};
function IChecker(expect = IExpect) {}
function IIt(name = '', checker = IChecker) {}
function IDescribeChecker(it = IIt) {}

/** Create it to describe */
const createIt = progress => async (name, checker) => {
  if (typeof name !== 'string') {
    throw new Error('it name need typeof string');
  }
  if (typeof checker !== 'function') {
    throw new Error('it chekcer need typeof function');
  }
  progress.total.push(name);

  const expect = {
    _skip: false,
    _fail: true,
    _throw: false,
    eq: (a, b) => {
      if (expect._throw) return;
      if (a === b) {
        expect._fail = false;
      } else {
        expect._fail = true;
        expect._throw = true;
      }
    },
    pass: isPass => {
      if (expect._throw) return;
      if (isPass) {
        expect._fail = true;
      } else {
        expect._fail = false;
        expect._throw = true;
      }
    },
  };

  // 计算进度
  const calc = () => {
    if (expect._skip) {
      progress.skip.push(name);
    } else if (expect._fail) {
      progress.fail.push(name);
    } else {
      progress.pass.push(name);
    }
  };

  await checker(expect);
  calc();

  return progress;
};

/** Describe a task */
const describe = async (name, detail = IDescribeChecker) => {
  if (config && !global.__configRunLock) {
    global.__configRunLock = true;
    const unSkipThis = await config({
      describeName: name,
      describeDetail: detail,
      beforeAllEvents,
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
  if (typeof detail !== 'function') {
    throw new Error('describe chekcer need typeof function');
  }

  describeLen += 1;

  if (beforeAllEvents.size > 0) {
    await Promise.all(Array.from(beforeAllEvents));
  }

  setTimeout(async () => {
    const progress = {
      total: [],
      pass: [],
      fail: [],
      skip: [],
    };

    await detail(createIt(progress));

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
        const totalStr = allProgress.total.length > 0 ? `total:${allProgress.total.length}` : undefined;
        const passStr = allProgress.pass.length > 0 ? `pass:${allProgress.pass.length}` : undefined;
        const failStr = allProgress.fail.length > 0 ? `fail:${allProgress.fail.length}` : undefined;
        const skipStr = allProgress.skip.length > 0 ? `skip:${allProgress.skip.length}` : undefined;

        const endStr = [totalStr, passStr, failStr, skipStr].filter(Boolean).join(', ');

        console.log(' ');
        console.log(`[${title}] ${endStr} - ${(Date.now() - start) / 1000} s`);
        console.log(' ');
      }

      if (!isPass) {
        process.exit(0);
      }
    });
  });
};

module.exports = {
  describe,
  beforeAll,
};
