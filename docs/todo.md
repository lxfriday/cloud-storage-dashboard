# TODO

## high priority
- 文件上传时的尾缀直接依据上传文件的尾缀确定
- 文件类型判断也依据文件尾缀判断，不再依据 mime 判断，mime 太过庞大很难覆盖全部
- 对于无尾缀的文件，则上传时不添加尾缀，显示时作为未知文件


- 依据 mime 的第二项判断文件类型存在问题
- 音频文件图标更改，音视频文件在浏览器中打开

## new feat

- 播放音频文件
  - https://marketplace.visualstudio.com/items?itemName=nondanee.vsc-netease-music
  - 命令行播放器 https://github.com/shime/play-sound#options
  - ref https://stackoverflow.com/questions/61118647/play-sound-in-the-webview-provided-by-vscode
  - aplayer
- 对各种编码的视频提供支持
- 文件下载
  - 参考 mpeg4 插件
  - https://github.com/microsoft/vscode/pull/108603

## Other

- 文件搜索
- ? 多文件上传的时候，需要多次生成 token

## 文件夹

- 创建文件夹
- 文件夹面包屑导航

## 上传

- MP3 上传变成 mpeg 格式了，使用的 mime 来命名尾缀，有问题
- 统计上传中的文件数量
- 拖拽上传
- 从剪切板上传
- 文件夹上传

## 下载

- 下载单文件
- 下载多文件

## resourceCard

## low priority

- ? vscode webview 无法播放声音
