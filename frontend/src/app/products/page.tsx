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
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import api from '@/lib/api';

interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number | string;
  cost?: number | string;
  unit?: string;
  length_mm?: number;
  width_mm?: number;
  is_active: boolean;
  category_id?: number;
  image_url?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    cost: '',
    unit: 'sqm',
    length_mm: '',
    width_mm: '',
    category_id: '',
    is_active: true,
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '0',
        cost: product.cost?.toString() || '0',
        unit: product.unit || 'sqm',
        length_mm: product.length_mm?.toString() || '',
        width_mm: product.width_mm?.toString() || '',
        category_id: product.category_id?.toString() || '',
        is_active: product.is_active ?? true,
        image_url: product.image_url || '',
      });
      // Set image preview if image_url exists
      if (product.image_url) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
        setImagePreview(`${baseUrl}${product.image_url}`);
      } else {
        setImagePreview('');
      }
    } else {
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        description: '',
        price: '0',
        cost: '0',
        unit: 'sqm',
        length_mm: '',
        width_mm: '',
        category_id: '',
        is_active: true,
        image_url: '',
      });
      setImagePreview('');
    }
    setImageFile(null);
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setError('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      setUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);
      
      const response = await api.post('/upload/product-image', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Ошибка загрузки изображения');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setUploadingImage(true);
      
      // Upload image if new file selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await handleUploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        unit: 'sqm', // Всегда м² по умолчанию
        length_mm: formData.length_mm ? parseInt(formData.length_mm) : null,
        width_mm: formData.width_mm ? parseInt(formData.width_mm) : null,
        // Convert empty string or '0' to null for category_id
        category_id: formData.category_id && formData.category_id !== '' && formData.category_id !== '0' 
          ? parseInt(formData.category_id) 
          : null,
        image_url: imageUrl || null,
      };
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, submitData);
      } else {
        await api.post('/products', submitData);
      }
      handleCloseDialog();
      fetchProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Не удалось сохранить товар';
      setError(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold">Товары</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Добавить товар
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Фото</strong></TableCell>
                  <TableCell><strong>Артикул</strong></TableCell>
                  <TableCell><strong>Название</strong></TableCell>
                  <TableCell><strong>Размер</strong></TableCell>
                  <TableCell><strong>Цена</strong></TableCell>
                  <TableCell><strong>Себестоимость</strong></TableCell>
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
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Товары не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0;
                    const cost = typeof product.cost === 'number' ? product.cost : parseFloat(String(product.cost || '0')) || 0;
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
                    const imageUrl = product.image_url ? `${baseUrl}${product.image_url}` : null;
                    const sizeDisplay = product.length_mm && product.width_mm 
                      ? `${product.length_mm}×${product.width_mm} мм`
                      : '-';
                    return (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          {imageUrl ? (
                            <Avatar
                              src={imageUrl}
                              alt={product.name}
                              sx={{ width: 56, height: 56 }}
                              variant="rounded"
                            />
                          ) : (
                            <Avatar sx={{ width: 56, height: 56, bgcolor: 'grey.300' }} variant="rounded">
                              <ImageIcon />
                            </Avatar>
                          )}
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{sizeDisplay}</TableCell>
                        <TableCell>{price.toFixed(2)} ТГ</TableCell>
                        <TableCell>{cost.toFixed(2)} ТГ</TableCell>
                        <TableCell>
                          <Chip
                            label={product.is_active ? 'Активный' : 'Неактивный'}
                            color={product.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(product)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(product.id)}
                            color="error"
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

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>
              {editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
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
                    label="Артикул"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Название"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Описание"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Цена"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    inputProps={{ step: '0.01', min: '0' }}
                    helperText="в тенге (ТГ)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Себестоимость"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    inputProps={{ step: '0.01', min: '0' }}
                    helperText="в тенге (ТГ)"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Длина (мм)"
                    type="number"
                    value={formData.length_mm}
                    onChange={(e) => setFormData({ ...formData, length_mm: e.target.value })}
                    inputProps={{ min: '0' }}
                    helperText="Размер плитки"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Ширина (мм)"
                    type="number"
                    value={formData.width_mm}
                    onChange={(e) => setFormData({ ...formData, width_mm: e.target.value })}
                    inputProps={{ min: '0' }}
                    helperText="Размер плитки"
                  />
                </Grid>
                {formData.length_mm && formData.width_mm && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Расчет:</strong> Площадь 1 плитки: {((parseFloat(formData.length_mm) || 0) * (parseFloat(formData.width_mm) || 0) / 1000000).toFixed(2)} м² | 
                        Штук в 1 м²: {formData.length_mm && formData.width_mm ? (1000000 / ((parseFloat(formData.length_mm) || 1) * (parseFloat(formData.width_mm) || 1))).toFixed(2) : '0'}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Статус"
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  >
                    <MenuItem value="true">Активный</MenuItem>
                    <MenuItem value="false">Неактивный</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Фото товара
                    </Typography>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<ImageIcon />}
                        sx={{ mr: 2 }}
                      >
                        {imageFile ? 'Изменить фото' : 'Загрузить фото'}
                      </Button>
                    </label>
                    {imagePreview && (
                      <Box sx={{ mt: 2 }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Отмена</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained"
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Загрузка...' : editingProduct ? 'Обновить' : 'Создать'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

