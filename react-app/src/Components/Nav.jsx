import React, { Component } from 'react'
import styles from './Nav.module.less'
import { Menu, Select, message } from 'antd'
import {
  FolderOpenOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { NavLink } from 'react-router-dom'

import { getYuanshenBackImg } from '../utils'
import * as messageCenter from '../utils/messageCenter'

const { SubMenu } = Menu
const { Option } = Select

export default class Nav extends Component {
  constructor() {
    super()
    this.state = {
      bucketList: [],
      bucketDomains: [],
      selectBucketDomain: '',
      backImg: getYuanshenBackImg(),
    }
  }

  handleChangeDomain = domain => {
    this.setState({ selectBucketDomain: domain })
  }

  render() {
    const { children } = this.props
    const { bucketList, backImg } = this.state

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
        <div className={styles.contentWrapper} style={{ backgroundImage: `url('${backImg}')` }}>
          <div className={styles.backImgOverlay}></div>
          {children}
        </div>
      </div>
    )
  }
  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({
        backImg: getYuanshenBackImg(),
      })
    }, 1000 * 300)
    messageCenter
      .requestGetBucketList()
      .then(data => {
        this.setState({
          bucketList: data,
        })
      })
      .catch(() => {
        message.error('bucket 列表获取失败')
      })
  }
  componentWillUnmount() {
    clearInterval(this.interval)
  }
}
