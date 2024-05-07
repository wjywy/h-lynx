
declare namespace IndexModuleLessNamespace {
  export interface IIndexModuleLess {
    back: string
    block: string
    circle: string
    container: string
    'container-no-im': string
    head: string
    item: string
    item1: string
    item2: string
    item3: string
    left: string
    name: string
    qa: string
    'scroll-x': string
    text: string
    title: string
    video: string
  }
}

declare const IndexModuleLessModule: IndexModuleLessNamespace.IIndexModuleLess & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: IndexModuleLessNamespace.IIndexModuleLess
}

export = IndexModuleLessModule
