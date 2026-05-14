<template>
  <header class="sticky top-0 z-50 border-b border-white/10 bg-navy/98 text-white shadow-xl backdrop-blur">
    <nav class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-5">
      <router-link to="/" class="flex min-w-0 items-center gap-3" @click="closeMenu">
        <img
          :src="BRAND_ASSETS.mainLogo"
          alt="SHOSA logo"
          class="h-11 w-11 shrink-0 rounded-full border-2 border-gold bg-white object-cover"
        />

        <span class="min-w-0">
          <span class="block truncate text-lg font-black leading-tight">{{ BRAND_NAME }}</span>
          <span class="block truncate text-[11px] font-bold leading-tight text-gold">{{ BRAND_SUBTITLE }}</span>
        </span>
      </router-link>

      <div class="hidden items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-sm font-bold lg:flex">
        <router-link
          v-for="item in navLinks"
          :key="item.to + item.label"
          :to="item.to"
          class="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-gold"
          active-class="bg-white/10 text-gold"
        >
          {{ item.label }}
        </router-link>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          class="rounded-xl border border-white/25 px-3 py-2 text-sm font-black transition hover:bg-white/10"
          type="button"
          @click="theme.toggleTheme()"
        >
          {{ theme.theme === 'light' ? 'Dark' : 'Light' }}
        </button>

        <router-link
          v-if="!auth.isLoggedIn"
          class="hidden rounded-xl bg-gold px-4 py-2 text-sm font-black text-navy shadow transition hover:scale-[1.02] md:inline-flex"
          to="/login"
          @click="closeMenu"
        >
          Login
        </router-link>

        <button
          v-else
          class="hidden rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-red-700 md:inline-flex"
          type="button"
          @click="logout"
        >
          Logout
        </button>

        <button
          class="inline-flex items-center gap-2 rounded-xl border border-white/25 px-3 py-2 text-sm font-black text-white lg:hidden"
          type="button"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          Menu
          <span class="text-gold">{{ mobileMenuOpen ? '×' : '☰' }}</span>
        </button>
      </div>
    </nav>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div v-if="mobileMenuOpen" class="border-t border-white/10 bg-navy px-4 pb-4 pt-3 shadow-xl lg:hidden">
        <div class="grid gap-2">
          <router-link
            v-for="item in navLinks"
            :key="'mobile-' + item.to + item.label"
            :to="item.to"
            :class="mobileLinkClass"
            active-class="bg-white/10 text-gold"
            @click="closeMenu"
          >
            {{ item.label }}
          </router-link>

          <router-link
            v-if="!auth.isLoggedIn"
            to="/login"
            class="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-gold px-4 py-3 text-base font-black text-navy"
            @click="closeMenu"
          >
            Login
          </router-link>

          <button
            v-else
            class="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-base font-black text-white"
            type="button"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { BRAND_NAME, BRAND_SUBTITLE, LEAGUE_LINK, BRAND_ASSETS } from '../data/brand'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()
const mobileMenuOpen = ref(false)

const mobileLinkClass =
  'flex min-h-12 items-center rounded-xl px-4 py-3 text-base font-bold transition hover:bg-white/10 hover:text-gold'

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Events', to: '/events' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Store', to: '/store' },
  { label: 'SACCO', to: '/sacco/register' },
  { label: 'League', to: LEAGUE_LINK },
  { label: 'Contact', to: '/contact' }
]

const alumniLinks = [
  { label: 'Dashboard', to: '/alumni/dashboard' },
  { label: 'Profile', to: '/profile' },
  { label: 'SACCO', to: '/sacco/dashboard' },
  { label: 'Payments', to: '/sacco/payments' },
  { label: 'Events', to: '/events' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Store', to: '/store' }
]

const adminLinks = [
  { label: 'Admin Dashboard', to: '/admin' },
  { label: 'Alumni', to: '/admin/alumni' },
  { label: 'Payments/SACCO', to: '/admin/payments' },
  { label: 'Gallery', to: '/admin/gallery' },
  { label: 'Documents', to: '/admin/files' },
  { label: 'Contacts', to: '/admin/contacts' },
  { label: 'Audit Logs', to: '/admin/audit-logs' }
]

const navLinks = computed(() => {
  if (auth.isAdmin) return adminLinks
  if (auth.isAlumni) return alumniLinks
  return publicLinks
})

function closeMenu() {
  mobileMenuOpen.value = false
}

function logout() {
  closeMenu()
  auth.logout()
  router.push('/')
}

watch(
  () => route.fullPath,
  () => closeMenu()
)
</script>