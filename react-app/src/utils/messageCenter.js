import MESSAGE_COMMANDS from '../../../src/messageCommands'
import messageAdaptor from './messageAdaptor'

export const providerInfo = {
  providerName: 'qiniu',
}

export function requestGenerateUploadToken() {
  return messageAdaptor({
    serverCommand: MESSAGE_COMMANDS.generateUploadToken,
    data: {
      ...providerInfo,
    },
  })
}

export function requestGetResourceList(params = { fromBegin: true, prefix: '' }) {
  return messageAdaptor({
    serverCommand: MESSAGE_COMMANDS.getResourceList,
    data: {
      ...providerInfo,
      ...params,
    },
  })
}

export function requestGetBucketList() {
  return messageAdaptor({
    serverCommand: MESSAGE_COMMANDS.getBucketList,
    data: {
      ...providerInfo,
    },
  })
}

export function requestUpdateBucket(newBucket) {
  return messageAdaptor({
    serverCommand: MESSAGE_COMMANDS.updateBucket,
    data: {
      ...providerInfo,
      newBucket,
    },
  })
}

// getBucketDomains
