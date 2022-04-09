import Home from './Pages/Home/index'
import Settings from './Pages/Settings/index'
import StorageManage from './Pages/StorageManage/index'

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
    path: '*',
    comp: Home,
    title: '存储空间',
  },
]

export default routes

// '/context'
export function getPageTitle(pathname) {
  for (let route of routes) {
    if (route.path === pathname) {
      return route.title
    }
  }
  return '无'
}
