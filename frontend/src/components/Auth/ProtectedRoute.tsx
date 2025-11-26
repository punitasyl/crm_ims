'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !token) {
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated && !token) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}

