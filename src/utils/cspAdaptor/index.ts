import Qiniu from './qiniu'

type cspInfoType = {
  bucket: string
  ak: string
  sk: string
  csp: string
  nickname: string // current login nickname
  region: string
}

// const cspInfo = {
//   bucket: '',
//   ak,
//   sk,
//   csp: 'qiniu',
//   nickname: '', // current login nickname
// }

export default function cspAdaptor(cspInfo: cspInfoType) {
  if (cspInfo.csp === 'qiniu') {
    const qiniu = new Qiniu({
      ak: cspInfo.ak,
      sk: cspInfo.sk,
      bucket: cspInfo.bucket,
      nickname: cspInfo.nickname,
      csp: cspInfo.csp,
      region: cspInfo.region,
    })
    return qiniu
  }
  const qiniu = new Qiniu({
    ak: cspInfo.ak,
    sk: cspInfo.sk,
    bucket: cspInfo.bucket,
    nickname: cspInfo.nickname,
    csp: cspInfo.csp,
    region: cspInfo.region,
  })
  return qiniu
}

export interface CSPAdaptorType extends Qiniu {}
