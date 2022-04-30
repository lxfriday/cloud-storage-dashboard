import React, { useState, useEffect } from 'react'
import { Menu, message, Spin } from 'antd'
import {
  FolderOpenOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import Login from '../Components/Login'
import { initSettings, logout } from '../store/settings'
import * as messageCenter from '../utils/messageCenter'
import messageCommands from '../../../src/messageCommands'
import styles from './Nav.module.less'

const { SubMenu } = Menu

export default function Nav({ children }) {
  const backImgs = useSelector(state => state.settings.customBackImgs)
  const currentCSP = useSelector(state => state.settings.currentCSP)
  // 是否已经初始化了，用于在获取到登录信息之前做过渡
  const [hasInitialized, setHasInitialized] = useState(false)
  const [backImg, setBackImg] = useState()
  const [bucketList, setBucketList] = useState([])
  // 后台是否正在同步数据
  const [isSyncing, setIsSyncing] = useState(false)
  const dispatch = useDispatch()
  const hasloggedIn = !!currentCSP

  function handleChangeCSP() {
    dispatch(logout())
  }

  useEffect(() => {
    let timer = null
    messageCenter
      .requestGetSettings()
      .then(data => {
        if (data.success) {
          // 加定时器只是为了让 loading 稳定显示1秒，免得页面 render 太快，loading 就闪了一下，体验不好
          timer = setTimeout(() => {
            setHasInitialized(true)
            dispatch(initSettings(data.settings))
            if (data.settings.customBackImgs.length) {
              setBackImg(
                data.settings.customBackImgs[
                  Math.floor(Math.random() * data.settings.customBackImgs.length)
                ]
              )
            }
          }, 1000)
        } else {
          message.error('获取初始配置信息失败')
        }
      })
      .catch(e => {
        message.error('获取初始配置信息失败', String(e))
      })

    function startSyncing(ev) {
      const msg = ev.data
      if (msg.command === messageCommands.syncBucket_startSyncing) {
        setIsSyncing(true)
      }
    }
    function endSyncing(ev) {
      const msg = ev.data
      if (msg.command === messageCommands.syncBucket_endSyncing) {
        setIsSyncing(false)
      }
    }

    window.addEventListener('message', startSyncing)
    window.addEventListener('message', endSyncing)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('message', startSyncing)
      window.removeEventListener('message', endSyncing)
    }
  }, [])

  useEffect(() => {
    if (hasloggedIn) {
      // 获取 bucket 列表
      messageCenter
        .requestGetBucketList()
        .then(data => {
          setBucketList(data)
        })
        .catch(() => {
          message.error('bucket 列表获取失败')
        })
    }
  }, [hasloggedIn])

  useEffect(() => {
    let interval = null
    if (backImgs.length) {
      setBackImg(backImgs[Math.floor(Math.random() * backImgs.length)])
      interval = setInterval(() => {
        setBackImg(backImgs[Math.floor(Math.random() * backImgs.length)])
      }, 1000 * 300)
    }
    return () => {
      clearInterval(interval)
    }
  }, [backImgs])

  if (!hasInitialized) {
    return (
      <div className={styles.loadingWrapper}>
        <Spin size="large" />
      </div>
    )
  }

  if (hasloggedIn) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.sideWrapper}>
          <div className={styles.sideTopWrapper}>
            <div className={styles.siteTitle}>云存储管理</div>
            <Menu
              style={{ width: 180 }}
              defaultSelectedKeys={['home']}
              defaultOpenKeys={['sub1']}
              mode="inline"
              theme="light"
            >
              <Menu.Item key="home" icon={<HomeOutlined />}>
                <NavLink
                  to="/"
                  className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                >
                  首页
                </NavLink>
              </Menu.Item>
              <SubMenu key="sub1" icon={<FolderOpenOutlined />} title="存储空间">
                {bucketList.map(bk => (
                  <Menu.Item key={bk}>
                    <NavLink
                      to={`/storagemanage?space=${bk}`}
                      className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                    >
                      {bk}
                    </NavLink>
                  </Menu.Item>
                ))}
              </SubMenu>
              <Menu.Item key="settings" icon={<SettingOutlined />}>
                <NavLink
                  to="/settings"
                  className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                >
                  设置
                </NavLink>
              </Menu.Item>
            </Menu>
          </div>
          <div className={styles.sideBottomWrapper}>
            {isSyncing && (
              <div className={styles.isSyncing}>
                <Spin size="small" style={{ marginRight: 10 }} /> bucket 数据同步中
              </div>
            )}
            <Menu style={{ width: 180 }} mode="inline" theme="light" selectedKeys={[]}>
              <Menu.Item key="changeCSP" icon={<LogoutOutlined />} onClick={handleChangeCSP}>
                {currentCSP.nickname}(切换)
              </Menu.Item>
            </Menu>
          </div>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.backImg} style={{ backgroundImage: `url('${backImg}')` }}></div>
          <div className={styles.backImgOverlay}></div>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    )
  } else {
    return <Login />
  }
}
