<template>
  <section class="mx-auto max-w-7xl space-y-8">
    <section class="overflow-hidden rounded-3xl bg-navy text-white shadow-2xl">
      <div class="relative p-6 md:p-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,211,77,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_35%)]"></div>

        <div class="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p class="font-bold text-gold">Alumni command center</p>
            <h1 class="mt-2 text-3xl font-black leading-tight md:text-5xl">
              Welcome back, {{ profile?.displayName || 'SHOSA Member' }}
            </h1>
            <p class="mt-4 max-w-3xl leading-8 text-slate-200">
              Your member home for profile status, SACCO access, payments, events, gallery memories and SHOSA merchandise.
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-gold">Membership snapshot</p>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p class="text-sm text-slate-300">Campus</p>
                <p class="font-black">{{ profile?.campus || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-300">Year</p>
                <p class="font-black">{{ profile?.gradYear || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-300">Alumni</p>
                <p class="font-black text-gold">{{ profile?.verificationStatus || 'pending' }}</p>
              </div>
              <div>
                <p class="text-sm text-slate-300">SACCO</p>
                <p class="font-black text-gold">{{ profile?.saccoMembership?.status || 'not joined' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="loading" class="card">Loading dashboard...</div>

    <template v-else>
      <section class="grid gap-5 md:grid-cols-4">
        <article v-for="card in summaryCards" :key="card.label" class="card">
          <p class="text-sm text-slate-500">{{ card.label }}</p>
          <h3 class="mt-2 text-2xl font-black text-navy dark:text-gold">{{ card.value }}</h3>
          <p class="mt-2 text-xs leading-5 text-slate-500">{{ card.hint }}</p>
        </article>
      </section>

      <section class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article class="card overflow-hidden p-0">
          <div class="grid md:grid-cols-[220px_1fr]">
            <div class="bg-gradient-to-br from-navy via-navy to-slate-950 p-6 text-white">
              <div class="mx-auto h-36 w-36 overflow-hidden rounded-[2rem] bg-white ring-4 ring-gold/40">
                <img :src="photoUrl" alt="Profile photo" class="h-full w-full object-cover" />
              </div>

              <div class="mt-5 text-center">
                <h2 class="text-2xl font-black">{{ profile?.displayName || 'Alumni Member' }}</h2>
                <p class="mt-1 text-sm text-slate-300">{{ profile?.campus || '-' }} Ã¢â‚¬Â¢ {{ profile?.gradYear || '-' }}</p>
                <span :class="statusPill(profile?.verificationStatus)" class="mt-3 inline-flex">
                  {{ profile?.verificationStatus || 'pending' }}
                </span>
              </div>
            </div>

            <div class="p-6">
              <p class="font-bold text-gold">My SHOSA record</p>
              <h2 class="mt-1 text-3xl font-black text-navy dark:text-gold">
                Profile first. Everything else follows.
              </h2>
              <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                Keep your profile accurate so admins can verify you, SACCO onboarding can proceed cleanly,
                and your alumni identity remains consistent across SHOSA activities.
              </p>

              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <div v-for="item in profileQuickFacts" :key="item.label" class="min-w-0 rounded-2xl bg-cream p-4 dark:bg-slate-800">
                  <p class="text-xs font-black uppercase tracking-wide text-slate-500">{{ item.label }}</p>
                  <p class="mt-1 break-words text-sm font-black leading-6 text-navy dark:text-gold md:text-base">{{ item.value || '-' }}</p>
                </div>
              </div>

              <router-link to="/profile" class="mt-5 inline-flex btn-primary">Open profile</router-link>
            </div>
          </div>
        </article>

        <article class="card">
          <p class="font-bold text-gold">Quick actions</p>
          <h2 class="mt-1 text-3xl font-black text-navy dark:text-gold">What do you want to do?</h2>

          <div class="mt-5 grid gap-3">
            <router-link
              v-for="action in quickActions"
              :key="action.to"
              :to="action.to"
              class="group rounded-2xl bg-cream p-4 transition hover:-translate-y-0.5 hover:bg-gold/20 hover:shadow dark:bg-slate-800"
            >
              <p class="font-black text-navy group-hover:text-gold dark:text-gold">{{ action.title }}</p>
              <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ action.text }}</p>
            </router-link>
          </div>
        </article>
      </section>

      <section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article class="card">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="font-bold text-gold">SACCO standing</p>
              <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">Savings and membership</h2>
            </div>
            <router-link to="/sacco/dashboard" class="btn-secondary">Open SACCO</router-link>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="text-xs font-black uppercase tracking-wide text-slate-500">Status</p>
              <p class="mt-1 text-2xl font-black text-navy dark:text-gold">{{ profile?.saccoMembership?.status || 'not joined' }}</p>
            </div>

            <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="text-xs font-black uppercase tracking-wide text-slate-500">Approved payments</p>
              <p class="mt-1 text-2xl font-black text-navy dark:text-gold">{{ money(approvedTotal) }}</p>
            </div>
          </div>

          <p class="mt-5 rounded-2xl bg-gold/15 p-4 text-sm leading-6 text-navy dark:text-gold">
            Membership and payments are finalized after admin verification. Keep transaction references clear for faster approval.
          </p>
        </article>

        <article class="card">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="font-bold text-gold">Recent payments</p>
              <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">Latest verified activity</h2>
            </div>
            <router-link to="/sacco/payments" class="btn-primary">Open payments</router-link>
          </div>

          <div class="mt-5 grid gap-3">
            <div
              v-for="payment in recentPayments"
              :key="payment.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream p-4 dark:bg-slate-800"
            >
              <div>
                <p class="font-black text-navy dark:text-gold">{{ nicePaymentLabel(payment) }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ date(payment.createdAt) }} Ã¢â‚¬Â¢ Ref: {{ payment.transactionRef || '-' }}</p>
              </div>
              <div class="text-right">
                <p class="font-black text-navy dark:text-gold">{{ money(payment.amount) }}</p>
                <span :class="statusPill(payment.status)">{{ payment.status }}</span>
              </div>
            </div>

            <div v-if="!recentPayments.length" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">
              No payments yet.
            </div>
          </div>
        </article>
      </section>

      <section class="grid gap-6 md:grid-cols-3">
        <article class="card">
          <p class="font-bold text-gold">Events</p>
          <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">Come through for what is next.</h2>
          <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Reunions, league weekends, mentorship, medical camps and school-facing activities.
          </p>
          <router-link to="/events" class="mt-5 inline-flex btn-secondary">View events</router-link>
        </article>

        <article class="card">
          <p class="font-bold text-gold">Gallery</p>
          <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">Relive the community memory.</h2>
          <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Browse organized SHOSA memories from leadership, reunions, league, mentorship and outreach.
          </p>
          <router-link to="/gallery" class="mt-5 inline-flex btn-secondary">Open gallery</router-link>
        </article>

        <article class="card">
          <p class="font-bold text-gold">Store</p>
          <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">Wear the identity.</h2>
          <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Request caps, shirts, polos, hoodies, tote bags, wristbands and official SHOSA items.
          </p>
          <router-link to="/store" class="mt-5 inline-flex btn-secondary">Open store</router-link>
        </article>
      </section>

      <p v-if="error" class="rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api, { UPLOADS_URL } from '../api'

const profile = ref(null)
const payments = ref([])
const loading = ref(true)
const error = ref('')

const photoUrl = computed(() => {
  return profile.value?.profilePhoto ? `${UPLOADS_URL}${profile.value.profilePhoto}` : '/assets/brand/shosa-primary-logo-web.png'
})

const approvedPayments = computed(() => {
  return payments.value.filter(payment => String(payment.status || '').toLowerCase() === 'approved')
})

const pendingPayments = computed(() => {
  return payments.value.filter(payment => String(payment.status || '').toLowerCase() === 'pending')
})

const approvedTotal = computed(() => {
  return approvedPayments.value.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
})

const recentPayments = computed(() => {
  return [...payments.value]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4)
})

const profileCompletion = computed(() => {
  const fields = [
    profile.value?.displayName,
    profile.value?.email,
    profile.value?.phone,
    profile.value?.campus,
    profile.value?.gradYear,
    profile.value?.period,
    profile.value?.occupation,
    profile.value?.city,
    profile.value?.country,
    profile.value?.profilePhoto
  ]

  const complete = fields.filter(Boolean).length
  return Math.round((complete / fields.length) * 100)
})

const summaryCards = computed(() => [
  { label: 'Profile completion', value: `${profileCompletion.value}%`, hint: 'Core record strength' },
  { label: 'Approved payments', value: money(approvedTotal.value), hint: `${approvedPayments.value.length} approved records` },
  { label: 'Pending payments', value: pendingPayments.value.length, hint: 'Waiting for admin review' },
  { label: 'SACCO status', value: profile.value?.saccoMembership?.status || 'not joined', hint: 'Member savings journey' }
])

const profileQuickFacts = computed(() => [
  { label: 'Email', value: profile.value?.email },
  { label: 'Phone', value: profile.value?.phone },
  { label: 'Level attended', value: profile.value?.period },
  { label: 'Location', value: [profile.value?.city, profile.value?.country].filter(Boolean).join(', ') }
])

const quickActions = [
  { title: 'Update profile', text: 'Keep contact, location, occupation and bio current.', to: '/profile' },
  { title: 'Join / update SACCO', text: 'Submit documents, registration fee and contribution choice.', to: '/sacco/register' },
  { title: 'Submit payment', text: 'Record savings, subscription, donation or verified payment proof.', to: '/sacco/payments' },
  { title: 'Explore SHOSA store', text: 'Build an order and send it directly on WhatsApp.', to: '/store' }
]

function money(value) {
  return 'UGX ' + Number(value || 0).toLocaleString('en-UG')
}

function date(value) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function nicePaymentLabel(payment) {
  return String(payment?.label || payment?.paymentType || 'Payment')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function statusPill(status) {
  const normalized = String(status || '').toLowerCase()
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide'

  if (normalized === 'approved' || normalized === 'verified' || normalized === 'active') {
    return `${base} bg-green-100 text-green-700`
  }

  if (normalized === 'pending') {
    return `${base} bg-gold/25 text-navy dark:text-gold`
  }

  if (normalized === 'rejected' || normalized === 'suspended') {
    return `${base} bg-red-100 text-red-700`
  }

  return `${base} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`
}

async function load() {
  loading.value = true
  error.value = ''

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