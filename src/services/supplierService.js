import api from './api';
import {
  productListingSchema,
  updateProductStockSchema,
} from '../shared/schemas';

const firstIssueMessage = (error) => {
  const issueMessage = error?.issues?.[0]?.message;
  if (issueMessage) {
    return issueMessage;
  }

  return error?.message || 'Validation failed';
};

// Fetch all listings managed by the logged-in supplier
export const fetchSupplierListings = async () => {
  const response = await api.get('/api/v1/supplier/products');
  return response.data;
};

// Create a new chemical product listing
export const createProductListing = async (productData) => {
  const parsed = productListingSchema.safeParse(productData);
  if (!parsed.success) {
    throw new Error(firstIssueMessage(parsed.error));
  }

  const response = await api.post('/api/v1/supplier/products', parsed.data);
  return response.data;
};

// Update stock tonnage or pricing per ton
export const updateProductStock = async (productId, updateData) => {
  const parsed = updateProductStockSchema.safeParse(updateData);
  if (!parsed.success) {
    throw new Error(firstIssueMessage(parsed.error));
  }

  const response = await api.patch(`/api/v1/supplier/products/${productId}`, parsed.data);
  return response.data;
};