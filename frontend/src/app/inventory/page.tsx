'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import api from '@/lib/api';

interface InventoryItem {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  reserved_quantity: number;
  product?: {
    name: string;
    sku: string;
  };
  warehouse?: {
    name: string;
  };
}

interface Product {
  id: number;
  name: string;
  sku: string;
  length_mm?: number;
  width_mm?: number;
}

interface Warehouse {
  id: number;
  name: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '0',
    reserved_quantity: '0',
    adjustment_type: 'set',
    adjustment_quantity: '0',
    quantity_unit: 'sqm' as 'sqm' | 'piece',  // Единица измерения для adjustment_quantity
  });

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setInventory(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=1000');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      // Try new warehouses endpoint first
      const response = await api.get('/warehouses?limit=1000');
      setWarehouses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      // Fallback: try old endpoint
      try {
        const response = await api.get('/inventory/warehouses');
        setWarehouses(Array.isArray(response.data) ? response.data : []);
      } catch (fallbackError) {
        console.error('Error fetching warehouses from inventory:', fallbackError);
        // Last fallback: get warehouses from inventory items
        try {
          const response = await api.get('/inventory');
          const inventoryData = Array.isArray(response.data) ? response.data : [];
          const uniqueWarehouses = Array.from(
            new Map(
              inventoryData
                .filter((item: any) => item.warehouse)
                .map((item: any) => [item.warehouse.id, item.warehouse])
            ).values()
          ) as Warehouse[];
          setWarehouses(uniqueWarehouses);
        } catch (lastError) {
          console.error('Error fetching warehouses from inventory items:', lastError);
        }
      }
    }
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

  const handleOpenDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id.toString(),
      warehouse_id: item.warehouse_id.toString(),
      quantity: item.quantity.toString(),
      reserved_quantity: item.reserved_quantity.toString(),
      adjustment_type: 'set',
      adjustment_quantity: item.quantity.toString(),
      quantity_unit: 'sqm', // По умолчанию м²
    });
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!editingItem) {
        setError('Не выбрана запись для редактирования');
        return;
      }

      // Update existing inventory using PUT endpoint
      // Переводим adjustment_quantity в м² если выбраны штуки
      let adjustmentQuantity = parseFloat(formData.adjustment_quantity) || 0;
      if (formData.quantity_unit === 'piece') {
        const product = products.find(p => p.id === parseInt(formData.product_id));
        if (product && product.length_mm && product.width_mm) {
          // Переводим штуки в м²: количество_м² = количество_шт × площадь_1_плитки
          const areaPerTile = calculateTileArea(product.length_mm, product.width_mm);
          adjustmentQuantity = adjustmentQuantity * areaPerTile;
        }
      }

      const updateData: any = {
        product_id: parseInt(formData.product_id),
        warehouse_id: parseInt(formData.warehouse_id),
        reserved_quantity: parseFloat(formData.reserved_quantity) || 0,
        adjustment_type: formData.adjustment_type,
        adjustment_quantity: adjustmentQuantity, // Всегда в м² для сервера
      };
      await api.put(`/inventory/${editingItem.id}`, updateData);
      
      handleCloseDialog();
      fetchInventory();
    } catch (err: any) {
      console.error('Error saving inventory:', err.response?.data);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Не удалось сохранить запись';
      setError(Array.isArray(errorMsg) ? JSON.stringify(errorMsg) : errorMsg);
    }
  };

  const handleView = (item: InventoryItem) => {
    setViewingItem(item);
    setViewDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        // Note: There's no delete endpoint, so we'll set quantity to 0
        const item = inventory.find(i => i.id === id);
        if (item) {
          await api.post('/inventory/adjust', {
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            quantity: 0,
            type: 'set',
          });
          fetchInventory();
        }
      } catch (error) {
        console.error('Error deleting inventory:', error);
      }
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Нет в наличии', color: 'error' as const };
    if (quantity < 10) return { label: 'Мало товара', color: 'warning' as const };
    return { label: 'В наличии', color: 'success' as const };
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold">Инвентарь</Typography>
            <Typography variant="body2" color="text.secondary">
              Товары автоматически поступают на склад при получении заявок на закупку
            </Typography>
          </Box>

          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Товар</strong></TableCell>
                  <TableCell><strong>Артикул</strong></TableCell>
                  <TableCell><strong>Склад</strong></TableCell>
                  <TableCell><strong>Количество</strong></TableCell>
                  <TableCell><strong>Зарезервировано</strong></TableCell>
                  <TableCell><strong>Доступно</strong></TableCell>
                  <TableCell><strong>Статус</strong></TableCell>
                  <TableCell><strong>Действия</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Товары на складе не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => {
                    const available = item.quantity - item.reserved_quantity;
                    const status = getStockStatus(item.quantity);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.product?.name || '-'}</TableCell>
                        <TableCell>{item.product?.sku || '-'}</TableCell>
                        <TableCell>{item.warehouse?.name || '-'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.reserved_quantity}</TableCell>
                        <TableCell>{available}</TableCell>
                        <TableCell>
                          <Chip label={status.label} color={status.color} size="small" />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleView(item)}
                            color="info"
                            title="Просмотр"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(item)}
                            color="primary"
                            title="Редактировать"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            color="error"
                            title="Удалить"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

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
            <DialogTitle>
              Корректировка остатков на складе
            </DialogTitle>
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Товар</InputLabel>
                    <Select
                      value={formData.product_id}
                      label="Товар"
                      disabled
                    >
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id.toString()}>
                          {product.name} ({product.sku})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Склад</InputLabel>
                    <Select
                      value={formData.warehouse_id}
                      label="Склад"
                      disabled
                    >
                      {warehouses.map((warehouse) => (
                        <MenuItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Текущее количество: {formData.quantity}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Тип корректировки</InputLabel>
                    <Select
                      value={formData.adjustment_type}
                      onChange={(e) => setFormData({ ...formData, adjustment_type: e.target.value })}
                      label="Тип корректировки"
                    >
                      <MenuItem value="add">Добавить</MenuItem>
                      <MenuItem value="subtract">Вычесть</MenuItem>
                      <MenuItem value="set">Установить</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 60 }}>Единица:</Typography>
                      <ToggleButtonGroup
                        value={formData.quantity_unit || 'sqm'}
                        exclusive
                        onChange={(e, newValue) => {
                          if (newValue !== null) {
                            const product = products.find(p => p.id === parseInt(formData.product_id));
                            const currentQuantity = parseFloat(formData.adjustment_quantity) || 0;
                            let newQuantity = currentQuantity;
                            
                            // Автоматический пересчет при переключении единиц измерения
                            if (product && product.length_mm && product.width_mm) {
                              const tilesPerSqm = calculateTilesPerSqm(product.length_mm, product.width_mm);
                              const areaPerTile = calculateTileArea(product.length_mm, product.width_mm);
                              
                              if (tilesPerSqm > 0) {
                                if (newValue === 'sqm' && formData.quantity_unit === 'piece') {
                                  // Переход с штук на м²: количество_м² = количество_шт × площадь_1_плитки
                                  newQuantity = currentQuantity * areaPerTile;
                                } else if (newValue === 'piece' && formData.quantity_unit === 'sqm') {
                                  // Переход с м² на штуки: количество_шт = количество_м² × штук_в_1_м²
                                  newQuantity = Math.round(currentQuantity * tilesPerSqm);
                                }
                              }
                            }
                            
                            setFormData({ 
                              ...formData, 
                              quantity_unit: newValue,
                              adjustment_quantity: newQuantity.toFixed(3)
                            });
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
                      value={formData.adjustment_quantity}
                      onChange={(e) => setFormData({ ...formData, adjustment_quantity: e.target.value })}
                      required
                      inputProps={{ 
                        min: 0, 
                        step: formData.quantity_unit === 'sqm' ? 0.001 : 1 
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {formData.quantity_unit === 'sqm' ? 'м²' : 'шт'}
                          </InputAdornment>
                        )
                      }}
                    />
                    {(() => {
                      const product = products.find(p => p.id === parseInt(formData.product_id));
                      if (product && product.length_mm && product.width_mm) {
                        return (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Площадь 1 плитки: {calculateTileArea(product.length_mm, product.width_mm).toFixed(2)} м² | 
                            Штук в 1 м²: {calculateTilesPerSqm(product.length_mm, product.width_mm).toFixed(2)}
                          </Typography>
                        );
                      }
                      return null;
                    })()}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Зарезервировано"
                    type="number"
                    value={formData.reserved_quantity}
                    onChange={(e) => setFormData({ ...formData, reserved_quantity: e.target.value })}
                    inputProps={{ min: 0, step: 0.001 }}
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
                Обновить
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Inventory Dialog */}
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
            <DialogTitle>
              Информация об остатке на складе
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Товар</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {viewingItem?.product?.name || '-'} ({viewingItem?.product?.sku || '-'})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Склад</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{viewingItem?.warehouse?.name || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Количество (м²)</Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {viewingItem?.quantity?.toFixed(2) || '0.00'} м²
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Зарезервировано (м²)</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {viewingItem?.reserved_quantity?.toFixed(2) || '0.00'} м²
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Доступно (м²)</Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
                    {((viewingItem?.quantity || 0) - (viewingItem?.reserved_quantity || 0)).toFixed(2)} м²
                  </Typography>
                </Grid>
                {(() => {
                  const product = products.find(p => p.id === viewingItem?.product_id);
                  if (product && product.length_mm && product.width_mm) {
                    const areaPerTile = (product.length_mm * product.width_mm) / 1000000; // м²
                    const tilesPerSqm = 1 / areaPerTile;
                    const quantityInPieces = (viewingItem?.quantity || 0) * tilesPerSqm;
                    const reservedInPieces = (viewingItem?.reserved_quantity || 0) * tilesPerSqm;
                    const availableInPieces = quantityInPieces - reservedInPieces;
                    return (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                            Размеры товара: {product.length_mm} × {product.width_mm} мм
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle2" color="text.secondary">Количество (шт)</Typography>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            {quantityInPieces.toFixed(0)} шт
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle2" color="text.secondary">Зарезервировано (шт)</Typography>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            {reservedInPieces.toFixed(0)} шт
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle2" color="text.secondary">Доступно (шт)</Typography>
                          <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
                            {availableInPieces.toFixed(0)} шт
                          </Typography>
                        </Grid>
                      </>
                    );
                  }
                  return null;
                })()}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Статус</Typography>
                  {(() => {
                    const available = (viewingItem?.quantity || 0) - (viewingItem?.reserved_quantity || 0);
                    const status = available > 0 ? 'В наличии' : available === 0 ? 'Нет в наличии' : 'Недостаточно';
                    const color = available > 0 ? 'success' : 'default';
                    return (
                      <Chip
                        label={status}
                        color={color}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    );
                  })()}
                </Grid>
              </Grid>
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

