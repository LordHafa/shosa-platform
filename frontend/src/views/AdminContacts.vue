<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4"><div><p class="font-bold text-gold">Admin contact handling</p><h1 class="text-3xl font-black text-navy dark:text-gold">Contact Messages</h1><p class="mt-2 text-slate-600 dark:text-slate-300">Read, reply-track and archive alumni, SACCO, store and technical inquiries.</p></div><router-link class="btn-secondary" to="/admin">Back to dashboard</router-link></div>
    <form class="card flex flex-wrap gap-3" @submit.prevent="load"><select v-model="status" class="input"><option value="">All statuses</option><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select><button class="btn-primary">Apply</button></form>
    <section class="grid gap-4">
      <article v-for="m in messages" :key="m.id" class="card"><div class="flex flex-wrap justify-between gap-3"><div><p class="text-xs font-bold uppercase text-gold">{{ m.category }} • {{ m.status }}</p><h2 class="text-xl font-black text-navy dark:text-gold">{{ m.subject }}</h2><p class="text-sm text-slate-500">{{ m.name }} • {{ m.email }} • {{ m.phone || 'No phone' }}</p></div><select class="input max-w-40" :value="m.status" @change="setStatus(m.id,$event.target.value)"><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select></div><p class="mt-4 whitespace-pre-line text-slate-700 dark:text-slate-300">{{ m.message }}</p><p class="mt-3 text-xs text-slate-400">Submitted {{ new Date(m.createdAt).toLocaleString() }}</p></article>
      <p v-if="!messages.length" class="card text-slate-500">No contact messages found.</p>
    </section>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'; import api from '../api'
const messages=ref([]); const status=ref('')
async function load(){ const params={}; if(status.value) params.status=status.value; messages.value=(await api.get('/admin/contacts',{params})).data }
async function setStatus(id,newStatus){ await api.put(`/admin/contacts/${id}/status`, { status:newStatus }); await load() }
onMounted(load)
</script>
