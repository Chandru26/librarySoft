import React, { useState } from 'react';
import { Typography, Box, List, ListItem, ListItemText, Paper } from '@mui/material';
import ProfilePage from './ProfilePage';
import SubscriptionInfo from './SubscriptionInfo';

const menuItems = [
  { text: 'Profile', key: 'profile' },
  { text: 'Subscription', key: 'subscription' },
];

const SettingsPage: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<'profile' | 'subscription'>('profile');

  return (
    <Box sx={{ display: 'flex', minHeight: '60vh' }}>
      {/* Left-side menu */}
      <Paper elevation={2} sx={{ minWidth: 180, mr: 4 }}>
        <List>
          {menuItems.map(item => (
            <ListItem
              button
              key={item.key}
              selected={selectedMenu === item.key}
              onClick={() => setSelectedMenu(item.key as 'profile' | 'subscription')}
            >
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Paper>
      {/* Right-side content */}
      <Box sx={{ flexGrow: 1 }}>
        {selectedMenu === 'profile' && (
          <>
            <Typography variant="h4" gutterBottom>
              Profile
            </Typography>
            <ProfilePage onClose={() => {}} />
          </>
        )}
        {selectedMenu === 'subscription' && (
          <>
            <Typography variant="h4" gutterBottom>
              Subscription
            </Typography>
            <SubscriptionInfo />
          </>
        )}
      </Box>
    </Box>
  );
};

export default SettingsPage;