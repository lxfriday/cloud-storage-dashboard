import React, { useEffect, useState } from 'react'
import { Input, Button } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import classnames from 'classnames'

import loadParticlesJS from '../utils/particle'
import styles from './Login.module.less'

const csps = [
  {
    id: 'qiniu',
    name: '七牛云',
  },
  {
    id: 'tencentcloud',
    name: '腾讯云',
  },
  {
    id: 'aliyun',
    name: '阿里云',
  },
  {
    id: 'upyun',
    name: '又拍云',
  },
  {
    id: 'qingcloud',
    name: '青云',
  },
  {
    id: 'AWSS3',
    name: '亚马逊S3',
  },
]

export default function Login() {
  const [selectedCSP, setSelectedCSP] = useState(csps[0])
  const [cspInfo, setCspInfo] = useState({
    nickname: csps[0].name,
    ak: '',
    sk: '',
  })

  useEffect(() => {
    loadParticlesJS('particle-js')
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.particleJS} id="particle-js"></div>
      <div className={styles.contentWrapper}>
        <div className={styles.leftWrapper}>
          {/* 左侧 csp 选择区域 */}
          {csps.map(_ => (
            <div
              key={_.id}
              className={classnames(
                styles.cspListItemWrapper,
                selectedCSP && selectedCSP.id === _.id && styles.selected
              )}
              onClick={() => {
                setSelectedCSP(_)
                setCspInfo({
                  nickname: _.name,
                  ak: '',
                  sk: '',
                })
              }}
            >
              <span className={styles.name}>{_.name}</span>
            </div>
          ))}
        </div>
        <div className={styles.rightWrapper}>
          {/* 右侧输入区域 */}
          <div className={styles.brandWrapper}>
            <div className={styles.appName}>云存储管理</div>
            <div className={styles.appcspconnect}></div>
            <div className={styles.cspName}>{selectedCSP.name}</div>
          </div>
          <div className={styles.inputWrapper}>
            <div className={styles.inputItem}>
              <span className={styles.title}>别名</span>
              <Input
                type="text"
                value={cspInfo.nickname}
                placeholder="输入别名，用于同时登录多个账号时做区分"
              />
            </div>
            <div className={styles.inputItem}>
              <span className={styles.title}>ACCESS_KEY</span>
              <Input
                type="text"
                value={cspInfo.ak}
                placeholder="这里输入 AK"
                onChange={e =>
                  setCspInfo({
                    ...cspInfo,
                    ak: e.target.value,
                  })
                }
              />
            </div>
            <div className={styles.inputItem}>
              <span className={styles.title}>SECRET_KEY</span>
              <Input
                type="text"
                value={cspInfo.sk}
                placeholder="这里输入 SK"
                onChange={e =>
                  setCspInfo({
                    ...cspInfo,
                    sk: e.target.value,
                  })
                }
              />
            </div>
            <div className={styles.submitItem}>
              <Button icon={<SendOutlined />}>进入{selectedCSP.name}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
