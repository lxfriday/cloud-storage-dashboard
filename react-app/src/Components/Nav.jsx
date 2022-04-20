import React, { useState, useEffect } from 'react'
import { Menu, message } from 'antd'
import {
  FolderOpenOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import Login from '../Components/Login'
import { initSettings } from '../store/settings'
import * as messageCenter from '../utils/messageCenter'
import styles from './Nav.module.less'

const { SubMenu } = Menu

export default function Nav({ children }) {
  const backImgs = useSelector(state => state.settings.customBackImgs)
  const currentCSP = useSelector(state => state.settings.currentCSP)
  const [backImg, setBackImg] = useState()
  const [bucketList, setBucketList] = useState([])
  const dispatch = useDispatch()
  const hasloggedIn = !!currentCSP

  useEffect(() => {
    // 获取 bucket 列表
    messageCenter
      .requestGetBucketList()
      .then(data => {
        setBucketList(data)
      })
      .catch(() => {
        message.error('bucket 列表获取失败')
      })

    messageCenter
      .requestGetSettings()
      .then(data => {
        if (data.success) {
          dispatch(initSettings(data.settings))
          setBackImg(
            data.settings.customBackImgs[
              Math.floor(Math.random() * data.settings.customBackImgs.length)
            ]
          )
        } else {
          message.error('获取初始配置信息失败')
        }
      })
      .catch(e => {
        message.error('获取初始配置信息失败', String(e))
      })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setBackImg(backImgs[Math.floor(Math.random() * backImgs.length)])
    }, 1000 * 300)
    return () => {
      clearInterval(interval)
    }
  }, [backImgs])

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
              theme="dark"
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
            <Menu style={{ width: 180 }} mode="inline" theme="dark">
              <Menu.Item key="logout" icon={<LogoutOutlined />}>
                <NavLink
                  to="/logout"
                  className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
                >
                  七牛云(切换)
                </NavLink>
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
