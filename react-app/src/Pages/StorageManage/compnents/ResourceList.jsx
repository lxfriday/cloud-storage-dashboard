import React, { useEffect, useState, useRef, Fragment } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { notification } from 'antd'

import ResourceCard from './ResourceCard'
import { debounce, isImage as isImageFunc, isVideo as isVideoFunc } from '../../../utils'
import styles from './ResourceList.module.less'

function httpsErrorNotiWarning() {
  notification.warning({
    message: '提示',
    description: 'https 协议加载图片失败，自动切换到 http 协议加载资源',
  })
}
function httpErrorNotiError() {
  notification.error({
    message: '提示',
    description: 'http 协议加载图片也失败了',
  })
}

const debouncedHttpsErrorNotiWarning = debounce(httpsErrorNotiWarning, 3000, true)
const debouncedHttpErrorNotiError = debounce(httpErrorNotiError, 3000, true)

export default function ResourceList({
  imagePreviewSuffix,
  selectedKeys,
  resourceList,
  resourcePrefix,
  handleToggleSelectKey,
  handleDeleteFiles,
  handleSelectAll,
  handlePreviewAsImg,
  handlePreviewAsVideo,
  handleDisableableHTTPS,
  loadData,
}) {
  // 资源框实际大小
  const resourceWidth = 130
  const resourceHeight = 130

  // 网格虚拟列表的一些信息
  const [gridInfo, setGridInfo] = useState({
    containerWidth: 0,
    containerheight: 0,
    columnCount: 1,
    cellWrapperWidth: 0,
    cellWrapperheight: 0,
  })
  // grid 外层 ref
  const gridEle = useRef(null)
  // 列表 wrapper ref
  const gridInnerEle = useRef(null)

  // 行数由总条目数和列数计算得出
  const rowCount = Math.ceil(resourceList.length / gridInfo.columnCount)

  // 当个 item 的渲染组件
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const ind = gridInfo.columnCount * rowIndex + columnIndex
    // 注意数组越界， gird 会把网格给布满，所以 ind 可能会超出，需要做判断，超出的不管就ok了
    const resourceInfo = resourceList[ind]
    if (ind >= resourceList.length) {
      return <Fragment></Fragment>
    } else {
      return (
        <div className={styles.cellWrapper} style={style}>
          <ResourceCard
            imagePreviewSuffix={imagePreviewSuffix}
            isVideo={isVideoFunc(resourceInfo.mimeType.split('/')[1])}
            isImage={isImageFunc(resourceInfo.mimeType.split('/')[1])}
            key={resourceInfo.key}
            fkey={resourceInfo.key}
            fsize={resourceInfo.fsize}
            hash={resourceInfo.hash}
            mimeType={resourceInfo.mimeType}
            putTime={resourceInfo.putTime}
            url={resourcePrefix + resourceInfo.key}
            selected={selectedKeys.includes(resourceInfo.key)}
            handleToggleSelectKey={handleToggleSelectKey}
            handleDeleteFile={handleDeleteFiles}
            handleSelectAll={handleSelectAll}
            debouncedHttpsErrorNotiWarning={debouncedHttpsErrorNotiWarning}
            debouncedHttpErrorNotiError={debouncedHttpErrorNotiError}
            handlePreviewAsImg={() => handlePreviewAsImg(ind)}
            handlePreviewAsVideo={() => handlePreviewAsVideo(resourcePrefix + resourceInfo.key)}
            handleDisableableHTTPS={handleDisableableHTTPS}
          />
        </div>
      )
    }
  }

  function handleScroll({ scrollTop }) {
    const threshhold = 20
    const reachEnd =
      scrollTop + gridInfo.containerheight + threshhold > gridInnerEle.current.clientHeight
    if (reachEnd) {
      console.log('Home load data')
      loadData()
    }
  }

  useEffect(() => {
    function calcGridInfo() {
      const { width: bodyWidth, height: bodyHeight } = document.body.getBoundingClientRect()
      const containerWidth = bodyWidth - 180
      const containerheight = bodyHeight - 104
      // const scrollBarWidth = gridEle.current.offsetWidth - gridEle.current.clientWidth // 有问题，页面初次渲染的时候，没有滚动条，scrollBarWidth值是0
      const scrollBarWidth = 20 // 直接指定成20，别问为什么，问就是懒得弄了，直接指定固定值一锅端了
      // 除去滚动条之后的内容区域宽度
      const contentWidth = containerWidth - scrollBarWidth
      const columnCount = Math.floor(contentWidth / resourceWidth) // 列数
      const cellWrapperWH = +(contentWidth / columnCount).toFixed(3)

      setGridInfo({
        containerWidth,
        containerheight,
        columnCount,
        gap: +((contentWidth - columnCount * resourceWidth) / (columnCount - 1)).toFixed(3),
        cellWrapperWidth: cellWrapperWH,
        cellWrapperheight: cellWrapperWH,
      })
    }
    window.addEventListener('resize', calcGridInfo)
    calcGridInfo()
    loadData()
    return () => {
      window.removeEventListener('resize', calcGridInfo)
    }
  }, [])

  return (
    <Grid
      outerRef={r => (gridEle.current = r)}
      innerRef={r => (gridInnerEle.current = r)}
      className={styles.grid}
      columnCount={gridInfo.columnCount}
      columnWidth={gridInfo.cellWrapperWidth}
      height={gridInfo.containerheight}
      rowCount={rowCount}
      rowHeight={gridInfo.cellWrapperheight}
      width={gridInfo.containerWidth}
      onScroll={handleScroll}
    >
      {Cell}
    </Grid>
  )
}
