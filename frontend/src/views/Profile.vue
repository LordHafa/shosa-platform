<template>
  <section class="mx-auto max-w-6xl space-y-6">
    <div class="overflow-hidden rounded-3xl bg-navy text-white shadow-xl">
      <div class="relative p-6 md:p-8">
        <div class="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-slate-950/40"></div>
        <div class="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="font-bold text-gold">My alumni profile</p>
            <h1 class="mt-2 text-3xl font-black md:text-5xl">{{ profile?.displayName || 'Alumni Member' }}</h1>
            <p class="mt-3 max-w-3xl leading-7 text-slate-200">
              Your official Seeta Alumni identity record. Core profile changes are allowed once every 12 months.
            </p>
          </div>

          <router-link to="/alumni/dashboard" class="inline-flex min-h-11 items-center justify-center rounded-xl border border-gold px-5 py-3 font-bold text-gold hover:bg-gold hover:text-navy">
            Back to dashboard
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card">Loading profile...</div>

    <template v-else>
      <div class="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside class="card h-fit overflow-hidden p-0">
          <div class="bg-gradient-to-br from-navy via-navy to-slate-950 p-6 text-white">
            <div class="mx-auto h-36 w-36 overflow-hidden rounded-[2rem] bg-white ring-4 ring-gold/40">
              <img :src="photoUrl" alt="Profile photo" class="h-full w-full object-cover" />
            </div>

            <div class="mt-5 text-center">
              <h2 class="text-2xl font-black">{{ profile?.displayName || 'Alumni Member' }}</h2>
              <p class="mt-1 text-sm text-slate-300">{{ profile?.campus || '-' }} • {{ profile?.gradYear || '-' }}</p>
              <p class="mt-3 inline-flex rounded-full bg-gold px-3 py-1 text-sm font-black text-navy">
                {{ profile?.verificationStatus || 'pending' }}
              </p>
            </div>
          </div>

          <div class="space-y-3 p-5">
            <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">SACCO status</p>
              <p class="mt-1 text-lg font-black text-navy dark:text-gold">{{ profile?.saccoMembership?.status || 'not joined' }}</p>
            </div>

            <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Next profile edit</p>
              <p class="mt-1 font-black text-navy dark:text-gold">{{ editWindowText }}</p>
              <p v-if="!canEditProfile" class="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Contact an administrator for urgent corrections before this date.
              </p>
            </div>
          </div>
        </aside>

        <div class="space-y-6">
          <section class="card">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="font-bold text-gold">Official record</p>
                <h2 class="text-2xl font-black text-navy dark:text-gold">Profile details</h2>
              </div>

              <button
                v-if="canEditProfile"
                class="btn-secondary"
                type="button"
                @click="editing = !editing"
              >
                {{ editing ? 'Close Edit' : 'Edit Profile' }}
              </button>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div v-for="item in profileItems" :key="item.label" class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ item.label }}</p>
                <p class="mt-1 break-words font-black text-navy dark:text-white">{{ item.value || '-' }}</p>
              </div>
            </div>
          </section>

          <section v-if="!canEditProfile" class="rounded-3xl border border-gold/40 bg-gold/10 p-5">
            <h3 class="font-black text-navy dark:text-gold">Profile editing is locked</h3>
            <p class="mt-2 leading-7 text-slate-600 dark:text-slate-300">
              Normal alumni profile editing is available once every 12 months. Your next edit window is
              <strong>{{ editWindowText }}</strong>. For urgent corrections, contact an administrator.
            </p>
          </section>

          <form v-if="canEditProfile && editing" class="card grid gap-4 md:grid-cols-2" @submit.prevent="saveProfile">
            <div>
              <label class="label">Country Code</label>
              <select v-model="form.phoneCountryCode" class="input">
                <option v-for="item in dialCodeOptions" :key="`${item.country}-${item.value}`" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="label">Phone / WhatsApp</label>
              <input v-model.trim="form.phoneLocal" class="input" inputmode="tel" />
            </div>

            <div>
              <label class="label">Occupation</label>
              <input v-model.trim="form.occupation" class="input" />
            </div>

            <div>
              <label class="label">Country</label>
              <select v-model="form.country" class="input">
                <option v-for="country in countries" :key="country.code" :value="country.name">{{ country.name }}</option>
              </select>
            </div>

            <div>
              <label class="label">City</label>
              <input v-model.trim="form.city" class="input" />
            </div>

            <div>
              <label class="label">House</label>
              <input v-model.trim="form.house" class="input" />
            </div>

            <div>
              <label class="label">Level / Section Attended</label>
              <select v-model="form.attendanceLevel" class="input">
                <option value="">Select level attended</option>
                <option v-for="option in attendanceOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>

            <div v-if="isPartialAttendance">
              <label class="label">Brief Attendance Note</label>
              <input v-model.trim="form.attendanceNote" class="input" placeholder="e.g. Joined in S.2, left after S.3" />
            </div>

            <div class="md:col-span-2">
              <label class="label">Bio</label>
              <textarea v-model.trim="form.bio" class="input min-h-32" placeholder="Share a short professional/community profile"></textarea>
            </div>

            <p v-if="message" class="md:col-span-2 rounded-lg bg-green-100 p-3 text-green-700">{{ message }}</p>
            <p v-if="error" class="md:col-span-2 rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>

            <button class="btn-primary md:col-span-2" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Annual Profile Update' }}
            </button>
          </form>
        </div>
      </div>
    </template>

    <p v-if="error && !editing" class="rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api, { UPLOADS_URL } from '../api'
import { countries, defaultCountry, dialCodeOptions, findCountryByDialCode } from '../data/countries'

const profile = ref(null)
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const error = ref('')
const message = ref('')

const attendanceOptions = [
  'S.1 - S.4 / O-Level',
  'S.5 - S.6 / A-Level',
  'S.1 - S.6 / O-Level and A-Level',
  'Partial / Non-continuous attendance'
]

const form = reactive({
  phoneCountryCode: defaultCountry().dialCode,
  phoneLocal: '',
  occupation: '',
  city: '',
  country: defaultCountry().name,
  house: '',
  attendanceLevel: '',
  attendanceNote: '',
  bio: ''
})

const photoUrl = computed(() => {
  return profile.value?.profilePhoto ? `${UPLOADS_URL}${profile.value.profilePhoto}` : '/assets/reference/seeta-reference-logo.jpeg'
})

const canEditProfile = computed(() => Boolean(profile.value?.profileEdit?.canEdit))

const editWindowText = computed(() => {
  if (!profile.value?.profileEdit?.nextEditAt) return canEditProfile.value ? 'Available now' : 'Pending'
  return new Date(profile.value.profileEdit.nextEditAt).toLocaleDateString()
})

const isPartialAttendance = computed(() => form.attendanceLevel === 'Partial / Non-continuous attendance')

const profileItems = computed(() => [
  { label: 'Email', value: profile.value?.email },
  { label: 'Phone', value: profile.value?.phone },
  { label: 'Campus', value: profile.value?.campus },
  { label: 'Completion Year', value: profile.value?.gradYear },
  { label: 'Level Attended', value: profile.value?.period },
  { label: 'Occupation', value: profile.value?.occupation },
  { label: 'Location', value: [profile.value?.city, profile.value?.country].filter(Boolean).join(', ') },
  { label: 'House', value: profile.value?.house },
  { label: 'Bio', value: profile.value?.bio }
])

function cleanLocalPhone(value) {
  return String(value || '').replace(/[^\d]/g, '').replace(/^0+/, '')
}

function parsePhone(value) {
  const text = String(value || '').trim()
  const match = text.match(/^(\+\d{1,4})\s*(.*)$/)

  if (!match) {
    return {
      dialCode: defaultCountry().dialCode,
      local: cleanLocalPhone(text)
    }
  }

  return {
    dialCode: match[1],
    local: cleanLocalPhone(match[2])
  }
}

function fullPhone() {
  return `${form.phoneCountryCode} ${cleanLocalPhone(form.phoneLocal)}`.trim()
}

function parsePeriod(value) {
  const text = String(value || '').trim()

  if (!text) return { attendanceLevel: '', attendanceNote: '' }

  if (attendanceOptions.includes(text)) {
    return { attendanceLevel: text, attendanceNote: '' }
  }

  if (text.startsWith('Partial / Non-continuous attendance')) {
    return {
      attendanceLevel: 'Partial / Non-continuous attendance',
      attendanceNote: text.split(':').slice(1).join(':').trim()
    }
  }

  return {
    attendanceLevel: 'Partial / Non-continuous attendance',
    attendanceNote: text
  }
}

function buildPeriod() {
  if (!form.attendanceLevel) return ''

  if (isPartialAttendance.value && form.attendanceNote.trim()) {
    return `${form.attendanceLevel}: ${form.attendanceNote.trim()}`
  }

  return form.attendanceLevel
}

function fillForm(data) {
  const parsedPhone = parsePhone(data.phone)
  const parsedPeriod = parsePeriod(data.period)
  const inferredCountry = findCountryByDialCode(parsedPhone.dialCode)

  Object.assign(form, {
    phoneCountryCode: parsedPhone.dialCode,
    phoneLocal: parsedPhone.local,
    occupation: data.occupation || '',
    city: data.city || '',
    country: data.country || inferredCountry.name || defaultCountry().name,
    house: data.house || '',
    attendanceLevel: parsedPeriod.attendanceLevel,
    attendanceNote: parsedPeriod.attendanceNote,
    bio: data.bio || ''
  })
}

async function loadProfile() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await api.get('/me')
    profile.value = data
    fillForm(data)
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  error.value = ''
  message.value = ''

  try {
    const payload = {
      phone: fullPhone(),
      occupation: form.occupation,
      city: form.city,
      country: form.country,
      house: form.house,
      period: buildPeriod(),
      bio: form.bio
    }

    const { data } = await api.put('/me', payload)
    profile.value = data
    fillForm(data)
    editing.value = false
    message.value = 'Profile updated successfully. Your next normal edit window is after 12 months.'
  } catch (e) {
    error.value = e.response?.data?.error || 'Profile update failed'
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>
