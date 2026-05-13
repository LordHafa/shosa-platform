<template>
  <div class="space-y-8">
    <section class="rounded-3xl bg-navy p-8 text-white shadow-xl">
      <p class="font-bold text-gold">Events and programmes</p>
      <h1 class="mt-2 text-4xl font-black">Where alumni show up.</h1>
      <p class="mt-4 max-w-3xl leading-8 text-slate-200">Events keep the alumni network active: reunions, league weekends, school visits, mentorship, medical camps, dinners and SACCO meetings.</p>
    </section>

    <div v-if="events.length" class="grid gap-5 md:grid-cols-2">
      <article v-for="event in events" :key="event.id" class="card">
        <p class="text-sm font-bold text-gold">{{ niceDate(event.startDate) }}</p>
        <h2 class="mt-1 text-2xl font-black text-navy dark:text-gold">{{ event.title }}</h2>
        <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">{{ event.description }}</p>
        <p class="mt-4 text-sm font-semibold">📍 {{ event.location || 'To be confirmed' }}</p>
      </article>
    </div>

    <section>
      <h2 class="mb-5 text-2xl font-black text-navy dark:text-gold">Seeta alumni programme calendar</h2>
      <div class="grid gap-5 md:grid-cols-2">
        <article v-for="item in programmeIdeas" :key="item.title" class="card">
          <div class="text-3xl">{{ item.icon }}</div>
          <h3 class="mt-2 text-xl font-black">{{ item.title }}</h3>
          <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ item.text }}</p>
          <p class="mt-3 text-sm font-bold text-gold">{{ item.audience }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import api from '../api'
const events = ref([])
const programmeIdeas = [
  { icon: '🎓', title: 'Student orientation support', audience: 'Audience: new/current students', text: 'Alumni show current students what life after Seeta can become through presence, encouragement and real stories.' },
  { icon: '⚽', title: 'Seeta Alumni League', audience: 'Audience: all alumni years', text: 'Sports bring different classes and campuses together in a friendly but competitive environment.' },
  { icon: '🎩', title: 'Alumni dinners and reunions', audience: 'Audience: alumni and school leadership', text: 'Formal gatherings create room for reflection, celebration, networking and planning the next chapter.' },
  { icon: '🏥', title: 'Medical camps and outreach', audience: 'Led by health professionals', text: 'Doctors, nurses and health workers can support students and the surrounding community through service.' },
  { icon: '🧭', title: 'Career guidance for candidates', audience: 'Audience: S.4 and S.6 candidates', text: 'Professionals return to guide students on subject choices, careers, internships and mentorship paths.' },
  { icon: '💰', title: 'SACCO AGM and finance clinics', audience: 'Audience: SACCO members', text: 'Members review savings performance, approve plans, learn financial discipline and strengthen trust.' }
]
function niceDate(value){ return value ? new Date(value).toLocaleDateString('en-UG', { dateStyle: 'medium' }) : 'Date to be confirmed' }
onMounted(async()=>{ events.value=(await api.get('/events')).data })
</script>
