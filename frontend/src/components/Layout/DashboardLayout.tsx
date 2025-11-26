'use client';

import React from 'react';
import { Box, Drawer, AppBar, Toolbar, List, Typography, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import LeadIcon from '@mui/icons-material/Leaderboard';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BusinessIcon from '@mui/icons-material/Business';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuthStore } from '@/store/authStore';

const drawerWidth = 240;

const menuItems = [
  { text: 'Панель управления', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Клиенты', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Товары', icon: <InventoryIcon />, path: '/products' },
  { text: 'Склады', icon: <WarehouseIcon />, path: '/warehouses' },
  { text: 'Инвентарь', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Поставщики', icon: <BusinessIcon />, path: '/suppliers' },
  { text: 'Заявки на закупку', icon: <ShoppingBagIcon />, path: '/purchase-orders' },
  { text: 'Заказы', icon: <ShoppingCartIcon />, path: '/orders' },
  { text: 'Лиды', icon: <LeadIcon />, path: '/leads' },
  { text: 'Отчеты', icon: <AssessmentIcon />, path: '/reports' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div" fontWeight="bold">
            CRM IMS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {user?.first_name} {user?.last_name}
            </Typography>
            <IconButton onClick={handleMenu} size="small">
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { handleClose(); router.push('/change-password'); }}>
                <LockIcon sx={{ mr: 1 }} />
                Изменить пароль
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Выйти
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => router.push(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
            {user?.role === 'admin' && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => router.push('/users')}>
                  <ListItemIcon><PersonAddIcon /></ListItemIcon>
                  <ListItemText primary="Пользователи" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

