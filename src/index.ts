import { Project, SourceFile, SyntaxKind, ImportDeclaration, OptionalKind,JsxAttributeStructure,JsxSpreadAttributeStructure, ElementAccessExpression, ts, JsxElement, PropertyAccessExpression, JsxSelfClosingElement, JsxOpeningElement, JsxClosingElement } from "ts-morph";
import {fileOperation as fo} from './util/index';

const porject = new Project({
    tsConfigFilePath: './tsconfig.json'
});

class TranCssAndHtml {
    private sourceFiles: SourceFile[];
    private iconNames: string[] = [];

    constructor(){
        // 获取引入styles的文件
        this.sourceFiles = porject.getSourceFiles().filter((it) => it.getImportDeclaration('./index.moudle.less')?.getDefaultImport()?.getText() === 'styles');
    }

    public async enter() {
        for (const sourceFile of this.sourceFiles) {
            await this.dealImportToSaveInfo(sourceFile);
            await this.tranJsx(sourceFile);
            const ans = sourceFile.getFullText();
            console.log(ans);
        }
    }

    // 统一对import语句进行处理，提取有益信息
    private async dealImportToSaveInfo (file: SourceFile) {
        await this.getImportName(file);
    }

    //统一对 Jsx 进行处理————主要涉及JsxExpression、JsxTag
    private async tranJsx(file: SourceFile) {
        const JsxElements = file.getDescendantsOfKind(SyntaxKind.JsxElement);
        // let a = 0;
        for (const JsxElement of JsxElements) {
            await this.divToView(JsxElement);
            await this.addTeaWarpperIntoLog(JsxElement, ['data-log-click'])
            // await this.addTextIntoWord(JsxElement);
            // await this.reviseStyleClassname(JsxElement);
            // a++;
            // await this.addIconIntoView(JsxElement); // 够了，是这里发生了重复渲染，原因是JsxElements属性有多个实例存在
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
                    styleObj.replaceWithText(value);
                })
            })

            // 修改styles.xxx类型
            JsxAttributes.forEach((jsxAttri) => {
                const key = jsxAttri.getFirstChildByKind(SyntaxKind.Identifier); // 定义的节点
                if (key?.getText() === 'className') {
                    const values = jsxAttri.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression); // 获取表达式的值，比如 styles.xxx
                    const actions: {
                        value: PropertyAccessExpression<ts.PropertyAccessExpression>,
                        key: string
                    }[] = [];

                    values.forEach((value) => {
                        const targets = value.getDescendantsOfKind(SyntaxKind.Identifier);
                        targets.forEach((target) => {
                            if (target?.getText() === 'styles') {
                                const [_, key] = value.getText().split('.');
                                actions.push({value, key});
                            } 
                        })
                    })

                    // 获取节点与修改节点的逻辑需要分开编写，否则会报错
                    actions.forEach((action) => {
                        const {value, key} = action;
                        value.replaceWithText(`${key}`);
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
                if (tagName.getTagNameNode().getText() === 'div') {
                    const name = tagName.getTagNameNode();
                    name.replaceWithText('view');    
                }
            })
        })
    }

    //:只为类型为 string 的变量或者字符串前后自动添加text组件(实验版，暂时只支持div)
    private async addTextIntoWord (JsxElement: JsxElement) {
            // div可以换为数组进行判断
            if (JsxElement.getOpeningElement().getTagNameNode().getText() === 'view') {
                const JsxChildrens = JsxElement.getJsxChildren();
                for (const JsxChildren of JsxChildrens) {
                    if (JsxChildren.isKind(SyntaxKind.JsxExpression)) {
                        // 成功进入
                        if (JsxChildren.getDescendantsOfKind(SyntaxKind.JsxElement).length === 0 && JsxChildren.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length === 0) {
                            if (JsxChildren.getExpression()?.getType().getText() === 'string') {
                                JsxChildren.replaceWithText(`<text>{${JsxChildren.getText()}}</text>`)
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

    // 获取改动的tsx文件同级目录下指定后缀的文件
    private async getSymbolFilePath(moudleFilePath: string[]) {
        fo.getSymbolFilePath(moudleFilePath);
    }

    //TODO: 将改动后的代码返回原文件

    //TODO:自动copy代码至指定文件夹内，可配置导入规则

    //TODO:构造引入文件与less文件的less关系

    //TODO:ICON组件前后自动套一层view并将classname属性移入view
    private async addIconIntoView (JsxElement: JsxElement) {
        const iconNames = this.iconNames;
        // console.log(iconNames);
        const tagNames = JsxElement.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
        // const closeTagNames = JsxElement.getDescendantsOfKind(SyntaxKind.JsxClosingElement);
        const selfTagNames = JsxElement.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
        // console.log(tagNames.length);
        // console.log(selfTagNames.length);

        [tagNames, selfTagNames].forEach((commonTagNames) => {
            // console.log(commonTagNames.)
            commonTagNames.forEach((tagName, index) => {
                // console.log(tagName.getText());
                if (iconNames.includes(tagName.getTagNameNode().getText())) {
                    // iconNames.splice(index, 1); // 这里多次渲染出了问题
                    const classname = this.getTagAttribue(tagName, 'className');
                    const name = tagName.getTagNameNode();
                    // if (classname.length > 6) {
                        console.log(name.getText(), 'classname');
                        tagName.replaceWithText(`<view ${classname}>${tagName.getText()}</view>`);  
                    // }  
                }
            })
        })
    }

    // 获取指定标签节点的Attribute信息
    private getTagAttribue(tagElement: JsxSelfClosingElement | JsxOpeningElement | JsxClosingElement, attributeName: string) {
        let ans: string = '';

        const tagClassNames = tagElement.getDescendantsOfKind(SyntaxKind.JsxAttribute); // 获取标签的props

        tagClassNames.forEach((tagClassName) => {
            tagClassName.getDescendantsOfKind(SyntaxKind.Identifier).forEach((idenName) => {
                // console.log(tagClassName.getText());
                if (idenName.getText() === attributeName) {
                    // console.log('enter');
                    ans = tagClassName.getText();
                }
            })
        })

        // console.log(ans);
        return ans;
    }

    // 获取引入的icon组件的名称
    private async getImportName (file: SourceFile) {
        const importNames = file.getDescendantsOfKind(SyntaxKind.ImportDeclaration);

        const iconImports:  ImportDeclaration[] = [];
        importNames.forEach((importName) => {
            const names = importName.getDescendantsOfKind(SyntaxKind.StringLiteral);
            names.forEach((name) => {
                if (name.getText() === "'@arco-design/iconbox-react-dcar-icon'") {
                    iconImports.push(importName);
                }
            })
        })

        // console.log(iconImports);
        const iconNames: string[] = [];
        iconImports.forEach((iconImport) => {
            const iconComNames = iconImport.getImportClause()?.getDescendantsOfKind(SyntaxKind.ImportSpecifier);

            iconComNames?.forEach((iconComName) => {
                // console.log(iconComName.getText());
                iconNames.push(iconComName.getText());
            })
        })

        this.iconNames = iconNames;
    }

    // Tips: 更换identifer的值用rename
    //TODO:在打点标签处自动添加TeaWarpper组件
      // 1. 检测出拥有log属性的标签   OK
      // 2. 在标签外包一个TeaWarpper组件，并将log属性移到此组件内  
      // 3. 假如打点标签是view，就将此view删除
      // 4. 假如打点标签是text或者image，将在TeaWrapper内设置as属性
    private async addTeaWarpperIntoLog(JsxElement: JsxElement, arrayAttribute: string[]) {
        // 检测是否含有打点属性
        const Jsx = JsxElement.getDescendantsOfKind(SyntaxKind.JsxAttributes)[0].getDescendantsOfKind(SyntaxKind.Identifier);

        for (const tag of Jsx) {
            if (arrayAttribute.includes(tag.getText())) {
                if(JsxElement.getOpeningElement().getTagNameNode().getText() === 'view') {
                    JsxElement.getOpeningElement().getFirstChildByKind(SyntaxKind.Identifier)?.rename('Teawrapper');
                }
            }
        }
    }

    // 为标签添加属性
    private addAttributeIntoTag(
        attributeName: OptionalKind<JsxAttributeStructure> | OptionalKind<JsxSpreadAttributeStructure>, 
        tagElement: JsxOpeningElement | JsxSelfClosingElement) 
    {   
        tagElement.addAttribute(attributeName);
    }
}

const tran = new TranCssAndHtml();
tran.enter();
