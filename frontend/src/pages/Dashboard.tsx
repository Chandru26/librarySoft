import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, Box, Toolbar } from '@mui/material';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

const drawerWidth = 220; // Should match Sidebar
const topbarHeight = 64; // Default MUI AppBar height

interface ReportData {
  users?: { total: number; newLast30Days: number; activeLast30Days: number };
  books?: { total: number; addedLast30Days: number };
  organizationSubscriptions?: { freeTier: number; standardTier: number; premiumTier: number };
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios.get('/api/reports/summary')
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            mt: `${topbarHeight}px`,
            minHeight: `calc(100vh - ${topbarHeight}px)`,
            background: '#f5f6fa',
          }}
        >
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress />
            </Box>
          ) : !data || Object.keys(data).length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <Typography variant="h6" color="textSecondary">
                No data available
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Users</Typography>
                    <Typography>Total: {data.users?.total ?? 'N/A'}</Typography>
                    <Typography>New (30d): {data.users?.newLast30Days ?? 'N/A'}</Typography>
                    <Typography>Active (30d): {data.users?.activeLast30Days ?? 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Books</Typography>
                    <Typography>Total: {data.books?.total ?? 'N/A'}</Typography>
                    <Typography>Added (30d): {data.books?.addedLast30Days ?? 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Organization Subscriptions</Typography>
                    <Typography>Free Tier: {data.organizationSubscriptions?.freeTier ?? 'N/A'}</Typography>
                    <Typography>Standard Tier: {data.organizationSubscriptions?.standardTier ?? 'N/A'}</Typography>
                    <Typography>Premium Tier: {data.organizationSubscriptions?.premiumTier ?? 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
