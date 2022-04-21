import React, { useEffect, useState } from 'react'
import { Input, Button, message, notification, Spin } from 'antd'
import { SendOutlined, DeleteFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { useSelector, useDispatch } from 'react-redux'

import { initSettings } from '../store/settings'
import loadParticlesJS from '../utils/particle'
import * as messageCenter from '../utils/messageCenter'
import styles from './Login.module.less'

const csps = [
  {
    id: 'qiniu',
    name: '七牛云',
    enable: true,
  },
  {
    id: 'tencentcloud',
    name: '腾讯云(?)',
    enable: false,
  },
  {
    id: 'aliyun',
    name: '阿里云(?)',
    enable: false,
  },
  {
    id: 'upyun',
    name: '又拍云(?)',
    enable: false,
  },
  {
    id: 'qingcloud',
    name: '青云(?)',
    enable: false,
  },
  {
    id: 'AWSS3',
    name: '亚马逊S3(?)',
    enable: false,
  },
]

export default function Login() {
  const usedCSPs = useSelector(state => state.settings.usedCSPs)
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [loginFromUsedCSPs, setLoginFromUsedCSPs] = useState(false)
  const [selectedCSP, setSelectedCSP] = useState(csps[0])
  const [cspInfo, setCspInfo] = useState({
    nickname: csps[0].name,
    csp: csps[0].id,
    ak: '',
    sk: '',
  })

  // 点击进入xxx，登录
  function handleSubmit(submitCSPInfo) {
    const { ak, sk } = submitCSPInfo
    const trimmedKeys = {
      ak: ak.trim(),
      sk: sk.trim(),
    }
    if (!trimmedKeys.ak.length) {
      message.error('请填写 ACCESS_KEY')
      return
    } else if (!trimmedKeys.sk.length) {
      message.error('请填写 SECRET_KEY')
      return
    }
    setIsLoading(true)
    messageCenter
      .requestLogin({
        ...submitCSPInfo,
        ...trimmedKeys,
      })
      .then(data => {
        if (data.success) {
          message.success('登录成功')
          dispatch(initSettings(data.settings))
          // setIsLoading(false) 不需要
        } else {
          notification.error({
            message: '提示',
            description: '登录失败，请检查 ak、sk：' + data.msg,
          })
          setIsLoading(false)
        }
      })
      .catch(e => {
        message.error('登录失败：' + String(e))
        setIsLoading(false)
      })
  }

  // 从已登录的列表中，删除条记录
  function handleDeleteUsedCSP(deleteCSPInfo) {
    console.log('deleteCSPInfo', deleteCSPInfo)
    setIsLoading(true)
    messageCenter
      .requestDeleteUsedCSP(deleteCSPInfo)
      .then(data => {
        if (data.success) {
          // 删除的有可能是当前的 currentCSP，要进行对应的处理
          dispatch(
            initSettings({
              ...data.settings,
              currentCSP: null,
            })
          )
        } else {
        }
      })
      .catch(e => {
        message.error('删除失败：' + String(e))
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    loadParticlesJS('particle-js')
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.particleJS} id="particle-js"></div>
      <div className={styles.contentWrapper}>
        {isLoading && (
          <div className={styles.loadingWrapper}>
            <Spin size="large" />
          </div>
        )}
        <div className={styles.leftWrapper}>
          {/* 左侧 csp 选择区域 */}
          {csps.map(_ => (
            <div
              key={_.id}
              className={classnames(
                styles.cspListItemWrapper,
                selectedCSP && selectedCSP.id === _.id && styles.selected,
                !_.enable && styles.disabled
              )}
              onClick={() => {
                if (_.enable) {
                  setSelectedCSP(_)
                  setCspInfo({
                    nickname: _.name,
                    csp: _.id,
                    ak: '',
                    sk: '',
                  })
                  setLoginFromUsedCSPs(false)
                } else {
                  message.info('正在开发中，尽请期待')
                }
              }}
            >
              <span className={styles.name}>{_.name}</span>
            </div>
          ))}
          {usedCSPs.length > 0 && (
            <div
              className={classnames(
                styles.cspListItemWrapper,
                loginFromUsedCSPs && styles.selected
              )}
              onClick={() => {
                setLoginFromUsedCSPs(true)
                setSelectedCSP(null)
                setCspInfo({
                  nickname: '',
                  csp: '',
                  ak: '',
                  sk: '',
                })
              }}
            >
              <span className={styles.name}>已登录</span>
            </div>
          )}
        </div>

        <div className={styles.rightWrapper}>
          {/* 右侧输入区域 */}
          <div className={styles.brandWrapper}>
            <div className={styles.appName}>云存储管理</div>
            {!loginFromUsedCSPs && <div className={styles.appcspconnect}></div>}
            {!loginFromUsedCSPs && <div className={styles.cspName}>{selectedCSP.name}</div>}
          </div>
          {!loginFromUsedCSPs && (
            <div className={styles.inputWrapper}>
              <div className={styles.inputItem}>
                <span className={styles.title}>别名</span>
                <Input
                  type="text"
                  value={cspInfo.nickname}
                  placeholder="输入别名，用于同时登录多个账号时做区分"
                  onChange={e =>
                    setCspInfo({
                      ...cspInfo,
                      nickname: e.target.value,
                    })
                  }
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
                <Button
                  icon={<SendOutlined />}
                  onClick={() => {
                    handleSubmit(cspInfo)
                  }}
                  loading={isLoading}
                >
                  进入{selectedCSP.name}
                </Button>
              </div>
            </div>
          )}
          {loginFromUsedCSPs && (
            <div className={styles.usedCSPSWrapper}>
              {usedCSPs.map((_, ind) => (
                <div key={ind} className={styles.itemWrapper}>
                  <div
                    title={'进入 ' + _.nickname}
                    className={styles.nicknameWrapper}
                    onClick={() => {
                      handleSubmit(_)
                    }}
                  >
                    {_.nickname}
                  </div>
                  <div
                    className={styles.deleteWrapper}
                    title={'删除 ' + _.nickname}
                    onClick={() => {
                      handleDeleteUsedCSP(_)
                    }}
                  >
                    <DeleteFilled style={{ color: '#ccc', fontSize: 18 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
