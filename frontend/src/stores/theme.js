import { defineStore } from 'pinia'

const DEFAULT_THEME = 'light'

function safeTheme(value) {
  return value === 'dark' ? 'dark' : DEFAULT_THEME
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: safeTheme(localStorage.getItem('theme'))
  }),

  actions: {
    setTheme(value) {
      this.theme = safeTheme(value)
      localStorage.setItem('theme', this.theme)
      this.applyTheme()
    },

    toggleTheme() {
      this.setTheme(this.theme === 'light' ? 'dark' : 'light')
    },

    applyTheme() {
      document.documentElement.classList.toggle('dark', this.theme === 'dark')
    }
  }
})