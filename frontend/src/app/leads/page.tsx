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
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import api from '@/lib/api';

interface Lead {
  id: number;
  customer_id?: number;
  source?: string;
  status: string;
  priority: string;
  estimated_value?: number | string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      setLeads(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'info';
      case 'contacted': return 'warning';
      case 'qualified': return 'primary';
      case 'converted': return 'success';
      case 'lost': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold">Лиды</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Добавить лид
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Источник</strong></TableCell>
                  <TableCell><strong>Статус</strong></TableCell>
                  <TableCell><strong>Приоритет</strong></TableCell>
                  <TableCell><strong>Оценочная стоимость</strong></TableCell>
                  <TableCell><strong>Действия</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Лиды не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>{lead.source || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={lead.status}
                          color={getStatusColor(lead.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.priority}
                          color={getPriorityColor(lead.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {lead.estimated_value 
                          ? `${(typeof lead.estimated_value === 'number' 
                            ? lead.estimated_value 
                            : parseFloat(lead.estimated_value) || 0).toFixed(2)} ТГ` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <TrendingUpIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

