<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-bold text-gold">Governance & Roles</p>
        <h1 class="text-3xl font-black text-navy dark:text-gold">Admin Users</h1>
        <p class="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">Manage admin accounts, campus scope and role assignments without exposing password hashes. This screen supports the final Seeta governance foundation.</p>
      </div>
      <router-link class="btn-secondary" to="/admin">Back to Dashboard</router-link>
    </div>

    <section class="card">
      <h2 class="mb-4 text-xl font-black text-navy dark:text-gold">Create Admin User</h2>
      <form class="grid gap-4 md:grid-cols-2 lg:grid-cols-5" @submit.prevent="createAdmin">
        <input v-model="form.fullName" class="rounded-lg border px-4 py-3 text-slate-900" placeholder="Full name" required />
        <input v-model="form.email" type="email" class="rounded-lg border px-4 py-3 text-slate-900" placeholder="Email" required />
        <select v-model="form.role" class="rounded-lg border px-4 py-3 text-slate-900">
          <option v-for="role in roles" :key="role.code" :value="role.code">{{ role.name || nice(role.code) }}</option>
        </select>
        <select v-model="form.campusScope" class="rounded-lg border px-4 py-3 text-slate-900">
          <option value="">All campuses / central</option>
          <option v-for="campus in campuses" :key="campus.code" :value="campus.code">{{ campus.name }}</option>
        </select>
        <input v-model="form.password" type="password" class="rounded-lg border px-4 py-3 text-slate-900" placeholder="Temp password" required minlength="8" />
        <button class="btn-primary md:col-span-2 lg:col-span-5" type="submit">Create Admin</button>
      </form>
      <p v-if="message" class="mt-3 rounded-lg bg-green-100 px-4 py-3 text-green-800">{{ message }}</p>
      <p v-if="error" class="mt-3 rounded-lg bg-red-100 px-4 py-3 text-red-800">{{ error }}</p>
    </section>

    <section class="card overflow-x-auto">
      <h2 class="mb-4 text-xl font-black text-navy dark:text-gold">Existing Admins</h2>
      <table class="w-full text-sm">
        <thead><tr class="text-left"><th>Name</th><th>Email</th><th>Primary Role</th><th>Campus Scope</th><th>Created</th></tr></thead>
        <tbody>
          <tr v-for="admin in admins" :key="admin.id" class="border-t border-slate-200 dark:border-slate-700">
            <td class="py-3 font-bold">{{ admin.fullName }}</td>
            <td>{{ admin.email }}</td>
            <td>{{ roleName(admin.role) }}</td>
            <td>{{ campusName(admin.campusScope) }}</td>
            <td>{{ date(admin.createdAt) }}</td>
          </tr>
          <tr v-if="!admins.length"><td colspan="5" class="py-4 text-slate-500">No admin users found.</td></tr>
        </tbody>
      </table>
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
      <div class="card">
        <h2 class="mb-4 text-xl font-black text-navy dark:text-gold">Roles</h2>
        <div class="space-y-3">
          <div v-for="role in roles" :key="role.code" class="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p class="font-black text-navy dark:text-gold">{{ role.name || nice(role.code) }}</p>
            <p class="text-sm text-slate-500">{{ role.description || 'Governance role' }}</p>
            <p class="mt-1 text-xs font-semibold text-gold">Scope: {{ role.scopeLevel || 'global' }}</p>
          </div>
        </div>
      </div>
      <div class="card">
        <h2 class="mb-4 text-xl font-black text-navy dark:text-gold">Campuses</h2>
        <div class="space-y-3">
          <div v-for="campus in campuses" :key="campus.code" class="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <span class="font-bold">{{ campus.name }}</span>
            <span class="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-navy dark:text-gold">{{ campus.code }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '../api'

const admins = ref([])
const governance = ref({ roles: [], campuses: [] })
const message = ref('')
const error = ref('')
const form = reactive({ fullName: '', email: '', role: 'admin', campusScope: '', password: '' })

const roles = ref([])
const campuses = ref([])

function nice(value){ return String(value || '—').replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase()) }
function date(value){ return value ? new Date(value).toLocaleDateString() : '—' }
function roleName(code){ const role = roles.value.find(r => r.code === code); return role?.name || nice(code) }
function campusName(code){ if(!code) return 'All campuses'; const campus = campuses.value.find(c => c.code === code); return campus?.name || nice(code) }

async function load(){
  const [usersRes, governanceRes] = await Promise.all([api.get('/admin/users'), api.get('/admin/governance')])
  admins.value = usersRes.data
  governance.value = governanceRes.data
  roles.value = governance.value.roles || []
  campuses.value = governance.value.campuses || []
}

async function createAdmin(){
  message.value = ''
  error.value = ''
  try {
    await api.post('/admin/users', { ...form })
    message.value = 'Admin user created and audit-logged.'
    form.fullName = ''; form.email = ''; form.role = 'admin'; form.campusScope = ''; form.password = ''
    await load()
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create admin user'
  }
}

onMounted(load)
</script>
