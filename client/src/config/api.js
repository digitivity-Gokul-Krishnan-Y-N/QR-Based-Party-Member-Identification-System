// API Configuration
// Update API_BASE_URL with your deployed backend URL from Render

// For development (using Vite proxy)
const DEV_API_URL = "/api";

// For production - Set via VITE_API_URL environment variable
// Must include /api at the end: https://your-backend-name.onrender.com/api
let PROD_API_URL = import.meta.env.VITE_API_URL;

// Ensure /api suffix is present in production URL
if (PROD_API_URL && !PROD_API_URL.endsWith('/api')) {
  PROD_API_URL = PROD_API_URL.replace(/\/$/, '') + '/api';
}

// Fallback to /api if not set
PROD_API_URL = PROD_API_URL || "/api";

// Automatically detect environment
const API_BASE_URL =
  import.meta.env.MODE === "production" ? PROD_API_URL : DEV_API_URL;

console.log('API Configuration:', {
  mode: import.meta.env.MODE,
  API_BASE_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL
});

export default API_BASE_URL;
