<template>
  <section class="mx-auto max-w-6xl space-y-6">
    <section class="overflow-hidden rounded-3xl bg-navy text-white shadow-xl">
      <div class="relative p-6 md:p-8">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,211,77,0.26),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_35%)]"></div>
        <div class="relative z-10">
          <p class="font-bold text-gold">Join the SACCO</p>
          <h1 class="mt-2 text-3xl font-black md:text-5xl">Start your SHOSA SACCO membership</h1>
          <p class="mt-3 max-w-3xl leading-7 text-slate-200">
            Choose your saver tier, upload required SACCO onboarding documents, and submit your registration for admin verification.
          </p>
        </div>
      </div>
    </section>

    <div class="grid gap-5 md:grid-cols-4">
      <div class="card">
        <p class="font-bold text-gold">1</p>
        <h3 class="text-xl font-black">Pick tier</h3>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Starter, Standard or Growth saver.</p>
      </div>

      <div class="card">
        <p class="font-bold text-gold">2</p>
        <h3 class="text-xl font-black">Registration fee</h3>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">UGX 50,000 registration fee for every member.</p>
      </div>

      <div class="card">
        <p class="font-bold text-gold">3</p>
        <h3 class="text-xl font-black">Upload documents</h3>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Passport photo, ID, form and payment proof.</p>
      </div>

      <div class="card">
        <p class="font-bold text-gold">4</p>
        <h3 class="text-xl font-black">Admin approval</h3>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Docs and payment must be verified before activation.</p>
      </div>
    </div>

    <form class="grid gap-6 xl:grid-cols-[.9fr_1.1fr]" @submit.prevent="submit">
      <section class="card h-fit space-y-4">
        <div>
          <p class="font-bold text-gold">SACCO plan</p>
          <h2 class="text-2xl font-black text-navy dark:text-gold">Membership request</h2>
        </div>

        <div>
          <label class="label">Membership Type</label>
          <select v-model="form.membershipType" class="input">
            <option v-for="plan in membershipPlans" :key="plan.value" :value="plan.value">
              {{ plan.label }}
            </option>
          </select>
          <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {{ activePlan.description }}
          </p>
        </div>

        <div class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Annual subscription after activation</p>
          <p class="mt-1 text-2xl font-black text-navy dark:text-gold">{{ money(activePlan.annualSubscription) }}</p>
          <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            First annual subscription becomes due 6 months after SACCO activation, then yearly.
          </p>
        </div>

        <div>
          <label class="label">Planned Contribution Option</label>
          <select v-model="form.monthlyContribution" class="input" required>
            <option value="">Select contribution option</option>
            <option v-for="option in activePlan.contributionOptions" :key="option.value" :value="String(option.value)">
              {{ option.label }}
            </option>
          </select>
          <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Contribution options are fixed according to your selected membership type.
          </p>
        </div>

        <div>
          <label class="label">Preferred Start Date</label>
          <input v-model="form.startDate" class="input" type="date" />
        </div>

        <div class="rounded-2xl bg-gold/15 p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Registration Fee</p>
          <p class="mt-1 text-2xl font-black text-navy dark:text-gold">UGX 50,000</p>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
            This payment will be submitted for admin verification.
          </p>
        </div>

        <div>
          <label class="label">Payment Phone</label>
          <input v-model.trim="form.phone" class="input" placeholder="+256 778120798" />
        </div>

        <div>
          <label class="label">Payment Network</label>
          <select v-model="form.network" class="input">
            <option>MTN Mobile Money</option>
            <option>Airtel Money</option>
            <option>Bank Transfer</option>
            <option>Cash / Manual Deposit</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label class="label">Transaction Reference</label>
          <input v-model.trim="form.transactionRef" class="input" placeholder="Enter reference if payment has already been made" />
        </div>

        <label class="flex items-start gap-3 rounded-2xl bg-cream p-4 text-sm dark:bg-slate-800">
          <input v-model="form.consent" type="checkbox" required class="mt-1" />
          <span>
            I understand SACCO membership becomes active only after admin verification of required documents and the UGX 50,000 registration payment.
          </span>
        </label>
      </section>

      <section class="card space-y-5">
        <div>
          <p class="font-bold text-gold">SACCO onboarding documents</p>
          <h2 class="text-2xl font-black text-navy dark:text-gold">Upload required files</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Files are automatically stored in private Admin Files and marked pending verification.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="doc in documentRequirements"
            :key="doc.type"
            class="rounded-3xl border-2 border-dashed p-4 transition"
            :class="[
              draggingType === doc.type ? 'border-gold bg-gold/10 shadow-lg' : 'border-slate-200 dark:border-slate-700',
              doc.required ? 'bg-white dark:bg-slate-900' : 'bg-cream/60 dark:bg-slate-800/60'
            ]"
            @dragenter.prevent="draggingType = doc.type"
            @dragover.prevent="draggingType = doc.type"
            @dragleave.prevent="draggingType = ''"
            @drop.prevent="handleDrop(doc.type, $event)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide" :class="doc.required ? 'text-gold' : 'text-slate-400'">
                  {{ doc.required ? 'Required' : 'Optional' }}
                </p>
                <h3 class="mt-1 font-black text-navy dark:text-white">{{ doc.label }}</h3>
                <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{{ doc.help }}</p>
              </div>

              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-xs font-black text-gold">
                {{ doc.icon }}
              </div>
            </div>

            <div v-if="files[doc.type]" class="mt-4 rounded-2xl bg-cream p-3 dark:bg-slate-800">
              <p class="truncate font-black text-navy dark:text-gold">{{ files[doc.type].name }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ files[doc.type].type || 'Unknown type' }} • {{ fileSize(files[doc.type].size) }}</p>
              <button type="button" class="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white" @click="clearFile(doc.type)">
                Remove
              </button>
            </div>

            <div v-else class="mt-4 rounded-2xl bg-cream p-4 text-center dark:bg-slate-800">
              <p class="text-sm font-semibold text-slate-500">Drop file here or choose from device.</p>
            </div>

            <div class="mt-4">
              <button type="button" class="btn-secondary w-full" @click="openPicker(doc.type)">
                {{ files[doc.type] ? 'Change file' : 'Choose file' }}
              </button>

              <input
                :ref="el => setInputRef(doc.type, el)"
                type="file"
                :accept="doc.accept"
                class="hidden"
                @change="event => onFileChange(doc.type, event)"
              />
            </div>
          </article>
        </div>

        <p v-if="message" class="rounded-lg bg-green-100 p-3 text-green-700">{{ message }}</p>
        <p v-if="error" class="rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>

        <button class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Submitting...' : 'Submit SACCO Registration + Documents' }}
        </button>
      </section>
    </form>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const message = ref('')
const draggingType = ref('')
const inputRefs = ref({})

const membershipPlans = [
  {
    value: 'starter',
    label: 'Youth / Starter Saver',
    annualSubscription: 50000,
    description: 'Best for recent S.4/S.6 leavers, students and early-stage alumni starting small but consistently.',
    contributionOptions: [
      { value: 30000, label: 'UGX 30,000 monthly / UGX 120,000 quarterly' }
    ]
  },
  {
    value: 'ordinary',
    label: 'Standard Saver',
    annualSubscription: 100000,
    description: 'Best for working alumni who want a stronger regular SACCO savings rhythm.',
    contributionOptions: [
      { value: 50000, label: 'UGX 50,000 monthly / UGX 200,000 quarterly' }
    ]
  },
  {
    value: 'growth',
    label: 'Growth / Support Saver',
    annualSubscription: 100000,
    description: 'Best for alumni who want to save more aggressively or support SACCO growth.',
    contributionOptions: [
      { value: 100000, label: 'UGX 100,000 monthly / UGX 400,000 quarterly' },
      { value: 200000, label: 'UGX 200,000 monthly / UGX 800,000 quarterly' },
      { value: 500000, label: 'UGX 500,000 monthly / UGX 1,500,000 quarterly' }
    ]
  }
]

const documentRequirements = [
  {
    type: 'sacco_passport_photo',
    label: 'Passport-size photo',
    required: true,
    icon: 'PIC',
    accept: 'image/jpeg,image/png,image/webp',
    help: 'Separate from profile photo. Use a clean passport-style image.'
  },
  {
    type: 'sacco_identity_document',
    label: 'National ID / Passport',
    required: true,
    icon: 'ID',
    accept: 'application/pdf,image/jpeg,image/png,image/webp',
    help: 'Upload national ID, passport bio page, or approved identity document.'
  },
  {
    type: 'sacco_application_form',
    label: 'Signed SACCO application / declaration',
    required: true,
    icon: 'APP',
    accept: 'application/pdf,image/jpeg,image/png,image/webp',
    help: 'Signed membership/application declaration document.'
  },
  {
    type: 'sacco_registration_fee_proof',
    label: 'Proof of registration fee payment',
    required: true,
    icon: 'PAY',
    accept: 'application/pdf,image/jpeg,image/png,image/webp',
    help: 'Mobile money screenshot, bank slip, cash receipt, or other proof.'
  },
  {
    type: 'sacco_guardian_consent',
    label: 'Guardian / next-of-kin consent',
    required: false,
    icon: 'KIN',
    accept: 'application/pdf,image/jpeg,image/png,image/webp',
    help: 'Use where SACCO policy requires guardian/next-of-kin support.'
  },
  {
    type: 'sacco_student_or_income_proof',
    label: 'Student / employment / income proof',
    required: false,
    icon: 'SRC',
    accept: 'application/pdf,image/jpeg,image/png,image/webp',
    help: 'Optional supporting document for student or income category.'
  }
]

const form = reactive({
  membershipType: 'starter',
  monthlyContribution: '',
  startDate: '',
  phone: '',
  network: 'MTN Mobile Money',
  transactionRef: '',
  consent: false
})

const files = reactive({
  sacco_passport_photo: null,
  sacco_identity_document: null,
  sacco_application_form: null,
  sacco_registration_fee_proof: null,
  sacco_guardian_consent: null,
  sacco_student_or_income_proof: null
})

const activePlan = computed(() => {
  return membershipPlans.find(plan => plan.value === form.membershipType) || membershipPlans[0]
})

watch(
  () => form.membershipType,
  () => {
    form.monthlyContribution = String(activePlan.value.contributionOptions[0]?.value || '')
  },
  { immediate: true }
)

function money(value) {
  return 'UGX ' + Number(value || 0).toLocaleString('en-UG')
}

function fileSize(bytes) {
  const value = Number(bytes || 0)
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(value / 1024))} KB`
}

function setInputRef(type, element) {
  if (element) inputRefs.value[type] = element
}

function openPicker(type) {
  inputRefs.value[type]?.click()
}

function allowedForType(type, file) {
  if (!file) return false

  const extension = file.name?.split('.').pop()?.toLowerCase()
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp']
  const documentExtensions = ['pdf', ...imageExtensions]

  if (type === 'sacco_passport_photo') {
    return file.type.startsWith('image/') || imageExtensions.includes(extension)
  }

  return file.type === 'application/pdf' || file.type.startsWith('image/') || documentExtensions.includes(extension)
}

function setFile(type, file) {
  error.value = ''
  message.value = ''

  if (!file) {
    files[type] = null
    return
  }

  if (!allowedForType(type, file)) {
    files[type] = null
    error.value = type === 'sacco_passport_photo'
      ? 'Passport-size photo must be JPG, PNG or WEBP.'
      : 'Only PDF, JPG, PNG or WEBP files are allowed.'
    return
  }

  files[type] = file
}

function onFileChange(type, event) {
  setFile(type, event.target.files?.[0] || null)
  event.target.value = ''
}

function handleDrop(type, event) {
  draggingType.value = ''
  setFile(type, event.dataTransfer?.files?.[0] || null)
}

function clearFile(type) {
  files[type] = null
}

function missingRequiredDocuments() {
  return documentRequirements
    .filter(doc => doc.required && !files[doc.type])
    .map(doc => doc.label)
}

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const missing = missingRequiredDocuments()
    if (missing.length) {
      throw new Error(`Please upload required document(s): ${missing.join(', ')}`)
    }

    if (!form.monthlyContribution) {
      throw new Error('Please select a planned contribution option.')
    }

    const payload = new FormData()

    payload.append('membershipType', form.membershipType)
    payload.append('monthlyContribution', form.monthlyContribution)
    payload.append('startDate', form.startDate)
    payload.append('phone', form.phone)
    payload.append('network', form.network)
    payload.append('transactionRef', form.transactionRef)
    payload.append('consent', form.consent ? 'true' : 'false')

    Object.entries(files).forEach(([type, file]) => {
      if (file) payload.append(type, file)
    })

    await api.post('/sacco/register', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    message.value = 'SACCO request and documents submitted. Redirecting to SACCO dashboard...'
    setTimeout(() => router.push('/sacco/dashboard'), 900)
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'SACCO registration failed'
  } finally {
    loading.value = false
  }
}
</script>

