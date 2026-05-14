<template>
  <div class="space-y-6">
    <section class="rounded-3xl bg-navy p-6 text-white shadow-xl md:p-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-bold text-gold">Admin media command center</p>
          <h1 class="mt-2 text-3xl font-black md:text-4xl">Gallery Management</h1>
          <p class="mt-3 max-w-3xl leading-7 text-slate-200">
            Organize SHOSA memories into clean public collections. Admins see counts and controls;
            the public sees only the image journey.
          </p>
        </div>

        <router-link class="btn-secondary" to="/admin">Back to dashboard</router-link>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-4">
      <article class="card">
        <p class="text-sm text-slate-500">Total images</p>
        <p class="mt-2 text-3xl font-black text-navy dark:text-gold">{{ items.length }}</p>
      </article>

      <article class="card">
        <p class="text-sm text-slate-500">Categories used</p>
        <p class="mt-2 text-3xl font-black text-navy dark:text-gold">{{ usedCategoryCount }}</p>
      </article>

      <article class="card">
        <p class="text-sm text-slate-500">Visible after search</p>
        <p class="mt-2 text-3xl font-black text-navy dark:text-gold">{{ visibleImageCount }}</p>
      </article>

      <article class="card">
        <p class="text-sm text-slate-500">Latest upload</p>
        <p class="mt-2 text-lg font-black text-navy dark:text-gold">{{ latestUploadLabel }}</p>
      </article>
    </section>

    <form class="card space-y-5" @submit.prevent="upload">
      <div>
        <p class="font-bold text-gold">Upload gallery memory</p>
        <h2 class="text-2xl font-black text-navy dark:text-gold">Add images to a SHOSA collection</h2>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="label">Collection / Image Title *</label>
          <input
            v-model.trim="form.title"
            class="input"
            placeholder="e.g. SHOSA League 2026 opening weekend"
            required
          />
        </div>

        <div>
          <label class="label">Category *</label>
          <select v-model="form.category" class="input">
            <option v-for="cat in GALLERY_CATEGORIES" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="label">Description</label>
          <textarea
            v-model.trim="form.description"
            class="input min-h-24"
            placeholder="Optional admin note"
          ></textarea>
        </div>
      </div>

      <div
        class="rounded-3xl border-2 border-dashed border-gold/60 bg-gradient-to-br from-gold/15 via-cream to-white p-5 text-center transition hover:border-gold hover:shadow-xl dark:from-gold/10 dark:via-slate-900 dark:to-slate-950"
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

          <h2 class="mt-4 text-2xl font-black text-navy dark:text-gold">Drop memories here</h2>

          <p class="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Choose one image, many images, or a whole folder. Accepted formats: JPG, PNG, WEBP.
          </p>

          <div class="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" class="btn-primary" @click="openSinglePicker">Choose single image</button>
            <button type="button" class="btn-secondary" @click="openMultiPicker">Choose many images</button>
            <button type="button" class="rounded-xl bg-navy px-5 py-3 font-bold text-gold shadow hover:opacity-90" @click="openFolderPicker">
              Upload folder
            </button>
          </div>

          <input ref="singleInput" class="hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="handleFileSelect" />
          <input ref="multiInput" class="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple @change="handleFileSelect" />
          <input ref="folderInput" class="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple webkitdirectory directory @change="handleFileSelect" />
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
          </div>
        </div>
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

      <button class="w-full btn-primary disabled:cursor-not-allowed disabled:opacity-60" :disabled="!canUpload || uploading">
        {{ selectedFiles.length > 1 ? 'Upload Collection' : 'Upload Image' }}
      </button>
    </form>

    <section class="card">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-bold text-gold">Organized gallery containers</p>
          <h2 class="text-2xl font-black text-navy dark:text-gold">Manage images by category</h2>
          <p class="mt-1 text-sm text-slate-500">
            No long flat list. Open each container and manage images where they belong.
          </p>
        </div>

        <button class="btn-secondary" type="button" @click="resetFilters">Reset filters</button>
      </div>

      <div class="mb-6 grid gap-3 md:grid-cols-[1fr_280px_160px]">
        <input
          v-model.trim="filters.search"
          class="input"
          placeholder="Search category, title, description"
        />

        <select v-model="filters.category" class="input">
          <option value="">All categories</option>
          <option v-for="cat in GALLERY_CATEGORIES" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>

        <button class="btn-primary" type="button" @click="load">Refresh</button>
      </div>

      <div class="space-y-6">
        <article
          v-for="container in visibleContainers"
          :key="container.value"
          class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <button
            type="button"
            class="flex w-full flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 text-left dark:border-slate-800"
            @click="toggleContainer(container.value)"
          >
            <div>
              <p class="text-xs font-black uppercase tracking-[0.22em] text-gold">{{ container.shortLabel }}</p>
              <h3 class="mt-1 text-2xl font-black text-navy dark:text-gold">{{ container.label }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ container.description }}</p>
            </div>

            <div class="flex items-center gap-3">
              <span class="rounded-full bg-navy px-4 py-2 text-sm font-black text-gold">
                {{ container.items.length }} image{{ container.items.length === 1 ? '' : 's' }}
              </span>
              <span class="rounded-full border border-slate-300 px-3 py-2 text-sm font-black dark:border-slate-700">
                {{ isOpen(container.value) ? 'Hide' : 'Open' }}
              </span>
            </div>
          </button>

          <div v-if="isOpen(container.value)" class="p-4">
            <div v-if="container.items.length" class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              <div
                v-for="item in container.items"
                :key="item.id"
                class="group relative overflow-hidden rounded-2xl bg-slate-200 shadow-sm"
              >
                <img
                  :src="imageUrl(item.imagePath)"
                  :alt="container.shortLabel"
                  class="h-36 w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div class="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    class="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white shadow"
                    @click.stop="remove(item.id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">
              No images in this container yet.
            </div>
          </div>
        </article>
      </div>

      <div v-if="!visibleContainers.length" class="rounded-3xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <h3 class="text-xl font-black text-navy dark:text-gold">No gallery records match your filters.</h3>
        <p class="mt-2 text-slate-500">Try another search term or reset filters.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import api, { UPLOADS_URL } from '../api'
import { GALLERY_CATEGORIES, categorizeGalleryItem } from '../data/galleryCategories'

const items = ref([])
const selectedFiles = ref([])
const previews = ref([])
const message = ref('')
const error = ref('')
const uploading = ref(false)
const isDragging = ref(false)
const openContainers = ref(new Set())
const uploadProgress = reactive({ done: 0, total: 0 })

const singleInput = ref(null)
const multiInput = ref(null)
const folderInput = ref(null)

const filters = reactive({
  search: '',
  category: ''
})

const form = reactive({
  title: '',
  category: GALLERY_CATEGORIES[0]?.value || 'campus_chapters',
  description: ''
})

const canUpload = computed(() => {
  return form.title.trim().length > 0 && selectedFiles.value.length > 0
})

const normalizedItems = computed(() => {
  return items.value.map(item => ({
    ...item,
    normalizedCategory: categorizeGalleryItem(item)
  }))
})

const categoryContainers = computed(() => {
  return GALLERY_CATEGORIES.map(cat => ({
    ...cat,
    items: filteredItemsForCategory(cat.value)
  }))
})

const visibleContainers = computed(() => {
  return categoryContainers.value.filter(container => {
    if (filters.category && container.value !== filters.category) return false
    return container.items.length > 0 || filters.category === container.value
  })
})

const usedCategoryCount = computed(() => {
  return new Set(normalizedItems.value.map(item => item.normalizedCategory)).size
})

const visibleImageCount = computed(() => {
  return visibleContainers.value.reduce((sum, container) => sum + container.items.length, 0)
})

const latestUploadLabel = computed(() => {
  if (!items.value.length) return 'None yet'
  const latest = items.value[0]?.createdAt
  if (!latest) return 'Available'
  return new Date(latest).toLocaleDateString()
})

function filteredItemsForCategory(category) {
  const search = filters.search.trim().toLowerCase()

  return normalizedItems.value.filter(item => {
    if (item.normalizedCategory !== category) return false

    const haystack = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${category}`.toLowerCase()
    return !search || haystack.includes(search)
  })
}

function toggleContainer(value) {
  const next = new Set(openContainers.value)

  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }

  openContainers.value = next
}

function isOpen(value) {
  return openContainers.value.has(value)
}

function resetFilters() {
  filters.search = ''
  filters.category = ''
  openContainers.value = new Set(GALLERY_CATEGORIES.map(cat => cat.value))
}

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

  message.value = rejected > 0
    ? `${allowed.length} image(s) selected. ${rejected} unsupported file(s) ignored.`
    : `${allowed.length} image(s) selected and ready to upload.`
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

async function load() {
  items.value = (await api.get('/admin/gallery')).data

  if (!openContainers.value.size) {
    openContainers.value = new Set(GALLERY_CATEGORIES.map(cat => cat.value))
  }
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

    filters.category = form.category
    openContainers.value = new Set([form.category])
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
  if (!confirm('Delete this gallery image?')) return

  await api.delete(`/admin/gallery/${id}`)
  message.value = 'Gallery image deleted and audit logged.'
  await load()
}

onMounted(load)

onBeforeUnmount(() => {
  clearPreviews()
})
</script>