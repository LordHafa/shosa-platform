<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-3xl bg-navy text-white shadow-xl">
      <div class="relative p-6 md:p-8">
        <div class="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-slate-950/50"></div>
        <div class="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="font-bold text-gold">Admin alumni management</p>
            <h1 class="mt-2 text-3xl font-black md:text-5xl">Alumni Records</h1>
            <p class="mt-3 max-w-3xl leading-7 text-slate-200">
              Search, filter, verify and govern alumni records without exposing private credentials.
            </p>
          </div>
          <router-link class="btn-secondary" to="/admin">Back to dashboard</router-link>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-4">
      <div class="card">
        <p class="text-sm text-slate-500">Visible records</p>
        <p class="mt-1 text-3xl font-black text-navy dark:text-gold">{{ alumni.length }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-slate-500">Verified</p>
        <p class="mt-1 text-3xl font-black text-green-600">{{ countByStatus('verified') }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-slate-500">Pending</p>
        <p class="mt-1 text-3xl font-black text-gold">{{ countByStatus('pending') }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-slate-500">SACCO active</p>
        <p class="mt-1 text-3xl font-black text-navy dark:text-gold">{{ activeSaccoCount }}</p>
      </div>
    </section>

    <form class="card grid gap-3 lg:grid-cols-[1.5fr_1fr_.8fr_1fr_auto_auto]" @submit.prevent="load">
      <input v-model="filters.search" class="input" placeholder="Search name, email, phone, campus" />

      <select v-model="filters.campus" class="input">
        <option value="">All campuses</option>
        <option v-for="option in campusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>

      <input v-model="filters.year" class="input" inputmode="numeric" placeholder="Year e.g. 2014" />

      <select v-model="filters.status" class="input">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="rejected">Rejected</option>
        <option value="suspended">Suspended</option>
      </select>

      <button class="btn-primary">Apply</button>
      <button type="button" class="btn-secondary" @click="resetFilters">Reset</button>
    </form>

    <section class="card">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-black text-navy dark:text-gold">Records</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Campus filter now uses real campus names and backend normalization.
          </p>
        </div>
        <button class="btn-secondary" @click="load">Refresh</button>
      </div>

      <div class="space-y-3 lg:hidden">
        <article
          v-for="a in alumni"
          :key="a.id"
          class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-lg font-black text-navy dark:text-white">{{ a.displayName }}</h3>
              <p class="mt-1 break-all text-sm text-slate-500">{{ a.email }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ a.phone || '-' }}</p>
            </div>
            <span :class="statusBadge(a.verificationStatus)">{{ niceStatus(a.verificationStatus) }}</span>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div class="rounded-xl bg-cream p-3 dark:bg-slate-900">
              <p class="text-xs text-slate-400">Campus</p>
              <p class="font-bold">{{ niceCampus(a.campus) }}</p>
            </div>
            <div class="rounded-xl bg-cream p-3 dark:bg-slate-900">
              <p class="text-xs text-slate-400">Year</p>
              <p class="font-bold">{{ a.gradYear || '-' }}</p>
            </div>
            <div class="rounded-xl bg-cream p-3 dark:bg-slate-900">
              <p class="text-xs text-slate-400">SACCO</p>
              <p class="font-bold">{{ a.saccoMembership?.status || '-' }}</p>
            </div>
            <div class="rounded-xl bg-cream p-3 dark:bg-slate-900">
              <p class="text-xs text-slate-400">Country</p>
              <p class="font-bold">{{ a.country || '-' }}</p>
            </div>
          </div>

          <div class="mt-4">
            <label class="label">Verification status</label>
            <select class="input" :value="a.verificationStatus" :disabled="updatingId === a.id" @change="updateStatus(a, $event.target.value)">
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </article>

        <div v-if="!alumni.length" class="rounded-2xl bg-cream p-6 text-center text-slate-500 dark:bg-slate-800">
          No alumni records found.
        </div>
      </div>

      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full min-w-[1100px] text-sm">
          <thead>
            <tr class="text-left">
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Campus</th>
              <th>Year</th>
              <th>SACCO</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="a in alumni" :key="a.id" class="border-t border-slate-100 dark:border-slate-800">
              <td class="py-3 font-bold">{{ a.displayName }}</td>
              <td class="max-w-[220px] truncate">{{ a.email }}</td>
              <td>{{ a.phone || '-' }}</td>
              <td>{{ niceCampus(a.campus) }}</td>
              <td>{{ a.gradYear }}</td>
              <td>{{ a.saccoMembership?.status || '-' }}</td>
              <td><span :class="statusBadge(a.verificationStatus)">{{ niceStatus(a.verificationStatus) }}</span></td>
              <td>
                <select class="input min-w-36" :value="a.verificationStatus" :disabled="updatingId === a.id" @change="updateStatus(a, $event.target.value)">
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </td>
            </tr>

            <tr v-if="!alumni.length">
              <td colspan="8" class="py-6 text-slate-500">No alumni records found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p v-if="message" class="rounded-2xl bg-gold/20 p-4 font-semibold text-navy dark:text-gold">{{ message }}</p>
    <p v-if="error" class="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../api'

const campusOptions = [
  { label: 'Main Campus', value: 'Main Campus' },
  { label: 'Mbalala Campus', value: 'Mbalala Campus' },
  { label: 'Green Campus', value: 'Green Campus' },
  { label: 'A Level Campus', value: 'A Level Campus' }
]

const alumni = ref([])
const updatingId = ref(null)
const error = ref('')
const message = ref('')

const filters = reactive({
  search: '',
  campus: '',
  year: '',
  status: ''
})

const activeSaccoCount = computed(() => {
  return alumni.value.filter(a => a.saccoMembership?.status === 'active').length
})

function countByStatus(status) {
  return alumni.value.filter(a => a.verificationStatus === status).length
}

function niceCampus(value) {
  return String(value || '-')
    .replace('alevel', 'A Level')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function niceStatus(value) {
  return String(value || '-').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function statusBadge(status) {
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide'
  if (status === 'verified') return `${base} bg-green-100 text-green-700`
  if (status === 'rejected') return `${base} bg-red-100 text-red-700`
  if (status === 'suspended') return `${base} bg-slate-200 text-slate-700`
  return `${base} bg-gold/25 text-navy dark:text-gold`
}

async function load() {
  error.value = ''
  const params = {}

  Object.entries(filters).forEach(([key, value]) => {
    if (String(value || '').trim()) params[key] = String(value).trim()
  })

  try {
    alumni.value = (await api.get('/admin/alumni', { params })).data
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load alumni records'
  }
}

function resetFilters() {
  Object.assign(filters, {
    search: '',
    campus: '',
    year: '',
    status: ''
  })
  load()
}

async function updateStatus(alumniRecord, status) {
  updatingId.value = alumniRecord.id
  error.value = ''
  message.value = ''

  try {
    await api.put(`/admin/alumni/${alumniRecord.id}/verification`, { status })
    message.value = `${alumniRecord.displayName} marked as ${niceStatus(status)}.`
    await load()
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to update alumni status'
  } finally {
    updatingId.value = null
  }
}

onMounted(load)
</script>

