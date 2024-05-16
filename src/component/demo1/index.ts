import { useEffect } from "@byted-lynx/react";
import { call } from '@byted-motor/safe-jsb'
import { reporter } from '@byted-motor/slardar'
import { optImage } from '@byted-motor/tos-image-uri'
import { buildUrl, parseUrl } from '@byted-motor/url'
import { isIOS } from '@byted-motor/lynx-utils/lepus'
import { useInView } from '@byted-motor/lynx-hooks'
import type { CommonCardType, SkuCardType } from '@lib/typing'
import { checkNsr, getStorage, jsonStringify, reportNsrResult } from '@lib/utils'
// eslint-disable-next-line import/no-extraneous-dependencies
import type { SDK } from '@piajs/types'


import debounce from 'lodash/debounce'

const nsrBridge = (options: SDK.NSROptions) =>
  call('pia.rendering.execute', options, 0, 'pia.rendering.execute').then(res => {
    if (res.code === 1) {
      return res as SDK.NSRResponse
    }
    return Promise.reject(res)
  })

type DispatchNSR = {
  data: SkuCardType
  extraInfo: Record<string, any>
}

const pendingSet: Record<string, DispatchNSR> = {}

const waitSec = 0.2 * 1000

export const getNSRConfig = (() => {
  if (checkNsr(true)) {
    return () => Promise.resolve(false)
  }
  let shouldNSR: boolean

  return () =>
    shouldNSR !== undefined
      ? shouldNSR
      : // iOS需要使用disk store
        getStorage<number>('pia_nsr_ab', { disk_storage: isIOS ? 1 : 0 }).then(res => {
          shouldNSR = res === 10 // 只有10个才做NSR
          return shouldNSR
        })
})()

const doNSR = debounce(async () => {
  const shouldNSR = await getNSRConfig()
  if (!shouldNSR) {
    return
  }
  const nsrList = Object.keys(pendingSet)
    .slice(0, 10)
    .map(key => {
      return { key, data: pendingSet[key] }
    })

  if (!nsrList.length) {
    return
  }

  const list: { url: string; params: Record<string, any> }[] = []

  nsrList.forEach(item => {
    const _item = item.data.data as unknown as CommonCardType['info']
    const openUrl = _item.card_info?.open_url as string
    const { params } = parseUrl(openUrl)

    const { card_info } = _item || {}

    const cover = card_info?.image

    delete pendingSet[item.key]

    // doneList.add(item.key)

    // 预览图
    const preview_img = cover
      ? optImage({
          url: cover,
          width: 150,
          autoWebp: true,
          fallbackExt: 'jpg',
        })
      : undefined

    const urlPath = new URL(
      `${window.location.protocol}//${window.location.host}/motor/feoffline/usedcar_detail/detail.html?_pia_=1`
    )

    const _url = urlPath.href

    list.push({
      url: _url,
      params: { ...params, ...item.data.extraInfo, _pia_: 1, preview_img },
    })
  })

  const templateUrl = list?.[0]?.url

  if (!templateUrl) {
    return
  }

  const nsrParams: SDK.NSROptions = {
    url: `${window.location.protocol}//${window.location.host}/motor/feoffline/usedcar_detail/detail.html?_pia_=1`,
    context: {
      urls: list.map(item => buildUrl(item.url, item.params)),
      query: ['sku_id', 'city_name', 'biz_scene'],
      maxAge: 60 * 15,
    },
  }

  console.warn('=========nsrParams', nsrParams)

  nsrBridge(nsrParams)
    .then(res => {
      console.warn('yea', res)
      reportNsrResult('detail', res)
    })
    .catch(res => {
      reporter.log('nsr_execute_fail', jsonStringify(res))
      console.warn('no', res)
    })
}, waitSec)

const dispatchNSR = (params: DispatchNSR, inView: boolean) => {
  const key = params.data.base_info?.sku_id

  if (!key) {
    return
  }

  if (inView) {
    pendingSet[key] = params
  } else {
    delete pendingSet[key]
  }

  doNSR()
}

const defaultOption = {
  rootMargin: '-80px 0px 0px 80px',
  threshold: 1,
}

export const useNSR = (data: SkuCardType, extraInfo: Record<string, any>) => {
  const [ref, inView] = useInView<HTMLDivElement>(undefined, defaultOption)

  useEffect(() => {
    if (!ref.current) {
      return
    }
    dispatchNSR({ data, extraInfo }, inView)
  }, [data, inView, extraInfo, ref])

  useEffect(() => {
    return () => {
      delete pendingSet[data.base_info?.sku_id || '']
    }
  }, [data])

  return ref
}
