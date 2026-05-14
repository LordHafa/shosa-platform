import axios from 'axios'

const DEV_API_URL = 'http://localhost:5000/api'
const DEV_UPLOADS_URL = 'http://localhost:5000'

const apiFallback = import.meta.env.DEV ? DEV_API_URL : '/api'
const uploadsFallback = import.meta.env.DEV ? DEV_UPLOADS_URL : ''

export const API_URL = import.meta.env.VITE_API_URL || apiFallback
export const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || uploadsFallback

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
