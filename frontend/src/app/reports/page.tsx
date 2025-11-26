'use client';

import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Typography variant="h4" fontWeight="bold" mb={3}>Отчеты</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '200px' }}>
                <Typography variant="h6" gutterBottom>Отчет по продажам</Typography>
                <Typography variant="body2" color="text.secondary">
                  Скоро...
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '200px' }}>
                <Typography variant="h6" gutterBottom>Отчет по складу</Typography>
                <Typography variant="body2" color="text.secondary">
                  Скоро...
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

