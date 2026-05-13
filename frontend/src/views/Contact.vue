<template>
  <div class="grid gap-8 lg:grid-cols-[1fr_360px]">
    <section class="card">
      <p class="font-bold text-gold">Contact desk</p>
      <h1 class="mt-2 text-3xl font-black text-navy dark:text-gold">Reach the Seeta Alumni team.</h1>
      <p class="mt-3 leading-7 text-slate-600 dark:text-slate-300">Use this page for inquiries, feedback, collaboration, mentorship offers, store questions, SACCO direction, or school support ideas.</p>
      <form class="mt-6 grid gap-4" @submit.prevent="submit">
        <input v-model="form.name" class="input" placeholder="Your name" required />
        <input v-model="form.email" class="input" type="email" placeholder="Email" required />
        <input v-model="form.phone" class="input" placeholder="Phone" />
        <select v-model="form.category" class="input"><option>General inquiry</option><option>SACCO</option><option>Store</option><option>Mentorship</option><option>Events</option><option>Giving back</option></select>
        <input v-model="form.subject" class="input" placeholder="Subject" required />
        <textarea v-model="form.message" class="input" rows="6" placeholder="Message" required></textarea>
        <button class="btn-primary">Send message</button>
      </form>
      <p v-if="message" class="mt-4 rounded-lg bg-green-100 p-3 text-green-700">{{ message }}</p>
      <p v-if="error" class="mt-4 rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>
    </section>
    <aside class="space-y-5">
      <div class="card"><h2 class="font-black text-navy dark:text-gold">Contact details</h2><p class="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">📧 alumni@seetahigh.ug<br>📞 +256 700 000000<br>📍 Seeta High Schools, Uganda</p></div>
      <div class="card"><h2 class="font-black text-navy dark:text-gold">Quick links</h2><div class="mt-3 grid gap-2 text-sm font-bold"><router-link to="/register">Register as Alumni</router-link><router-link to="/sacco/register">Join the SACCO</router-link><router-link to="/donate">Make a donation</router-link><router-link to="/store">Visit store</router-link></div></div>
    </aside>
  </div>
</template>
<script setup>
import { reactive, ref } from 'vue'; import api from '../api'
const message=ref(''); const error=ref('')
const form=reactive({ name:'', email:'', phone:'', category:'General inquiry', subject:'', message:'' })
async function submit(){ message.value=''; error.value=''; try{ await api.post('/contact', form); message.value='Message sent. Admins can view it in the contact desk.'; Object.assign(form,{ name:'', email:'', phone:'', category:'General inquiry', subject:'', message:'' }) }catch(e){ error.value=e.response?.data?.error || e.message } }
</script>
