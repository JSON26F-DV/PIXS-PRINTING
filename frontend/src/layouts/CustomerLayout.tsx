import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerNavbar from '../components/customer/CustomerNavbar';

const CustomerLayout: React.FC = () => {
  return (
    <>
      <CustomerNavbar />
      <Outlet />
    </>
  );
};

export default CustomerLayout;
