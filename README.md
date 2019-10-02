# Eest

[中文文档](./README-CN.md)

> Easy-to-use, incredibly fast, test tool that maintains the `original operating environment'.

> With the original console printing and error reporting information, it returns to the original appearance of the source program.

What tasks do you need to perform a test?

- Introducing Source Programs

- Perform and record test results

Eest only did the above.

## Why Eest?

There are too many test libraries, such as `Jest` and `ava`, which separate the execution of test programs and execution procedures in order to locate errors better, which results in the inconsistency between the program in the test execution process and the feeling we usually experience in the execution process. Whenever we execute these test programs, we have a sense of inconsistency with the source program.

What is the essence of recall testing? It simply replaces our manual verification procedures. All we need is an automated program, executed according to the verification rules we describe. Program exceptions are the same as source programs. The only difference is that we write more test cases.

That's what Eest is. `Jest` is great, but Eest is what I want. It makes me feel that there is no burden in writing and executing test code. It has the original console printing and error information, and it returns to the original appearance of the source program.

Since it is the most primitive aspect, we should not have the cost of learning.

- No global variables

- No black magic

- No API requiring extra study

## Principle

The Eest principle is very simple. It just provides several functions to record the results of the verification. We introduce the test target code and execute it with node. Finally, Eest throws out the test verification results, that's all. It's so simple that the author completes the core function just two hours before he goes to bed.

Eest doesn't do much extra work, and even watches are handed over to ready-made third-party libraries, such as nodemon.

## Install

```sh
$ npm i eest --save
```

## Use

**Create file**

```md
- controller;
  createUser.js;
  createUser.spec.js;
```

**Write test file**

```js
const { describe } = require('eest');
const createUser = require('createUser');

describe('Create user', async it => {
  // get async/await something
  const db = await MongoClient('....');

  it('Check password length', assert => {
    const user = createUser('username', '123');

    assert(user.password.length >= 6);
  });
});
```

**Run test**

Finally, just use node to execute it, just like our source program:

```sh
node controller/createUser.spec.js
```

## Testing the entire project

We write `package.json` and add scripts

```json
{
  "scripts": {
    "test": "eest ./src spec.js test.js"
  }
}
```

Run： `npm test`。

The reason why there is no separate execution is that the first is for better performance, and the author hopes that if there is interference between them, the developers will handle it by themselves.

## Watch

Eest was originally designed to introduce test objects and execute node programs in a minimal way. Because of its simplicity, nature is well compatible with the ecology around node. We can use the `nodemon` or other libraries directly for change monitoring:

```sh
$ npm i nodemon --save
```

Write package.json, use nodemon:

```json
{
  "scripts": {
    "test": "nodemon node_modules/.bin/eest ./src spec.js test.js"
  }
}
```

## Babel

In order not to pollute the original project's babel, we use @babel/register and introduce it before the test starts.

We use the eest. config. JS file, which executes before all tests are executed

Install @babel/register:

```sh
yarn add @babel/core @babel/register -D
```

Create `eest.config.js` at project root:

```js
require('@babel/register')({
  ignore: [/node_modules/],
  cache: true,
});
```

More babel info：https://babeljs.io/docs/en/next/babel-register.html

Run test:

```js
eest ./src spec.js
```

## Configure mongodb or other preconditions

Create file `eest.config.js` at root project:

```js
// The modules.exports function performs every describe tests after promise
modules.exports = async ({ describeName, describeTask, allProgress }) => {
  // Every describe run here, you can add lock, or do someting at describe
  if (describeName === 'test user') {
    // if return false, skip the describe
    return false;
  }

  if (!global.db) {
    lock = true;
    const db = await MongodbClient('...');
    global.db = db;
  }
};
```

Thinks.
