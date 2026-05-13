<template>
  <div class="space-y-8">
    <section class="rounded-3xl bg-navy p-8 text-white shadow-xl">
      <p class="font-bold text-gold">About Seeta Alumni</p>
      <h1 class="mt-2 text-4xl font-black">A formal home for old students of Seeta High.</h1>
      <p class="mt-4 max-w-3xl leading-8 text-slate-200">
        Seeta High started in 2000. This platform treats alumni years from 2000 onward and brings together old students from Main, Mbalala, Green, and A Level campuses.
      </p>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card space-y-4">
        <h2 class="text-2xl font-black text-navy dark:text-gold">Who we are</h2>
        <p class="leading-8 text-slate-600 dark:text-slate-300">
          The Seeta Alumni community is a growing network of professionals, entrepreneurs, creatives, parents, leaders and young graduates connected by a shared school story.
        </p>
        <p class="leading-8 text-slate-600 dark:text-slate-300">
          The system gives that community structure: registration, communication, events, gallery memories, merchandise, SACCO membership, records, files and responsible administration.
        </p>
      </div>
      <div class="card space-y-4">
        <h2 class="text-2xl font-black text-navy dark:text-gold">Why the platform exists</h2>
        <p class="leading-8 text-slate-600 dark:text-slate-300">
          As Seeta High grows, alumni need a clear place to stay visible, support one another, contribute to school culture, and build financial participation through a SACCO model.
        </p>
        <p class="leading-8 text-slate-600 dark:text-slate-300">
          The platform keeps alumni identity and SACCO participation connected, while still allowing admins to verify sensitive records before they affect official status.
        </p>
      </div>
    </div>

    <section>
      <h2 class="mb-5 text-2xl font-black text-navy dark:text-gold">Our pillars</h2>
      <div class="grid gap-5 md:grid-cols-4">
        <article v-for="pillar in pillars" :key="pillar.title" class="card">
          <div class="text-3xl">{{ pillar.icon }}</div>
          <h3 class="mt-2 font-black">{{ pillar.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ pillar.text }}</p>
        </article>
      </div>
    </section>

    <section class="card">
      <h2 class="text-2xl font-black text-navy dark:text-gold">What the system should support</h2>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <div v-for="item in capabilities" :key="item" class="rounded-2xl bg-cream p-4 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{{ item }}</div>
      </div>
    </section>
  </div>
</template>
<script setup>
const pillars = [
  { icon: '🤝', title: 'Alumni networking', text: 'Reunions, class networks, professional growth, mentorship and visible alumni participation.' },
  { icon: '🏫', title: 'Giving back', text: 'Student orientation, career guidance, school support, medical camps and community service.' },
  { icon: '💰', title: 'SACCO growth', text: 'Structured saving, registration fee tracking, member contributions and transparent approvals.' },
  { icon: '🗂️', title: 'Records and memory', text: 'Gallery records, admin files, audit logs, contact submissions and official communication.' }
]
const capabilities = [
  'Structured alumni registration with first, last and other names',
  'Unified login for alumni and admins',
  'SACCO application with fixed registration fee rules',
  'Admin approval before financial status changes',
  'Gallery and event records for alumni activities',
  'Store ordering workflow separated from SACCO payments',
  'Contact desk for inquiries and collaboration',
  'Admin files area for documents and proof records'
]
</script>
