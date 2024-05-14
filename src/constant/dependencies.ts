// 第一种情况，直接替换包名
export const dependencies: {
    old: string;
    new: string;
}[] = [
    {
        old: "'@arco-design/iconbox-react-dcar-icon'",
        new: "'@byted-motor/lynx-icons'"
    },
    {
        old: "'@byted-motor/mui'",
        new: "'@byted-motor/lynx-mui'"
    },
    {
        old: "'@byted-motor/usedcar-common'",
        new: "'@src/utils'"
    },
    {
        old: "'@byted-motor/logger'",
        new: "'@byted-motor/lynx-utils'"
    },
    {
        old: "'@byted-motor/env-fetch'",
        new: "'@byted-motor/lynx-utils'"
    },
    {
        old: "'clsx'",
        new: "'@byted-motor/lynx-utils/lepus'"
    },
    {
        old: "'react'",
        new: "'@byted-lynx/react'"
    },
    {
        old: "'@byted/hooks'",
        new: "'@byted-motor/lynx-hooks'"
    },
    {
        old: "'@byted-motor/user-agent'",
        new: "'@byted-motor/lynx-utils/lepus'"
    }
]

// 第二种情况，替换包名且替换函数名,暂不考虑吧
export const changeFunName = [
    {

    }
]