'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Chip, Alert, CircularProgress, Grid,
  Select, MenuItem, FormControl, InputLabel, InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { 
  Add as AddIcon, Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon, Delete as DeleteIcon, Remove as RemoveIcon
} from '@mui/icons-material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import api from '@/lib/api';

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: { name: string; code: string; };
  order_date: string;
  expected_date?: string;
  status: string;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  notes?: string;
  items?: Array<{
    product?: { name: string; sku: string; };
    quantity: number | string;
    unit_price: number | string;
    total: number | string;
    received_quantity: number | string;
  }>;
}

interface Supplier {
  id: number;
  name: string;
  code: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number | string;
  cost?: number | string;
  unit?: string;
  length_mm?: number;
  width_mm?: number;
}

interface Warehouse {
  id: number;
  name: string;
  code: string;
}

interface PurchaseOrderItem {
  product_id: number;
  quantity: number | string;
  quantity_unit: 'sqm' | 'piece';  // Единица измерения: м² или шт
  unit_price: number | string;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_date: '',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [receiveWarehouseId, setReceiveWarehouseId] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/purchase-orders', {
        params: {
          limit: 1000
        }
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers', {
        params: {
          limit: 1000,
          is_active: true
        }
      });
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', {
        params: {
          limit: 100,
          is_active: true
        }
      });
      const productsData = Array.isArray(response.data) ? response.data : [];
      console.log('Loaded products:', productsData.length);
      setProducts(productsData);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      console.error('Error details:', error.response?.data);
      setProducts([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses', {
        params: {
          limit: 1000
        }
      });
      setWarehouses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'ordered': return 'Заказано';
      case 'received': return 'Получено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'ordered': return 'info';
      case 'received': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
    setFormData({ supplier_id: '', expected_date: '', notes: '' });
    setOrderItems([]);
    // Убедимся, что товары загружены
    if (products.length === 0) {
      fetchProducts();
    }
  };

  const handleViewOrder = async (order: PurchaseOrder) => {
    try {
      const response = await api.get(`/purchase-orders/${order.id}`);
      setSelectedOrder(response.data);
      setViewDialog(true);
    } catch (error) {
      console.error('Error fetching purchase order:', error);
    }
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: 0, quantity: '', quantity_unit: 'sqm', unit_price: '' }]);
    // Убедимся, что товары загружены
    if (products.length === 0) {
      fetchProducts();
    }
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

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...orderItems];
    const item = updated[index];
    const product = products.find(p => p.id === item.product_id);
    
    // Обработка переключения единиц измерения с автоматическим пересчетом
    if (field === 'quantity_unit' && product && product.length_mm && product.width_mm) {
      const currentQuantity = parseFloat(String(item.quantity)) || 0;
      const tilesPerSqm = calculateTilesPerSqm(product.length_mm, product.width_mm);
      
      if (tilesPerSqm > 0) {
        if (value === 'sqm' && item.quantity_unit === 'piece') {
          // Переход с штук на м²: количество_м² = количество_шт × площадь_1_плитки
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
    
    // Auto-fill unit_price when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        const cost = typeof product.cost === 'number' ? product.cost : parseFloat(product.cost?.toString() || '0');
        updated[index].unit_price = cost;
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
      if (!formData.supplier_id) {
        setError('Выберите поставщика');
        return;
      }
      if (orderItems.length === 0) {
        setError('Добавьте хотя бы один товар');
        return;
      }
      const validItems = orderItems.filter(item => 
        item.product_id > 0 && 
        item.quantity && 
        parseFloat(item.quantity.toString()) > 0 &&
        item.unit_price && 
        parseFloat(item.unit_price.toString()) > 0
      );
      if (validItems.length === 0) {
        setError('Заполните все поля товаров');
        return;
      }
      const submitData = {
        supplier_id: parseInt(formData.supplier_id),
        expected_date: formData.expected_date || undefined,
        notes: formData.notes || undefined,
        items: validItems.map(item => {
          // Если единица измерения - штуки, переводим в м² для отправки на сервер
          let quantity = parseFloat(item.quantity.toString());
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
            unit_price: parseFloat(item.unit_price.toString()),
          };
        }),
      };
      await api.post('/purchase-orders', submitData);
      handleCloseDialog();
      fetchOrders();
    } catch (err: any) {
      console.error('Error creating purchase order:', err.response?.data);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Не удалось создать заявку';
      setError(Array.isArray(errorMsg) ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const handleReceive = async (orderId: number) => {
    if (!receiveWarehouseId) {
      alert('Выберите склад для поступления товара');
      return;
    }
    if (!confirm('Подтвердите получение товара. Товар будет добавлен на склад.')) return;
    try {
      await api.post(`/purchase-orders/${orderId}/receive?warehouse_id=${receiveWarehouseId}`);
      setViewDialog(false);
      fetchOrders();
      alert('Товар успешно получен и добавлен на склад');
    } catch (err: any) {
      console.error('Error receiving order:', err.response?.data);
      alert(err.response?.data?.detail || 'Не удалось получить товар');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setFormData({ supplier_id: '', expected_date: '', notes: '' });
    setOrderItems([]);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity.toString()) || 0;
      const price = parseFloat(item.unit_price.toString()) || 0;
      return sum + (qty * price);
    }, 0);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3, gap: 2 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Заявки на закупку</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleOpenDialog} 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Создать заявку
            </Button>
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
                    <TableCell><strong>Номер</strong></TableCell>
                    <TableCell><strong>Поставщик</strong></TableCell>
                    <TableCell><strong>Дата</strong></TableCell>
                    <TableCell><strong>Ожидаемая дата</strong></TableCell>
                    <TableCell><strong>Статус</strong></TableCell>
                    <TableCell><strong>Итого</strong></TableCell>
                    <TableCell><strong>Действия</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Заявки на закупку не найдены
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>{order.po_number}</TableCell>
                        <TableCell>{order.supplier?.name || '-'}</TableCell>
                        <TableCell>{new Date(order.order_date).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell>{order.expected_date ? new Date(order.expected_date).toLocaleDateString('ru-RU') : '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {typeof order.total === 'number' 
                            ? order.total.toFixed(2) 
                            : parseFloat(order.total || '0').toFixed(2)} ТГ
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleViewOrder(order)} color="primary">
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Dialog 
            open={openDialog} 
            onClose={handleCloseDialog} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: {
                m: { xs: 1, sm: 2 },
                maxHeight: { xs: '95vh', sm: '90vh' }
              }
            }}
          >
            <DialogTitle>Создать заявку на закупку</DialogTitle>
            <DialogContent>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Поставщик</InputLabel>
                    <Select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                      label="Поставщик"
                    >
                      {suppliers.map((supplier) => (
                        <MenuItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name} ({supplier.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ожидаемая дата"
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Примечания"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">Товары</Typography>
                    <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddItem}>
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
                                    value={item.product_id ? item.product_id.toString() : ''}
                                    onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value as string))}
                                    label="Товар"
                                  >
                                    <MenuItem value="">
                                      <em>Выберите товар</em>
                                    </MenuItem>
                                    {products.length === 0 ? (
                                      <MenuItem disabled>Нет доступных товаров</MenuItem>
                                    ) : (
                                      products.map((p) => {
                                        const costValue = typeof p.cost === 'number' ? p.cost : parseFloat(p.cost?.toString() || '0');
                                        return (
                                          <MenuItem key={p.id} value={p.id}>
                                            {p.name} ({p.sku || 'N/A'}) - {costValue.toFixed(2)} ТГ/м²
                                          </MenuItem>
                                        );
                                      })
                                    )}
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
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                    {(() => {
                                      if (item.quantity_unit === 'sqm') {
                                        const areaPerTile = product && product.length_mm && product.width_mm 
                                          ? calculateTileArea(product.length_mm, product.width_mm) 
                                          : 0;
                                        return (
                                          <IconButton
                                            onClick={() => {
                                              const currentValue = parseFloat(String(item.quantity)) || 0;
                                              const newValue = currentValue - areaPerTile;
                                              const roundedValue = newValue >= 0 
                                                ? (Math.round(newValue / areaPerTile) * areaPerTile).toFixed(3)
                                                : '0';
                                              handleItemChange(index, 'quantity', roundedValue);
                                            }}
                                            disabled={areaPerTile === 0}
                                            sx={{ mt: 1 }}
                                            title="Уменьшить на площадь одной плитки"
                                            color="error"
                                            size="small"
                                          >
                                            <RemoveIcon />
                                          </IconButton>
                                        );
                                      } else {
                                        return (
                                          <IconButton
                                            onClick={() => {
                                              const currentValue = parseFloat(String(item.quantity)) || 0;
                                              const newValue = Math.max(0, Math.round(currentValue) - 1);
                                              handleItemChange(index, 'quantity', newValue.toString());
                                            }}
                                            sx={{ mt: 1 }}
                                            title="Уменьшить на 1 штуку"
                                            color="error"
                                            size="small"
                                          >
                                            <RemoveIcon />
                                          </IconButton>
                                        );
                                      }
                                    })()}
                                    <TextField
                                      fullWidth
                                      label="Количество"
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                      onBlur={(e) => {
                                        // Автоматическое округление до кратного площади одной плитки при потере фокуса
                                        if (item.quantity_unit === 'sqm' && product && product.length_mm && product.width_mm) {
                                          const areaPerTile = calculateTileArea(product.length_mm, product.width_mm);
                                          const inputValue = parseFloat(e.target.value) || 0;
                                          if (areaPerTile > 0 && inputValue > 0) {
                                            const tiles = Math.round(inputValue / areaPerTile);
                                            const roundedValue = (tiles * areaPerTile).toFixed(3);
                                            handleItemChange(index, 'quantity', roundedValue);
                                          }
                                        }
                                      }}
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
                                    {(() => {
                                      if (item.quantity_unit === 'sqm') {
                                        const areaPerTile = product && product.length_mm && product.width_mm 
                                          ? calculateTileArea(product.length_mm, product.width_mm) 
                                          : 0;
                                        return (
                                          <IconButton
                                            onClick={() => {
                                              const currentValue = parseFloat(String(item.quantity)) || 0;
                                              const newValue = currentValue + areaPerTile;
                                              const roundedValue = (Math.round(newValue / areaPerTile) * areaPerTile).toFixed(3);
                                              handleItemChange(index, 'quantity', roundedValue);
                                            }}
                                            disabled={areaPerTile === 0}
                                            sx={{ mt: 1 }}
                                            title="Увеличить на площадь одной плитки"
                                            color="primary"
                                            size="small"
                                          >
                                            <AddIcon />
                                          </IconButton>
                                        );
                                      } else {
                                        return (
                                          <IconButton
                                            onClick={() => {
                                              const currentValue = parseFloat(String(item.quantity)) || 0;
                                              const newValue = Math.round(currentValue) + 1;
                                              handleItemChange(index, 'quantity', newValue.toString());
                                            }}
                                            sx={{ mt: 1 }}
                                            title="Увеличить на 1 штуку"
                                            color="primary"
                                            size="small"
                                          >
                                            <AddIcon />
                                          </IconButton>
                                        );
                                      }
                                    })()}
                                  </Box>
                                  {product && product.length_mm && product.width_mm && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                      Площадь 1 плитки: {calculateTileArea(product.length_mm, product.width_mm).toFixed(2)} м² | 
                                      Штук в 1 м²: {calculateTilesPerSqm(product.length_mm, product.width_mm).toFixed(2)}
                                    </Typography>
                                  )}
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  fullWidth
                                  label="Цена за м²"
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                  required
                                  inputProps={{ step: '0.01', min: '0' }}
                                  helperText="ТГ/м²"
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">ТГ</InputAdornment>
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={1}>
                                <IconButton onClick={() => handleRemoveItem(index)} color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </Grid>
                              {item.quantity && item.unit_price && (
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
                                      const total = (parseFloat(item.unit_price.toString()) * quantityInSqm);
                                      return `Итого: ${total.toFixed(2)} ТГ${item.quantity_unit === 'piece' ? ` (${quantityInSqm.toFixed(3)} м²)` : ''}`;
                                    })()}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                  {orderItems.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h6">
                        Подытог: {calculateTotal().toFixed(2)} ТГ
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        НДС (12%): {(calculateTotal() * 0.12).toFixed(2)} ТГ
                      </Typography>
                      <Typography variant="h6" color="primary">
                        Итого: {(calculateTotal() * 1.12).toFixed(2)} ТГ
                      </Typography>
                    </Box>
                  )}
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
                Создать заявку
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog 
            open={viewDialog} 
            onClose={() => setViewDialog(false)} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: {
                m: { xs: 1, sm: 2 },
                maxHeight: { xs: '95vh', sm: '90vh' }
              }
            }}
          >
            <DialogTitle>Заявка {selectedOrder?.po_number}</DialogTitle>
            <DialogContent>
              {selectedOrder && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Поставщик</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedOrder.supplier?.name || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Дата</Typography>
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
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Товары</Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Товар</strong></TableCell>
                              <TableCell align="right"><strong>Количество</strong></TableCell>
                              <TableCell align="right"><strong>Цена</strong></TableCell>
                              <TableCell align="right"><strong>Итого</strong></TableCell>
                              <TableCell align="right"><strong>Получено</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedOrder.items.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.product?.name || '-'}</TableCell>
                                <TableCell align="right">{parseFloat(item.quantity || '0').toFixed(3)}</TableCell>
                                <TableCell align="right">{parseFloat(item.unit_price || '0').toFixed(2)} ТГ</TableCell>
                                <TableCell align="right">{parseFloat(item.total || '0').toFixed(2)} ТГ</TableCell>
                                <TableCell align="right">{parseFloat(item.received_quantity || '0').toFixed(3)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mt: 2 }}>Итого: {typeof selectedOrder.total === 'number' ? selectedOrder.total.toFixed(2) : parseFloat(selectedOrder.total || '0').toFixed(2)} ТГ</Typography>
                    </Grid>
                    {selectedOrder.status !== 'received' && (
                      <Grid item xs={12}>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel>Склад для поступления</InputLabel>
                          <Select
                            value={receiveWarehouseId}
                            onChange={(e) => setReceiveWarehouseId(e.target.value)}
                            label="Склад для поступления"
                          >
                            {warehouses.map((w) => (
                              <MenuItem key={w.id} value={w.id.toString()}>
                                {w.name} ({w.code})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleReceive(selectedOrder.id)}
                          sx={{ mt: 2 }}
                          fullWidth
                        >
                          Получить товар на склад
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
              <Button 
                onClick={() => setViewDialog(false)}
                variant="contained"
                fullWidth={false}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Закрыть
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

