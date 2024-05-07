#!/usr/bin/env node

import cac from 'cac';
import ora from "ora";
import { blue, green, yellow } from "chalk";
import {TranCssAndHtml} from '../src/index';


const cli = cac();
cli
  .command("[tran,ana]", "h5转换为lynx")
  .action(async (_, options: {
    '--': any[];
    comName: string[];
  }) => {
    const { Input } = require("enquirer");

    options.comName = [
      String(
        await new Input({
          name: "comName",
          message: "请输入你要转化的xxxx",
          initial: '',
        }).run(),
      ),
    ];

    const spinner = ora(blue("🕵️ 正在潜入\n")).start();
    console.log(__filename, 'fileName');
    const startTime = Date.now();
    const tran = new TranCssAndHtml();
    // await tran.enter();
    // const  = new analysis(option);
    // await ana.OutputFile();

    spinner.stop();
    console.log(green(`转化成功,耗时 ${yellow(Date.now() - startTime)} ms`));
  });

cli.help();
cli.parse();

