const colors = require('colors/safe');

const log = {
  info: (...args) => {
    if (process.env.nocolor) {
      console.log('[eest]', ...args);
    }
    console.log(colors.dim('[eest]'), ...args);
  },
  warn: (...args) => {
    if (process.env.nocolor) {
      console.log('[eest]', ...args);
    }
    console.log(colors.dim('[eest]'), colors.brightRed(...args));
  },
};

/** interface */
function IChecker(assert = () => {}) {}
function IIt(name = '', checker = IChecker) {}
function ITask(it = IIt) {}

let allProgress, taskList, taskLogs, taskErrorUrls;
function createData() {
  allProgress = {
    total: [],
    pass: [],
    fail: [],
  };

  taskList = [];
  taskLogs = [];
  taskErrorUrls = {};
}
createData();

/** Describe a task */
const createDescribe = ({ url, argv, getLastErrors, updateLastErrors, isWatch }) => {
  const describe = async (describeName, task = ITask) => {
    if (typeof describeName !== 'string') {
      throw new Error('describe name need typeof string');
    }
    if (typeof task !== 'function') {
      throw new Error('describe task need typeof function');
    }

    const startTime = Date.now();
    const historyErrors = Object.values(getLastErrors());

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
      const errorKey = `${url}:${describeName}:${name}`;

      // 若有历史错误未解决，跳过上次未捕获错误的测试，焦距历史错误，这可以使得在成千上万的测试用例中焦距当下需要解决的错误
      const skipLogPassTask = historyErrors.length > 0 && !getLastErrors()[errorKey];

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
          calcData._throw = true;
        } else {
          calcData._fail = false;
        }
      };

      await checker(assert);
      calc();

      checkerLogs.push(() => {
        if (!skipLogPassTask || calcData._fail) {
          log[calcData._fail ? 'warn' : 'info'](
            `${calcData._fail ? '[x]' : '[√]'} ${name} ${calcData._fail ? ` <-*` : ''}`
          );
        }
      });
      if (calcData._fail) {
        taskErrorUrls[errorKey] = url;
      }

      if (checkerLogs.length === checkerList.length) {
        allProgress.total = [...allProgress.total, ...progress.total];
        allProgress.pass = [...allProgress.pass, ...progress.pass];
        allProgress.fail = [...allProgress.fail, ...progress.fail];

        if (!skipLogPassTask || progress.fail.length > 0) {
          log[progress.fail.length > 0 ? 'warn' : 'info'](
            `[${describeName}] ${progress.fail.length > 0 ? 'fail' : 'pass'}`
          );
        }

        checkerLogs.forEach(v => v());
        if (!skipLogPassTask) {
          console.log(' ');
        }

        taskLogs.push(1);

        // 结束统计
        if (taskLogs.length === taskList.length) {
          const isPass = allProgress.pass.length === allProgress.total.length;
          // 如果有历史错误，先处理历史错误
          if (historyErrors.length > 0) {
            // 如果历史错误已清理完，提示重新检查整个项目的错误
            if (isPass) {
              log.info(`[FOCUS] Done! Please run again -  Time: ${(Date.now() - startTime) / 1000}s`);
            } else {
              // 如果历史错误未清理完，提示当前还焦距的历史错误
              log.warn(`[FOCUS] fail: ${historyErrors.length}  -  Time: ${(Date.now() - startTime) / 1000}s`);
            }
          } else {
            log[isPass ? 'info' : 'warn'](
              `[${isPass ? 'SUCCESSFUL' : 'FAILED'}] pass: ${allProgress.pass.length}/${
                allProgress.total.length
              }  -  Time: ${(Date.now() - startTime) / 1000}s`
            );
          }

          // 更新错误缓存
          updateLastErrors(taskErrorUrls);
          if (!isWatch) {
            process.exit(isPass ? 0 : 1);
          }
        }
      }
    });
  };

  return describe;
};

module.exports = createDescribe;
