const colors = require('colors/safe');

exports.log = {
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
