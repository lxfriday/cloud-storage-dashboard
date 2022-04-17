import * as fs from 'fs'
import * as path from 'path'

// 读取前端传过来的路径，是一个数组
// 数组中的路径可能是一个文件也可能是一个文件夹
// 是文件则直接返回文件的信息
// 是文件夹则读取文件夹中的文件，可能存在文件夹中套文件夹的情况

type fileInfo = {
  name: string
  path: string
}

type retFileInfo = {
  relativeDir: string // 文件的相对路径
  name: string // name 是真的文件名
  path: string // 文件在系统中的路径
}

function readTargetPath(name1: string, p1: string): retFileInfo[] {
  const readRes: retFileInfo[] = []

  function readDir(dirName: string, p: string) {
    const dirsToRead: string[] = []
    const fileNames = fs.readdirSync(p)
    fileNames.forEach(fn => {
      const currentPath = path.join(p, fn)
      if (fs.statSync(currentPath).isFile()) {
        readRes.push({
          relativeDir: dirName + '/', // 文件的相对文件夹
          name: fn,
          path: currentPath,
        })
      } else {
        dirsToRead.push(fn)
      }
      // 文件都读完了，只剩下文件夹
    })
    while (dirsToRead.length > 0) {
      const currentDirName = <string>dirsToRead.shift()
      readDir(`${dirName}/${currentDirName}`, path.join(p, currentDirName))
    }
  }

  readDir(name1, p1)
  return readRes
}

export async function readPaths(fileInfos: fileInfo[]) {
  let res: retFileInfo[] = []
  const dirs: fileInfo[] = []

  fileInfos.forEach(fi => {
    if (fs.statSync(fi.path).isFile()) {
      res.push({
        relativeDir: '',
        name: fi.name,
        path: fi.path,
      })
    } else {
      dirs.push(fi)
    }
  })

  dirs.forEach(fi => {
    res = res.concat(readTargetPath(fi.name, fi.path))
  })

  return res
}
