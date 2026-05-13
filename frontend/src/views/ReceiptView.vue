<template>
  <section class="mx-auto max-w-5xl space-y-6 px-4 py-6">
    <div class="no-print flex flex-wrap items-center justify-between gap-3">
      <router-link class="btn-secondary" to="/sacco/payments">Back to payments</router-link>
      <div class="flex flex-wrap gap-2">
        <button class="btn-primary" @click="printReceipt">Print / Save PDF</button>
        <button class="btn-secondary" :disabled="emailing" @click="emailReceipt">
          {{ emailing ? 'Sending...' : 'Email receipt' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="card">Loading receipt...</div>
    <p v-if="error" class="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">{{ error }}</p>

    <article v-if="receipt" class="receipt-shell mx-auto overflow-hidden rounded-3xl bg-navy text-white shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 print:shadow-none print:ring-0 print:rounded-none print:bg-white">
      <div class="receipt-document bg-white text-navy print:text-black">
        <header class="receipt-print-header flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-8 print:px-6 print:py-6 print:gap-6">
          <div class="flex items-center gap-4 print:gap-3">
            <img src="/assets/reference/seeta-reference-logo.jpeg" alt="Seeta Alumni Association logo" class="h-16 w-16 rounded-2xl border-4 border-gold bg-white object-cover print:h-12 print:w-12 print:rounded-lg print:border-2" />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-gold print:text-navy">Seeta Alumni Association</p>
              <h1 class="mt-1 text-2xl font-black text-navy print:text-black print:text-xl">Official Receipt</h1>
              <p class="mt-1 text-xs text-slate-500 print:text-slate-600 print:text-xs">Premium alumni and SACCO payment record</p>
            </div>
          </div>

          <div class="text-center print:text-left">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Receipt No.</p>
            <p class="mt-2 text-xl font-black text-gold print:text-navy print:text-lg">{{ receipt.receiptNumber }}</p>
          </div>

          <div class="flex items-center justify-end print:justify-start">
            <img src="/assets/reference/sacco-placeholder-logo.svg" alt="SACCO logo" class="h-16 w-16 rounded-2xl border-4 border-gold bg-white object-contain print:h-12 print:w-12 print:rounded-lg print:border-2" />
          </div>
        </header>

        <main class="receipt-content px-8 py-8 space-y-6 print:px-6 print:py-6 print:space-y-4">
          <section class="receipt-section grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-3">
            <div class="rounded-2xl bg-slate-50 p-6 print:rounded-lg print:bg-white print:border print:border-slate-200 print:p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Received from</p>
              <p class="mt-2 text-xl font-black text-navy print:text-black print:text-lg">{{ receipt.alumni?.displayName || '-' }}</p>
              <p class="mt-1 text-sm text-slate-500 print:text-slate-600">{{ receipt.alumni?.email || '-' }}</p>
              <p class="text-sm text-slate-500 print:text-slate-600">{{ receipt.alumni?.phone || '-' }}</p>
            </div>

            <div class="rounded-2xl bg-slate-50 p-6 print:rounded-lg print:bg-white print:border print:border-slate-200 print:p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Issued by</p>
              <p class="mt-2 text-lg font-black text-navy print:text-black print:text-base">{{ receipt.issuedByAdmin?.fullName || 'Seeta Alumni Admin' }}</p>
              <p class="mt-1 text-sm text-slate-500 print:text-slate-600">{{ formatDate(receipt.issuedAt) }}</p>
              <p class="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Email status</p>
              <p class="mt-1 text-sm font-semibold text-navy print:text-black">{{ receipt.emailStatusMessage }}</p>
              <p v-if="receipt.emailStatus === 'failed' && !receipt.canSeeEmailDebug" class="mt-2 text-sm text-red-700 print:hidden">
                Email delivery failed. Please contact admin or try again later.
              </p>
              <p v-if="receipt.canSeeEmailDebug && receipt.emailError" class="mt-2 text-xs text-red-700 print:hidden">
                Email error: {{ receipt.emailError }}
              </p>
            </div>
          </section>

          <section class="receipt-section rounded-2xl border border-slate-200 bg-slate-50 p-6 print:rounded-lg print:border print:bg-white print:p-4">
            <div class="grid gap-4 md:grid-cols-3 print:grid-cols-3 print:gap-3">
              <div class="md:col-span-2 print:col-span-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Payment for</p>
                <p class="mt-1 text-lg font-black text-navy print:text-black print:text-base">{{ paymentLabel(receipt.paymentType, receipt.label) }}</p>
              </div>

              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Amount</p>
                <p class="mt-1 text-xl font-black text-gold print:text-navy print:text-lg">{{ money(receipt.amount, receipt.currency) }}</p>
              </div>

              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Receipt status</p>
                <p class="mt-1 text-lg font-black text-navy print:text-black print:text-base">{{ niceStatus(receipt.status) }}</p>
              </div>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-3 print:grid-cols-3 print:gap-3 print:mt-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Transaction ref</p>
                <p class="mt-1 font-black text-navy print:text-black print:text-sm">{{ receipt.payment?.transactionRef || '-' }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Network</p>
                <p class="mt-1 font-black text-navy print:text-black print:text-sm">{{ receipt.payment?.network || '-' }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 print:text-slate-600">Verification code</p>
                <p class="mt-1 font-black text-navy print:text-black print:text-sm">{{ receipt.verificationCode }}</p>
              </div>
            </div>
          </section>

          <section class="receipt-section rounded-2xl bg-gold/10 p-6 text-sm leading-7 text-slate-600 print:rounded-lg print:bg-white print:border print:border-slate-200 print:p-4 print:text-slate-700">
            This official receipt was generated after admin approval of the payment record. Keep this document for your personal and SACCO records.
          </section>
        </main>
      </div>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const receipt = ref(null)
const loading = ref(true)
const emailing = ref(false)
const error = ref('')

function money(value, currency = 'UGX') {
  return currency + ' ' + Number(value || 0).toLocaleString('en-UG')
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

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function printReceipt() {
  window.print()
}

async function emailReceipt() {
  emailing.value = true
  error.value = ''

  try {
    const { data } = await api.post(`/receipts/${route.params.receiptNumber}/email`)
    receipt.value = data
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to email receipt'
  } finally {
    emailing.value = false
  }
}

async function loadReceipt() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await api.get(`/receipts/${route.params.receiptNumber}`)
    receipt.value = data
  } catch (e) {
    error.value = e.response?.data?.error || 'Receipt not found'
  } finally {
    loading.value = false
  }
}

onMounted(loadReceipt)
</script>

<style scoped>
.receipt-shell {
  border-radius: 32px;
}

.receipt-document {
  border-radius: 32px;
  overflow: hidden;
}

.receipt-print-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
}

.receipt-section {
  break-inside: avoid;
  page-break-inside: avoid;
}

@media print {
  html,
  body {
    background: #ffffff !important;
    color: #071a45 !important;
  }

  .no-print {
    display: none !important;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .receipt-shell {
    box-shadow: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    background: white !important;
  }

  .receipt-document {
    box-shadow: none !important;
    background: #ffffff !important;
    border-radius: 0 !important;
    border: 1px solid #d1d5db !important;
    color: black !important;
  }

  .receipt-print-header,
  .receipt-section,
  .receipt-content {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .receipt-print-header img {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: A4 portrait;
    margin: 12mm;
  }
}
</style>


