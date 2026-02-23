// API Configuration
// Points to the separate backend server

// In development: http://localhost:3002/api
// In production: Set VITE_API_URL to your backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  markets: {
    getAll: `${API_BASE_URL}/markets`,
    getById: (id: string) => `${API_BASE_URL}/markets/${id}`,
    create: `${API_BASE_URL}/markets`,
    update: (id: string) => `${API_BASE_URL}/markets/${id}`,
    delete: (id: string) => `${API_BASE_URL}/markets/${id}`,
    import: `${API_BASE_URL}/markets/import`,
  },
  products: {
    getAll: `${API_BASE_URL}/products`,
    getById: (id: string) => `${API_BASE_URL}/products/${id}`,
    create: `${API_BASE_URL}/products`,
    update: (id: string) => `${API_BASE_URL}/products/${id}`,
    delete: (id: string) => `${API_BASE_URL}/products/${id}`,
  },
  maps: {
    drivingTimes: `${API_BASE_URL}/maps/driving-times`,
  },
};


