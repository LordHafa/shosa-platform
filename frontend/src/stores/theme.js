import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({ theme: localStorage.getItem('theme') || 'light' }),
  actions: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', this.theme)
      this.applyTheme()
    },
    applyTheme() {
      document.documentElement.classList.toggle('dark', this.theme === 'dark')
    }
  }
})
