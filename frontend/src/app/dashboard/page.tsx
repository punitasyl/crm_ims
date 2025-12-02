'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import api from '@/lib/api';

interface DashboardStats {
  customers: number;
  products: number;
  orders: number;
  leads: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    products: 0,
    orders: 0,
    leads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customersRes, productsRes, ordersRes, leadsRes] = await Promise.all([
        api.get('/customers?limit=1'),
        api.get('/products?limit=1'),
        api.get('/orders?limit=1'),
        api.get('/leads?limit=1'),
      ]);

      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const leads = Array.isArray(leadsRes.data) ? leadsRes.data : [];

      setStats({
        customers: customers.length,
        products: products.length,
        orders: orders.length,
        leads: leads.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: 'white',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
              {value}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ fontSize: { xs: 32, sm: 40, md: 48 }, opacity: 0.3 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Панель управления
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Добро пожаловать! Вот обзор вашего бизнеса.
          </Typography>

          {loading ? (
            <LinearProgress />
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Всего клиентов"
                  value={stats.customers}
                  icon={<PeopleIcon sx={{ fontSize: 48 }} />}
                  color="#667eea"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Товары"
                  value={stats.products}
                  icon={<InventoryIcon sx={{ fontSize: 48 }} />}
                  color="#f093fb"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Заказы"
                  value={stats.orders}
                  icon={<ShoppingCartIcon sx={{ fontSize: 48 }} />}
                  color="#4facfe"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Активные лиды"
                  value={stats.leads}
                  icon={<TrendingUpIcon sx={{ fontSize: 48 }} />}
                  color="#43e97b"
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

