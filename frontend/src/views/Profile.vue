<template>
  <section class="mx-auto max-w-7xl space-y-8">
    <section class="overflow-hidden rounded-3xl bg-navy text-white shadow-2xl">
      <div class="relative p-6 md:p-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,211,77,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_35%)]"></div>

        <div class="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="font-bold text-gold">My alumni profile</p>
            <h1 class="mt-2 text-3xl font-black leading-tight md:text-5xl">
              {{ profile?.displayName || 'SHOSA Alumni Member' }}
            </h1>
            <p class="mt-4 max-w-3xl leading-8 text-slate-200">
              Your official SHOSA identity record. Keep the public-safe details clean, current and easy for administrators to verify.
            </p>
          </div>

          <router-link to="/alumni/dashboard" class="inline-flex min-h-11 items-center justify-center rounded-xl border border-gold px-5 py-3 font-bold text-gold hover:bg-gold hover:text-navy">
            Back to dashboard
          </router-link>
        </div>
      </div>
    </section>

    <div v-if="loading" class="card">Loading profile...</div>

    <template v-else>
      <section class="grid gap-6 lg:grid-cols-[380px_1fr]">
        <aside class="space-y-6">
          <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div class="bg-gradient-to-br from-navy via-navy to-slate-950 p-6 text-white">
              <div class="mx-auto h-44 w-44 overflow-hidden rounded-[2.25rem] bg-white ring-4 ring-gold/40">
                <img :src="photoUrl" alt="Profile photo" class="h-full w-full object-cover" />
              </div>

              <div class="mt-5 text-center">
                <h2 class="text-2xl font-black">{{ profile?.displayName || 'Alumni Member' }}</h2>
                <p class="mt-1 text-sm text-slate-300">{{ profile?.campus || '-' }} • {{ profile?.gradYear || '-' }}</p>
                <span :class="statusPill(profile?.verificationStatus)" class="mt-3 inline-flex">
                  {{ profile?.verificationStatus || 'pending' }}
                </span>
              </div>
            </div>

            <div class="space-y-4 p-5">
              <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
                <p class="text-xs font-black uppercase tracking-wide text-slate-500">SACCO status</p>
                <p class="mt-1 text-lg font-black text-navy dark:text-gold">{{ profile?.saccoMembership?.status || 'not joined' }}</p>
              </div>

              <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
                <p class="text-xs font-black uppercase tracking-wide text-slate-500">Next normal profile edit</p>
                <p class="mt-1 text-lg font-black text-navy dark:text-gold">{{ editWindowText }}</p>
              </div>
            </div>
          </article>

          <article class="card">
            <p class="font-bold text-gold">Profile photo</p>
            <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">Update your face photo</h2>
            <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use a clear alumni profile photo. This is separate from the SACCO passport-size photo.
            </p>

            <div class="mt-4 grid gap-3">
              <button type="button" class="btn-secondary" @click="openPhotoPicker">
                {{ photoFile ? 'Change selected photo' : 'Choose photo' }}
              </button>

              <button
                class="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                :disabled="!photoFile || photoLoading"
                @click="uploadPhoto"
              >
                {{ photoLoading ? 'Uploading...' : 'Upload photo' }}
              </button>
            </div>

            <input
              ref="photoInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onPhotoChange"
            />

            <div v-if="photoPreview" class="mt-4 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              <img :src="photoPreview" alt="New profile preview" class="h-56 w-full object-cover" />
            </div>
          </article>
        </aside>

        <div class="space-y-6">
          <article class="card">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="font-bold text-gold">Official record</p>
                <h2 class="mt-1 text-3xl font-black text-navy dark:text-gold">Profile details</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  These details support alumni identification, communication and SACCO onboarding.
                </p>
              </div>

              <button
                v-if="canEditProfile && !editing"
                class="btn-primary"
                type="button"
                @click="editing = true"
              >
                Edit profile
              </button>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div
                v-for="item in profileItems"
                :key="item.label"
                class="rounded-2xl bg-cream p-4 dark:bg-slate-800"
                :class="item.label === 'Bio' ? 'md:col-span-2' : ''"
              >
                <p class="text-xs font-black uppercase tracking-wide text-slate-500">{{ item.label }}</p>
                <p class="mt-2 font-black leading-7 text-navy dark:text-gold">{{ item.value || '-' }}</p>
              </div>
            </div>
          </article>

          <article v-if="!canEditProfile && !editing" class="rounded-3xl border border-gold/40 bg-gold/10 p-6">
            <p class="font-black text-navy dark:text-gold">Profile editing is locked</p>
            <p class="mt-2 leading-7 text-slate-700 dark:text-slate-300">
              Normal alumni profile editing is available once every 12 months. Your next edit window is
              <strong>{{ editWindowText }}</strong>. For urgent corrections, contact an administrator.
            </p>
          </article>

          <article v-if="editing" class="card">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="font-bold text-gold">Annual update</p>
                <h2 class="text-3xl font-black text-navy dark:text-gold">Update safe profile fields</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Names, campus and completion year are controlled by admin verification. Update contact and public-safe profile details here.
                </p>
              </div>

              <button type="button" class="btn-secondary" @click="cancelEdit">Cancel</button>
            </div>

            <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="saveProfile">
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
          </article>
        </div>
      </section>

      <p v-if="message && !editing" class="rounded-lg bg-green-100 p-3 text-green-700">{{ message }}</p>
      <p v-if="error && !editing" class="rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>
    </template>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import api, { UPLOADS_URL } from '../api'
import { countries, defaultCountry, dialCodeOptions, findCountryByDialCode } from '../data/countries'

const profile = ref(null)
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const photoLoading = ref(false)
const error = ref('')
const message = ref('')
const photoFile = ref(null)
const photoPreview = ref('')
const photoInput = ref(null)

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
  return profile.value?.profilePhoto ? `${UPLOADS_URL}${profile.value.profilePhoto}` : '/assets/brand/shosa-primary-logo-web.png'
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

function statusPill(status) {
  const normalized = String(status || '').toLowerCase()
  const base = 'inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide'

  if (normalized === 'verified' || normalized === 'approved' || normalized === 'active') {
    return `${base} bg-green-100 text-green-700`
  }

  if (normalized === 'pending') {
    return `${base} bg-gold px-3 py-1 text-navy`
  }

  if (normalized === 'rejected' || normalized === 'suspended') {
    return `${base} bg-red-100 text-red-700`
  }

  return `${base} bg-slate-100 text-slate-600`
}

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

function cancelEdit() {
  fillForm(profile.value || {})
  editing.value = false
  error.value = ''
  message.value = ''
}

function isAllowedImage(file) {
  const typeOk = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  const extOk = /\.(jpe?g|png|webp)$/i.test(file.name)
  return typeOk || extOk
}

function clearPhotoPreview() {
  if (photoPreview.value) {
    URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = ''
  }
}

function openPhotoPicker() {
  photoInput.value?.click()
}

function onPhotoChange(event) {
  const file = event.target.files?.[0] || null
  event.target.value = ''

  error.value = ''
  message.value = ''

  if (!file) return

  if (!isAllowedImage(file)) {
    photoFile.value = null
    clearPhotoPreview()
    error.value = 'Please choose a JPG, PNG or WEBP image.'
    return
  }

  clearPhotoPreview()
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
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

async function uploadPhoto() {
  if (!photoFile.value) return

  photoLoading.value = true
  error.value = ''
  message.value = ''

  try {
    const fd = new FormData()
    fd.append('photo', photoFile.value)

    await api.post('/profile/photo', fd)
    photoFile.value = null
    clearPhotoPreview()
    await loadProfile()
    message.value = 'Profile photo updated successfully.'
  } catch (e) {
    error.value = e.response?.data?.error || 'Photo upload failed'
  } finally {
    photoLoading.value = false
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

onBeforeUnmount(() => {
  clearPhotoPreview()
})
</script>