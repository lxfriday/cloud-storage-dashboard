import Qiniu from './qiniu'
import Tencent from './tencent'

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

const map = {
  qiniu: Qiniu,
  tencent: Tencent,
}

export default function cspAdaptor(cspInfo: cspInfoType) {
  // @ts-ignore
  const CSP = map[cspInfo.csp] || Qiniu
  // @ts-ignore
  const csp: Qiniu = new CSP({
    ak: cspInfo.ak,
    sk: cspInfo.sk,
    bucket: cspInfo.bucket,
    nickname: cspInfo.nickname,
    csp: cspInfo.csp,
    region: cspInfo.region,
  })
  return csp
}

export interface CSPAdaptorType extends Qiniu {}
