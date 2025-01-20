import axios from 'axios';
const BASE_URL = import.meta.env.VITE_BASE_URL;


// Create axios instance with default config
const apiClient = axios.create({
  baseURL:  BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors here
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export default apiClient; 