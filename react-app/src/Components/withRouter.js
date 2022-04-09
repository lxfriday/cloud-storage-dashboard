import { useLocation, useNavigate } from 'react-router-dom'
import React from 'react'
export default function withRouter(child) {
  return props => {
    const location = useLocation()
    const navigate = useNavigate()

    return React.createElement(child, {
      ...props,
      navigate,
      location,
    })

    // return <child {...props} navigate={navigate} location={location} />
  }
}
