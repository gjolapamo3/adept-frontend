import api from './api';

// Fetch all listings managed by the logged-in supplier
export const fetchSupplierListings = async () => {
  const response = await api.get('/api/v1/supplier/products');
  return response.data;
};

// Create a new chemical product listing
export const createProductListing = async (productData) => {
  const response = await api.post('/api/v1/supplier/products', productData);
  return response.data;
};

// Update stock tonnage or pricing per ton
export const updateProductStock = async (productId, updateData) => {
  const response = await api.patch(`/api/v1/supplier/products/${productId}`, updateData);
  return response.data;
};