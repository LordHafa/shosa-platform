<template>
  <section class="mx-auto max-w-6xl space-y-6">
    <div class="rounded-3xl bg-navy p-6 text-white shadow-xl md:p-8">
      <p class="font-bold text-gold">SHOSA SACCO</p>
      <h1 class="mt-2 text-3xl font-black md:text-4xl">My SACCO dashboard</h1>
      <p class="mt-3 max-w-3xl leading-7 text-slate-200">
        Track your membership status, registration fee, yearly subscription, savings and payment history.
      </p>
    </div>

    <div v-if="loading" class="card">Loading SACCO information...</div>

    <div v-else-if="!data?.membership" class="card">
      <h2 class="text-2xl font-black text-navy dark:text-gold">You have not joined the SACCO yet.</h2>
      <p class="mt-2 text-slate-600 dark:text-slate-300">
        Start with the membership form. The system will create a UGX 50,000 registration fee record for admin review.
      </p>
      <router-link to="/sacco/register" class="mt-5 inline-block btn-primary">Start SACCO Registration</router-link>
    </div>

    <template v-else>
      <div class="grid gap-5 md:grid-cols-4">
        <div class="card">
          <p class="text-sm text-slate-500">Membership No.</p>
          <h3 class="text-xl font-black text-navy dark:text-gold">{{ data.membership.membershipNumber }}</h3>
        </div>

        <div class="card">
          <p class="text-sm text-slate-500">Status</p>
          <h3 class="text-xl font-black text-navy dark:text-gold">{{ data.membership.status }}</h3>
        </div>

        <div class="card">
          <p class="text-sm text-slate-500">Approved payments</p>
          <h3 class="text-xl font-black text-navy dark:text-gold">UGX {{ formatMoney(data.summary.approvedAmount) }}</h3>
        </div>

        <div class="card">
          <p class="text-sm text-slate-500">Pending payments</p>
          <h3 class="text-xl font-black text-navy dark:text-gold">{{ data.summary.pendingCount }}</h3>
        </div>
      </div>

      <div class="card">
        <p class="font-bold text-gold">Subscription discipline</p>
        <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">{{ subscriptionTitle }}</h2>
        <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">{{ data.subscription?.message }}</p>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Yearly subscription</p>
            <p class="mt-1 text-xl font-black text-navy dark:text-gold">UGX 100,000</p>
          </div>

          <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">First due</p>
            <p class="mt-1 font-black text-navy dark:text-gold">{{ formatDate(data.subscription?.firstSubscriptionDueAt) }}</p>
          </div>

          <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Next due</p>
            <p class="mt-1 font-black text-navy dark:text-gold">{{ formatDate(data.subscription?.nextSubscriptionDueAt) }}</p>
          </div>
        </div>

        <router-link to="/sacco/payments" class="mt-5 inline-block btn-secondary">Open SACCO payments</router-link>
      </div>

      <div class="card">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-black text-navy dark:text-gold">Recent SACCO payments</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Mobile-friendly history of SACCO-related payments.</p>
          </div>
          <router-link to="/sacco/payments" class="btn-secondary">Submit Payment</router-link>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <article
            v-for="p in data.payments"
            :key="p.id"
            class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-gold">{{ p.label || niceType(p.paymentType) }}</p>
                <h3 class="mt-1 text-xl font-black text-navy dark:text-white">UGX {{ formatMoney(p.amount) }}</h3>
              </div>
              <span :class="statusBadge(p.status)">{{ niceStatus(p.status) }}</span>
            </div>

            <div class="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <p>{{ formatDate(p.createdAt) }}</p>
              <p class="truncate">Ref: {{ p.transactionRef || '-' }}</p>
            </div>
          </article>

          <div v-if="!data.payments.length" class="rounded-2xl bg-cream p-6 text-center text-slate-500 dark:bg-slate-800 md:col-span-2">
            No SACCO payments yet.
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

const data = ref(null)
const loading = ref(true)
const error = ref('')

const subscriptionTitle = computed(() => {
  if (!data.value?.subscription?.isActive) return 'Membership activation required'
  if (data.value?.subscription?.hasPendingYearlySubscription) return 'Yearly subscription pending review'
  if (data.value?.subscription?.isSubscriptionDue) return 'Yearly subscription is due'
  return 'Subscription is in good standing'
})

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-UG')
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
    data.value = (await api.get('/sacco/me')).data
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load SACCO dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

