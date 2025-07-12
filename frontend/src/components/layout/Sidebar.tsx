import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemText, Box, IconButton, Typography, ListItemIcon } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookIcon from '@mui/icons-material/Book';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 220;
const collapsedWidth = 64;

const menuItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Books', path: '/books', icon: <BookIcon /> },
  { text: 'Users', path: '/users', icon: <PeopleIcon /> },
  { text: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? collapsedWidth : drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#222e3c',
          color: '#fff',
          transition: 'width 0.2s',
        },
      }}
    >
      {/* Branding and collapse/expand button at the very top */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: 2,
          height: 64,
        }}
      >
        {!collapsed && (
          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
            SLibrarySoft
          </Typography>
        )}
        <IconButton
          color="inherit"
          onClick={() => setCollapsed((prev) => !prev)}
          sx={{ ml: collapsed ? 0 : 1 }}
        >
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <Box sx={{ overflow: 'auto', pt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                color: '#fff',
                bgcolor: location.pathname === item.path ? '#1a2232' : 'inherit',
                '&:hover': { bgcolor: '#1a2232' },
                borderLeft: location.pathname === item.path ? '4px solid #22c55e' : '4px solid transparent',
                transition: 'border-color 0.2s',
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 0 : 2,
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={collapsed ? '' : item.text}
                sx={{
                  textAlign: collapsed ? 'center' : 'left',
                  opacity: collapsed ? 0 : 1,
                  transition: 'opacity 0.2s',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;