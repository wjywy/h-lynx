import { FC, forwardRef, useRef, useState, useEffect, useMemo } from "@byted-lynx/react";

// 整行展示卡片
import { IconQuoteDown, IconQuoteUp } from '@byted-motor/lynx-icons'

import { Image, Tag } from '@byted-motor/lynx-mui'
import { sendCustomEvent } from '@byted-motor/tea'
import { isAndroid } from '@byted-motor/lynx-utils/lepus'
import { isExternalDeliveryPlatform, supportPIA2 } from '@lib/constant'
import { SkuSpecialTagsType } from '@lib/typing/'
import type { SkuCardType, SkuTagItemType } from '@lib/typing/index'
import { getDetailUrlParams, jsonParse, jsonStringify, jumpToDetail } from '@lib/utils/index'
import {clsx} from '@byted-motor/lynx-utils/lepus'

import { isFunction } from '@/asserts/index'

import { getSourceClass } from '../utils'
import { CarImage, CardBottom } from './common'


import { DirectSaleTagOpt, NationwideTag, NationwideTagOpt, NationwideTagV2 } from './widget'




type TeaType = {
  'data-log-view'?: string
  'data-log-click'?: string
  'data-log-extra'?: string
}

export type CarSourceCardProps = {
  extraTopNode?: React.ReactNode
  extraBottomNode?: React.ReactNode
  data: SkuCardType
  rank?: number
  showRank?: boolean
  cityName?: string // 列表页用户选择的城市
  usedCarEntry?: string
  linkSource?: string
  preObjId?: string
  actionNode?: React.ReactNode
  lazyImg?: boolean
  isJumpToMicroApp?: boolean // 强制跳转小程序
  videoPlayConf?: Record<string, any>
  /** 展示图片底部运营banner */
  enableNSR?: boolean
  showImgBanner?: boolean
  newImage?: boolean
  useNativeImage?: boolean // 车源图片是否使用native-image组件
  bottomNode?: React.ReactNode
  onClick?: (arg: CarSourceCardProps, e: React.MouseEvent) => boolean | void
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> &
  TeaType

const prefixCls = 'sh-horizontal-card'

export const HCardImageSize = 150

const ContentInfo = ({ text }: { text: string }) => {
  return (
    <view className={`${prefixCls}-article`}>
      <view ><IconQuoteUp width="16" height="16" color="#D18700" /></view>
      <view className="line-1"><text>{{text}}</text></view>
      <view ><IconQuoteDown width="16" height="16" color="#D18700" /></view>
    </view>
  )
}

export const DirectSaleTag: FC<React.HTMLAttributes<HTMLImageElement>> = props => {
  const { style, ...rest } = props
  return (
    <img
      className={`${prefixCls}-content-left-top-direct-icon`}
      src="https://p3.dcarimg.com/img/tos-cn-i-dcdx/c0d8e7e88e7148e3b66534432561c7c5~tplv-dcdx-origin.image"
      width={28}
      height={16}
      style={{ objectFit: 'cover', ...style }}
      loading="eager"
      data-text="自营"
      {...rest}
    />
  )
}

/** 展车特卖 */
const NewCarSaleTag: FC<{
  tag?: SkuTagItemType
}> = props => {
  const { tag } = props

  if (!tag?.text) {
    return null
  }

  return (
    <img
      className={`${prefixCls}-content-left-top-new-car-sale-icon`}
      src="https://p3.dcarimg.com/img/tos-cn-i-dcdx/4f7fe071a68041178fc8b5ff5baeaf7d~tplv-dcdx-origin.image"
      width={48}
      height={16}
      style={{ objectFit: 'cover' }}
      loading="eager"
      data-text={tag.text}
      data-text-key={tag.key}
    />
  )
}

type ShTagProps = {
  data: SkuTagItemType
  optimize?: boolean
}

const ShTag: FC<ShTagProps> = props => {
  const { data, optimize = false } = props

  if (data.key === 'dcd_self_sh') {
    return optimize ? (
      <DirectSaleTagOpt />
    ) : (
      <DirectSaleTag
        style={{
          marginTop: 4,
          marginRight: 0,
        }}
      />
    )
  }

  if (data.key === 'nationwide_purchase') {
    return optimize ? <NationwideTagOpt /> : <NationwideTag />
  }

  if (data.key === 'nationwide_purchase_v2') {
    return optimize ? <NationwideTagOpt /> : <NationwideTagV2 />
  }

  if (!data.text) {
    return null
  }

  return (
    <Tag
      style={{
        backgroundColor: data.background_color || 'rgb(242, 244, 250)',
        color: data.text_color || 'rgb(31, 33, 41)',
        backgroundImage: data.background_image || 'none',
        fontFamily: data.font_family ? `'${data.font_family}'` : '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        '--border-color': data.border_color,
      }}
      variant={data.border_color ? 'outlined' : 'solid'}
      size="small"
      className={`${prefixCls}-tags`}
      data-text={data.text}
      data-text-key={data.key}>
      {/* 限时秒杀 */}
      {data.key === 'flash_sale_reduction_price' && <text className={`${prefixCls}-tags-ms`}>秒杀</text>}
      {data?.logo?.startsWith('http') && <Image width={12} height={12} src={data.logo} loading="eager" />}
      <text className={`${prefixCls}-tags-text ${isAndroid ? 'android' : ''}`}>{data.text}</text>
    </Tag>
  )
}

export const HorizontalCard = forwardRef<HTMLDivElement, CarSourceCardProps>((props, ref) => {
  const {
    extraTopNode,
    extraBottomNode,
    data: _data = {},
    cityName,
    newImage,
    usedCarEntry,
    linkSource,
    preObjId,
    className,
    onClick,
    actionNode,
    lazyImg = false,
    isJumpToMicroApp = false,
    showImgBanner = false,
    useNativeImage,
    rank,
    showRank,
    bottomNode,
    enableNSR,
    // videoPlayConf,
    'data-log-view': viewTea,
    'data-log-click': clickTea,
    'data-log-extra': extraTea,
    ...restProps
  } = props

  const tagsRef = useRef<HTMLDivElement>(null)
  const [tea, setTea] = useState<TeaType>({})

  // 获取可视tag埋点
  useEffect(() => {
    const tagContainer = tagsRef.current
    if (!tagContainer) {
      setTea({
        'data-log-view': viewTea,
        'data-log-click': clickTea,
        'data-log-extra': extraTea,
      })
      return
    }

    const extra = jsonParse(extraTea || '{}')

    try {
      const childrenTag = Array.from(tagContainer.children || [])
      const containerOffset = tagContainer.offsetTop
      const visibleTag: string[] = []
      const visibleTagList: string[] = []
      childrenTag.some(item => {
        if ((item as HTMLSpanElement).offsetTop - 20 > containerOffset) {
          return true
        }
        const dataText = item.getAttribute('data-text')
        const dataTextKey = item.getAttribute('data-text-key')
        if (dataText) {
          visibleTag.push(dataTextKey === 'flash_sale_reduction_price' ? '秒杀' : dataText)
        }

        if (dataTextKey) {
          visibleTagList.push(dataTextKey)
        }
        return false
      })

      extra.visible_tag = visibleTag.toString()
      extra.common_tag_list = visibleTagList.toString()
    } catch (error) {}
    setTea({
      'data-log-view': viewTea,
      'data-log-click': clickTea,
      'data-log-extra': jsonStringify(extra),
    })
  }, [viewTea, clickTea, extraTea, _data])

  const extraInfo = useMemo(() => {
    return {
      city_name: cityName,
      sh_city_name: cityName,
      link_source: linkSource,
      used_car_entry: usedCarEntry,
      pre_obj_id: preObjId,
      source_class: getSourceClass(_data),
      _pia_: enableNSR ? 1 : 0,
      common_tag_list: jsonParse(tea['data-log-extra'])?.common_tag_list || '',
      impr_extra: {
        rank: rank?.toString(),
        row_number: _data?.base_info?.row_number?.toString(),
        list_class_type:
          jsonParse(tea['data-log-extra'])?.list_class_type || jsonParse(tea['data-log-click'])?.list_class_type || '',
      },
    }
  }, [cityName, linkSource, usedCarEntry, preObjId, _data, rank, enableNSR, tea])

  const data = useMemo<SkuCardType>(() => {
    if (!_data.card_info?.open_url) {
      return _data
    }
    return getDetailUrlParams(_data, extraInfo)
  }, [_data, extraInfo])

  const {
    title,
    sub_title,
    special_tags = {} as Record<SkuSpecialTagsType, SkuTagItemType>,
    tags,
    pv_text,
    card_expend,
  } = data?.card_info || {}
  const { sh_search_list_tag_ui } = card_expend || {}
  const newCardUi = ['1', '2'].includes(sh_search_list_tag_ui || '0')
  const inTags = sh_search_list_tag_ui === '1'
  // 置顶标签
  const topTag = special_tags?.[SkuSpecialTagsType.PROMOTION]
  const ddImgActivity = special_tags?.[SkuSpecialTagsType.DD_IMG_ACTIVITY]

  const imgBanner =
    special_tags?.[SkuSpecialTagsType.IMG_BANNER] || special_tags?.[SkuSpecialTagsType.IMG_BANNER_ACTIVITY]

  const hasDirectTag = tags?.some(tag => tag.key === 'dcd_self_sh')
  const hasNewDirectTag = special_tags?.[SkuSpecialTagsType.DCD_SELF_SH] && inTags
  const hasNationWideTagV2 = tags?.some(tag => tag.key === 'nationwide_purchase_v2')

  /** 新车 展车特卖 */
  const newCarSaleTag = tags?.find(tag => tag.key === 'new_car_sale')

  const nationWideTag = special_tags?.[SkuSpecialTagsType.NATION_WIDE_TAG]

  const imgBannerConfig = useMemo(() => {
    if (imgBanner && showImgBanner && !ddImgActivity) {
      const price = imgBanner.price || ''
      /** 首付{{price}}万起  */
      const priceTpl = imgBanner.sub_text || ''
      const [prefix = '', suffix = ''] = priceTpl.split('{{price}}')
      return {
        logo: imgBanner.logo,
        title: imgBanner.text,
        backgroundColor: imgBanner.background_color,
        subTextClass: imgBanner.sub_text_bg_color,
        price: {
          value: price,
          prefix,
          suffix,
        },
      }
    }
    return false
  }, [imgBanner, showImgBanner, ddImgActivity])

  const handleClk = (e: React.MouseEvent) => {
    e.stopPropagation()
    sendCustomEvent('clk_event', {
      ...jsonParse(tea['data-log-extra']),
      ...jsonParse(tea['data-log-click']),
    })

    if (isFunction(onClick) && Boolean(onClick(props, e))) {
      return
    }

    jumpToDetail(data, extraInfo, isJumpToMicroApp)
  }

  const inViewRef = useNSR(data, extraInfo)

  if (!data) {
    return null
  }

  const contentText = data.card_info?.card_expend?.content_text
  const showTitleDirectTag = hasDirectTag && (contentText || hasNationWideTagV2)
  const tagList = showTitleDirectTag ? tags?.filter(tag => tag.key !== 'dcd_self_sh') : tags
  if (hasNewDirectTag) {
    tagList?.unshift({
      key: 'dcd_self_sh',
      text: '直营',
    })
  }

  return (
    <>
      {extraTopNode}
      <view
        onClick={handleClk}
        className={clsx(`${prefixCls}-wrap`, newCardUi && `${prefixCls}-wrap-new`, className)}
        {...restProps}
        data-log-view={tea['data-log-view']}
        data-log-extra={tea['data-log-extra']}
        ref={ref}>
        <view className={`${prefixCls}-left-wrap`} ref={enableNSR && supportPIA2 ? inViewRef : undefined}>
          <CarImage
            data={data?.card_info}
            lazyImg={lazyImg}
            imgWidth={HCardImageSize}
            useNativeImage={useNativeImage}
            rank={rank}
            newImage={newImage}
            showRank={showRank}>
            {!isExternalDeliveryPlatform && pv_text && <view className={`${prefixCls}-pv T8`}>{pv_text}</view>}
            {!isExternalDeliveryPlatform && topTag && (
              <view
                className={`T8 ${prefixCls}-top-tag`}
                style={{
                  color: topTag.text_color,
                  backgroundColor: topTag.background_color,
                }}>
                {topTag.text}
              </view>
            )}
            {!isExternalDeliveryPlatform && imgBannerConfig && (
              <>
                <view style={{ backgroundColor: imgBannerConfig.backgroundColor }} className={`${prefixCls}-img-banner`}>
                  {imgBannerConfig.logo ? (
                    <Image
                      loading="eager"
                      disableLoadingBackground
                      className={`${prefixCls}-img-banner-logo`}
                      imgScale={0}
                      src={imgBannerConfig.logo}
                    />
                  ) : (
                    <view className={clsx(`${prefixCls}-img-banner-title`)}>{imgBannerConfig.title}</view>
                  )}
                </view>
                <view className={clsx(`${prefixCls}-img-banner-left`, imgBannerConfig.subTextClass)}>
                  <view className={`${prefixCls}-img-banner-prefix`}>{imgBannerConfig.price.prefix}</view>
                  <view className={`${prefixCls}-img-banner-price`}>
                    <text className={`font-ddin-bold ${prefixCls}-img-banner-price-price`}>
                      {imgBannerConfig.price.value}
                    </text>
                    <text className={`${prefixCls}-img-banner-price-suffix`}>{imgBannerConfig.price.suffix}</text>
                  </view>
                </view>
              </>
            )}
            {!isExternalDeliveryPlatform && ddImgActivity && (
              <view
                className={`${prefixCls}-img-bottom-activity`}
                style={{
                  backgroundImage: `url(${ddImgActivity?.background_image})`,
                }}>
                <view className={`${prefixCls}-img-bottom-activity-content`}>
                  <view
                    style={{
                      color: ddImgActivity?.text_color,
                    }}>
                    {ddImgActivity?.text}
                  </view>
                  <view
                    style={{
                      color: ddImgActivity?.sub_text_color,
                    }}>
                    <text className={`${prefixCls}-img-bottom-activity-price font-ddin-bold`}>
                      {ddImgActivity?.price}
                    </text>
                    {(ddImgActivity?.sub_text || '').replace('{{price}}', '')}
                  </view>
                </view>
              </view>
            )}
          </CarImage>
        </view>
        <view className={`${prefixCls}-content`}>
          <view className={`T5 font-5-bold sh-line-2 ${prefixCls}-title medium-font-14`}>
            {showTitleDirectTag && <DirectSaleTag />}
            {nationWideTag && !newCardUi && <NationwideTag />}
            <NewCarSaleTag tag={newCarSaleTag} />
            {title}
          </view>
          <view className={`T7 ${prefixCls}-year sh-line-1`}>{sub_title}</view>
          {!contentText && tagList && tagList.length > 0 && (
            <view className={`${prefixCls}-tags-wrap`} ref={tagsRef}>
              {tagList.map((tItem: SkuTagItemType) => (
                <ShTag data={tItem} key={`${tItem.key}_${tItem.text}`} optimize={inTags} />
              ))}
            </view>
          )}
          {contentText && <ContentInfo text={contentText} />}
          <view className={`${prefixCls}-price-wrap`}>
            <view className={`${prefixCls}-price-collect`}>
              <view className={`T2 ${prefixCls}-price`}>
                <CardBottom data={data.card_info} />
              </view>
              {actionNode && <view className={`${prefixCls}-actions`}>{actionNode}</view>}
            </view>
          </view>
          {bottomNode && <view className={`${prefixCls}-bottom-node`}>{bottomNode}</view>}
        </view>
      </view>
      {extraBottomNode}
    </>
  )
})

export default HorizontalCard
