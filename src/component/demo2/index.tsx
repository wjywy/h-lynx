import * as React from 'react'
import { IconExclamationPoint } from '@arco-design/iconbox-react-dcar-icon'

import { EmptyCardType } from '@lib/typing'
import clsx from 'clsx'

// import styles from './index.moudle.less'

import { jumpUrl } from '@lib/utils'

type TopTipCardProps = {
  data: EmptyCardType
  onClick?: () => void
} & React.HTMLAttributes<HTMLDivElement>

const prefixCls = 'sh-top-tip'

console.log(styles.content);

export const TopTipCard: React.FC<TopTipCardProps> = props => {
  const { data, className, onClick, ...restProps } = props

  if (!data || !data.text) return null

  const { text, button_text, open_url } = data

  const onButtonClick = () => {
    if (onClick) {
      onClick()
      return
    }
    if (open_url) {
      jumpUrl(open_url)
    }
  }

  const showButton = Boolean(button_text && (open_url || onClick))

  return (
    <div className={clsx(prefixCls, className)} {...restProps}>
      <div className={`${prefixCls}-left`}>
        <IconExclamationPoint width="16" height="16" fill="#606370" className={`${prefixCls}-icon-remind`} />
        {text}
      </div>
      {showButton && (
        <span onClick={onButtonClick}>
          {button_text} <div className={`${prefixCls}-triangle`} />
        </span>
      )}
    </div>
  )
}
