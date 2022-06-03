import React, { useEffect, useState, useRef, Fragment } from 'react'
import { FixedSizeGrid as Grid, FixedSizeList as List } from 'react-window'
import { VerticalAlignTopOutlined } from '@ant-design/icons'
import classnames from 'classnames'

import ResourceCard from './ResourceCard'
import FolderCard from './FolderCard'
import {
  isImage as isImageFunc,
  isVideo as isVideoFunc,
  isAudio as isAudioFunc,
  isGif as isGifFunc,
  isSvg as isSvgFunc,
  getResourceExtAndName,
} from '../../../utils'
import styles from './ResourceList.module.less'

export default function ResourceList({
  listType,
  bucketInfo,
  uploadFolder,
  commonPrefixList,
  selectedKeys,
  selectedFolders,
  resourceList,
  resourcePrefix,
  handleToggleSelectKey,
  handleToggleSelectFolder,
  handleDeleteFiles,
  handleSelectAll,
  handlePreviewAsImg,
  // handlePreviewAsVideo,
  handleViewFolder,
  handleLoadData,
  handleBackward,
  handleOpenInBrowser,
  handleRenameResource,
  handleRefreshResource,
  handleRefreshDir,
  handleDownloadFiles,
  handleUpdateStorageClass,
  handleGenTmpLink,
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
  // 普通列表的一些信息
  const [listInfo, setListInfo] = useState({
    containerWidth: 0,
    containerheight: 0,
  })
  const [isToTopVisible, setIsToTopVisible] = useState(false)
  // grid 外层 ref
  const gridOutterEle = useRef(null)
  // grid 列表 wrapper ref
  const gridInnerEle = useRef(null)
  const gridRef = useRef(null)
  // list 外层 ref
  const listOutterEle = useRef(null)
  // list 列表 wrapper ref
  const listInnerEle = useRef(null)
  const listRef = useRef(null)

  // 行数由总条目数文件夹数和列数计算得出，+1 是因为要加上 第一个返回上一层的按钮
  const isTopFolder = uploadFolder.length === 0
  const rowCount = Math.ceil(
    (resourceList.length + commonPrefixList.length + (isTopFolder ? 0 : 1)) / gridInfo.columnCount
  )
  const listData = [...commonPrefixList, ...resourceList]
  const listItemCount = listData.length + (isTopFolder ? 0 : 1)

  function handleGridScroll({ scrollTop }) {
    const threshhold = 20
    const reachEnd =
      scrollTop + gridInfo.containerheight + threshhold > gridInnerEle.current.clientHeight
    const shouldShowToTop = scrollTop > gridInfo.containerheight + 200
    if (shouldShowToTop !== isToTopVisible) {
      setIsToTopVisible(shouldShowToTop)
    }
    if (reachEnd) {
      handleLoadData()
    }
  }

  function handleListScroll({ scrollOffset }) {
    const threshhold = 20
    const reachEnd =
      scrollOffset + listInfo.containerheight + threshhold > listInnerEle.current.clientHeight
    const shouldShowToTop = scrollOffset > listInfo.containerheight + 200
    if (shouldShowToTop !== isToTopVisible) {
      setIsToTopVisible(shouldShowToTop)
    }
    if (reachEnd) {
      handleLoadData()
    }
  }

  useEffect(() => {
    // 计算 Grid List 的布局信息
    function calcListGridInfo() {
      const { width: bodyWidth, height: bodyHeight } = document.body.getBoundingClientRect()
      const containerWidth = bodyWidth - 180
      const containerheight = bodyHeight - 104
      // const scrollBarWidth = gridOutterEle.current.offsetWidth - gridOutterEle.current.clientWidth // 有问题，页面初次渲染的时候，没有滚动条，scrollBarWidth值是0
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
      setListInfo({
        containerWidth,
        containerheight,
      })
    }
    window.addEventListener('resize', calcListGridInfo)
    calcListGridInfo()
    handleLoadData()
    return () => {
      window.removeEventListener('resize', calcListGridInfo)
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      {listType === 'grid' ? (
        <Grid
          ref={r => (gridRef.current = r)}
          outerRef={r => (gridOutterEle.current = r)}
          innerRef={r => (gridInnerEle.current = r)}
          className={styles.grid}
          columnCount={gridInfo.columnCount}
          columnWidth={gridInfo.cellWrapperWidth}
          height={gridInfo.containerheight}
          rowCount={rowCount}
          rowHeight={gridInfo.cellWrapperheight}
          width={gridInfo.containerWidth}
          onScroll={handleGridScroll}
          itemData={{
            data: listData,
            listType,
            bucketInfo,
            columnCount: gridInfo.columnCount,
            isTopFolder,
            handleBackward,
            selectedFolders,
            handleViewFolder,
            handleRefreshDir,
            handleToggleSelectFolder,
            commonPrefixList,
            resourcePrefix,
            selectedKeys,
            handleToggleSelectKey,
            handleDeleteFiles,
            handleSelectAll,
            handlePreviewAsImg,
            handleOpenInBrowser,
            handleRenameResource,
            handleRefreshResource,
            handleDownloadFiles,
            handleUpdateStorageClass,
            handleGenTmpLink,
          }}
        >
          {GridCell}
        </Grid>
      ) : (
        <List
          ref={r => (listRef.current = r)}
          outerRef={r => (listOutterEle.current = r)}
          innerRef={r => (listInnerEle.current = r)}
          className={styles.list}
          height={listInfo.containerheight}
          width={listInfo.containerWidth}
          itemSize={32}
          itemCount={listItemCount}
          onScroll={handleListScroll}
          itemData={{
            data: listData,
            listType,
            bucketInfo,
            columnCount: gridInfo.columnCount,
            isTopFolder,
            handleBackward,
            selectedFolders,
            handleViewFolder,
            handleRefreshDir,
            handleToggleSelectFolder,
            commonPrefixList,
            resourcePrefix,
            selectedKeys,
            handleToggleSelectKey,
            handleDeleteFiles,
            handleSelectAll,
            handlePreviewAsImg,
            handleOpenInBrowser,
            handleRenameResource,
            handleRefreshResource,
            handleDownloadFiles,
            handleUpdateStorageClass,
            handleGenTmpLink,
          }}
        >
          {GridCell}
        </List>
      )}
      {isToTopVisible && (
        <div
          className={styles.toTopWrapper}
          title="返回顶部"
          onClick={() => {
            if (listType === 'grid') {
              gridRef.current.scrollToItem({
                rowIndex: 0,
              })
            } else {
              listRef.current.scrollToItem(0)
            }
          }}
        >
          <VerticalAlignTopOutlined style={{ color: '#000', fontSize: '25px' }} />
        </div>
      )}
    </div>
  )
}

// 当个 item 的渲染组件
const GridCell = ({
  columnIndex,
  rowIndex,
  index,
  style,
  data: {
    data,
    listType,
    bucketInfo,
    columnCount,
    isTopFolder,
    handleBackward,
    selectedFolders,
    handleViewFolder,
    handleRefreshDir,
    handleToggleSelectFolder,
    commonPrefixList,
    resourcePrefix,
    selectedKeys,
    handleToggleSelectKey,
    handleDeleteFiles,
    handleSelectAll,
    handlePreviewAsImg,
    handleOpenInBrowser,
    handleRenameResource,
    handleRefreshResource,
    handleDownloadFiles,
    handleUpdateStorageClass,
    handleGenTmpLink,
  },
}) => {
  // 判断是网格布局还是普通列表
  const isGridCell = listType === 'grid'
  // 注意 ind 指的是第多少个格子，不是 listData 的第 ind 个
  let ind = 0
  if (isGridCell) {
    ind = columnCount * rowIndex + columnIndex
  } else {
    ind = index
  }
  if (!isTopFolder && ind === 0) {
    return (
      <div
        className={classnames(
          styles.cellWrapper,
          isGridCell ? styles.gridCellWrapper : styles.listCellWrapper
        )}
        style={style}
      >
        <FolderCard
          isGridCell={isGridCell}
          isBackward={true}
          folderName={''}
          handleClick={handleBackward}
        />
      </div>
    )
  }
  const resourceInfo = isTopFolder ? data[ind] : data[ind - 1]
  // 注意数组越界， gird 会把网格给布满，所以 ind 可能会超出，需要做判断，超出的不管就ok了
  if (typeof resourceInfo === 'undefined') {
    return <Fragment></Fragment>
  } else if (typeof resourceInfo === 'string') {
    // 是文件夹
    return (
      <div
        className={classnames(
          styles.cellWrapper,
          isGridCell ? styles.gridCellWrapper : styles.listCellWrapper
        )}
        style={style}
      >
        <FolderCard
          isGridCell={isGridCell}
          selected={selectedFolders.includes(resourceInfo)}
          isBackward={false}
          folderName={resourceInfo}
          handleClick={() => handleViewFolder(resourceInfo)}
          handleRefreshDir={() => handleRefreshDir(resourceInfo)}
          handleToggleSelectFolder={() => handleToggleSelectFolder(resourceInfo)}
        />
      </div>
    )
  } else {
    // 是资源
    // const ext = resourceInfo.mimeType.split('/')[1]
    // 在打开 image gallary 的时候， ind 在 resourceList 对应的资源可能存在偏移，这个时候需要把偏移摆正
    const previewInd = ind - ((isTopFolder ? 0 : 1) + commonPrefixList.length)
    const url = encodeURI(resourcePrefix + resourceInfo.key)
    const keyS = resourceInfo.key.split('/')
    const fileFullName = keyS[keyS.length - 1]
    const { ext, fname } = getResourceExtAndName(fileFullName)

    return (
      <div
        className={classnames(
          styles.cellWrapper,
          isGridCell ? styles.gridCellWrapper : styles.listCellWrapper
        )}
        style={style}
        key={resourceInfo.key}
      >
        <ResourceCard
          isGridCell={isGridCell}
          ext={ext}
          bucketInfo={bucketInfo}
          fileFullName={fileFullName}
          isAudio={isAudioFunc(ext)}
          isVideo={isVideoFunc(ext)}
          isImage={isImageFunc(ext)}
          isGif={isGifFunc(ext)}
          isSvg={isSvgFunc(ext)}
          // key={resourceInfo.key}
          fkey={resourceInfo.key}
          fsize={resourceInfo.fsize}
          hash={resourceInfo.hash}
          md5={resourceInfo.md5}
          mimeType={resourceInfo.mimeType}
          putTime={resourceInfo.putTime}
          storageClass={resourceInfo.storageClass}
          url={url}
          signatureUrl={resourceInfo.signatureUrl}
          selected={selectedKeys.includes(resourceInfo.key)}
          handleToggleSelectKey={handleToggleSelectKey}
          handleDeleteFile={handleDeleteFiles}
          handleSelectAll={handleSelectAll}
          handlePreviewAsImg={() => handlePreviewAsImg(previewInd)}
          handleOpenInBrowser={() => handleOpenInBrowser(url)}
          handleRenameResource={handleRenameResource}
          handleRefreshResource={() => handleRefreshResource(resourcePrefix + resourceInfo.key)}
          handleDownloadFile={() =>
            handleDownloadFiles([
              {
                signatureUrl: resourceInfo.signatureUrl, // 不 encode
                url: resourcePrefix + resourceInfo.key, // 不 encode
                fname,
                ext,
              },
            ])
          }
          handleUpdateStorageClass={handleUpdateStorageClass}
          handleGenTmpLink={handleGenTmpLink}
        />
      </div>
    )
  }
}
