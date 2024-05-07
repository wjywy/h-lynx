#!/usr/bin/env node
const H_Lynx = require('../dist/index.js');
console.log(__filename);
const tran = new H_Lynx.TranCssAndHtml();
tran.enter();