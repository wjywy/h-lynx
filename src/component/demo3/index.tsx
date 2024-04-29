// import styles from './index.moudle.less'
import clsx from 'classnames'

console.log(styles['color-change'])


export type BlankCardProps = {
    width: string
    height: string
    top: string
  }
  
  export const BlankCard: ReactFC<BlankCardProps> = ({ width, height, top }) => (
    <div className={clsx('wujiayu', styles.card)}>
      <div className={styles.back}></div>
      <IconLogoIcon width={width} height={height} style={{ marginTop: top }} />
      <div className={styles.filterItem}>
        <div className={styles.info}></div>
      </div>
    </div>
  )