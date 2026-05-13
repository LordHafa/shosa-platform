<template>
  <section class="mx-auto max-w-6xl space-y-6">
    <div class="rounded-3xl bg-navy p-6 text-white shadow-xl md:p-8">
      <p class="font-bold text-gold">Alumni dashboard</p>
      <h1 class="mt-2 text-3xl font-black md:text-4xl">Welcome back, {{ profile?.displayName || 'Seeta Alumni' }}</h1>
      <p class="mt-3 max-w-3xl leading-7 text-slate-200">
        A quick command center for your alumni status, SACCO access, payments, events, and merchandise.
      </p>
    </div>

    <div v-if="loading" class="card">Loading dashboard...</div>

    <template v-else>
      <div class="grid gap-5 md:grid-cols-4">
        <div class="card">
          <p class="text-sm text-slate-500">Campus</p>
          <h3 class="text-xl font-black text-navy dark:text-gold">{{ profile?.campus || '-' }}</h3>
        </div>

        <div class="card">
          <p class="text-sm text-slate-500">Year Group</p>
          <h3 class="text-xl font-black text-navy dark:text-gold">{{ profile?.gradYear || '-' }}</h3>
        </div>

        <div class="card">
          <p class="text-sm text-slate-500">Alumni Status</p>
          <h3 class="text-xl font-black text-navy dark:text-gold">{{ profile?.verificationStatus || 'pending' }}</h3>
        </div>

        <div class="card">
          <p class="text-sm text-slate-500">SACCO Status</p>
          <h3 class="text-xl font-black text-navy dark:text-gold">{{ profile?.saccoMembership?.status || 'not joined' }}</h3>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <div class="card">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-bold text-gold">My Seeta record</p>
              <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">Profile stays separate and editable.</h2>
              <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                Keep this dashboard clean for quick decisions. Use the Profile page to update photo, phone, occupation, location, house, bio, and attendance details.
              </p>
            </div>

            <router-link to="/profile" class="btn-primary shrink-0">Open Profile</router-link>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Email</p>
              <p class="mt-1 break-all font-bold">{{ profile?.email || '-' }}</p>
            </div>

            <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Phone</p>
              <p class="mt-1 font-bold">{{ profile?.phone || '-' }}</p>
            </div>

            <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Level attended</p>
              <p class="mt-1 font-bold">{{ profile?.period || '-' }}</p>
            </div>

            <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Location</p>
              <p class="mt-1 font-bold">{{ [profile?.city, profile?.country].filter(Boolean).join(', ') || '-' }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="text-2xl font-black text-navy dark:text-gold">Quick actions</h2>
          <div class="mt-5 space-y-3">
            <router-link class="block min-h-12 rounded-2xl bg-cream p-4 font-bold text-navy transition hover:bg-gold dark:bg-slate-800 dark:text-gold" to="/sacco/register">
              Start / update SACCO registration ->
            </router-link>

            <router-link class="block min-h-12 rounded-2xl bg-cream p-4 font-bold text-navy transition hover:bg-gold dark:bg-slate-800 dark:text-gold" to="/sacco/payments">
              Submit SACCO payment ->
            </router-link>

            <router-link class="block min-h-12 rounded-2xl bg-cream p-4 font-bold text-navy transition hover:bg-gold dark:bg-slate-800 dark:text-gold" to="/events">
              View alumni events ->
            </router-link>

            <router-link class="block min-h-12 rounded-2xl bg-cream p-4 font-bold text-navy transition hover:bg-gold dark:bg-slate-800 dark:text-gold" to="/store">
              Open alumni store ->
            </router-link>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-black text-navy dark:text-gold">Recent payments</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest payment records only. Open payments for full history.</p>
          </div>
          <router-link to="/sacco/payments" class="btn-secondary">Open payments</router-link>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <article
            v-for="p in recentPayments"
            :key="p.id"
            class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-gold">{{ p.label || niceType(p.paymentType) }}</p>
                <h3 class="mt-1 text-xl font-black text-navy dark:text-white">{{ money(p.amount) }}</h3>
              </div>
              <span :class="statusBadge(p.status)">{{ niceStatus(p.status) }}</span>
            </div>

            <div class="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <p>{{ formatDate(p.createdAt) }}</p>
              <p class="truncate">Ref: {{ p.transactionRef || '-' }}</p>
            </div>
          </article>

          <div v-if="!recentPayments.length" class="rounded-2xl bg-cream p-6 text-center text-slate-500 dark:bg-slate-800 md:col-span-2">
            No payments yet.
          </div>
        </div>
      </div>
    </template>

    <p v-if="error" class="rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../api'

const profile = ref(null)
const payments = ref([])
const loading = ref(true)
const error = ref('')

const recentPayments = computed(() => payments.value.slice(0, 4))

function money(value) {
  return 'UGX ' + Number(value || 0).toLocaleString('en-UG')
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

function niceType(value) {
  return String(value || '-').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function niceStatus(value) {
  return niceType(value)
}

function statusBadge(status) {
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide'

  if (status === 'approved') return `${base} bg-green-100 text-green-700`
  if (status === 'rejected') return `${base} bg-red-100 text-red-700`
  if (status === 'pending_gateway_confirmation') return `${base} bg-blue-100 text-blue-700`

  return `${base} bg-gold/25 text-navy dark:text-gold`
}

async function load() {
  try {
    profile.value = (await api.get('/me')).data
    payments.value = (await api.get('/payments/my')).data
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
