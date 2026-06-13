import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import CustomerNavbar from '../components/customer/CustomerNavbar'

const CustomerLayout: React.FC = () => {
  const location = useLocation()
  const isChatPage = location.pathname.includes('/chat')

  return (
    <>
      <CustomerNavbar hideOnMobile={isChatPage} />
      <Outlet />
    </>
  )
}

export default CustomerLayout
