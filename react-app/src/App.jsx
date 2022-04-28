import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import styles from './App.module.less'
import routesConfig from '@/routesConfig'
import Nav from '@/Components/Nav'
import { renderUploadManager, destroyUploadManager } from './Components/UploadManager'
import { renderDownloadManager, destroyDownloadManager } from './Components/DownloadManager'

function App() {
  useEffect(() => {
    renderUploadManager()
    renderDownloadManager()
    return () => {
      destroyUploadManager()
      destroyDownloadManager()
    }
  }, [])
  return (
    <div
      className={styles.container}
      onContextMenu={e => {
        e.stopPropagation()
      }}
    >
      <Nav>
        <Routes>
          {routesConfig.map(route => (
            <Route
              key={route.path}
              path={route.path}
              title={route.title}
              element={<route.comp />}
            />
          ))}
        </Routes>
      </Nav>
    </div>
  )
}

export default App
