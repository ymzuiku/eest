# Eest

> 易用的, 速度惊人的, 保持`原运行环境`的测试工具

> 有着原始的 console 打印和原始报错信息，回归了源程序本来的面貌

做一个测试需要哪些任务：

- 引入源程序
- 执行并且记录测试结果

Eest 就只做了这些

## Eest 存在的意义

jest \ ava 等测试库做的都太多了，它们为了更好的定位错误，分离执行测试程序和执行程序，这导致于测试执行过程中的程序和我们平时执行过程中所呈现的感受不一致。每当我们执行这些测试程序的时候，都有一种和执行源程序不一致的感官。

回想测试的本质是什么？它仅仅是代替我们手动去校验程序。我们需要的仅仅是一个自动执行的程序，根据我们描述的校验规则去执行。程序异常和源程序一样，唯一的不同仅仅是我们多写了一些测试用例。

Eest 就是如此，虽然 jest 很伟大，但是 Eest 才是我要的。它让我感觉编写和执行测试代码没有任何负担，有着原始的 console 打印和原始报错信息，回归了源程序本来的面貌。

## 原理

Eest 原理非常简单，它仅仅是提供了几个函数，用于我们记录校验的结果，我们引入测试目标代码，并且使用 node 执行。最后 Eest 抛出测试校验结果，仅此而已。它简单到以致于作者仅仅是在睡觉前两个小时的编写就完成了核心功能。

Eest 也不会多做额外的事情，甚至 watch 等行为都交给现成的第三方库，如 nodemon

## 安装

```sh
$ npm i eest --save
```

## 使用

**创建文件**

```md
- controller;
  createUser.js;
  createUser.spec.js; //我们在需要测试的 js 附近创建一个用于测试的文件，文件名随意
```

**编写测试文件**

```js
const { describe, it } = require('eest');
const createUser = require('createUser');

describe('创建用户', () => {
  it('密码长度校验', expect => {
    const user = createUser('username', '123');

    // 校验密码长度是否大于等于6
    expect.eq(user.password.length >= 6, true);
  });
});
```

**执行测试**

最后仅仅是使用 node 去执行它，和执行我们源程序一样：

```sh
node controller/createUser.spec.js
```

## 对整个项目进行测试

我们编写 package.json , 添加 scripts

```json
{
  "scripts": {
    "test": "eest ./src spec.js test.js"
  }
}
```

以上脚本表示，命令执行目录下，文件名包含 spec.js 或 test.js 的文件都会被引入并进行测试，它们之间并不是分离的，实际形式如:

```js
// all.test.js
require('a.spec.js');
require('b.spec.js');

// node all.test.js
```

最后再执行： `npm test`。

之所以没有进行分离执行，一是为了更好的性能，并且作者希望它们之间若有干扰，由开发者自行处理。

## Watch

Eest 原本的设计仅仅是引入测试对象，执行 node 程序的极简方式，因为简单，所以自然和 node 周边的生态有了很好的兼容。我们可以直接使用 nodemon 等库做改动监听：

```sh
$ npm i nodemon --save
```

修改 package.json, 使用 nodemon

```json
{
  "scripts": {
    "test": "nodemon node_modules/.bin/eest ./src spec.js test.js"
  }
}
```

## Babel

为了不污染原项目的 babel，我们使用 @babel/register, 并且在测试启动前引入它。

我们使用 eest.config.js 文件，它会在所有测试执行之前执行

安装 @babel/register:

```sh
yarn add @babel/core @babel/register -D
```

在项目根目录创建 `eest.config.js`:

```js
require('@babel/register')({
  ignore: [/node_modules/],
  cache: true,
});
```

具体的配置请查阅：https://babeljs.io/docs/en/next/babel-register.html

执行测试:

```js
eest ./src spec.js
```

## 配置 mongodb 或其他前置条件

在项目根目录创建 `eest.config.js`:

```js
// 导出的函数会在 promise 之后再执行后续的测试
modules.exports = async () => {
  const db = await MongodbClient('...');
  global.db = db;
};
```

谢谢使用
