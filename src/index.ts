import {
    Project,
    SourceFile, 
    SyntaxKind, 
    ImportDeclaration,
    ElementAccessExpression, 
    ts, 
    JsxElement, 
    PropertyAccessExpression, 
    JsxSelfClosingElement, 
    JsxOpeningElement, 
    JsxClosingElement, 
    JsxAttribute,
    Expression,
    ExpressionStatement,
    QualifiedName,
    JsxExpression
} from "ts-morph";
import * as fs from 'fs';
import {fileOperation as fo, action} from './util/index';
import { needAddTextTag, needAutoImport } from "./constant/name";

const porject = new Project({
    tsConfigFilePath: './tran.config.json'
});

// 测试s
export class TranCssAndHtml {
    private sourceFiles: SourceFile[];
    private iconNames: string[] = [];

    constructor (){
        const compilerOptions = porject.getCompilerOptions();
        const filePath = compilerOptions.configFilePath as string;
        const tsConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (!tsConfig.include) {
            throw Error('不符合要求，请确保配置文件中包含include属性');
        }
        // 获取引入指定后缀的文件
        this.sourceFiles = porject.getSourceFiles().filter((file) => file.getFilePath().endsWith('.tsx') || file.getFilePath().endsWith('ts'));

        if (this.sourceFiles.length === 0) {
            throw Error('不符合要求，请确保配置中包含tsx文件夹');
        }
    }

    public async enter() {
        for (const sourceFile of this.sourceFiles) {
            console.log(sourceFile.getFilePath(),' >>>');
            sourceFile.insertImportDeclaration(1, {
                namedImports: ['TeaWrapper'],
                moduleSpecifier:'@byted-motor/lynx-utils'
            })
            await this.tranWindowToOpenview(sourceFile);
            await this.tranUrl(sourceFile);
            await this.deleteImportStatement(sourceFile, 'urlQuery');
            await this.dealImportToSaveInfo(sourceFile);
            await this.tranJsx(sourceFile);
            sourceFile.fixUnusedIdentifiers(); // 清除没用到的引用
            sourceFile.saveSync();
            const ans = sourceFile.getFullText();
        }
    }

    // 统一对import语句进行处理，提取有益信息
    private async dealImportToSaveInfo (file: SourceFile) {
        await this.getImportName(file);
    }

    //统一对 Jsx 进行处理————主要涉及JsxExpression、JsxTag
    private async tranJsx(file: SourceFile) {
        const JsxElements = file.getDescendantsOfKind(SyntaxKind.JsxElement);
        for (const JsxElement of JsxElements) {
            await this.divToView(JsxElement);
            const mark = await this.addTeaWarpperIntoLog(JsxElement, ['data-log-click'])
            await this.addTextIntoWord(JsxElement);
            await this.reviseStyleClassname(JsxElement);
            await this.addIconIntoView(JsxElement); 
        }
    }

    // 第一个写的函数，不熟悉api，写得不优雅，有很多优化空间
    private async reviseStyleClassname(JsxElement: JsxElement) {
            const JsxAttributes = JsxElement.getDescendantsOfKind(SyntaxKind.JsxAttribute); // 获取jsx属性

            // 修改styles['xxx']类型
            JsxAttributes.forEach((attri) => {
                const actions: {
                    styleObj: ElementAccessExpression<ts.ElementAccessExpression>,
                    value: string
                }[] = [];
                const styleObjs = attri.getDescendantsOfKind(SyntaxKind.ElementAccessExpression);

                styleObjs.forEach((styleObj) => {
                    if (styleObj.getExpression().getText() === 'styles') {
                        const value = styleObj.getArgumentExpression()?.getText()!
                        actions.push({styleObj, value})
                    }
                })

                actions.forEach((action) => {
                    const {styleObj, value} = action;
                    styleObj.replaceWithText(`"${value}"` );
                })
            })

            // 修改styles.xxx类型
            JsxAttributes.forEach((jsxAttri) => {
                const key = jsxAttri.getFirstChildByKind(SyntaxKind.Identifier); // 定义的节点
                if (key?.getText() === 'className') {
                    const values = jsxAttri.getDescendantsOfKind(SyntaxKind.JsxExpression); // 获取表达式的值，比如 styles.xxx
                    const actions: {
                        value: JsxExpression,
                        key: string
                    }[] = [];

                    values.forEach((value) => {
                        const targets = value.getDescendantsOfKind(SyntaxKind.Identifier);
                        targets.forEach((target) => {
                            if (target?.getText() === 'styles') {
                                let [_, key] = value.getText().split('.');
                                key = key.replace('}', '');
                                actions.push({value, key});
                            } 
                        })
                    })

                    // 获取节点与修改节点的逻辑需要分开编写，否则会报错
                    // 补充：由于之前有大括号的存在，在转化之后，需要将大括号给删除
                    actions.forEach((action) => {
                        const {value, key} = action;
                        value.replaceWithText(`"${key}"`);
                    })
                }
            })
    }

    // 将div自动转换view （可抽象函数——获取指定名称的标签）
    private async divToView (JsxElement: JsxElement) {
        const tagNames = JsxElement.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
        const closeTagNames = JsxElement.getDescendantsOfKind(SyntaxKind.JsxClosingElement);
        const selfTagNames = JsxElement.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);

        [tagNames, closeTagNames, selfTagNames].forEach((commonTagNames) => {
            commonTagNames.forEach((tagName) => {
                const hName = tagName.getTagNameNode().getText();
                if (hName === 'div') {
                    const name = tagName.getTagNameNode();
                    name.replaceWithText('view');    
                } else if (hName === 'span' || hName === 'p') {
                    const name = tagName.getTagNameNode();
                    name.replaceWithText('text');    
                } else if (hName === 'img') {
                    const name = tagName.getTagNameNode();
                    name.replaceWithText('Image');
                }
            })
        })
    }

    //只为类型为 string 的变量或者字符串前后自动添加text组件
    private async addTextIntoWord (JsxElement: JsxElement) {
            // div可以换为数组进行判断
            if (needAddTextTag.includes(JsxElement.getOpeningElement().getTagNameNode().getText())) {
                const JsxChildrens = JsxElement.getJsxChildren();
                for (const JsxChildren of JsxChildrens) {
                    if (JsxChildren.isKind(SyntaxKind.JsxExpression)) {
                        // 成功进入
                        if (JsxChildren.getDescendantsOfKind(SyntaxKind.JsxElement).length === 0 && JsxChildren.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length === 0) {
                            if (JsxChildren.getExpression()?.getType().getText().includes('string')) {
                                JsxChildren.replaceWithText(`<text>${JsxChildren.getText()}</text>`)
                            }
                        }
                    }

                    // 第二种情况，包含普通字符串
                    else if (JsxChildren.isKind(SyntaxKind.JsxText)) {
                        if (JsxChildren.getWidth() !== 0) {
                            JsxChildren.replaceWithText(`<text>${JsxChildren.getText()}</text>`)
                        }
                    }

                    else {
                        continue;
                    }
                }
            }
    }

    //ICON组件前后自动套一层view并将classname属性移入view
    private async addIconIntoView (JsxElement: JsxElement) {
        const iconNames = this.iconNames;

        const tagNames = JsxElement.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
        const selfTagNames = JsxElement.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);


        [tagNames, selfTagNames].forEach((commonTagNames) => {
            commonTagNames.forEach((tagName) => {
                    if (iconNames.includes(tagName.getTagNameNode().getText())) {
                        this.iconNames = this.iconNames.filter((item) => {
                            return item !== tagName.getTagNameNode().getText();
                        })
                        const classname = this.getTagAttribue(tagName, 'className');
                        tagName.replaceWithText(`<view ${classname}>${tagName.getText()}</view>`);  
                }
            })
        })
    }

    // 获取指定标签节点的Attribute信息
    private getTagAttribue(tagElement: JsxSelfClosingElement | JsxOpeningElement | JsxClosingElement, attributeName: string) {
        let ans: string = '';
        const actions: JsxAttribute[] = [];

        const tagClassNames = tagElement.getDescendantsOfKind(SyntaxKind.JsxAttribute); // 获取标签的props

        tagClassNames.forEach((tagClassName) => {
            tagClassName.getDescendantsOfKind(SyntaxKind.Identifier).forEach((idenName) => {
                if (idenName.getText() === attributeName) {
                    ans = tagClassName.getText();
                    actions.push(tagClassName);
                }
            })
        })

        actions.forEach((action) => {
            action.remove(); // 移除Icon内的classname属性
        })
        return ans;
    }

    // 添加h5与lynx包的映射关系, 获取引入的icon组件的名称
    private async getImportName (file: SourceFile) {
        const importNames = file.getDescendantsOfKind(SyntaxKind.ImportDeclaration);

        const iconImports:  ImportDeclaration[] = [];
        const clsxImports: ImportDeclaration[] = [];
        const reactFunImports: ImportDeclaration[] = [];
        importNames.forEach((importName) => {
            const name = importName.getModuleSpecifier().getText();
            // 策略模式改造(delay)
            if (name === "'@arco-design/iconbox-react-dcar-icon'") {
                iconImports.push(importName);
            }

            if (name === "'clsx'") {
                clsxImports.push(importName);
            }

            if (name === "'react'") {
                reactFunImports.push(importName);
            }

            // 根据映射关系，改变包名
            const newName = action.lodToNew(name);
            if (newName) {
                importName.getModuleSpecifier().replaceWithText(newName);
            }
        })

        const iconNames: string[] = [];
        iconImports.forEach((iconImport) => {
            const iconComNames = iconImport.getImportClause()?.getDescendantsOfKind(SyntaxKind.ImportSpecifier);

            iconComNames?.forEach((iconComName) => {
                iconNames.push(iconComName.getText());
            })
        })

        clsxImports.forEach((clsxImport) => {
            const clsxName = clsxImport.getImportClause()?.getDescendantsOfKind(SyntaxKind.Identifier);

            clsxName?.forEach((item) => {
                item.replaceWithText(`{${item.getText()}}`);
            })
        })

        for (let reactFunImport of reactFunImports) {
            reactFunImport.remove();
            const importData = await this.getReactFun(file);
            file.insertImportDeclaration(0, {
                namedImports: [...importData],
                moduleSpecifier:'@byted-lynx/react',
            })
        }

        this.iconNames = iconNames;
    }

    // 获取React.xxx
    private async getReactFun(file: SourceFile) {
        const reactUseApi: string[] = [];
        const qualifiedNames = file.getDescendantsOfKind(SyntaxKind.QualifiedName);
        const propertyAccessExpressions = file.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
        const actions: {
            all: QualifiedName | PropertyAccessExpression<ts.PropertyAccessExpression>,
            right: string
        }[] = [];

        [...qualifiedNames, ...propertyAccessExpressions].forEach((item) => {
            const arr = item.getText().split('.');
            if (needAutoImport.includes(arr[1])) {
                actions.push({
                    all: item,
                    right: arr[1]
                })
                reactUseApi.push(arr[1]);
            }
        })

        actions.forEach((action) => {
            const {all, right} = action;
            all.replaceWithText(right);
        })

        return Array.from(new Set(reactUseApi));
    }

    // Tips: 更换identifer的值用rename
    //:在打点标签处自动添加TeaWarpper组件
      // 1. 检测出拥有log属性的标签   OK
      // 2. 在标签外包一个TeaWarpper组件，并将log属性移到此组件内  
      // 3. 假如打点标签是view，就将此view删除
      // 4. 假如打点标签是text或者image，将在TeaWrapper内设置as属性
    private async addTeaWarpperIntoLog(JsxElement: JsxElement, arrayAttribute: string[]) {
        let mark = false; // 是否拥有打点属性
        // 检测是否含有打点属性
        const Jsx = JsxElement.getDescendantsOfKind(SyntaxKind.JsxAttributes)[0].getDescendantsOfKind(SyntaxKind.Identifier);

        for (const tag of Jsx) {
            if (arrayAttribute.includes(tag.getText())) {
                if(JsxElement.getOpeningElement().getTagNameNode().getText() === 'view') {
                    JsxElement.getOpeningElement().getFirstChildByKind(SyntaxKind.Identifier)?.rename('TeaWrapper');
                    mark = true;
                }
                else if (JsxElement.getOpeningElement().getTagNameNode().getText() === 'image') {
                    const start = JsxElement.getOpeningElement().getAttributes().length;
                    JsxElement.getOpeningElement().insertAttribute(start, { // 这里的 start 的范围是【0，元素内部的属性的长度】 
                        name: '\n as',
                        initializer: 'image'
                    });
                }
                else if (JsxElement.getOpeningElement().getTagNameNode().getText() === 'text') {
                    const start = JsxElement.getOpeningElement().getAttributes().length;
                    JsxElement.getOpeningElement().insertAttribute(start, {
                        name: '\n as',
                        initializer: 'text'
                    });
                }
            }
        }
        return mark;
    }

    // 添加url语句
    private async tranUrl(file: SourceFile) {
        const actions: PropertyAccessExpression<ts.PropertyAccessExpression>[] = [];
        // 替换全局的urlQuery为urlQuery?
        file.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((item) => {
            if (item.getText().includes('urlQuery')) {
                actions.unshift(item);
            }
        })
        actions.forEach((action) => {
                action.setHasQuestionDotToken(true)
        })

        const importData = file.getDescendantsOfKind(SyntaxKind.ImportDeclaration);
        const len = importData.length;
        file.insertVariableStatement(len, { // 添加语句的规则
            declarations: [
                {
                    name: 'urlQuery',
                    initializer: 'lynx.__globalProps.queryItems',
                }
            ]
        })
    }

    // 删除import中的指定语句，参数为export出的值
    private async deleteImportStatement(file: SourceFile, importName: string) {
        const actions:  ImportDeclaration[] = []
        file.getDescendantsOfKind(SyntaxKind.ImportDeclaration).forEach((item) => {
            item.getDescendantsOfKind(SyntaxKind.ImportClause).forEach((clause) => {
                if (clause.getText().includes(importName)) {
                    actions.push(item);
                }
            })
        })

        actions.forEach((item) => {
            item.remove(); // 移除指定语句
        })
    }

    // window.location.href 的转化
    private async tranWindowToOpenview(file: SourceFile) {
        let mark = false;
        let action: {expression: ExpressionStatement, right: Expression<ts.Expression>, left: Expression<ts.Expression>}[] = [];
        const deleteStatement:ExpressionStatement[] = [];
        file.getDescendantsOfKind(SyntaxKind.ExpressionStatement).forEach((item, index) => {
            // 针对的 window.location.href=函数 的场景
            const all = item.getDescendantsOfKind(SyntaxKind.BinaryExpression)[0];
            const right = all?.getRight();
            const left = all?.getLeft();
            item.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((expression) => {
                if (expression.getText() === 'window.location.href') {
                    mark = true;
                    action.unshift({expression: item,  right: right, left: left});
                    deleteStatement.unshift(item);

                    // 插入import语句——getUniversalUrl
                    file.insertImportDeclaration(1, {
                        namedImports: ['getUniversalUrl'],
                        moduleSpecifier: '@byted-motor/url',
                    })
                }
            })
        })

        if (mark) {
            action.forEach((item) => {
                const {expression, right, left } = item;
                const start = left.getStart();
                file.insertText(start, `const newUrl = ${right.getText()} \n openViewV2(newUrl) \n`);
                deleteStatement.push(expression);
            })

            // 插入openViewV2
            file.insertImportDeclaration(1, {
                namedImports: ['openViewV2'],
                moduleSpecifier: 'common/src/jsb'
            })

            // 由于新增了节点，所以需要重新判断并删除原先节点
            const acs: ExpressionStatement[] = []
            file.getDescendantsOfKind(SyntaxKind.ExpressionStatement).forEach((item) => {
                // 针对的 window.location.href=函数 的场景
                item.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((expression) => {
                    if (expression.getText() === 'window.location.href') {
                        acs.unshift(item);
                    }
                })
            })

            acs.forEach((ac) => {
                ac.remove();
            })
        }
    }
}
