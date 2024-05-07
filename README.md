<a name="t2hBU"></a>
## 简介
**H5-Lynx** 意为 h5 到 lynx 的代码转换工具，具有按照**配置文件**进行 h5 到 lynx 代码的一键转换能力
<a name="AKBFI"></a>
## 快速开始
<a name="wVDs5"></a>
### 下载依赖
进入本地文件夹后，运行<br />`pnpm i`
<a name="VfQaA"></a>
### 本地调试
确认本地分支拥有 h-lynx 文件夹<br />之后你可以在 `package.json` 中添加 **script** 脚本
```json
"scripts": {
  "ca" : "node ./h-lynx/cli/bin.js" 
},
```
如果想根据默认配置直接转换（默认配置为项目同级目录下的 `ts.config.json` 文件）， 需要在命令行中运行：<br />`pnpm run tran`<br />**Tip:**<br />由于实验阶段，本项目暂未开启默认配置，若想要实现转换功能，需要手动声明 `tran.config.json` 文件，其配置与参数与 `ts.config.json` 无异<br />需要注意的是，在实验阶段，必须要手动指定工具所覆盖的文件夹（也就是 `tran.config.json` 中的 `include` 字段），否则将会直接退出不予转换，
<a name="kNHb9"></a>
## 实现功能

- [x] div 转 view
- [x] span 转 text
- [x] 为类型为 string 的文本或变量自动包一层 text
- [x] styles.component 转 less
- [x] 埋点处自动加上 TeaWarpper 组件，且根据原先h5打点的标签进行属性的迁移（还未加?.common——这个是否有自动添加的必要呢）
- ~~原先为 div，转换后的 view 标签变为 TeaWarpper 标签~~，且为less文件加上?.common
- ~~下一层为 span，转换后的 text 标签变为 TeaWarpper 标签~~，~~加上"as = text" ~~，且为less文件加上?.common
- ~~下一层为 img，转换后的 image 标签变为 TeaWarpper 标签~~，~~加上 "as = img"~~，且为less文件加上?.common
- 其他标签的规则是？？
- [x] ICON 组件前后自动套一层 view 并将 classname 属性移入 view
- [x] h5 和 lynx 导入包的迁移(待定)
- 在导出方法名称相同的情况下，只需要给出前后包名进行简单替换即可
- 在导出方法前后名称不相同的情况下，需要给出前后包名中具体方法的名称，以此做简单替换

![image.png](https://cdn.nlark.com/yuque/0/2024/png/29733541/1715082727912-e41a80e8-ed52-4c58-a975-d6d2db9fbb6d.png#averageHue=%23fefefe&clientId=u1da086fe-651d-4&from=paste&height=380&id=uc7fd44d8&originHeight=760&originWidth=1540&originalType=binary&ratio=2&rotation=0&showTitle=false&size=117867&status=done&style=none&taskId=u0c4afc5a-6907-4c52-8077-2aaca951401&title=&width=770)

- [x] urlQuery 的迁移
- [x] window.location.href 的迁移
- [ ] 代码结构优化，渲染优化，功能函数抽离

......
