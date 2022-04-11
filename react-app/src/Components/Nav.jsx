import React, { Component } from 'react'
import styles from './Nav.module.less'
import { Menu, Select } from 'antd'
import {
  FolderOpenOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { NavLink } from 'react-router-dom'
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
    }
  }

  handleChangeDomain = domain => {
    console.log('handleChangeDomain', domain)
    this.setState({ selectBucketDomain: domain })
  }

  render() {
    const { children } = this.props
    const { bucketList } = this.state

    // console.log('nav state', this.state)

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
        <div className={styles.contentWrapper}>{children}</div>
      </div>
    )
  }
  componentDidMount() {
    messageCenter.requestGetBucketList().then(data => {
      this.setState({
        bucketList: data,
      })
    })
  }
}
