import axios from 'axios'
import * as qs from 'querystring'

type requestParam = {
  url: string
  params?: any
  config?: any
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
