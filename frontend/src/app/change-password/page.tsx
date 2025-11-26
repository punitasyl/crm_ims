'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import api from '@/lib/api';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      setError('Все поля обязательны для заполнения');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (formData.new_password.length > 72) {
      setError('Пароль не должен превышать 72 символа');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (formData.old_password === formData.new_password) {
      setError('Новый пароль должен отличаться от старого');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('old_password', formData.old_password);
      params.append('new_password', formData.new_password);

      await api.post('/auth/change-password', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setSuccess('Пароль успешно изменен');
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Change password error:', err);
      
      // Handle validation errors
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors
          const errorMessages = err.response.data.detail.map((e: any) => {
            if (typeof e === 'object' && e.msg) {
              return e.msg;
            }
            return String(e);
          }).join(', ');
          setError(errorMessages);
        } else if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } else {
          setError('Ошибка изменения пароля');
        }
      } else {
        setError('Ошибка изменения пароля. Проверьте подключение к серверу.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LockIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h4" fontWeight="bold">
                Изменение пароля
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Текущий пароль"
                type={showPassword.old ? 'text' : 'password'}
                value={formData.old_password}
                onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
                        edge="end"
                      >
                        {showPassword.old ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Новый пароль"
                type={showPassword.new ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                margin="normal"
                required
                helperText="Минимум 6 символов, максимум 72 символа"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                        edge="end"
                      >
                        {showPassword.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Подтвердите новый пароль"
                type={showPassword.confirm ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                        edge="end"
                      >
                        {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #653a8f 100%)',
                  },
                }}
              >
                {loading ? 'Изменение...' : 'Изменить пароль'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push('/dashboard')}
                sx={{ mt: 1 }}
              >
                Отмена
              </Button>
            </form>
          </Paper>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

