import { notification } from 'antd'
import { requestSyncBucket } from './messageCenter'
import { debounce } from './index'

function notiSyncBucket() {
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
      </div>
    ),
  })
}

export default debounce(notiSyncBucket, 30000, false)
