import React, { Component } from 'react'
import { Navigate } from 'react-router-dom'
import { DatePicker } from 'antd'

export default class Home extends Component {
  render() {
    return (
      <div>
        Home <DatePicker />
      </div>
    )
  }
}
