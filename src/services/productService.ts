import { API_ENDPOINTS } from '../config/database';
import type { Product } from '../types/product-types';

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  const response = await fetch(API_ENDPOINTS.products.getAll);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

// Get single product
export const getProductById = async (id: string): Promise<Product> => {
  const response = await fetch(API_ENDPOINTS.products.getById(id));
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  return response.json();
};

// Create products (bulk)
export const createProducts = async (products: Product[]): Promise<Product[]> => {
  const response = await fetch(API_ENDPOINTS.products.create, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(products),
  });

  if (!response.ok) {
    throw new Error('Failed to create products');
  }

  return response.json();
};

// Update product
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  const response = await fetch(API_ENDPOINTS.products.update(id), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update product');
  }

  return response.json();
};

// Delete product
export const deleteProduct = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.products.delete(id), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
};

export const productService = {
  getAllProducts,
  getProductById,
  createProducts,
  updateProduct,
  deleteProduct,
};
