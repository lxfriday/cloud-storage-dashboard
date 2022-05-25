import axios from 'axios'
import * as qs from 'querystring'
import qiniu from './cspAdaptor/qiniu'

type requestParam = {
  url: string
  params?: any
  config?: any
}

axios.defaults.validateStatus = function (status) {
  return status >= 200 && status < 600 // default
}

axios.interceptors.request.use(function (config) {
  // console.log('request config', config)
  return config
})

axios.interceptors.response.use(function (res) {
  if (res.status >= 200 && res.status < 300) {
    return { success: true, data: res.data }
  } else {
    return { success: false, msg: res.data.error || res.data.error_code }
  }
})

export function qiniuGet(
  { url, params, config }: requestParam,
  getAuthorization: (url: string) => string
) {
  if (params) {
    url += `?${qs.stringify(params)}`
  }
  if (!config) {
    config = {}
  }
  // 七牛api
  config = {
    ...config,
    headers: {
      ...config.headers,
      authorization: getAuthorization(url),
    },
  }
  return axios(url, { method: 'GET', ...config })
    .then(res => {
      console.log('qniuGet', res)
      return res
    })
    .catch(e => {
      return e
    })
}

export function get({ url, params, config }: requestParam) {
  if (params) {
    url += `?${qs.stringify(params)}`
  }
  if (!config) {
    config = {}
  }
  return axios(url, { method: 'GET', ...config }).then(res => {
    return res.data
  })
}

export function post({ url, params, config }: requestParam) {
  if (!config) {
    config = {}
  }
  if (params) {
    config.data = params
  }
  return axios(url, { method: 'POST', ...config }).then(res => res.data)
}
