#!/usr/bin/env node

const progress = {
  total: [],
  pass: [],
  fail: [],
  skip: [],
};

let beforeAllCache = { event: null };
const beforeAll = event => {
  beforeAllCache.event = event;
};

const describe = async (name, checker) => {
  const start = Date.now();

  if (typeof name !== 'string') {
    throw new Error('describe name need typeof string');
  }
  if (typeof checker !== 'function') {
    throw new Error('describe chekcer need typeof function');
  }

  if (beforeAllCache.event) {
    await beforeAllCache.event();
  }

  await checker();

  setTimeout(() => {
    const isPass = progress.total.length === progress.pass.length + progress.skip.length;
    const title = isPass ? 'SUCCESSFUL' : 'FAILED';

    console.log(` `);
    console.log(`* ${name} [time ${(Date.now() - start) / 1000} s]:`);
    progress.total.forEach(n => {
      let isFailName = true;
      if (progress.pass.find(v => v == n)) {
        isFailName = false;
      }
      if (progress.skip.find(v => v == n)) {
        isFailName = false;
      }
      console.log(` ${isFailName ? '[x]' : '[o]'} ${n}`);
    });

    const passStr = progress.pass.length > 0 ? `pass:${progress.pass.length}` : undefined;
    const failStr = progress.fail.length > 0 ? `fail:${progress.fail.length}` : undefined;
    const skipStr = progress.skip.length > 0 ? `skip:${progress.skip.length}` : undefined;

    const endStr = [passStr, failStr, skipStr].filter(Boolean).join(', ');

    console.log(`[${title}] ${endStr}`);

    console.log(' ');

    if (!isPass) {
      process.exit(0);
    }
  });
};

const it = async (name, checker) => {
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

module.exports = {
  it,
  describe,
  beforeAll,
};
