import { notification } from 'antd'
import { requestSyncBucket } from './messageCenter'
import { debounce } from './index'
import { store } from '../store'

function notiSyncBucket() {
  const {
    settings: { enableNotiSyncBucket },
  } = store.getState()
  if (enableNotiSyncBucket) {
    notification.info({
      message: '提示',
      description: (
        <div>
          bucket 内文件变化之后建议立即同步本地 bucket 信息
          <span
            style={{ cursor: 'pointer', color: 'blue' }}
            onClick={() => {
              requestSyncBucket(true)
              notification.destroy()
            }}
          >
            【立即同步】
          </span>
          <p style={{ fontSize: 10, color: '#666' }}>
            如果您觉得此提示过于频繁，可以前往 【设置】 关闭 【启用 bucket 同步提示】 选项
          </p>
        </div>
      ),
    })
  }
}

export default debounce(notiSyncBucket, 30000, false)
