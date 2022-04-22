import * as async from 'async'
import * as path from 'path'
const Downloader = require('nodejs-file-downloader')

// 需要传自定义的文件名，并且为了防止重复，文件名带上时间戳防止重复

type fileInfoType = {
  id: string
  url: string
  fname: string
}

export function download(filesInfo: fileInfoType[], directory: string) {
  console.log('directory', path.resolve(directory))
  return new Promise((res, rej) => {
    async
      .mapLimit(filesInfo, 5, (_, cb) => {
        const downloader = new Downloader({
          url: _.url,
          directory: path.resolve(directory),
          fileName: _.fname,
        })

        console.log('[download manger][start] => ' + _.url)
        downloader
          .download()
          .then(() => {
            console.log('[download manger][finished] => ' + _.url)
            cb()
          })
          .catch(() => {
            // 下载失败了，把下载失败的 id 传递到后面的逻辑去
            cb(null, _)
          })
      })
      .then(_ => {
        const failedFiles = _.filter(Boolean)
        if (failedFiles.length) {
          res({ success: false, failedFiles })
        } else {
          res({ success: true })
        }
      })
      .catch(e => {
        rej(e)
      })
  })
}
