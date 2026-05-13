<template>
  <div class="space-y-8">
    <section class="rounded-3xl bg-navy p-8 text-white shadow-xl">
      <p class="font-bold text-gold">Seeta Alumni Gallery</p>
      <h1 class="mt-2 text-4xl font-black">Moments that keep the community real.</h1>
      <p class="mt-4 max-w-3xl leading-8 text-slate-200">
        A visual record of alumni gatherings, mentorship, celebrations, school support, SACCO activities,
        and the Seeta High Old Students Association journey.
      </p>
    </section>

    <section v-if="collections.length" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="(collection, index) in collections"
        :key="collection.key"
        class="card overflow-hidden p-0"
      >
        <div class="relative">
          <img
            :src="imageUrl(currentImage(collection, index)?.imagePath || currentImage(collection, index)?.image)"
            :alt="collection.title"
            class="h-64 w-full object-cover transition-all duration-500"
          />

          <div class="absolute left-4 top-4 rounded-full bg-navy/85 px-3 py-1 text-xs font-bold uppercase text-gold">
            {{ niceType(collection.category) }}
          </div>
        </div>

        <div class="p-5">
          <h2 class="text-xl font-black text-navy dark:text-gold">
            {{ collection.title }}
          </h2>

          <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {{ collection.description }}
          </p>

          <div v-if="collection.images.length > 1" class="mt-4 flex items-center gap-2">
            <span
              v-for="n in Math.min(collection.images.length, 8)"
              :key="n"
              class="h-2 rounded-full transition-all"
              :class="activeDot(collection, index, n - 1) ? 'w-6 bg-gold' : 'w-2 bg-slate-300 dark:bg-slate-600'"
            ></span>
          </div>
        </div>
      </article>
    </section>

    <section v-else class="card text-center">
      <h2 class="text-2xl font-black text-navy dark:text-gold">No gallery items yet.</h2>
      <p class="mt-2 text-slate-600 dark:text-slate-300">
        Alumni memories will appear here once they are uploaded by the admin team.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import api, { UPLOADS_URL } from '../api'

const items = ref([])
const tick = ref(0)
let timer = null

const fallbackItems = [
  {
    title: 'Orientation and mentorship',
    category: 'mentorship',
    image: '/assets/reference/alumni-orientation.jpg',
    description: 'Alumni presence reminds current students that Seeta is a community they can grow into.'
  },
  {
    title: 'Seeta Alumni League and Sports',
    category: 'league_sports',
    image: '/assets/reference/seeta-gallery-2.jpg',
    description: 'Alumni league and sports activities bring old students together through teamwork, friendship and school spirit.'
  }
]

const leagueReferenceTitles = [
  'Community Gathering',
  'Career Guidance and Mentorship',
  'Alumni Outreach Moment',
  'Seeta Alumni League Moment'
]

const collections = computed(() => {
  const source = items.value.length ? items.value : fallbackItems
  const grouped = new Map()

  for (const item of source) {
    const title = cleanCollectionTitle(item)
    const category = cleanCollectionCategory(title, item.category)
    const key = `${category}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        title,
        category,
        description: cleanDescription(title, category, item.description),
        images: []
      })
    }

    grouped.get(key).images.push(item)
  }

  return Array.from(grouped.values())
})

function cleanCollectionTitle(item) {
  const value = String(item?.title || 'Seeta Alumni Memory').trim()
  const imagePath = String(item?.imagePath || item?.image || '').toLowerCase()

  if (
    leagueReferenceTitles.includes(value) &&
    /seeta-gallery-[2-5]\.jpg/.test(imagePath)
  ) {
    return 'Seeta Alumni League and Sports'
  }

  if (value.includes(' - p')) {
    return polishTitle(value.split(' - p')[0].trim())
  }

  return polishTitle(value)
}

function polishTitle(value) {
  return String(value || 'Seeta Alumni Memory')
    .replace(/\bShosa\b/g, 'SHOSA')
    .replace(/\bSacco\b/g, 'SACCO')
    .replace(/\bS5\b/g, 'S.5')
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bMr\b/g, 'Mr.')
    .replace(/\bMrs\b/g, 'Mrs.')
    .replace(/\bDr\b/g, 'Dr.')
}

function cleanCollectionCategory(title, originalCategory) {
  if (String(title || '').toLowerCase().includes('league and sports')) {
    return 'league_sports'
  }

  return originalCategory || 'events'
}

function cleanDescription(title, category, originalDescription) {
  const lower = String(title || '').toLowerCase()

  if (lower.includes('league') || lower.includes('sports')) {
    return 'Alumni league and sports activities bring old students together through teamwork, friendship and school spirit.'
  }

  if (lower.includes('cover and logos')) {
    return 'Official SHOSA identity visuals representing the association journey and its connected initiatives.'
  }

  if (lower.includes('founders')) {
    return 'A tribute to the founding vision and leadership that shaped the Seeta High story.'
  }

  if (lower.includes('dinner') || lower.includes('reunion')) {
    return 'Formal alumni reunion memories celebrating connection, recognition and the Seeta bond.'
  }

  if (lower.includes('sacco')) {
    return 'SACCO planning and savings moments showing alumni commitment to financial growth and cooperation.'
  }

  if (lower.includes('medical')) {
    return 'Medical outreach memories showing alumni service to the school and surrounding community.'
  }

  if (lower.includes('orientation')) {
    return 'Orientation moments where alumni encourage current students through presence, guidance and shared experience.'
  }

  if (lower.includes('prefects') || lower.includes('debating') || lower.includes('career')) {
    return 'Leadership, career guidance and student-development moments supported by the alumni community.'
  }

  if (lower.includes('campus') || lower.includes('headteacher') || lower.includes('director')) {
    return 'Campus and leadership memories connecting old students with the people and places that shaped them.'
  }

  if (lower.includes('fest')) {
    return 'SHOSA Fest memories celebrating alumni unity, school spirit and community activity.'
  }

  if (originalDescription && !String(originalDescription).toLowerCase().includes('pictorial journey image')) {
    return originalDescription
  }

  return 'A Seeta High Old Students Association memory preserved as part of the alumni journey.'
}

function imageUrl(path) {
  if (!path) return ''
  return path.startsWith('/uploads') ? UPLOADS_URL + path : path
}

function currentImage(collection, index) {
  if (!collection.images.length) return null
  const imageIndex = (tick.value + index) % collection.images.length
  return collection.images[imageIndex]
}

function activeDot(collection, index, dotIndex) {
  if (!collection.images.length) return false
  return ((tick.value + index) % collection.images.length) === dotIndex
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
  try {
    items.value = (await api.get('/gallery')).data
  } catch {
    items.value = []
  }
}

onMounted(async () => {
  await load()
  timer = setInterval(() => {
    tick.value += 1
  }, 3500)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

