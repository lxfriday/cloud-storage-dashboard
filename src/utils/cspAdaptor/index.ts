import Qiniu from './qiniu'

type cspInfoType = {
  bucket: string
  ak: string
  sk: string
  csp: string
  nickname: string // current login nickname
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
    const qiniu = new Qiniu(cspInfo.ak, cspInfo.sk, cspInfo.bucket)
    return qiniu
  }
  const qiniu = new Qiniu(cspInfo.ak, cspInfo.sk, cspInfo.bucket)
  return qiniu
}

export interface CSPAdaptorType extends Qiniu {}
