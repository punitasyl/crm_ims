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
  Link,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { LockReset as LockResetIcon } from '@mui/icons-material';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [userInfo, setUserInfo] = useState<{ username?: string; email?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!usernameOrEmail.trim()) {
      setError('Введите email или имя пользователя');
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('username_or_email', usernameOrEmail.trim());

      const response = await api.post('/auth/forgot-password', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.data.temp_password) {
        setTempPassword(response.data.temp_password);
        setUserInfo({
          username: response.data.username,
          email: response.data.email,
        });
        setSuccessDialog(true);
      } else {
        // User not found, but we show success message for security
        setSuccessDialog(true);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      
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
          setError('Ошибка при запросе сброса пароля');
        }
      } else {
        setError('Ошибка при запросе сброса пароля. Проверьте подключение к серверу.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSuccessDialog(false);
    if (tempPassword) {
      router.push('/login');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <LockResetIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold">
              Восстановление пароля
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Введите ваш email или имя пользователя. Мы создадим временный пароль для входа в систему.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email или Имя пользователя"
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Обработка...' : 'Создать временный пароль'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Вспомнили пароль?{' '}
              <Link href="/login" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Войти
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Временный пароль создан</DialogTitle>
        <DialogContent>
          {tempPassword ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Временный пароль успешно создан!
              </Alert>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Важно:</strong> Сохраните этот временный пароль. После входа в систему рекомендуется сразу изменить пароль.
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Имя пользователя: <strong>{userInfo.username}</strong>
                </Typography>
                {userInfo.email && (
                  <Typography variant="body2" color="text.secondary">
                    Email: <strong>{userInfo.email}</strong>
                  </Typography>
                )}
                <Typography variant="body1" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '1.2rem' }}>
                  Временный пароль: <strong>{tempPassword}</strong>
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Скопируйте пароль и используйте его для входа в систему.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Если пользователь с указанным email или именем существует, временный пароль будет создан.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                В целях безопасности мы не сообщаем, существует ли такой пользователь в системе.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="contained"
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {tempPassword ? 'Перейти к входу' : 'Закрыть'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

