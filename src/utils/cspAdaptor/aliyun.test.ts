import Aliyun from './aliyun'
import keys from './aliyun.keys'

async function generateUploadToken() {
  try {
    const t = new Aliyun({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'yuny-storage',
      nickname: '',
      csp: '',
      region: 'oss-cn-hangzhou',
    })
    const res = await t.generateUploadToken()
    console.log('generateUploadToken', res)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function getBucketList() {
  try {
    const t = new Aliyun({
      ak: keys.ak,
      sk: keys.sk,
      bucket: '',
      nickname: '',
      csp: '',
      region: '',
    })
    const data = await t.getBucketList()
    console.log('bucket list', data)
  } catch (e) {
    console.log('catch error', e)
  }
}

// async function getBucketInfo() {
//   try {
//     const t = new Aliyun({
//       ak: keys.ak,
//       sk: keys.sk,
//       bucket: 'yuny-storage',
//       nickname: '',
//       csp: '',
//       region: 'oss-cn-hangzhou',
//     })
//     const res = await t.getBucketInfo()
//     console.log('getBucketInfo', res)
//   } catch (e) {
//     console.log('catch error', e)
//   }
// }

async function getBucketDomains() {
  try {
    const t = new Aliyun({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'yuny-storage',
      nickname: '',
      csp: '',
      region: 'oss-cn-hangzhou',
    })
    const res = await t.getBucketDomains()
    console.log('getBucketDomains', res)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function getResourceList() {
  try {
    const t = new Aliyun({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'yuny-storage',
      nickname: '',
      csp: '',
      region: 'oss-cn-hangzhou',
    })
    const res = await t.getResourceList(true, '', '', false, '')
    console.log('getResourceList', res.data)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function getResourceListForSync() {
  try {
    const t = new Aliyun({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'yuny-storage',
      nickname: '',
      csp: '',
      region: 'oss-cn-hangzhou',
    })
    const res = await t.getResourceListForSync('')
    console.log('getResourceListForSync', res.data)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function deleteBucketFiles() {
  try {
    const t = new Aliyun({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'yuny-storage',
      nickname: '',
      csp: '',
      region: 'oss-cn-hangzhou',
    })
    const res = await t.deleteBucketFiles(['react-source_20191004120s139.png'])
    console.log('deleteBucketFiles', res.data)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function moveBucketFile() {
  try {
    const t = new Aliyun({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'yuny-storage',
      nickname: '',
      csp: '',
      region: 'oss-cn-hangzhou',
    })
    const res = await t.moveBucketFile({
      originalKey: 'react-source_20191004104845.png',
      newKey: 'a/b/c/d/newkey333.png',
    })
    console.log('moveBucketFile', res)
  } catch (e) {
    console.log('catch error', e)
  }
}

// async function refreshFiles() {
//   try {
//     const t = new Aliyun({
//       ak: keys.ak,
//       sk: keys.sk,
//       bucket: 'yuny-storage',
//       nickname: '',
//       csp: '',
//       region: 'oss-cn-hangzhou',
//     })
//     const res = await t.refreshFiles([
//       'https://alioss.lxfriday.xyz/newkey222.png',
//       'https://alioss.lxfriday.xyz/microsft-type-script_20191004104830.jpg',
//     ])
//     console.log('refreshFiles', res)
//   } catch (e) {
//     console.log('catch error', e)
//   }
// }

async function refreshDirs() {
  try {
    const t = new Aliyun({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'yuny-storage',
      nickname: '',
      csp: '',
      region: 'oss-cn-hangzhou',
    })
    const res = await t.refreshDirs([
      'https://alioss.lxfriday.xyz/',
      'https://alioss.lxfriday.xyz/a/',
    ])
    console.log('refreshDirs', res)
  } catch (e) {
    console.log('catch error', e)
  }
}
refreshDirs()
