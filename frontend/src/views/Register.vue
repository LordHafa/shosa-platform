<template>
  <section class="mx-auto max-w-7xl space-y-8">
    <section class="overflow-hidden rounded-3xl bg-navy text-white shadow-2xl">
      <div class="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div class="relative flex items-center p-6 md:p-10">
          <div class="absolute inset-0 opacity-20">
            <img src="/assets/reference/alumni-orientation.jpg" alt="SHOSA registration" class="h-full w-full object-cover" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-slate-950"></div>

          <div class="relative z-10 max-w-3xl">
            <p class="inline-flex rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gold">
              SHOSA membership
            </p>
            <h1 class="mt-5 text-4xl font-black leading-tight md:text-6xl">
              Create your alumni profile.
            </h1>
            <p class="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              Register once with a clean SHOSA record, clear profile photo, correct contact details, campus, completion year and attendance history.
            </p>

            <div class="mt-8 grid gap-3 sm:grid-cols-4">
              <div v-for="step in journey" :key="step.title" class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p class="font-black text-gold">{{ step.no }}</p>
                <p class="mt-2 text-sm font-black">{{ step.title }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="relative min-h-[360px] bg-slate-950">
          <img src="/assets/reference/seeta-gallery-2.jpg" alt="SHOSA alumni memory" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent"></div>

          <article class="absolute bottom-5 left-5 right-5 rounded-3xl bg-navy/85 p-5 text-white shadow-2xl backdrop-blur">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-gold">Why this matters</p>
            <h2 class="mt-2 text-2xl font-black">One verified record unlocks the network.</h2>
            <p class="mt-2 text-sm leading-6 text-slate-200">
              Your profile powers alumni verification, SACCO onboarding, payments, communication, events, gallery visibility and official records.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[380px_1fr]">
      <aside class="space-y-6">
        <div class="card">
          <p class="font-bold text-gold">Profile photo</p>
          <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">Add a clear face photo.</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            This is different from the SACCO passport photo. It helps admins identify and verify real SHOSA alumni accounts.
          </p>

          <div
            class="mt-5 rounded-3xl border-2 border-dashed border-gold/60 bg-gradient-to-br from-gold/10 via-cream to-white p-5 text-center transition dark:from-gold/10 dark:via-slate-900 dark:to-slate-950"
            :class="isDragging ? 'scale-[1.01] border-gold shadow-xl' : ''"
            @dragenter.prevent="isDragging = true"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handlePhotoDrop"
          >
            <div class="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] bg-navy text-sm font-black text-gold shadow ring-4 ring-gold/25">
              <img v-if="photoPreview" :src="photoPreview" alt="Selected profile photo" class="h-full w-full object-cover" />
              <span v-else>PHOTO</span>
            </div>

            <h3 class="mt-4 text-xl font-black text-navy dark:text-gold">Drop or choose photo</h3>
            <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
              JPG, PNG or WEBP. Use a clear image that can represent your alumni profile.
            </p>

            <div class="mt-4 grid gap-3">
              <button type="button" class="btn-primary" @click="openPhotoPicker">
                {{ photoFile ? 'Change photo' : 'Choose photo' }}
              </button>

              <button
                v-if="photoFile"
                type="button"
                class="rounded-xl border border-slate-300 px-5 py-3 font-bold text-navy dark:text-white"
                @click="clearPhotoSelection"
              >
                Remove photo
              </button>
            </div>

            <input
              ref="photoInput"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="onPhotoChange"
            />

            <p v-if="photoFile" class="mx-auto mt-3 max-w-sm truncate rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-navy dark:bg-slate-800 dark:text-gold">
              {{ photoFile.name }}
            </p>
          </div>
        </div>

        <div class="card">
          <p class="font-bold text-gold">After registration</p>
          <div class="mt-4 space-y-3">
            <div v-for="item in afterRegister" :key="item.title" class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
              <p class="font-black text-navy dark:text-gold">{{ item.title }}</p>
              <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ item.text }}</p>
            </div>
          </div>
        </div>
      </aside>

      <form class="card space-y-7" @submit.prevent="submit">
        <div>
          <p class="font-bold text-gold">Alumni record</p>
          <h2 class="text-3xl font-black text-navy dark:text-gold">Your SHOSA identity details</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Keep names, campus and completion year accurate. These become your official alumni record.
          </p>
        </div>

        <section class="space-y-4">
          <h3 class="rounded-2xl bg-navy px-4 py-3 font-black text-gold">1. Names and login</h3>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="label">First Name *</label>
              <input v-model.trim="form.firstName" class="input" required />
            </div>

            <div>
              <label class="label">Last Name *</label>
              <input v-model.trim="form.lastName" class="input" required />
            </div>

            <div>
              <label class="label">Other Names / Middle Name</label>
              <input v-model.trim="form.otherNames" class="input" />
            </div>

            <div>
              <label class="label">Email *</label>
              <input v-model.trim="form.email" class="input" type="email" required />
            </div>

            <div>
              <label class="label">Password *</label>
              <input v-model="form.password" class="input" type="password" minlength="8" required />
            </div>

            <div>
              <label class="label">Confirm Password *</label>
              <input v-model="form.passwordConfirm" class="input" type="password" minlength="8" required />
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="rounded-2xl bg-navy px-4 py-3 font-black text-gold">2. Contact and location</h3>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="label">Country Code *</label>
              <select v-model="form.phoneCountryCode" class="input" required>
                <option v-for="item in dialCodeOptions" :key="`${item.country}-${item.value}`" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="label">Phone / WhatsApp *</label>
              <input v-model.trim="form.phoneLocal" class="input" inputmode="tel" required placeholder="778120798" />
            </div>

            <div>
              <label class="label">Country *</label>
              <select v-model="form.country" class="input" required>
                <option v-for="country in countries" :key="country.code" :value="country.name">{{ country.name }}</option>
              </select>
            </div>

            <div>
              <label class="label">City</label>
              <input v-model.trim="form.city" class="input" placeholder="e.g. Kampala, London, Dubai" />
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="rounded-2xl bg-navy px-4 py-3 font-black text-gold">3. Seeta High record</h3>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="label">Gender</label>
              <select v-model="form.gender" class="input">
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>

            <div>
              <label class="label">Campus *</label>
              <select v-model="form.campus" class="input" required>
                <option value="">Select campus</option>
                <option>Main Campus</option>
                <option>Mbalala Campus</option>
                <option>Green Campus</option>
                <option>A Level Campus</option>
              </select>
            </div>

            <div>
              <label class="label">Graduation / Completion Year *</label>
              <input
                v-model.number="form.gradYear"
                class="input"
                type="number"
                inputmode="numeric"
                min="2000"
                max="2100"
                required
                placeholder="e.g. 2014"
              />
            </div>

            <div>
              <label class="label">Level / Section Attended *</label>
              <select v-model="form.attendanceLevel" class="input" required>
                <option value="">Select level attended</option>
                <option v-for="option in attendanceOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>

            <div v-if="isPartialAttendance" class="md:col-span-2">
              <label class="label">Brief Attendance Note</label>
              <input v-model.trim="form.attendanceNote" class="input" placeholder="e.g. Joined in S.2, left after S.3" />
            </div>

            <div>
              <label class="label">House</label>
              <input v-model.trim="form.house" class="input" placeholder="If applicable" />
            </div>

            <div>
              <label class="label">Occupation</label>
              <input v-model.trim="form.occupation" class="input" placeholder="e.g. Software Developer" />
            </div>
          </div>
        </section>

        <label class="flex items-start gap-3 rounded-2xl bg-cream p-4 text-sm leading-6 dark:bg-slate-800">
          <input v-model="form.consent" type="checkbox" required class="mt-1" />
          <span>
            I confirm that the information provided is accurate and consent to SHOSA using it for alumni membership,
            communication, SACCO onboarding, and official record keeping.
          </span>
        </label>

        <p v-if="message" class="rounded-lg bg-green-100 p-3 text-green-700">{{ message }}</p>
        <p v-if="error" class="rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>

        <button class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create SHOSA Alumni Account' }}
        </button>

        <p class="text-center text-sm text-slate-500">
          Already registered?
          <router-link to="/login" class="font-black text-navy hover:text-gold dark:text-gold">Login here</router-link>
        </p>
      </form>
    </section>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { countries, defaultCountry, dialCodeOptions } from '../data/countries'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const error = ref('')
const message = ref('')
const photoFile = ref(null)
const photoPreview = ref('')
const photoInput = ref(null)
const isDragging = ref(false)

const journey = [
  { no: '01', title: 'Create profile' },
  { no: '02', title: 'Admin verifies' },
  { no: '03', title: 'Join SACCO' },
  { no: '04', title: 'Participate' }
]

const afterRegister = [
  { title: 'Admin verification', text: 'Your record can be reviewed before full alumni status is confirmed.' },
  { title: 'Profile access', text: 'You can manage your alumni identity, photo, contact, location and bio.' },
  { title: 'SACCO onboarding', text: 'After login, you can submit SACCO registration documents and payment proof.' }
]

const attendanceOptions = [
  'S.1 - S.4 / O-Level',
  'S.5 - S.6 / A-Level',
  'S.1 - S.6 / O-Level and A-Level',
  'Partial / Non-continuous attendance'
]

const form = reactive({
  firstName: '',
  lastName: '',
  otherNames: '',
  email: '',
  phoneCountryCode: defaultCountry().dialCode,
  phoneLocal: '',
  gender: '',
  campus: '',
  gradYear: '',
  attendanceLevel: '',
  attendanceNote: '',
  house: '',
  occupation: '',
  city: '',
  country: defaultCountry().name,
  password: '',
  passwordConfirm: '',
  consent: false
})

const isPartialAttendance = computed(() => form.attendanceLevel === 'Partial / Non-continuous attendance')

function cleanLocalPhone(value) {
  return String(value || '').replace(/[^\d]/g, '').replace(/^0+/, '')
}

function fullPhone() {
  return `${form.phoneCountryCode} ${cleanLocalPhone(form.phoneLocal)}`.trim()
}

function buildPeriod() {
  if (!form.attendanceLevel) return ''

  if (isPartialAttendance.value && form.attendanceNote.trim()) {
    return `${form.attendanceLevel}: ${form.attendanceNote.trim()}`
  }

  return form.attendanceLevel
}

function openPhotoPicker() {
  photoInput.value?.click()
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

function clearPhotoSelection() {
  photoFile.value = null
  clearPhotoPreview()
}

function setPhotoFile(file) {
  error.value = ''
  message.value = ''

  if (!file) {
    clearPhotoSelection()
    return
  }

  if (!isAllowedImage(file)) {
    clearPhotoSelection()
    error.value = 'Please choose a JPG, PNG or WEBP image.'
    return
  }

  clearPhotoPreview()
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

function onPhotoChange(event) {
  setPhotoFile(event.target.files?.[0] || null)
  event.target.value = ''
}

function handlePhotoDrop(event) {
  isDragging.value = false
  setPhotoFile(event.dataTransfer?.files?.[0] || null)
}

function appendFormData(fd, key, value) {
  fd.append(key, value == null ? '' : String(value))
}

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    if (form.password !== form.passwordConfirm) throw new Error('Passwords do not match')
    if (!cleanLocalPhone(form.phoneLocal)) throw new Error('Please enter a valid phone number')
    if (!form.consent) throw new Error('Please confirm your consent before registering')

    const payload = new FormData()

    appendFormData(payload, 'firstName', form.firstName)
    appendFormData(payload, 'lastName', form.lastName)
    appendFormData(payload, 'otherNames', form.otherNames)
    appendFormData(payload, 'email', form.email)
    appendFormData(payload, 'phone', fullPhone())
    appendFormData(payload, 'gender', form.gender)
    appendFormData(payload, 'campus', form.campus)
    appendFormData(payload, 'gradYear', form.gradYear)
    appendFormData(payload, 'period', buildPeriod())
    appendFormData(payload, 'house', form.house)
    appendFormData(payload, 'occupation', form.occupation)
    appendFormData(payload, 'city', form.city)
    appendFormData(payload, 'country', form.country)
    appendFormData(payload, 'password', form.password)
    appendFormData(payload, 'passwordConfirm', form.passwordConfirm)

    if (photoFile.value) payload.append('photo', photoFile.value)

    await auth.register(payload)

    message.value = 'Registration successful. Redirecting to login...'
    setTimeout(() => router.push('/login'), 900)
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  clearPhotoPreview()
})
</script>