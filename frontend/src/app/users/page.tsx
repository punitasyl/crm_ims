'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

const roleLabels: { [key: string]: string } = {
  admin: 'Администратор',
  manager: 'Менеджер',
  sales: 'Продавец',
  warehouse: 'Склад',
  viewer: 'Просмотр',
};

const roleColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
  admin: 'error',
  manager: 'primary',
  sales: 'info',
  warehouse: 'warning',
  viewer: 'default',
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'viewer',
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      const response = await api.get(`/users?${params.toString()}`);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '', // Не показываем пароль при редактировании
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'viewer',
        is_active: true,
      });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'viewer',
      is_active: true,
    });
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setError('');

      // Validation
      if (!formData.username.trim()) {
        setError('Имя пользователя обязательно');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email обязателен');
        return;
      }
      if (!editingUser && !formData.password) {
        setError('Пароль обязателен при создании пользователя');
        return;
      }
      if (formData.password && formData.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов');
        return;
      }
      if (formData.password && formData.password.length > 72) {
        setError('Пароль не должен превышать 72 символа');
        return;
      }
      if (!formData.first_name.trim()) {
        setError('Имя обязательно');
        return;
      }
      if (!formData.last_name.trim()) {
        setError('Фамилия обязательна');
        return;
      }

      const submitData: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role,
        is_active: formData.is_active,
      };

      // Пароль добавляем только если он указан (при редактировании можно не менять)
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, submitData);
      } else {
        await api.post('/users', submitData);
      }

      handleCloseDialog();
      fetchUsers();
    } catch (err: any) {
      console.error('Error saving user:', err.response?.data);
      const errorMsg = err.response?.data?.detail || 'Не удалось сохранить пользователя';
      setError(Array.isArray(errorMsg) ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err.response?.data);
      const errorMsg = err.response?.data?.detail || 'Не удалось удалить пользователя';
      alert(Array.isArray(errorMsg) ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold">
              Управление пользователями
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Добавить пользователя
            </Button>
          </Box>

          {currentUser?.role !== 'admin' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              У вас нет доступа к этой странице. Только администраторы могут управлять пользователями.
            </Alert>
          )}

          {currentUser?.role === 'admin' && (
            <>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Поиск по имени, email, имени пользователя..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell><strong>Имя пользователя</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Имя</strong></TableCell>
                        <TableCell><strong>Фамилия</strong></TableCell>
                        <TableCell><strong>Роль</strong></TableCell>
                        <TableCell><strong>Статус</strong></TableCell>
                        <TableCell><strong>Последний вход</strong></TableCell>
                        <TableCell><strong>Действия</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Пользователи не найдены
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id} hover>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.first_name}</TableCell>
                            <TableCell>{user.last_name}</TableCell>
                            <TableCell>
                              <Chip
                                label={roleLabels[user.role] || user.role}
                                color={roleColors[user.role] || 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.is_active ? 'Активен' : 'Неактивен'}
                                color={user.is_active ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {user.last_login
                                ? new Date(user.last_login).toLocaleString('ru-RU')
                                : 'Никогда'}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(user)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              {user.id !== currentUser?.id && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(user.id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Create/Edit Dialog */}
              <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                  {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
                </DialogTitle>
                <DialogContent>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Имя пользователя"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        disabled={!!editingUser} // Нельзя менять username при редактировании
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={editingUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                        helperText={editingUser ? 'Оставьте пустым, чтобы не менять пароль' : 'Минимум 6 символов, максимум 72'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Роль</InputLabel>
                        <Select
                          value={formData.role}
                          label="Роль"
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <MenuItem value="admin">Администратор</MenuItem>
                          <MenuItem value="manager">Менеджер</MenuItem>
                          <MenuItem value="sales">Продавец</MenuItem>
                          <MenuItem value="warehouse">Склад</MenuItem>
                          <MenuItem value="viewer">Просмотр</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Имя"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Фамилия"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          />
                        }
                        label="Активен"
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 0 }, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
                  <Button 
                    onClick={handleCloseDialog}
                    fullWidth={false}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    variant="contained"
                    fullWidth={false}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    {editingUser ? 'Сохранить' : 'Создать'}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

