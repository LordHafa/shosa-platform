import { defineStore } from 'pinia'
import api from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  getters: {
    isLoggedIn: (s) => Boolean(s.token),
    isAdmin: (s) => s.user?.type === 'admin',
    isAlumni: (s) => s.user?.type === 'alumni'
  },
  actions: {
    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password })
      this.token = data.token
      this.user = { type: data.type, role: data.role, campusScope: data.campusScope, name: data.name, redirect: data.redirect }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(this.user))
      return data
    },
    async register(payload) {
      const { data } = await api.post('/auth/register', payload)
      return data
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
