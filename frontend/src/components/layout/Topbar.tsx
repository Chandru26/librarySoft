import React from 'react';
import { AppBar, Toolbar, Box, IconButton, Avatar, Button } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 220; // Make sure this matches your Sidebar

const Topbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/'); // Redirect to login page
  };

  return (
    <AppBar
      position="static"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: '#e6e4e4ff', // light grey background
        color: '#222e3c',   // dark text/icons
        boxShadow: 'none',
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="inherit" sx={{ ml: 2 }}>
          <Avatar sx={{ bgcolor: '#e0e0e0', color: '#222e3c' }}>
            <AccountCircleIcon />
          </Avatar>
        </IconButton>
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;