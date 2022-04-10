import Home from './Pages/Home/index'
import Settings from './Pages/Settings/index'
import StorageManage from './Pages/StorageManage/index'
import Logout from './Pages/Logout'

const routes = [
  {
    path: '/settings',
    comp: Settings,
    title: '设置',
  },
  {
    path: '/storagemanage',
    comp: StorageManage,
    title: '管理存储空间',
  },
  {
    path: '/logout',
    comp: Logout,
    title: '切换',
  },
  {
    path: '*',
    comp: Home,
    title: '首页',
  },
]

export default routes
