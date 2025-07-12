import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

const drawerWidth = 220;
const topbarHeight = 64;

const MainLayout: React.FC = () => (
  <Box sx={{ display: 'flex', height: '100vh' }}>
    <Sidebar />
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          background: '#f5f6fa',
          minHeight: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  </Box>
);

export default MainLayout;