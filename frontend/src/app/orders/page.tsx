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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Select,
  FormControl,
  InputLabel,
  Divider,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import api from '@/lib/api';

interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer?: {
    company_name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  order_date: string;
  status: string;
  subtotal?: number | string;
  tax?: number | string;
  discount?: number | string;
  total: number | string;
  shipping_address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: Array<{
    product?: {
      name: string;
      sku?: string;
    };
    quantity: number;
    unit_price: number | string;
    discount: number | string;
    total: number | string;
  }>;
}

interface Customer {
  id: number;
  company_name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number | string;
  unit?: string;
  length_mm?: number;
  width_mm?: number;
}

interface OrderItem {
  product_id: number;
  quantity: number | string;  // Количество (в м² или шт в зависимости от quantity_unit)
  quantity_unit: 'sqm' | 'piece';  // Единица измерения: м² или шт
  unit_price: number;  // Цена за м²
  discount: number;
  warehouse_id?: number;
}

interface Warehouse {
  id: number;
  name: string;
  code: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    warehouse_id: '',
    shipping_address: '',
    notes: '',
    discount: '0',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses?limit=1000');
      setWarehouses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers?limit=100');
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
    setFormData({
      customer_id: '',
      warehouse_id: '',
      shipping_address: '',
      notes: '',
      discount: '0',
    });
    setOrderItems([]);
  };

  const handleViewOrder = async (order: Order) => {
    try {
      const response = await api.get(`/orders/${order.id}`);
      setSelectedOrder(response.data);
      setViewDialog(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string, warehouseId?: number) => {
    try {
      await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
        warehouse_id: warehouseId || undefined,
      });
      fetchOrders();
      if (viewDialog) {
        const response = await api.get(`/orders/${orderId}`);
        setSelectedOrder(response.data);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Не удалось обновить статус заказа';
      alert(errorMsg);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: 0, quantity: 1, quantity_unit: 'sqm', unit_price: 0, discount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Функция для расчета площади одной плитки в м²
  const calculateTileArea = (length_mm?: number, width_mm?: number): number => {
    if (!length_mm || !width_mm) return 0;
    return (length_mm * width_mm) / 1000000; // Переводим мм² в м²
  };

  // Функция для расчета количества плиток в 1 м²
  const calculateTilesPerSqm = (length_mm?: number, width_mm?: number): number => {
    const area = calculateTileArea(length_mm, width_mm);
    if (area === 0) return 0;
    return 1 / area;
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...orderItems];
    const item = updated[index];
    const product = products.find(p => p.id === item.product_id);
    
    // Обработка переключения единиц измерения с автоматическим пересчетом
    if (field === 'quantity_unit' && product && product.length_mm && product.width_mm) {
      const currentQuantity = parseFloat(String(item.quantity)) || 0;
      const tilesPerSqm = calculateTilesPerSqm(product.length_mm, product.width_mm);
      
      if (tilesPerSqm > 0) {
        if (value === 'sqm' && item.quantity_unit === 'piece') {
          // Переход с штук на м²: количество_м² = количество_шт / штук_в_1_м²
          const areaPerTile = calculateTileArea(product.length_mm, product.width_mm);
          updated[index].quantity = (currentQuantity * areaPerTile).toFixed(3);
        } else if (value === 'piece' && item.quantity_unit === 'sqm') {
          // Переход с м² на штуки: количество_шт = количество_м² × штук_в_1_м²
          updated[index].quantity = Math.round(currentQuantity * tilesPerSqm);
        }
      }
      updated[index][field] = value;
    } else if (field === 'quantity_unit') {
      // Если размеры не указаны, просто меняем единицу измерения
      updated[index][field] = value;
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    // Auto-fill unit_price when product is selected (цена всегда за м²)
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
        updated[index].unit_price = price; // Цена за м²
        // Устанавливаем единицу измерения по умолчанию
        if (!updated[index].quantity_unit) {
          updated[index].quantity_unit = 'sqm';
        }
      }
    }
    
    setOrderItems(updated);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.customer_id) {
        setError('Выберите клиента');
        return;
      }
      
      if (orderItems.length === 0) {
        setError('Добавьте хотя бы один товар');
        return;
      }
      
      if (!formData.warehouse_id) {
        setError('Выберите склад');
        return;
      }

      const submitData = {
        customer_id: parseInt(formData.customer_id),
        warehouse_id: parseInt(formData.warehouse_id),
        items: orderItems.map(item => {
          // Если единица измерения - штуки, переводим в м² для отправки на сервер
          let quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity)) || 0;
          if (item.quantity_unit === 'piece') {
            const product = products.find(p => p.id === item.product_id);
            if (product && product.length_mm && product.width_mm) {
              // Переводим штуки в м²: количество_м² = количество_шт × площадь_1_плитки
              const areaPerTile = calculateTileArea(product.length_mm, product.width_mm);
              quantity = quantity * areaPerTile;
            }
          }
          return {
            product_id: item.product_id,
            quantity: quantity, // Всегда в м² для сервера
            unit_price: typeof item.unit_price === 'number' ? item.unit_price : parseFloat(String(item.unit_price)) || 0, // Цена за м²
            discount: item.discount || 0,
            warehouse_id: item.warehouse_id || parseInt(formData.warehouse_id),
          };
        }),
        shipping_address: formData.shipping_address || undefined,
        notes: formData.notes || undefined,
        discount: parseFloat(formData.discount) || 0,
      };
      
      await api.post('/orders', submitData);
      handleCloseDialog();
      fetchOrders();
    } catch (err: any) {
      console.error('Error creating order:', err.response?.data);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Не удалось создать заказ';
      setError(Array.isArray(errorMsg) ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'confirmed': return 'Подтвержден';
      case 'processing': return 'В обработке';
      case 'shipped': return 'Отгружен';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold">Заказы</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Создать заказ
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Номер заказа</strong></TableCell>
                  <TableCell><strong>Дата</strong></TableCell>
                  <TableCell><strong>Статус</strong></TableCell>
                  <TableCell><strong>Итого</strong></TableCell>
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
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Заказы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const total = typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0;
                    return (
                      <TableRow key={order.id} hover>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{total.toFixed(2)} ТГ</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewOrder(order)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>Создать новый заказ</DialogTitle>
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Клиент</InputLabel>
                    <Select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      label="Клиент"
                    >
                      {customers.map((customer) => (
                        <MenuItem key={customer.id} value={customer.id.toString()}>
                          {customer.company_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Склад</InputLabel>
                    <Select
                      value={formData.warehouse_id}
                      onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                      label="Склад"
                    >
                      {warehouses.map((warehouse) => (
                        <MenuItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name} ({warehouse.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Товары</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                    >
                      Добавить товар
                    </Button>
                  </Box>
                  
                  {orderItems.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Нет товаров. Нажмите "Добавить товар" чтобы начать.
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {orderItems.map((item, index) => {
                        const product = products.find(p => p.id === item.product_id);
                        return (
                          <Paper key={index} sx={{ p: 2, mb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={5}>
                                <FormControl fullWidth required>
                                  <InputLabel>Товар</InputLabel>
                                  <Select
                                    value={item.product_id}
                                    onChange={(e) => handleItemChange(index, 'product_id', parseInt(String(e.target.value)))}
                                    label="Товар"
                                  >
                                    {products.map((prod) => (
                                      <MenuItem key={prod.id} value={prod.id}>
                                        {prod.name} ({prod.sku})
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <Box>
                                  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: 60 }}>Единица:</Typography>
                                    <ToggleButtonGroup
                                      value={item.quantity_unit || 'sqm'}
                                      exclusive
                                      onChange={(e, newValue) => {
                                        if (newValue !== null) {
                                          handleItemChange(index, 'quantity_unit', newValue);
                                        }
                                      }}
                                      size="small"
                                    >
                                      <ToggleButton value="sqm">м²</ToggleButton>
                                      <ToggleButton value="piece">шт</ToggleButton>
                                    </ToggleButtonGroup>
                                  </Box>
                                  <TextField
                                    fullWidth
                                    label="Количество"
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    required
                                    inputProps={{ 
                                      step: item.quantity_unit === 'sqm' ? '0.001' : '1', 
                                      min: '0' 
                                    }}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          {item.quantity_unit === 'sqm' ? 'м²' : 'шт'}
                                        </InputAdornment>
                                      )
                                    }}
                                  />
                                  {product && product.length_mm && product.width_mm && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                      Площадь 1 плитки: {calculateTileArea(product.length_mm, product.width_mm).toFixed(2)} м² | 
                                      Штук в 1 м²: {calculateTilesPerSqm(product.length_mm, product.width_mm).toFixed(2)}
                                    </Typography>
                                  )}
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <TextField
                                  fullWidth
                                  label="Цена"
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                  required
                                  inputProps={{ step: '0.01', min: '0' }}
                                  helperText="ТГ/м²"
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <TextField
                                  fullWidth
                                  label="Скидка"
                                  type="number"
                                  value={item.discount}
                                  onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                                  inputProps={{ step: '0.01', min: '0' }}
                                  helperText="ТГ"
                                />
                              </Grid>
                              <Grid item xs={12} sm={1}>
                                <IconButton
                                  color="error"
                                  onClick={() => handleRemoveItem(index)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                  {(() => {
                                    // Переводим количество в м² для расчета
                                    let quantityInSqm = parseFloat(String(item.quantity)) || 0;
                                    if (item.quantity_unit === 'piece' && product && product.length_mm && product.width_mm) {
                                      // Для штук: количество_м² = количество_шт × площадь_1_плитки
                                      const areaPerTile = calculateTileArea(product.length_mm, product.width_mm);
                                      quantityInSqm = quantityInSqm * areaPerTile;
                                    }
                                    const total = (item.unit_price * quantityInSqm) - (item.discount || 0);
                                    return `Итого: ${total.toFixed(2)} ТГ${item.quantity_unit === 'piece' ? ` (${quantityInSqm.toFixed(3)} м²)` : ''}`;
                                  })()}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Адрес доставки"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Скидка на заказ"
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    inputProps={{ step: '0.01', min: '0' }}
                    helperText="ТГ"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Примечания"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Отмена</Button>
              <Button onClick={handleSubmit} variant="contained">
                Создать заказ
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Order Dialog */}
          <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              Заказ {selectedOrder?.order_number}
            </DialogTitle>
            <DialogContent>
              {selectedOrder && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Основная информация</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Номер заказа</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedOrder.order_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Дата заказа</Typography>
                      <Typography variant="body1">
                        {new Date(selectedOrder.order_date).toLocaleDateString('ru-RU')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Статус</Typography>
                      <Chip
                        label={getStatusLabel(selectedOrder.status)}
                        color={getStatusColor(selectedOrder.status) as any}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    {selectedOrder.created_at && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Дата создания</Typography>
                        <Typography variant="body1">
                          {new Date(selectedOrder.created_at).toLocaleString('ru-RU')}
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" sx={{ mb: 2 }}>Информация о клиенте</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Название компании</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedOrder.customer?.company_name || 'Не указан'}
                      </Typography>
                    </Grid>
                    {selectedOrder.customer?.email && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">
                          {selectedOrder.customer.email}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrder.customer?.phone && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Телефон</Typography>
                        <Typography variant="body1">
                          {selectedOrder.customer.phone}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrder.customer?.address && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Адрес</Typography>
                        <Typography variant="body1">
                          {selectedOrder.customer.address}
                          {selectedOrder.customer.city && `, ${selectedOrder.customer.city}`}
                          {selectedOrder.customer.country && `, ${selectedOrder.customer.country}`}
                        </Typography>
                      </Grid>
                    )}
                    
                    {selectedOrder.shipping_address && (
                      <>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="h6" sx={{ mb: 2 }}>Адрес доставки</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body1">
                            {selectedOrder.shipping_address}
                          </Typography>
                        </Grid>
                      </>
                    )}
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="h6" sx={{ mb: 1 }}>Товары</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                  <TableCell><strong>Товар</strong></TableCell>
                                  <TableCell><strong>Артикул</strong></TableCell>
                                  <TableCell align="right"><strong>Количество</strong></TableCell>
                                  <TableCell align="right"><strong>Цена за ед.</strong></TableCell>
                                  <TableCell align="right"><strong>Скидка</strong></TableCell>
                                  <TableCell align="right"><strong>Итого</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {selectedOrder.items.map((item: any, index: number) => (
                                  <TableRow key={index} hover>
                                    <TableCell>{item.product?.name || '-'}</TableCell>
                                    <TableCell>{item.product?.sku || '-'}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">{parseFloat(item.unit_price || '0').toFixed(2)} ТГ</TableCell>
                                    <TableCell align="right">{parseFloat(item.discount || '0').toFixed(2)} ТГ</TableCell>
                                    <TableCell align="right"><strong>{parseFloat(item.total || '0').toFixed(2)} ТГ</strong></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </>
                    )}
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" sx={{ mb: 2 }}>Финансовая информация</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Подытог</Typography>
                      <Typography variant="body1">
                        {typeof selectedOrder.subtotal === 'number' 
                          ? selectedOrder.subtotal.toFixed(2) 
                          : parseFloat(selectedOrder.subtotal?.toString() || '0').toFixed(2)} ТГ
                      </Typography>
                    </Grid>
                    {selectedOrder.tax && parseFloat(selectedOrder.tax.toString()) > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Налог</Typography>
                        <Typography variant="body1">
                          {typeof selectedOrder.tax === 'number' 
                            ? selectedOrder.tax.toFixed(2) 
                            : parseFloat(selectedOrder.tax.toString() || '0').toFixed(2)} ТГ
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrder.discount && parseFloat(selectedOrder.discount.toString()) > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Скидка</Typography>
                        <Typography variant="body1" color="error">
                          - {typeof selectedOrder.discount === 'number' 
                            ? selectedOrder.discount.toFixed(2) 
                            : parseFloat(selectedOrder.discount.toString() || '0').toFixed(2)} ТГ
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" fontWeight="bold">Итого</Typography>
                      <Typography variant="h6" color="primary">
                        {typeof selectedOrder.total === 'number' 
                          ? selectedOrder.total.toFixed(2) 
                          : parseFloat(selectedOrder.total || '0').toFixed(2)} ТГ
                      </Typography>
                    </Grid>
                    
                    {selectedOrder.notes && (
                      <>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="h6" sx={{ mb: 1 }}>Примечания</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                              {selectedOrder.notes}
                            </Typography>
                          </Paper>
                        </Grid>
                      </>
                    )}
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" sx={{ mb: 1 }}>Управление статусом</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedOrder.status !== 'confirmed' && (
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                          >
                            Подтвердить
                          </Button>
                        )}
                        {selectedOrder.status !== 'processing' && selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && (
                          <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                          >
                            В обработке
                          </Button>
                        )}
                        {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => {
                              const warehouseId = warehouses.length > 0 ? warehouses[0].id : undefined;
                              handleUpdateStatus(selectedOrder.id, 'shipped', warehouseId);
                            }}
                          >
                            Отгружен
                          </Button>
                        )}
                        {selectedOrder.status !== 'delivered' && (
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            onClick={() => {
                              const warehouseId = warehouses.length > 0 ? warehouses[0].id : undefined;
                              handleUpdateStatus(selectedOrder.id, 'delivered', warehouseId);
                            }}
                          >
                            Доставлен
                          </Button>
                        )}
                        {selectedOrder.status !== 'cancelled' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => {
                              if (window.confirm('Вы уверены, что хотите отменить заказ?')) {
                                handleUpdateStatus(selectedOrder.id, 'cancelled');
                              }
                            }}
                          >
                            Отменить
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Закрыть</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

