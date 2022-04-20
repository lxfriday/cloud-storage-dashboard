// import React, { useEffect } from 'react'
// import { Button } from 'antd'
// import { useSelector, useDispatch } from 'react-redux'

// import { incremented, decremented } from '../../store/count'
// import styles from './index.module.less'

// export default function index(...args) {
//   const counter = useSelector(state => state.counter.value)
//   const displatch = useDispatch()

//   console.log('args', args)

//   useEffect(() => {
//     return () => {
//       console.log('unmount')
//     }
//   }, [])
//   return (
//     <div className={styles.wrapper}>
//       <div>{counter}</div>
//       <div>
//         <Button onClick={() => displatch(incremented())}>increment</Button>
//         <Button onClick={() => displatch(decremented())}>decrement</Button>
//       </div>
//     </div>
//   )
// }
import React from 'react'
import styles from './index.module.less'

export default function index() {
  return <div>index</div>
}
