import React, { Component, useState } from 'react'
import styles from './Nav.module.less'
import { Menu, Popover } from 'antd'
import { AppstoreOutlined, MailOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import { NavLink, useLocation } from 'react-router-dom'
import classnames from 'classnames'
import routesConfig, { getPageTitle } from '@/routesConfig'

const { SubMenu } = Menu

const sideRoutesConfig = routesConfig.slice(1)

export default function Nav({ children }) {
  let location = useLocation()
  console.log('location', location)

  function handleClick() {
    console.log('????')
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.sideWrapper}>
        <div className={styles.siteTitle}>云存储管理</div>
        <Menu
          onClick={handleClick}
          style={{ width: 180 }}
          defaultSelectedKeys={['settings']}
          openKeys={['sub1']}
          mode="inline"
          theme="dark"
        >
          <SubMenu key="sub1" icon={<MailOutlined />} title="存储空间">
            <Menu.Item key="storagemanage-storage">
              <NavLink
                to="/storagemanage?space=storage"
                className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
              >
                storage
              </NavLink>
            </Menu.Item>
            <Menu.Item key="storagemanage-lxfriday-test">
              <NavLink
                to="/storagemanage?space=lxfriday-test"
                className={({ isActive }) => (isActive ? styles.navLinkActive : undefined)}
              >
                lxfriday-test
              </NavLink>
            </Menu.Item>
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
      <div className={styles.contentWrapper}>
        <div className={styles.navTools}>
          <Popover content="文件上传(支持多选)" placement="left">
            <div className={styles.buttonWrapper}>
              <UploadOutlined style={{ fontSize: '20px' }} />
            </div>
          </Popover>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
