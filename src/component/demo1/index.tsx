import * as React from 'react'
import { IconBack, IconDownTriangle, IconUpTriangle } from '@byted-motor/lynx-icons'

import { ConfigProvider, NavigationBar } from '@byted-motor/lynx-mui'
import { Image, goBack, jsonStringify } from '@src/utils'
import { isBytedance, isWeixin } from '@byted-motor/user-agent'
import clsx from 'clsx'


let urlQuery = lynx._globalProps.query;
const [placeholder, setPlaceholder] = useState(urlQuery.keyword || DEFAULT_PLACEHOLDER)

const hideIM = urlQuery.hide_im === '1'

const qaListTwo = [
  {
    q: 'wuuwibwib',
    a: `目前不支持线下看车哦。但懂车帝二手车保证每一辆严选二手车均有平台保障，您还可以联系购车顾问对意向车源发起严格复检，在线看车。`,
  },
  {
    q: '为什么选择严选二手车？',
    a: '严选二手车不仅经过平台严格选品，质量有保障。更涵盖异地车源，帮助您在全国范围内搜寻价格更低、车况更好的车源，打破买二手车的地域限制。',
  },
  {
    q: '买车怎么交费？',
    a: '您可以通过电话或微信联系购车顾问，由顾问帮助您创建购车订单并明确后续购车事项。',
  },
  {
    q: '买车落地需要哪些费用？',
    a: `购车总费用=裸车价+物流费+上牌服务费+保险费+延保费。<br>
    物流费：根据购车具体需求，按照车辆运输里程收取费用；<br>
    上牌服务费：平台全程提供车辆产权转移相关服务；<br>
    保险费：根据购车具体需求，按照实际选购车型的保险费为准；<br>
    延保费：在平台购买车辆后，1元即可享受额外1年或新增行驶3万公里的质保服务。`,
  },
  {
    q: '如果买到了问题车怎么办？',
    a: '严选二手车均为平台严格选品，所有的车源均无重大事故、无火烧、无水泡，且具有平台保障。如果检测出所售车源出现以上情况，平台承诺终身回购该车。车辆交付后60天内，易损易耗件整车保修；车辆交付后7天内，不满意可享受换车或回购服务（具体规则以售后服务协议为准）。',
  },
]

const Index: React.FC = () => {
  const [active, setActive] = React.useState<number | undefined>(0)
  const handleQaClick = (i: number) => () => {
    setActive(prevI => (i === prevI ? undefined : i));
    if (isFirstPageRef.current) {
      setKeyword(urlQuery.query || '')
    }
  }

  const newUrl = getUniversalUrl(
    schema,
    {
      series_id,
      sh_city_name: cityName || urlQuery.city_name || '北京',
      sh_province_name: shProvinceName || urlQuery.sh_province_name || '',
      year: carYear,
      ...params,
    },
    {
      hide_bar: 1,
      hide_back_close: 1,
      hide_status_bar: 1,
      status_bar_color: 'black',
      bounce_disable: 1,
      adjust_resize_5497: 1,
    }
  ) 
 openViewV2(newUrl) 
  return (
    <view className={clsx(container, hideIM && 'container-no-im')}>
      {!isWeixin && (
        <NavigationBar
          immersion
          title="购车流程"
          showLeftIcon={false}
          showRightIcon={false}
          scrollToShow
          leftAction={
            isBytedance && (
              <view className={back}><IconBack
                                  data-log-click={jsonStringify({
                                    obj_id: 'return_btn',
                                  })}
                                  onClick={goBack}
                                  fill="#1f2129"
                                /></view>
            )
          }
        />
      )}
      <Image
        src="https://p3.dcarimg.com/img/tos-cn-i-dcdx/154fa3444c1f4737804989f1e02790b0~tplv-dcdx-origin.image"
        disableLoadingBackground
      />
      <Image
        className={item}
        disableLoadingBackground
        src="https://p3.dcarimg.com/img/tos-cn-i-dcdx/ef99bfb0b91246f699a210ef0410808b~noop.image"
      />
      <Image
        className={item1}
        disableLoadingBackground
        src="https://p3.dcarimg.com/img/tos-cn-i-dcdx/29c8b62890cd48bf834978b049ff3e58~tplv-dcdx-origin.image"
      />
      <Image
        className={item3}
        disableLoadingBackground
        src="https://p3.dcarimg.com/img/tos-cn-i-dcdx/f32408a3de0e4281b94798adcf3cc1b8~noop.image"
      />

      <view className={qa} data-log-view={jsonStringify({ obj_id: 'faq_module' })}>
        <view className={clsx('T4_S', title)}><text>常见问题</text></view>
        <view>
          {qaListTwo.map((qa, i) => (
            <view className={block} key={qa.q}>
              <Teawrapper
                className={head}
                data-log-click={jsonStringify({
                  obj_id: 'faq_issue',
                  issue_title: qa.q,
                })}
                onClick={handleQaClick(i)}>
                <view className={left}>
                  <text className={circle} />
                  <view className={clsx('T5', name)}><text>{{qa.q}}</text></view>
                </view>
                {active === i ? <view ><IconUpTriangle fontSize={14} /></view> : <view ><IconDownTriangle fontSize={14} /></view>}
              </Teawrapper>
              {active === i && <view className={clsx('T5', text)} dangerouslySetInnerHTML={{ __html: qa.a }}>{wujiayu.lss}</view>}
            </view>
          ))}
        </view>
      </view>
    </view>
  )
}

const App = () => (
  <ConfigProvider isV7="auto">
    <Index />
  </ConfigProvider>
)

export default App
