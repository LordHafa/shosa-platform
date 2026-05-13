<template>
  <section class="mx-auto max-w-5xl space-y-6">
    <div class="rounded-3xl bg-navy p-6 text-white shadow-xl md:p-8">
      <p class="font-bold text-gold">Seeta Alumni membership</p>
      <h1 class="mt-2 text-3xl font-black md:text-4xl">Create your alumni profile</h1>
      <p class="mt-3 max-w-3xl leading-7 text-slate-200">
        Register once with a clean alumni record, profile photo, correct phone code, country, campus, and completion year.
      </p>
    </div>

    <form class="card grid gap-4 md:grid-cols-2" @submit.prevent="submit">
      <div class="md:col-span-2">
        <label class="label">Profile photo</label>

        <div
          class="rounded-3xl border-2 border-dashed border-gold/60 bg-gradient-to-br from-gold/10 via-cream to-white p-5 text-center transition dark:from-gold/10 dark:via-slate-900 dark:to-slate-950"
          :class="isDragging ? 'border-gold shadow-lg' : ''"
          @dragenter.prevent="isDragging = true"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handlePhotoDrop"
        >
          <div class="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-navy text-sm font-black text-gold shadow ring-4 ring-gold/20">
            <img v-if="photoPreview" :src="photoPreview" alt="Selected profile photo" class="h-full w-full object-cover" />
            <span v-else>PHOTO</span>
          </div>

          <h3 class="mt-4 text-xl font-black text-navy dark:text-gold">Add a clear profile photo</h3>
          <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            This helps admins verify real alumni records. Use JPG, PNG or WEBP.
          </p>

          <div class="mt-4 grid gap-3 sm:flex sm:justify-center">
            <button type="button" class="btn-secondary" @click="openPhotoPicker">
              {{ photoFile ? 'Change photo' : 'Choose photo' }}
            </button>

            <button v-if="photoFile" type="button" class="rounded-xl border border-slate-300 px-5 py-3 font-bold text-navy dark:text-white" @click="clearPhotoSelection">
              Remove
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
            Selected: {{ photoFile.name }}
          </p>
        </div>
      </div>

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
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">This is your main alumni year group.</p>
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
        <label class="label">Country *</label>
        <select v-model="form.country" class="input" required>
          <option v-for="country in countries" :key="country.code" :value="country.name">{{ country.name }}</option>
        </select>
      </div>

      <div>
        <label class="label">City</label>
        <input v-model.trim="form.city" class="input" placeholder="e.g. Kampala, London, Dubai" />
      </div>

      <div>
        <label class="label">House</label>
        <input v-model.trim="form.house" class="input" placeholder="If applicable" />
      </div>

      <div>
        <label class="label">Occupation</label>
        <input v-model.trim="form.occupation" class="input" placeholder="e.g. Software Developer" />
      </div>

      <div>
        <label class="label">Password *</label>
        <input v-model="form.password" class="input" type="password" minlength="8" required />
      </div>

      <div>
        <label class="label">Confirm Password *</label>
        <input v-model="form.passwordConfirm" class="input" type="password" minlength="8" required />
      </div>

      <label class="md:col-span-2 flex items-start gap-3 rounded-2xl bg-cream p-4 text-sm dark:bg-slate-800">
        <input v-model="form.consent" type="checkbox" required class="mt-1" />
        <span>
          I confirm that the information provided is accurate and consent to Seeta Alumni Association using it for alumni membership, communication, SACCO onboarding, and official record keeping.
        </span>
      </label>

      <p v-if="message" class="md:col-span-2 rounded-lg bg-green-100 p-3 text-green-700">{{ message }}</p>
      <p v-if="error" class="md:col-span-2 rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>

      <button class="btn-primary md:col-span-2" :disabled="loading">
        {{ loading ? 'Registering...' : 'Create Alumni Account' }}
      </button>
    </form>
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

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    if (form.password !== form.passwordConfirm) throw new Error('Passwords do not match')
    if (!cleanLocalPhone(form.phoneLocal)) throw new Error('Please enter a valid phone number')

    const payload = new FormData()

    payload.append('firstName', form.firstName)
    payload.append('lastName', form.lastName)
    payload.append('otherNames', form.otherNames)
    payload.append('email', form.email)
    payload.append('phone', fullPhone())
    payload.append('gender', form.gender)
    payload.append('campus', form.campus)
    payload.append('gradYear', form.gradYear)
    payload.append('period', buildPeriod())
    payload.append('house', form.house)
    payload.append('occupation', form.occupation)
    payload.append('city', form.city)
    payload.append('country', form.country)
    payload.append('password', form.password)
    payload.append('passwordConfirm', form.passwordConfirm)
    payload.append('consent', form.consent ? 'true' : 'false')

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
