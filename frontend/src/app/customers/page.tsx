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
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import api from '@/lib/api';

interface Customer {
  id: number;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status: string;
  customer_type: string;
  city?: string;
  country?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    status: 'prospect',
    customer_type: 'business',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get(`/customers?search=${searchTerm || ''}`);
      setCustomers(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        company_name: customer.company_name || '',
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: '',
        city: customer.city || '',
        state: '',
        zip_code: '',
        country: customer.country || '',
        status: customer.status || 'prospect',
        customer_type: customer.customer_type || 'business',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        status: 'prospect',
        customer_type: 'business',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setError('');
      // Clean up form data: only include non-empty optional fields
      const submitData: any = {
        company_name: formData.company_name.trim(),
        status: formData.status,
        customer_type: formData.customer_type,
      };
      
      // Add optional fields only if they have values
      if (formData.contact_person?.trim()) submitData.contact_person = formData.contact_person.trim();
      if (formData.email?.trim()) submitData.email = formData.email.trim();
      if (formData.phone?.trim()) submitData.phone = formData.phone.trim();
      if (formData.address?.trim()) submitData.address = formData.address.trim();
      if (formData.city?.trim()) submitData.city = formData.city.trim();
      if (formData.state?.trim()) submitData.state = formData.state.trim();
      if (formData.zip_code?.trim()) submitData.zip_code = formData.zip_code.trim();
      if (formData.country?.trim()) submitData.country = formData.country.trim();
      
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, submitData);
      } else {
        await api.post('/customers', submitData);
      }
      handleCloseDialog();
      fetchCustomers();
    } catch (err: any) {
      console.error('Error saving customer:', err.response?.data);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Не удалось сохранить клиента';
      setError(Array.isArray(errorMsg) ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'prospect': return 'warning';
      default: return 'default';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold">Клиенты</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Добавить клиента
            </Button>
          </Box>

          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Поиск клиентов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchCustomers();
              }}
            />
            <Button
              variant="outlined"
              onClick={fetchCustomers}
              sx={{ minWidth: 100 }}
            >
              Поиск
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Название компании</strong></TableCell>
                  <TableCell><strong>Контактное лицо</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Телефон</strong></TableCell>
                  <TableCell><strong>Статус</strong></TableCell>
                  <TableCell><strong>Действия</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Клиенты не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>{customer.company_name}</TableCell>
                      <TableCell>{customer.contact_person || '-'}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={customer.status}
                          color={getStatusColor(customer.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(customer)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(customer.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>
              {editingCustomer ? 'Редактировать клиента' : 'Добавить нового клиента'}
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
                    label="Название компании"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Контактное лицо"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Телефон"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Адрес"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Город"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Область"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Почтовый индекс"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Страна"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Статус"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="active">Активный</MenuItem>
                    <MenuItem value="inactive">Неактивный</MenuItem>
                    <MenuItem value="prospect">Потенциальный</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Отмена</Button>
              <Button onClick={handleSubmit} variant="contained">
                {editingCustomer ? 'Обновить' : 'Создать'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

