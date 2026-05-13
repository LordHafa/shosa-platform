<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-bold text-gold">Admin gallery management</p>
        <h1 class="text-3xl font-black text-navy dark:text-gold">Gallery Uploads</h1>
        <p class="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
          Upload public-safe alumni memories as a single image, a batch, or a whole folder. Folder/batch uploads use one
          collection title so the public Gallery can rotate the photos inside one clean container.
        </p>
      </div>

      <router-link class="btn-secondary" to="/admin">Back to dashboard</router-link>
    </div>

    <form class="card space-y-5" @submit.prevent="upload">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="label">Collection / Image Title *</label>
          <input
            v-model.trim="form.title"
            class="input"
            placeholder="e.g. SHOSA League and Sports"
            required
          />
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            For folder uploads, this becomes the public rotating collection title.
          </p>
        </div>

        <div>
          <label class="label">Category *</label>
          <select v-model="form.category" class="input">
            <option value="alumni_orientation">Alumni orientation</option>
            <option value="league_sports">League / sports</option>
            <option value="events">Events</option>
            <option value="career_guidance">Career guidance</option>
            <option value="dinners">Dinners</option>
            <option value="campuses">Campuses</option>
            <option value="sacco_activities">SACCO activities</option>
            <option value="mentorship">Mentorship</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="label">Description</label>
          <textarea
            v-model.trim="form.description"
            class="input min-h-28"
            placeholder="Short public-safe description for this memory collection"
          ></textarea>
        </div>
      </div>

      <div
        class="group rounded-3xl border-2 border-dashed border-gold/60 bg-gradient-to-br from-gold/15 via-cream to-white p-5 text-center transition hover:border-gold hover:shadow-xl dark:from-gold/10 dark:via-slate-900 dark:to-slate-950"
        :class="isDragging ? 'scale-[1.01] border-gold shadow-xl' : ''"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div class="mx-auto flex max-w-2xl flex-col items-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-navy text-2xl font-black text-gold shadow-lg">
            UP
          </div>

          <h2 class="mt-4 text-2xl font-black text-navy dark:text-gold">
            Drop memories here
          </h2>

          <p class="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Choose one image, select many images, or upload a whole folder from your computer.
            Accepted formats: JPG, PNG, WEBP.
          </p>

          <div class="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" class="btn-primary" @click="openSinglePicker">
              Choose single image
            </button>

            <button type="button" class="btn-secondary" @click="openMultiPicker">
              Choose many images
            </button>

            <button type="button" class="rounded-xl bg-navy px-5 py-3 font-bold text-gold shadow hover:opacity-90" @click="openFolderPicker">
              Upload folder
            </button>
          </div>

          <input
            ref="singleInput"
            class="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="handleFileSelect"
          />

          <input
            ref="multiInput"
            class="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            @change="handleFileSelect"
          />

          <input
            ref="folderInput"
            class="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            webkitdirectory
            directory
            @change="handleFileSelect"
          />
        </div>
      </div>

      <div v-if="selectedFiles.length" class="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-black text-navy dark:text-gold">
              {{ selectedFiles.length }} image{{ selectedFiles.length === 1 ? '' : 's' }} selected
            </h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ selectedFiles.length === 1 ? selectedFiles[0].name : 'Batch/folder upload ready' }}
            </p>
          </div>

          <button type="button" class="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white" @click="clearSelection">
            Clear
          </button>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="preview in previews"
            :key="preview.key"
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <img :src="preview.url" :alt="preview.name" class="h-32 w-full object-cover" />
            <div class="p-2">
              <p class="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{{ preview.name }}</p>
              <p v-if="preview.folder" class="truncate text-[11px] text-slate-400">{{ preview.folder }}</p>
            </div>
          </div>
        </div>

        <p v-if="selectedFiles.length > previews.length" class="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Showing first {{ previews.length }} previews. All {{ selectedFiles.length }} selected images will upload.
        </p>
      </div>

      <div v-if="uploading" class="rounded-2xl bg-gold/20 p-4 text-sm font-semibold text-navy dark:text-gold">
        Uploading {{ uploadProgress.done }} of {{ uploadProgress.total }} images...
      </div>

      <div v-if="message" class="rounded-2xl bg-gold/20 p-4 font-semibold text-navy dark:text-gold">
        {{ message }}
      </div>

      <div v-if="error" class="rounded-2xl bg-red-100 p-4 font-semibold text-red-700">
        {{ error }}
      </div>

      <button class="w-full btn-primary disabled:cursor-not-allowed disabled:opacity-60" :disabled="!selectedFiles.length || uploading">
        {{ selectedFiles.length > 1 ? 'Upload Collection' : 'Upload Image' }}
      </button>
    </form>

    <section class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="item in items" :key="item.id" class="card overflow-hidden p-0">
        <img class="h-56 w-full object-cover" :src="imageUrl(item.imagePath)" :alt="item.title" />

        <div class="p-5">
          <p class="text-xs font-bold uppercase text-gold">{{ niceType(item.category) }}</p>
          <h2 class="text-xl font-black text-navy dark:text-gold">{{ item.title }}</h2>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ item.description || 'No description' }}</p>

          <button class="mt-4 rounded-xl bg-red-600 px-4 py-2 text-white" @click="remove(item.id)">
            Delete
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import api, { UPLOADS_URL } from '../api'

const items = ref([])
const selectedFiles = ref([])
const previews = ref([])
const message = ref('')
const error = ref('')
const uploading = ref(false)
const isDragging = ref(false)
const uploadProgress = reactive({ done: 0, total: 0 })

const singleInput = ref(null)
const multiInput = ref(null)
const folderInput = ref(null)

const form = reactive({
  title: '',
  category: 'events',
  description: ''
})

const canUpload = computed(() => {
  return form.title.trim().length > 0 && selectedFiles.value.length > 0
})

function openSinglePicker() {
  singleInput.value?.click()
}

function openMultiPicker() {
  multiInput.value?.click()
}

function openFolderPicker() {
  folderInput.value?.click()
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files || [])
  setFiles(files)
  event.target.value = ''
}

function handleDrop(event) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  setFiles(files)
}

function setFiles(files) {
  error.value = ''
  message.value = ''

  const allowed = files.filter(isAllowedImage)

  if (!allowed.length) {
    selectedFiles.value = []
    clearPreviews()
    error.value = 'Please select JPG, PNG or WEBP images only.'
    return
  }

  const rejected = files.length - allowed.length
  selectedFiles.value = allowed

  if (!form.title.trim()) {
    form.title = suggestTitleFromFiles(allowed)
  }

  buildPreviews()

  if (rejected > 0) {
    message.value = `${allowed.length} image(s) selected. ${rejected} unsupported file(s) ignored.`
  } else {
    message.value = `${allowed.length} image(s) selected and ready to upload.`
  }
}

function suggestTitleFromFiles(files) {
  if (!files.length) return ''

  const first = files[0]

  if (first.webkitRelativePath) {
    const folder = first.webkitRelativePath.split('/')[0]
    return cleanTitle(folder)
  }

  return cleanTitle(first.name.replace(/\.[^.]+$/, ''))
}

function cleanTitle(value) {
  return String(value || 'Gallery Upload')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function isAllowedImage(file) {
  const typeOk = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  const extOk = /\.(jpe?g|png|webp)$/i.test(file.name)
  return typeOk || extOk
}

function buildPreviews() {
  clearPreviews()

  previews.value = selectedFiles.value.slice(0, 12).map((file, index) => ({
    key: `${file.name}-${file.size}-${index}`,
    name: file.name,
    folder: file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(0, -1).join('/') : '',
    url: URL.createObjectURL(file)
  }))
}

function clearPreviews() {
  for (const preview of previews.value) {
    URL.revokeObjectURL(preview.url)
  }

  previews.value = []
}

function clearSelection() {
  selectedFiles.value = []
  clearPreviews()
  message.value = ''
  error.value = ''
  uploadProgress.done = 0
  uploadProgress.total = 0
}

function imageUrl(path) {
  return path?.startsWith('/uploads') ? UPLOADS_URL + path : path
}

function niceType(value) {
  const mapped = {
    league_sports: 'League Sports',
    sacco_activities: 'SACCO Activities',
    alumni_orientation: 'Alumni Orientation',
    career_guidance: 'Career Guidance'
  }

  if (mapped[value]) return mapped[value]

  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

async function load() {
  items.value = (await api.get('/admin/gallery')).data
}

async function upload() {
  if (uploading.value) return

  if (!selectedFiles.value.length) {
    error.value = 'Please choose at least one JPG, PNG or WEBP image.'
    return
  }

  if (!form.title.trim()) {
    error.value = 'Please add a collection or image title before uploading.'
    return
  }

  uploading.value = true
  error.value = ''
  message.value = ''
  uploadProgress.done = 0
  uploadProgress.total = selectedFiles.value.length

  try {
    for (const file of selectedFiles.value) {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('category', form.category)
      fd.append('description', form.description.trim())
      fd.append('image', file)

      await api.post('/admin/gallery', fd)
      uploadProgress.done += 1
    }

    message.value = selectedFiles.value.length === 1
      ? 'Gallery image uploaded and audit logged.'
      : `${selectedFiles.value.length} gallery images uploaded as one collection and audit logged.`

    form.title = ''
    form.description = ''
    clearSelection()
    await load()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

async function remove(id) {
  if (!confirm('Delete this gallery item?')) return

  await api.delete(`/admin/gallery/${id}`)
  message.value = 'Gallery item deleted and audit logged.'
  await load()
}

onMounted(load)

onBeforeUnmount(() => {
  clearPreviews()
})
</script>

