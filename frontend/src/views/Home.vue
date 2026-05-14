<template>
  <section class="space-y-12">
    <section class="overflow-hidden rounded-3xl bg-navy shadow-2xl">
      <div class="grid min-h-[520px] lg:grid-cols-[1.08fr_0.92fr]">
        <div class="relative flex items-center p-6 text-white md:p-12">
          <div class="absolute inset-0 opacity-20">
            <img src="/assets/reference/alumni-orientation.jpg" alt="SHOSA alumni background" class="h-full w-full object-cover" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-slate-950"></div>

          <div class="relative z-10 max-w-3xl">
            <p class="inline-flex rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-gold">
              SHOSA public experience
            </p>

            <h1 class="mt-6 text-4xl font-black leading-tight md:text-6xl">
              Whether reconnecting or driving change, there is a place for you.
            </h1>

            <p class="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              SHOSA brings alumni, SACCO, mentorship, events, gallery memories and official merchandise into one living network.
            </p>

            <div class="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <router-link to="/register" class="btn-secondary">Join SHOSA</router-link>
              <router-link to="/sacco/register" class="btn-primary">Join SACCO</router-link>
              <router-link to="/gallery" class="rounded-xl border border-gold px-5 py-3 text-center font-black text-gold transition hover:bg-gold hover:text-navy">
                View Gallery
              </router-link>
              <router-link to="/store" class="rounded-xl border border-white/30 px-5 py-3 text-center font-black text-white transition hover:bg-white/10">
                Explore Store
              </router-link>
            </div>
          </div>
        </div>

        <div class="relative min-h-[420px] bg-slate-950">
          <img :key="activeHeroImage.key" :src="heroImage" alt="SHOSA community highlight" class="h-full w-full object-cover transition duration-700" />
          <div class="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent"></div>

          <div class="absolute right-5 top-5 z-10 flex gap-2 rounded-full bg-navy/60 px-3 py-2 backdrop-blur">
            <button
              v-for="(image, index) in heroCarouselImages"
              :key="image.key"
              type="button"
              class="h-2.5 rounded-full transition-all"
              :class="index === activeHeroIndex ? 'w-7 bg-gold' : 'w-2.5 bg-white/60 hover:bg-white'"
              :aria-label="`Show SHOSA activity image ${index + 1}`"
              @click="heroTick = index"
            ></button>
          </div>

          <article class="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/15 bg-navy/85 p-5 text-white shadow-2xl backdrop-blur">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-gold">This term in SHOSA</p>
            <h2 class="mt-2 text-2xl font-black">Alumni showing up for the next generation.</h2>
            <p class="mt-2 text-sm leading-6 text-slate-200">
              Mentorship, SACCO discipline, school support, league weekends and memories that keep the community alive.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-4">
      <article v-for="stat in stats" :key="stat.label" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-3xl font-black text-navy dark:text-gold">{{ stat.value }}</p>
        <p class="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{{ stat.label }}</p>
      </article>
    </section>

    <section>
      <div class="mx-auto max-w-4xl text-center">
        <p class="font-black uppercase tracking-[0.24em] text-gold">Why join SHOSA?</p>
        <h2 class="mt-3 text-3xl font-black text-navy dark:text-gold md:text-5xl">
          A youth-facing alumni experience that still feels unmistakably SHOSA.
        </h2>
      </div>

      <div class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="item in whyJoin" :key="item.title" class="card group transition hover:-translate-y-1 hover:shadow-2xl">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20 text-sm font-black text-navy dark:text-gold">
            {{ item.code }}
          </div>
          <p class="mt-5 text-xs font-black uppercase tracking-[0.22em] text-gold">{{ item.kicker }}</p>
          <h3 class="mt-2 text-2xl font-black text-navy dark:text-gold">{{ item.title }}</h3>
          <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">{{ item.text }}</p>
          <router-link :to="item.to" class="mt-5 inline-flex font-black text-navy transition group-hover:text-gold dark:text-gold">
            {{ item.action }} ->
          </router-link>
        </article>
      </div>
    </section>

    <section class="overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-slate-900">
      <div class="grid lg:grid-cols-2">
        <div class="grid grid-cols-2 gap-1 bg-navy p-1">
          <img
            v-for="image in storyImages"
            :key="image.key"
            :src="image.src"
            :alt="image.alt"
            class="h-44 w-full object-cover md:h-64"
          />
        </div>

        <div class="flex items-center p-6 md:p-10">
          <div>
            <p class="font-black uppercase tracking-[0.24em] text-gold">What is moving now</p>
            <h2 class="mt-3 text-3xl font-black text-navy dark:text-gold md:text-4xl">
              From nostalgia to action, SHOSA is becoming a living network.
            </h2>
            <p class="mt-4 leading-8 text-slate-600 dark:text-slate-300">
              The platform connects public identity, alumni records, SACCO onboarding, payments, gallery memory,
              official merchandise and admin audit trails in one controlled system.
            </p>

            <div class="mt-6 grid gap-3 sm:grid-cols-2">
              <div v-for="move in movingNow" :key="move.title" class="rounded-2xl bg-cream p-4 dark:bg-slate-800">
                <p class="font-black text-navy dark:text-gold">{{ move.title }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ move.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-3xl bg-gradient-to-br from-gold via-yellow-500 to-amber-700 p-6 text-navy shadow-2xl md:p-10">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-black uppercase tracking-[0.24em] text-navy/70">Official store</p>
          <h2 class="mt-2 text-3xl font-black md:text-5xl">Carry the SHOSA story with quiet pride.</h2>
        </div>
        <router-link to="/store" class="rounded-xl bg-navy px-5 py-3 font-black text-gold shadow">Open store -></router-link>
      </div>

      <div class="mt-8 grid gap-5 md:grid-cols-3">
        <article v-for="(product, index) in featuredProducts" :key="product.id" class="overflow-hidden rounded-3xl bg-white/85 shadow-xl">
          <div class="flex h-56 items-center justify-center bg-white p-5">
            <img
              :src="currentHomeVariant(product, index).image"
              :alt="`${product.name} - ${currentHomeVariant(product, index).label}`"
              class="max-h-full max-w-full rounded-2xl object-contain"
            />
          </div>
          <div class="p-5">
            <p class="text-sm font-black text-amber-700">{{ product.tag }}</p>
            <h3 class="text-2xl font-black">{{ product.name }}</h3>
            <p class="mt-1 font-black">{{ money(product.price) }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <article class="card">
        <p class="font-black uppercase tracking-[0.24em] text-gold">SHOSA journey</p>
        <h2 class="mt-3 text-3xl font-black text-navy dark:text-gold">A clear path into active membership.</h2>

        <div class="mt-6 space-y-4">
          <div v-for="step in journey" :key="step.title" class="flex gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-black text-navy">{{ step.no }}</span>
            <div>
              <h3 class="font-black text-navy dark:text-gold">{{ step.title }}</h3>
              <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ step.text }}</p>
            </div>
          </div>
        </div>
      </article>

      <article class="card">
        <p class="font-black uppercase tracking-[0.24em] text-gold">Gallery memory</p>
        <h2 class="mt-3 text-3xl font-black text-navy dark:text-gold">Moments that keep the community real.</h2>
        <div class="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3">
          <img
            v-for="image in galleryStrip"
            :key="image.key"
            :src="image.src"
            :alt="image.alt"
            class="h-28 w-full rounded-2xl object-cover md:h-36"
          />
        </div>
        <router-link to="/gallery" class="mt-6 inline-flex btn-primary">View full gallery</router-link>
      </article>
    </section>

    <section class="rounded-3xl bg-navy p-6 text-white shadow-xl md:p-10">
      <div class="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p class="font-black uppercase tracking-[0.24em] text-gold">Need help, want to join, or ready to support?</p>
          <h2 class="mt-3 text-3xl font-black md:text-5xl">Contact SHOSA and stay in the story.</h2>
        </div>
        <div class="rounded-3xl bg-white/10 p-5">
          <p class="leading-7 text-slate-200">
            Ask about SACCO registration, events, mentorship, gallery memories, merchandise or school support.
          </p>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <router-link to="/contact" class="btn-secondary text-center">Contact SHOSA</router-link>
            <router-link to="/register" class="rounded-xl border border-gold px-5 py-3 text-center font-black text-gold hover:bg-gold hover:text-navy">Join now</router-link>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import api, { UPLOADS_URL } from '../api'
import { defaultVariant, money, products } from '../data/storeProducts'

const galleryItems = ref([])
const storeTick = ref(0)
const heroTick = ref(0)
let storeTimer = null
let heroTimer = null

const stats = [
  { value: '2000', label: 'School start year' },
  { value: '4', label: 'Campuses connected' },
  { value: 'UGX 50,000', label: 'SACCO registration fee' },
  { value: '1 Network', label: 'Alumni, SACCO, events and store' }
]

const whyJoin = [
  { code: 'NET', kicker: 'Alumni network', title: 'Stay connected', text: 'Reconnect with classmates, discover alumni across professions, and keep the SHOSA story alive beyond school.', to: '/register', action: 'Register' },
  { code: 'MEN', kicker: 'Mentorship', title: 'Guide the next generation', text: 'Support S.4, S.6, vacists and young alumni through career guidance, talks and practical presence.', to: '/contact', action: 'Mentor' },
  { code: 'SAC', kicker: 'SHOSA SACCO', title: 'Invest together', text: 'Build savings discipline through a member-owned SACCO with clear payments, approvals and records.', to: '/sacco/register', action: 'Join SACCO' },
  { code: 'EVT', kicker: 'Events', title: 'Show up again', text: 'League weekends, reunions, dinners, outreach and school-facing activities keep alumni visible.', to: '/events', action: 'View events' },
  { code: 'ID', kicker: 'Merchandise', title: 'Wear the identity', text: 'Official SHOSA caps, shirts, polos, hoodies, tote bags, wristbands and stickers keep the brand alive.', to: '/store', action: 'Visit store' },
  { code: 'GIV', kicker: 'Impact', title: 'Give back visibly', text: 'Support school projects, mentorship, medical camps, scholarships and organized alumni contribution.', to: '/donate', action: 'Donate' }
]

const movingNow = [
  { title: 'Clear membership journey', text: 'Register once, then access alumni and SACCO flows.' },
  { title: 'Audit-first payments', text: 'Admins verify payments before status changes.' },
  { title: 'Organized gallery memory', text: 'Images are grouped into purposeful collections.' },
  { title: 'Official communication', text: 'Receipts, contacts and documents reduce scattered records.' }
]

const journey = [
  { no: 1, title: 'Register as alumni', text: 'Create your verified SHOSA alumni profile and become visible to the network.' },
  { no: 2, title: 'Complete your profile', text: 'Keep your photo, class year, campus, contact and location details clean.' },
  { no: 3, title: 'Join or update SACCO', text: 'Submit SACCO documents, registration fee and planned contribution option.' },
  { no: 4, title: 'Attend, support and represent', text: 'Join events, mentor students, contribute, buy merchandise and grow the community.' }
]

const featuredProductIds = [5, 1, 8]

const featuredProducts = computed(() => {
  return featuredProductIds
    .map(id => products.find(product => product.id === id))
    .filter(Boolean)
})

const fallbackImages = [
  { key: 'orientation', src: '/assets/reference/alumni-orientation.jpg', alt: 'SHOSA orientation' },
  { key: 'league', src: '/assets/reference/seeta-gallery-2.jpg', alt: 'SHOSA league' },
  { key: 'store', src: '/assets/store-merchandise/01_caps/cap_navy_blue.png', alt: 'SHOSA merchandise' },
  { key: 'brand', src: '/assets/brand/shosa-sacco-logo-web.png', alt: 'SHOSA SACCO' },
  { key: 'shirt', src: '/assets/store-merchandise/03_tshirts_unisex/tshirt_unisex_white.png', alt: 'SHOSA shirt' },
  { key: 'sticker', src: '/assets/store-merchandise/08_stickers/_full_stickers_sheet.png', alt: 'SHOSA stickers' }
]

const uploadedImages = computed(() => {
  return [...galleryItems.value]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 8)
    .map((item, index) => ({
      key: item.id || `gallery-${index}`,
      src: imageUrl(item.imagePath || item.image),
      alt: 'Recent SHOSA activity'
    }))
})
const storyImages = computed(() => {
  return [...uploadedImages.value, ...fallbackImages].slice(0, 4)
})

const galleryStrip = computed(() => {
  return [...uploadedImages.value, ...fallbackImages].slice(0, 6)
})

const heroCarouselImages = computed(() => {
  return [...uploadedImages.value, ...fallbackImages]
    .filter(image => image?.src)
    .slice(0, 8)
})

const activeHeroIndex = computed(() => {
  if (!heroCarouselImages.value.length) return 0
  return heroTick.value % heroCarouselImages.value.length
})

const activeHeroImage = computed(() => {
  return heroCarouselImages.value[activeHeroIndex.value] || fallbackImages[0]
})

const heroImage = computed(() => activeHeroImage.value?.src || '/assets/reference/alumni-orientation.jpg')

function currentHomeVariant(product, index) {
  if (!product?.variants?.length) return defaultVariant(product)
  const variantIndex = (storeTick.value + index) % product.variants.length
  return product.variants[variantIndex] || defaultVariant(product)
}

function imageUrl(path) {
  if (!path) return ''
  return path.startsWith('/uploads') ? UPLOADS_URL + path : path
}

async function loadGalleryPreview() {
  try {
    galleryItems.value = (await api.get('/gallery')).data || []
  } catch {
    galleryItems.value = []
  }
}

onMounted(() => {
  loadGalleryPreview()

  storeTimer = setInterval(() => {
    storeTick.value += 1
  }, 3200)

  heroTimer = setInterval(() => {
    heroTick.value += 1
  }, 4500)
})

onBeforeUnmount(() => {
  if (storeTimer) clearInterval(storeTimer)
  if (heroTimer) clearInterval(heroTimer)
})
</script>