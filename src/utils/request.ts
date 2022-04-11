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

export function get({ url, params, config }: requestParam) {
  if (params) {
    url += `?${qs.stringify(params)}`
  }
  if (!config) {
    config = {}
  }
  if (/(qiniu.com|qbox.me)/g.test(url)) {
    // 七牛api
    config = {
      ...config,
      headers: {
        ...config.headers,
        authorization: qiniu.generateHTTPAuthorization(url),
      },
    }
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
