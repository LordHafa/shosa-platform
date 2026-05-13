<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-3xl bg-navy text-white shadow-xl">
      <div class="relative p-6 md:p-8">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,211,77,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.22),transparent_35%)]"></div>
        <div class="relative z-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p class="font-bold text-gold">Seeta Admin Command Center</p>
            <h1 class="mt-2 text-3xl font-black md:text-5xl">Admin Dashboard</h1>
            <p class="mt-3 max-w-3xl leading-7 text-slate-200">
              A fintech-style command room for alumni growth, SACCO collections, payment verification, files, gallery, contacts and audit activity.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <router-link class="btn-secondary" to="/admin/payments">Review Payments</router-link>
            <router-link class="btn-secondary" to="/admin/alumni">Alumni Records</router-link>
            <router-link class="rounded-xl border border-gold px-5 py-3 font-bold text-gold hover:bg-gold hover:text-navy" to="/admin/files">Files</router-link>
            <router-link class="rounded-xl border border-white/30 px-5 py-3 font-bold text-white hover:bg-white hover:text-navy" to="/admin/audit-logs">Audit Logs</router-link>
          </div>
        </div>
      </div>
    </section>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in heroKpis" :key="card.label" class="card overflow-hidden">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400">{{ card.label }}</p>
            <p class="mt-2 text-3xl font-black text-navy dark:text-gold">{{ card.value }}</p>
            <p class="mt-2 text-xs leading-5 text-slate-500">{{ card.hint }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20 text-xs font-black text-navy dark:text-gold">
            {{ card.tag }}
          </div>
        </div>
      </article>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
      <section class="card">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="font-bold text-gold">Collections intelligence</p>
            <h2 class="text-2xl font-black text-navy dark:text-gold">SACCO / payment trend</h2>
          </div>
          <div class="rounded-2xl bg-cream px-4 py-3 text-right dark:bg-slate-800">
            <p class="text-xs text-slate-500">Approved total</p>
            <p class="font-black text-navy dark:text-gold">{{ money(dashboard.totalRevenue) }}</p>
          </div>
        </div>

        <div class="rounded-3xl bg-gradient-to-br from-navy to-slate-950 p-4 text-white">
          <svg viewBox="0 0 100 100" class="h-64 w-full overflow-visible">
            <defs>
              <linearGradient id="trendGlow" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stop-color="#facc15" stop-opacity="0.95" />
                <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.95" />
              </linearGradient>
            </defs>

            <line v-for="y in [20,40,60,80]" :key="y" x1="0" :y1="y" x2="100" :y2="y" stroke="rgba(255,255,255,.08)" stroke-width=".6" />

            <polyline
              v-if="trendPoints.length"
              :points="trendPointString"
              fill="none"
              stroke="url(#trendGlow)"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <circle
              v-for="point in trendPoints"
              :key="point.label"
              :cx="point.x"
              :cy="point.y"
              r="2.6"
              fill="#facc15"
              stroke="#0b1f4d"
              stroke-width="1"
            />
          </svg>

          <div class="grid gap-2 text-xs sm:grid-cols-3">
            <div v-for="row in trend" :key="row.month" class="rounded-2xl bg-white/10 p-3">
              <p class="font-bold text-gold">{{ row.month }}</p>
              <p>{{ money(row.amount) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <p class="font-bold text-gold">Money mix</p>
        <h2 class="text-2xl font-black text-navy dark:text-gold">Payment category split</h2>

        <div class="mt-6 grid place-items-center">
          <div class="relative h-56 w-56 rounded-full" :style="{ background: donutStyle }">
            <div class="absolute inset-10 grid place-items-center rounded-full bg-white text-center shadow-inner dark:bg-slate-900">
              <p class="text-xs font-bold uppercase text-slate-500">Categories</p>
              <p class="text-3xl font-black text-navy dark:text-gold">{{ paymentBreakdown.length }}</p>
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <div v-for="(row, index) in paymentBreakdown" :key="row.type" class="flex items-center justify-between gap-3 text-sm">
            <div class="flex items-center gap-2">
              <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: chartColors[index % chartColors.length] }"></span>
              <span class="font-bold">{{ niceType(row.type) }}</span>
            </div>
            <span class="text-slate-500">{{ money(row.amount) }}</span>
          </div>
          <p v-if="!paymentBreakdown.length" class="text-slate-500">No approved payment breakdown yet.</p>
        </div>
      </section>
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
      <section class="card xl:col-span-2">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="font-bold text-gold">Alumni growth map</p>
            <h2 class="text-2xl font-black text-navy dark:text-gold">Campuses and year groups</h2>
          </div>
          <router-link to="/admin/alumni" class="btn-secondary">Open alumni records</router-link>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 class="mb-4 font-black text-navy dark:text-gold">By campus</h3>
            <div class="space-y-4">
              <div v-for="row in campusCounts" :key="row.campus">
                <div class="mb-1 flex justify-between text-sm">
                  <span class="font-bold">{{ niceCampus(row.campus) }}</span>
                  <span>{{ row.count }}</span>
                </div>
                <div class="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div class="h-full rounded-full bg-gold" :style="{ width: barWidth(row.count, maxCampus) }"></div>
                </div>
              </div>
              <p v-if="!campusCounts.length" class="text-slate-500">No campus data yet.</p>
            </div>
          </div>

          <div>
            <h3 class="mb-4 font-black text-navy dark:text-gold">By completion year</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="row in yearCounts.slice(0, 18)"
                :key="row.year"
                class="rounded-full bg-cream px-4 py-2 text-sm font-bold text-navy dark:bg-slate-800 dark:text-gold"
              >
                {{ row.year }} · {{ row.count }}
              </span>
              <p v-if="!yearCounts.length" class="text-slate-500">No year group data yet.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <p class="font-bold text-gold">Action queue</p>
        <h2 class="text-2xl font-black text-navy dark:text-gold">Needs attention</h2>

        <div class="mt-5 space-y-3">
          <router-link to="/admin/payments" class="block rounded-2xl bg-gold/15 p-4">
            <p class="text-sm text-slate-500">Pending payments</p>
            <p class="text-3xl font-black text-navy dark:text-gold">{{ dashboard.pendingPayments ?? 0 }}</p>
          </router-link>

          <router-link to="/admin/alumni" class="block rounded-2xl bg-cream p-4 dark:bg-slate-800">
            <p class="text-sm text-slate-500">Pending alumni</p>
            <p class="text-3xl font-black text-navy dark:text-gold">{{ dashboard.pendingAlumni ?? 0 }}</p>
          </router-link>

          <router-link to="/admin/contacts" class="block rounded-2xl bg-cream p-4 dark:bg-slate-800">
            <p class="text-sm text-slate-500">New contact messages</p>
            <p class="text-3xl font-black text-navy dark:text-gold">{{ dashboard.contactMessages ?? 0 }}</p>
          </router-link>
        </div>
      </section>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <section class="card">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="font-bold text-gold">Verification stream</p>
            <h2 class="text-2xl font-black text-navy dark:text-gold">Recent payments</h2>
          </div>
          <router-link to="/admin/payments" class="font-bold text-navy dark:text-gold">View all -></router-link>
        </div>

        <div class="space-y-3">
          <article v-for="p in recentPayments" :key="p.id" class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-black text-navy dark:text-white">{{ p.alumni?.displayName || '-' }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ niceType(p.paymentType) }}</p>
              </div>
              <span :class="statusBadge(p.status)">{{ niceStatus(p.status) }}</span>
            </div>
            <div class="mt-3 flex items-center justify-between text-sm">
              <span class="font-black text-gold">{{ money(p.amount) }}</span>
              <span class="text-slate-500">{{ formatDate(p.createdAt) }}</span>
            </div>
          </article>

          <p v-if="!recentPayments.length" class="rounded-2xl bg-cream p-6 text-center text-slate-500 dark:bg-slate-800">
            No payments yet.
          </p>
        </div>
      </section>

      <section class="card">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="font-bold text-gold">Governance trail</p>
            <h2 class="text-2xl font-black text-navy dark:text-gold">Recent audit activity</h2>
          </div>
          <router-link to="/admin/audit-logs" class="font-bold text-navy dark:text-gold">View logs -></router-link>
        </div>

        <div class="space-y-3">
          <article v-for="log in recentAuditLogs" :key="log.id" class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-black text-navy dark:text-white">{{ niceType(log.action) }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ log.resourceType }} {{ log.resourceId ? `#${log.resourceId}` : '' }}</p>
              </div>
              <span :class="auditStatusBadge(log.status)">{{ log.status }}</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">{{ formatDate(log.createdAt) }}</p>
          </article>

          <p v-if="!recentAuditLogs.length" class="rounded-2xl bg-cream p-6 text-center text-slate-500 dark:bg-slate-800">
            No audit activity yet.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../api'

const dashboard = ref({})
const loading = ref(true)

const chartColors = ['#facc15', '#60a5fa', '#22c55e', '#fb7185', '#a78bfa', '#f97316', '#14b8a6']

const trend = computed(() => dashboard.value.collectionsTrend || [])
const campusCounts = computed(() => dashboard.value.campusCounts || [])
const yearCounts = computed(() => dashboard.value.yearCounts || [])
const paymentBreakdown = computed(() => dashboard.value.paymentBreakdown || [])
const recentPayments = computed(() => dashboard.value.recentPayments || [])
const recentAuditLogs = computed(() => dashboard.value.recentAuditLogs || [])

const maxTrend = computed(() => Math.max(1, ...trend.value.map(row => Number(row.amount || 0))))
const maxCampus = computed(() => Math.max(1, ...campusCounts.value.map(row => Number(row.count || 0))))

const heroKpis = computed(() => [
  { label: 'Total Alumni', value: dashboard.value.totalAlumni ?? 0, hint: 'Registered alumni profiles', tag: 'ALM' },
  { label: 'SACCO Members', value: dashboard.value.saccoMembers ?? 0, hint: 'Approved active SACCO members', tag: 'SAC' },
  { label: 'Pending Payments', value: dashboard.value.pendingPayments ?? 0, hint: 'Require finance/admin action', tag: 'PAY' },
  { label: 'Approved Revenue', value: money(dashboard.value.totalRevenue), hint: 'Approved payment collections', tag: 'UGX' },
  { label: 'Private Files', value: dashboard.value.adminDocuments ?? 0, hint: 'Protected admin documents', tag: 'DOC' },
  { label: 'Audit Logs', value: dashboard.value.auditLogCount ?? 0, hint: 'Governance trail entries', tag: 'LOG' },
  { label: 'Gallery Items', value: dashboard.value.galleryUploads ?? 0, hint: 'Public gallery memories', tag: 'IMG' },
  { label: 'Contacts', value: dashboard.value.contactMessages ?? 0, hint: 'New contact messages', tag: 'MSG' }
])

const trendPoints = computed(() => {
  if (!trend.value.length) return []

  return trend.value.map((row, index) => {
    const x = trend.value.length === 1 ? 50 : (index / (trend.value.length - 1)) * 100
    const normalized = Number(row.amount || 0) / maxTrend.value
    const y = 88 - normalized * 72

    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      label: row.month,
      amount: row.amount
    }
  })
})

const trendPointString = computed(() => trendPoints.value.map(point => `${point.x},${point.y}`).join(' '))

const donutStyle = computed(() => {
  if (!paymentBreakdown.value.length) return 'conic-gradient(#e2e8f0 0 100%)'

  const total = paymentBreakdown.value.reduce((sum, row) => sum + Number(row.amount || 0), 0) || 1
  let cursor = 0

  const segments = paymentBreakdown.value.map((row, index) => {
    const value = (Number(row.amount || 0) / total) * 100
    const start = cursor
    cursor += value
    return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`
  })

  return `conic-gradient(${segments.join(', ')})`
})

function money(value) {
  return 'UGX ' + Number(value || 0).toLocaleString('en-UG')
}

function niceType(value) {
  return String(value || '-').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function niceCampus(value) {
  return String(value || '-')
    .replace('alevel', 'A Level')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function niceStatus(value) {
  return niceType(value)
}

function statusBadge(status) {
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide'
  if (status === 'approved' || status === 'verified') return `${base} bg-green-100 text-green-700`
  if (status === 'rejected') return `${base} bg-red-100 text-red-700`
  if (status === 'pending_gateway_confirmation') return `${base} bg-blue-100 text-blue-700`
  return `${base} bg-gold/25 text-navy dark:text-gold`
}

function auditStatusBadge(status) {
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide'
  if (status === 'success') return `${base} bg-green-100 text-green-700`
  if (status === 'failed') return `${base} bg-red-100 text-red-700`
  return `${base} bg-gold/25 text-navy dark:text-gold`
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function barWidth(value, max) {
  return Math.max(4, Math.round((Number(value || 0) / Number(max?.value || max || 1)) * 100)) + '%'
}

onMounted(async () => {
  dashboard.value = (await api.get('/admin/dashboard')).data
  loading.value = false
})
</script>
