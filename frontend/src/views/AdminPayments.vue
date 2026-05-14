<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-3xl bg-navy text-white shadow-xl">
      <div class="relative p-6 md:p-8">
        <div class="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-slate-950/50"></div>
        <div class="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="font-bold text-gold">SACCO and payment verification</p>
            <h1 class="mt-2 text-3xl font-black md:text-5xl">Admin Payments</h1>
            <p class="mt-3 max-w-3xl leading-7 text-slate-200">
              Approve payments, reject errors, and issue official e-receipts after verification.
            </p>
          </div>
          <router-link class="btn-secondary" to="/admin">Back to dashboard</router-link>
        </div>
      </div>
    </section>

    <form class="card grid gap-3 md:grid-cols-4" @submit.prevent="load">
      <select v-model="filters.status" class="input">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="pending_gateway_confirmation">Pending gateway</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <select v-model="filters.type" class="input">
        <option value="">All types</option>
        <option v-for="type in paymentTypes" :key="type" :value="type">{{ niceType(type) }}</option>
      </select>

      <input v-model="filters.search" class="input" placeholder="Search ref, alumni, label" />

      <button class="btn-primary">Apply Filters</button>
    </form>

    <p v-if="message" class="rounded-2xl bg-gold/20 p-4 font-semibold text-navy dark:text-gold">{{ message }}</p>
    <p v-if="error" class="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">{{ error }}</p>

    <section class="card">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-black text-navy dark:text-gold">Payment records</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Approved records automatically receive an official receipt.</p>
        </div>
        <button class="btn-secondary" @click="load">Refresh</button>
      </div>

      <div class="space-y-3 lg:hidden">
        <article v-for="p in payments" :key="p.id" class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-gold">{{ paymentLabel(p.paymentType) }}</p>
              <h3 class="mt-1 text-lg font-black text-navy dark:text-white">{{ p.alumni?.displayName || '-' }}</h3>
            </div>
            <span :class="statusBadge(p.status)">{{ niceStatus(p.status) }}</span>
          </div>

          <div class="mt-4 grid gap-2 text-sm">
            <div class="flex justify-between gap-3"><span class="text-slate-400">Amount</span><strong>{{ money(p.amount) }}</strong></div>
            <div class="flex justify-between gap-3"><span class="text-slate-400">Network</span><strong>{{ p.network || '-' }}</strong></div>
            <div class="flex justify-between gap-3"><span class="text-slate-400">Ref</span><strong>{{ p.transactionRef || '-' }}</strong></div>
          </div>

          <div class="space-y-3">
            <div class="grid gap-2 sm:grid-cols-2">
              <button v-if="canFinalize(p)" class="btn-secondary" @click="approve(p.id)">Approve</button>
              <button v-if="canFinalize(p)" class="rounded-xl bg-red-600 px-4 py-3 font-bold text-white" @click="reject(p.id)">Reject</button>
              <router-link v-if="p.receipt" class="btn-primary text-center" :to="`/receipt/${p.receipt.receiptNumber}`">View receipt</router-link>
              <span v-if="!canFinalize(p) && !p.receipt" class="rounded-xl bg-slate-100 px-4 py-3 text-center font-bold text-slate-500 dark:bg-slate-700">Finalized</span>
            </div>
            <div v-if="p.receipt" class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <div class="font-semibold text-navy dark:text-white">Receipt: <router-link class="text-gold" :to="`/receipt/${p.receipt.receiptNumber}`">{{ p.receipt.receiptNumber }}</router-link></div>
              <div>Email status: {{ niceStatus(p.receipt.emailStatus) }}</div>
              <button class="mt-2 btn-secondary" @click="resendEmail(p.receipt.receiptNumber)" :disabled="resending">Resend email</button>
              <p v-if="p.receipt.emailError" class="mt-2 text-xs text-red-700 dark:text-red-400">Email error: {{ p.receipt.emailError }}</p>
            </div>
          </div>
        </article>

        <div v-if="!payments.length" class="rounded-2xl bg-cream p-6 text-center text-slate-500 dark:bg-slate-800">
          No payment records found.
        </div>
      </div>

      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full min-w-[1100px] text-sm">
          <thead>
            <tr class="text-left">
              <th>Alumni</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Network</th>
              <th>Ref</th>
              <th>Status</th>
              <th>Receipt</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="p in payments" :key="p.id" class="border-t border-slate-100 dark:border-slate-800">
              <td class="py-3 font-bold">{{ p.alumni?.displayName || '-' }}</td>
              <td>{{ paymentLabel(p.paymentType) }}</td>
              <td>{{ money(p.amount) }}</td>
              <td>{{ p.network || '-' }}</td>
              <td>{{ p.transactionRef || '-' }}</td>
              <td><span :class="statusBadge(p.status)">{{ niceStatus(p.status) }}</span></td>
              <td>
                <div v-if="p.receipt" class="space-y-1">
                  <router-link class="font-black text-gold" :to="`/receipt/${p.receipt.receiptNumber}`">{{ p.receipt.receiptNumber }}</router-link>
                  <div class="text-xs text-slate-500">Email: {{ niceStatus(p.receipt.emailStatus) }}</div>
                  <button class="btn-secondary px-3 py-1 text-xs" @click="resendEmail(p.receipt.receiptNumber)" :disabled="resending">Resend</button>
                  <p v-if="p.receipt.emailError" class="text-xs text-red-600 dark:text-red-400">Error: {{ p.receipt.emailError }}</p>
                </div>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td class="space-x-2 whitespace-nowrap">
                <button v-if="canFinalize(p)" class="btn-secondary" @click="approve(p.id)">Approve</button>
                <button v-if="canFinalize(p)" class="rounded-xl bg-red-600 px-4 py-2 font-bold text-white" @click="reject(p.id)">Reject</button>
                <span v-else class="text-slate-400">Finalized</span>
              </td>
            </tr>

            <tr v-if="!payments.length">
              <td colspan="8" class="py-6 text-slate-500">No payment records found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '../api'

const payments = ref([])
const message = ref('')
const error = ref('')
const resending = ref(false)

const filters = reactive({ status: '', type: '', search: '' })

const paymentTypes = [
  'sacco_membership_fee',
  'sacco_yearly_subscription',
  'sacco_savings_monthly',
  'sacco_savings_quarterly',
  'donation',
  'merchandise_order',
  'event_fee',
  'other'
]

function money(value) {
  return 'UGX ' + Number(value || 0).toLocaleString('en-UG')
}

function niceType(value) {
  return String(value || '-').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function paymentLabel(type, label) {
  if (label) return label

  switch (type) {
    case 'donation':
      return 'Donation'
    case 'sacco_savings_quarterly':
      return 'Quarterly SACCO Savings'
    case 'sacco_yearly_subscription':
      return 'Yearly SACCO Subscription'
    case 'sacco_savings_monthly':
      return 'Monthly SACCO Savings'
    case 'sacco_membership_fee':
      return 'SACCO Membership Fee'
    case 'merchandise_order':
      return 'Merchandise Order'
    case 'event_fee':
      return 'Event Fee'
    default:
      return niceType(type)
  }
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

function canFinalize(payment) {
  return ['pending', 'pending_gateway_confirmation'].includes(payment.status)
}

async function load() {
  error.value = ''
  const params = {}
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value
  })

  try {
    payments.value = (await api.get('/admin/payments', { params })).data
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load payments'
  }
}

async function approve(id) {
  message.value = ''
  error.value = ''

  try {
    const { data } = await api.post(`/admin/payments/${id}/approve`)
    message.value = data.receipt
      ? `Payment approved. Receipt issued: ${data.receipt.receiptNumber}.`
      : 'Payment approved.'
    await load()
  } catch (e) {
    error.value = e.response?.data?.error || 'Payment approval failed'
  }
}

async function resendEmail(receiptNumber) {
  if (!receiptNumber) return
  message.value = ''
  error.value = ''
  resending.value = true

  try {
    await api.post(`/receipts/${encodeURIComponent(receiptNumber)}/email`)
    message.value = `Receipt ${receiptNumber} email resend requested.`
    await load()
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to resend receipt email'
  } finally {
    resending.value = false
  }
}

async function reject(id) {
  const reason = prompt('Enter rejection reason. This will be audit logged.')
  if (!reason) return

  message.value = ''
  error.value = ''

  try {
    await api.post(`/admin/payments/${id}/reject`, { reason })
    message.value = 'Payment rejected and audit logged.'
    await load()
  } catch (e) {
    error.value = e.response?.data?.error || 'Payment rejection failed'
  }
}

onMounted(load)
</script>

