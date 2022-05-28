import Tencent from './tencent'
import keys from './tencent.keys'

async function getBucketList() {
  try {
    const t = new Tencent({
      ak: 'xxx',
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

async function getBucketDomains() {
  try {
    const t = new Tencent({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'qcloudtest-1254460906',
      nickname: '',
      csp: '',
      region: 'ap-guangzhou',
    })
    const data = await t.getBucketDomains()
    console.log('getBucketDomains', data)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function getResourceList() {
  try {
    const t = new Tencent({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'qcloudtest-1254460906',
      nickname: '',
      csp: '',
      region: 'ap-guangzhou',
    })
    const res = await t.getResourceList(false, '', '', false, '')
    console.log('getResourceList', res)
    console.log('getResourceList', res.data?.list)
  } catch (e) {
    console.log('catch error', e)
  }
}

getResourceList()

async function getResourceListForSync() {
  try {
    const t = new Tencent({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'qcloudtest-1254460906',
      nickname: '',
      csp: '',
      region: 'ap-guangzhou',
    })
    const res = await t.getResourceListForSync('1523103635408-SyicPE8sM.jpg')
    console.log('getResourceListForSync', res)
    console.log('getResourceListForSync', res.data?.list)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function deleteBucketFiles() {
  try {
    const t = new Tencent({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'qcloudtest-1254460906',
      nickname: '',
      csp: '',
      region: 'ap-guangzhou',
    })
    const res = await t.deleteBucketFiles(['历届冠军皮肤.mp4'])
    console.log('getResourceList', res)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function moveBucketFile() {
  try {
    const t = new Tencent({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'qcloudtest-1254460906',
      nickname: '',
      csp: '',
      region: 'ap-guangzhou',
    })
    const res = await t.moveBucketFile({
      originalKey: '1523088577973-SJ5angIiM.jpg',
      newKey: '1008611.jpg',
    })
    console.log('moveBucketFile', res)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function refreshFiles() {
  try {
    const t = new Tencent({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'qcloudtest-1254460906',
      nickname: '',
      csp: '',
      region: 'ap-guangzhou',
    })
    const res = await t.refreshFiles([
      'https://qcloudtest-1254460906.file.myqcloud.com/1523103635408-SyicPE8sM.jpg',
      'https://qcloud-test.lxfriday.xyz/1523103635408-SyicPE8sM.jpg',
    ])
    console.log('refreshFiles', res)
  } catch (e) {
    console.log('catch error', e)
  }
}

async function refreshDirs() {
  try {
    const t = new Tencent({
      ak: keys.ak,
      sk: keys.sk,
      bucket: 'qcloudtest-1254460906',
      nickname: '',
      csp: '',
      region: 'ap-guangzhou',
    })
    const res = await t.refreshDirs(['	https://qcloudtest-1254460906.file.myqcloud.com/folder1/'])
    console.log('refreshDirs', res)
  } catch (e) {
    console.log('catch error', e)
  }
}
// refreshDirs()
