<template>
  <div class="space-y-8">
    <section class="relative overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-xl md:p-10">
      <div class="absolute inset-0 opacity-20">
        <img src="/assets/reference/alumni-orientation.jpg" alt="SHOSA gallery background" class="h-full w-full object-cover" />
      </div>
      <div class="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-slate-950"></div>

      <div class="relative z-10">
        <p class="font-bold text-gold">SHOSA Gallery</p>
        <h1 class="mt-2 max-w-4xl text-3xl font-black leading-tight md:text-5xl">
          Moments that keep the community real.
        </h1>
        <p class="mt-4 max-w-3xl leading-8 text-slate-200">
          A pictorial journey of alumni leadership, reunions, SACCO, league, mentorship, outreach,
          campus chapters and official SHOSA identity.
        </p>
      </div>
    </section>

    <nav class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="rounded-full px-4 py-2 text-sm font-bold transition"
        :class="activeTab === tab.value ? 'bg-gold text-navy' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'"
        @click="setActiveTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'all'" class="space-y-10">
      <article v-for="cat in visibleCategorySections" :key="cat.value" class="space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="font-black uppercase tracking-[0.24em] text-gold">{{ cat.shortLabel }}</p>
            <h2 class="text-3xl font-black text-navy dark:text-gold">{{ cat.label }}</h2>
          </div>
          <button class="btn-primary" type="button" @click="setActiveTab(cat.value)">View collection</button>
        </div>

        <div class="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
          <button
            v-for="(item, index) in categoryPreview(cat.value)"
            :key="itemKey(item)"
            type="button"
            class="group overflow-hidden rounded-2xl bg-slate-200 shadow-sm"
            :class="index === 0 ? 'md:col-span-2 md:row-span-2' : ''"
            @click="setActiveTab(cat.value)"
          >
            <img
              :src="imageUrl(item.imagePath || item.image)"
              :alt="cat.shortLabel"
              class="h-32 w-full object-cover transition duration-500 group-hover:scale-105 md:h-full"
              :class="index === 0 ? 'md:h-72' : 'md:h-36'"
            />
          </button>
        </div>
      </article>
    </section>

    <section v-else class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-black uppercase tracking-[0.24em] text-gold">Collection</p>
          <h2 class="text-3xl font-black text-navy dark:text-gold">{{ activeCategory?.shortLabel }}</h2>
          <p class="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">{{ activeCategory?.description }}</p>
        </div>
        <button class="btn-secondary" type="button" @click="setActiveTab('all')">Back to all collections</button>
      </div>

      <div v-if="visibleItems.length" class="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
        <button
          v-for="(item, index) in visibleItems"
          :key="itemKey(item)"
          type="button"
          class="group overflow-hidden rounded-2xl bg-slate-200 shadow-sm"
          :class="index % 11 === 0 ? 'md:col-span-2 md:row-span-2' : ''"
        >
          <img
            :src="imageUrl(item.imagePath || item.image)"
            :alt="activeCategory?.shortLabel || 'SHOSA memory'"
            class="h-32 w-full object-cover transition duration-500 group-hover:scale-105 md:h-full"
            :class="index % 11 === 0 ? 'md:h-72' : 'md:h-36'"
          />
        </button>
      </div>

      <section v-else class="card text-center">
        <h3 class="text-2xl font-black text-navy dark:text-gold">This collection is ready for uploads.</h3>
        <p class="mt-2 text-slate-600 dark:text-slate-300">
          The admin team can add approved photos into this SHOSA collection.
        </p>
      </section>

      <div v-if="hasMore" class="text-center">
        <button class="btn-primary" type="button" @click="showMore">Show more memories</button>
      </div>
    </section>

    <section v-if="!hasItems" class="card text-center">
      <h2 class="text-2xl font-black text-navy dark:text-gold">No gallery items yet.</h2>
      <p class="mt-2 text-slate-600 dark:text-slate-300">
        Alumni memories will appear here once they are uploaded by the admin team.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api, { UPLOADS_URL } from '../api'
import { GALLERY_CATEGORIES, getGalleryCategory, categorizeGalleryItem } from '../data/galleryCategories'

const items = ref([])
const activeTab = ref('all')
const visibleCount = ref(24)

const tabs = computed(() => [
  { value: 'all', label: 'All / Highlights' },
  ...GALLERY_CATEGORIES.map(cat => ({ value: cat.value, label: cat.shortLabel }))
])

const activeCategory = computed(() => getGalleryCategory(activeTab.value))

const categorizedItems = computed(() => {
  const source = items.value.length ? items.value : fallbackItems

  return source.map(item => ({
    ...item,
    category: categorizeGalleryItem(item)
  }))
})

const visibleCategorySections = computed(() => {
  return GALLERY_CATEGORIES.filter(cat => categoryItems(cat.value).length > 0)
})

const categoryItemsForActiveTab = computed(() => {
  if (activeTab.value === 'all') return []
  return categoryItems(activeTab.value)
})

const visibleItems = computed(() => categoryItemsForActiveTab.value.slice(0, visibleCount.value))
const hasMore = computed(() => categoryItemsForActiveTab.value.length > visibleCount.value)
const hasItems = computed(() => categorizedItems.value.length > 0)

function setActiveTab(value) {
  activeTab.value = value
  visibleCount.value = 24
}

function categoryItems(category) {
  return categorizedItems.value.filter(item => item.category === category)
}

function categoryPreview(category) {
  return categoryItems(category).slice(0, 9)
}

function itemKey(item) {
  return item.id || item.imagePath || item.image || `${item.category}-${item.title}`
}

function imageUrl(path) {
  if (!path) return ''
  return path.startsWith('/uploads') ? UPLOADS_URL + path : path
}

function showMore() {
  visibleCount.value += 24
}

async function load() {
  try {
    items.value = (await api.get('/gallery')).data
  } catch {
    items.value = []
  }
}

const fallbackItems = [
  {
    title: 'Orientation and mentorship',
    category: 'career_orientation',
    image: '/assets/reference/alumni-orientation.jpg',
    description: 'Alumni presence reminds current students that SHOSA is a community they can grow into.'
  },
  {
    title: 'SHOSA League and Sports',
    category: 'league_sports',
    image: '/assets/reference/seeta-gallery-2.jpg',
    description: 'Alumni league and sports activities bring old students together through teamwork, friendship and school spirit.'
  }
]

onMounted(load)
</script>