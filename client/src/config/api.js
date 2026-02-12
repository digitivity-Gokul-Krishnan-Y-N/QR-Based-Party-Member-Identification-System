// API Configuration
// Update API_BASE_URL with your deployed backend URL from Render

// For development (using Vite proxy)
const DEV_API_URL = "/api";

// For production - UPDATE THIS with your Render backend URL
// Example: 'https://your-backend-name.onrender.com/api'
const PROD_API_URL = import.meta.env.VITE_API_URL || "/api";

// Automatically detect environment
const API_BASE_URL =
  import.meta.env.MODE === "production" ? PROD_API_URL : DEV_API_URL;

export default API_BASE_URL;
