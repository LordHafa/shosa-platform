<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4"><div><p class="font-bold text-gold">System accountability</p><h1 class="text-3xl font-black text-navy dark:text-gold">Audit Logs</h1><p class="mt-2 text-slate-600 dark:text-slate-300">Financial approvals, document actions, gallery changes, contact handling and permission denials are tracked here.</p></div><router-link class="btn-secondary" to="/admin">Back to dashboard</router-link></div>
    <form class="card grid gap-3 md:grid-cols-3" @submit.prevent="load"><input v-model="filters.action" class="input" placeholder="Filter by action"><input v-model="filters.resourceType" class="input" placeholder="Resource type"><button class="btn-primary">Apply Filters</button></form>
    <div class="card overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left"><th>Date</th><th>Admin</th><th>Role</th><th>Action</th><th>Resource</th><th>Status</th><th>Reason</th></tr></thead><tbody><tr v-for="l in logs" :key="l.id" class="border-t border-slate-100 dark:border-slate-800"><td class="py-2">{{ new Date(l.createdAt).toLocaleString() }}</td><td>{{ l.adminEmail || 'system' }}</td><td>{{ l.adminRole || 'â€”' }}</td><td class="font-bold">{{ l.action }}</td><td>{{ l.resourceType }} <span v-if="l.resourceId">#{{ l.resourceId }}</span></td><td>{{ l.status }}</td><td>{{ l.reason || 'â€”' }}</td></tr><tr v-if="!logs.length"><td colspan="7" class="py-6 text-slate-500">No audit logs found.</td></tr></tbody></table></div>
  </div>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'; import api from '../api'
const logs=ref([]); const filters=reactive({action:'',resourceType:''})
async function load(){ const params={}; Object.entries(filters).forEach(([k,v])=>{ if(v) params[k]=v }); logs.value=(await api.get('/admin/audit-logs',{params})).data }
onMounted(load)
</script>

