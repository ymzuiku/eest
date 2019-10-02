#!/usr/bin/env node

const fs = require('fs-extra');
const { resolve, dirname } = require('path');
const pwd = (...args) => resolve(process.cwd(), ...args);

let config;
if (fs.existsSync(pwd('eest.config.js'))) {
  config = require(pwd('eest.config.js'));
}

/** interface */
function IChecker(assert = () => {}) {}
function IIt(name = '', checker = IChecker) {}
function ITask(it = IIt) {}

const allProgress = {
  total: [],
  pass: [],
  fail: [],
};

const taskList = [];
const taskLogs = [];

function getTitle(isPass) {
  return isPass ? 'FAILED' : 'SUCCESSFUL';
}

/** Describe a task */
const describe = async (describeName, task = ITask) => {
  if (typeof config === 'function') {
    const unSkipThis = await config({
      describeName,
      describeTask: task,
    });

    if (unSkipThis === false) {
      return;
    }
  }

  const start = Date.now();

  if (typeof describeName !== 'string') {
    throw new Error('describe name need typeof string');
  }
  if (typeof task !== 'function') {
    throw new Error('describe task need typeof function');
  }

  taskList.push(describeName);

  const progress = {
    total: [],
    pass: [],
    fail: [],
  };

  const checkerList = [];
  const checkerLogs = [];

  await task(async (name, checker) => {
    if (typeof name !== 'string') {
      throw new Error('it name need typeof string');
    }
    if (typeof checker !== 'function') {
      throw new Error('it chekcer need typeof function');
    }
    checkerList.push(name);
    progress.total.push(name);

    const calcData = {
      _fail: true,
      _throw: false,
    };

    // 计算进度
    const calc = () => {
      if (calcData._fail) {
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

    checkerLogs.push(() => console.log(` ${calcData._fail ? '[x]' : '[√]'} ${name} ${calcData._fail ? ` <-*` : ''}`));
    if (checkerLogs.length === checkerList.length) {
      allProgress.total = [...allProgress.total, progress.total];
      allProgress.pass = [...allProgress.pass, progress.pass];
      allProgress.fail = [...allProgress.fail, progress.fail];

      checkerLogs.forEach(v => v());
      console.log(`[${describeName}] it pass : ${progress.pass.length}/${progress.total.length}`);
      console.log(' ');

      taskLogs.push(1);
      if (taskLogs.length === taskList.length) {
        const isPass = allProgress.fail.length === 0;
        console.log(
          `[=${getTitle(isPass)}=] describe pass: ${allProgress.pass.length}/${
            allProgress.total.length
          }  -  Time: ${(Date.now() - start) / 1000}s`
        );
        console.log(' ');
        if (!process.env.watch) {
          process.exit(isPass ? 0 : 1);
        }
      }
    }

    if (calcData._fail) {
      process.exit(1);
    }
  });
};

module.exports = describe;
