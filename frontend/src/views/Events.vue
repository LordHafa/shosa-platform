<template>
  <div class="space-y-8">
    <section class="relative overflow-hidden rounded-3xl bg-navy p-8 text-white shadow-xl md:p-12">
      <div class="absolute inset-0 opacity-20">
        <img src="/assets/reference/seeta-gallery-2.jpg" alt="SHOSA event hero" class="h-full w-full object-cover" />
      </div>
      <div class="absolute inset-0 bg-gradient-to-br from-navy via-slate-950/80 to-slate-950/95"></div>
      <div class="relative z-10">
        <p class="font-semibold text-gold">SHOSA events</p>
        <h1 class="mt-3 text-4xl font-black md:text-5xl">Where alumni reconnect, compete and build together.</h1>
        <p class="mt-4 max-w-3xl leading-8 text-slate-200">A calendar of league weekends, reunions, mentorship, medical camps, SACCO clinics and public programmes for SHOSA members.</p>
      </div>
    </section>

    <section id="seeta-league" class="grid gap-5 md:grid-cols-2">
      <article class="card flex flex-col gap-4 p-6">
        <div class="flex items-center gap-4">
          <img src="/assets/brand/seeta-league-logo-web.png" alt="SHOSA League logo" class="h-16 w-16 object-contain" />
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.24em] text-gold">SHOSA League</p>
            <h2 class="text-2xl font-black text-navy dark:text-gold">Community sport, alumni pride.</h2>
          </div>
        </div>
        <p class="text-slate-600 dark:text-slate-300">League competition is a key anchor for the community. It keeps old students engaged, visible and active across campuses.</p>
        <router-link to="/gallery" class="inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-3 text-sm font-bold text-navy">See League moments</router-link>
      </article>
      <article class="card p-6">
        <p class="text-sm font-bold uppercase tracking-[0.24em] text-gold">Programme spotlight</p>
        <h2 class="mt-2 text-2xl font-black text-navy dark:text-gold">A fuller calendar for SHOSA members.</h2>
        <p class="mt-4 text-slate-600 dark:text-slate-300">Whether it is mentorship for candidates, medical outreach, reunion dinners, or SACCO finance clinics, the SHOSA programme line-up is built around real alumni contributions.</p>
      </article>
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
      <h2 class="mb-5 text-2xl font-black text-navy dark:text-gold">SHOSA programme calendar</h2>
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
  { icon: '🎓', title: 'Student orientation support', audience: 'Audience: new/current students', text: 'Alumni show current students what life after school can become through presence, encouragement and real stories.' },
  { icon: '🏆', title: 'SHOSA League', audience: 'Audience: all alumni years', text: 'Sports bring different classes and campuses together in a friendly but competitive environment.' },
  { icon: '🍽️', title: 'Alumni dinners and reunions', audience: 'Audience: alumni and school leadership', text: 'Formal gatherings create room for reflection, celebration, networking and planning the next chapter.' },
  { icon: '🩺', title: 'Medical camps and outreach', audience: 'Led by health professionals', text: 'Doctors, nurses and health workers can support students and the surrounding community through service.' },
  { icon: '🎯', title: 'Career guidance for candidates', audience: 'Audience: S.4 and S.6 candidates', text: 'Professionals return to guide students on subject choices, careers, internships and mentorship paths.' },
  { icon: '💰', title: 'SACCO AGM and finance clinics', audience: 'Audience: SACCO members', text: 'Members review savings performance, approve plans, learn financial discipline and strengthen trust.' }
]
function niceDate(value){ return value ? new Date(value).toLocaleDateString('en-UG', { dateStyle: 'medium' }) : 'Date to be confirmed' }
onMounted(async()=>{ events.value=(await api.get('/events')).data })
</script>

