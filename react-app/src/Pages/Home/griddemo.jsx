import React, { useEffect, useState, useRef, Fragment } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import classnames from 'classnames'
import styles from './griddemo.module.less'

export default function Home() {
  const [resourceList, setResourceList] = useState([])
  const resourceWidth = 130
  const resourceHeight = 130
  const [gridInfo, setGridInfo] = useState({
    containerWidth: 0,
    containerheight: 0,
    columnCount: 1,
    cellWrapperWidth: 0,
    cellWrapperheight: 0,
  })
  const gridEle = useRef(null)
  const gridInnerEle = useRef(null)

  const rowCount = Math.ceil(resourceList.length / gridInfo.columnCount)
  console.log('Home rowCount', rowCount)

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const ind = gridInfo.columnCount * rowIndex + columnIndex
    // 注意数组越界， gird 会把网格给布满，所以 ind 可能会超出，需要做判断，超出的不管就ok了
    if (ind >= resourceList.length) {
      return <Fragment></Fragment>
    } else {
      return (
        <div className={styles.cellWrapper} style={style}>
          <div className={styles.cell}>
            r{rowIndex}, c{columnIndex}, ind{ind}
            <div>{resourceList[ind].id}</div>
          </div>
        </div>
      )
    }
  }

  function loadData() {
    const nResourceList = new Array(100).fill(1).map((_, ind) => ({
      id: `${ind + resourceList.length}__${Math.floor(Math.random() * 40)}`,
    }))
    setResourceList([...resourceList, ...nResourceList])
  }

  function handleScroll({ scrollTop }) {
    console.log('Home scrollTop', {
      scrollTop,
      containerHeight: gridInfo.containerheight,
      clientHeight: gridInnerEle.current.clientHeight,
      chazhi: scrollTop + gridInfo.containerheight - gridInnerEle.current.clientHeight,
    })
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
      const scrollBarWidth = gridEle.current.offsetWidth - gridEle.current.clientWidth
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
    <div className={styles.wrapper}>
      <div className={styles.nav}></div>
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
    </div>
  )
}
