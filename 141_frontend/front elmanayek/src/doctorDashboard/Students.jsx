import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const Students = () => {
  return (
    <>
      <Title level={2}>Students Management</Title>
      <p>Manage your students here.</p>
    </>
  );
};

export default Students;