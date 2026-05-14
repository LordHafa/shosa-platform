<template>
  <footer class="mt-12 bg-navy text-white">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
      <div class="space-y-4">
        <div class="mb-3 flex items-center gap-3">
          <img :src="BRAND_ASSETS.mainLogo" alt="SHOSA logo" class="h-12 w-12 rounded-full border-2 border-gold bg-white object-cover" />
          <div>
            <h3 class="text-lg font-bold text-gold">{{ BRAND_NAME }}</h3>
            <p class="text-xs uppercase tracking-[0.24em] text-slate-400">{{ BRAND_SUBTITLE }}</p>
          </div>
        </div>
        <p class="text-sm leading-7 text-slate-200">A public hub for alumni connections, SACCO membership, events, gallery memories and official SHOSA merchandise.</p>
        <router-link to="/register" class="inline-flex rounded-full bg-gold px-4 py-2 text-sm font-bold text-navy transition hover:bg-gold/90">Join SHOSA</router-link>
      </div>

      <div>
        <h3 class="mb-3 font-bold text-gold">Community</h3>
        <ul class="space-y-2 text-sm text-slate-200">
          <li><router-link to="/register" class="transition hover:text-gold">Register as Alumni</router-link></li>
          <li><router-link to="/login" class="transition hover:text-gold">Alumni Login</router-link></li>
          <li><router-link to="/events" class="transition hover:text-gold">Events</router-link></li>
          <li><router-link to="/gallery" class="transition hover:text-gold">Gallery</router-link></li>
          <li><router-link to="/contact" class="transition hover:text-gold">Mentorship / Contact</router-link></li>
        </ul>
      </div>

      <div>
        <h3 class="mb-3 font-bold text-gold">SACCO</h3>
        <ul class="space-y-2 text-sm text-slate-200">
          <li><router-link to="/sacco/register" class="transition hover:text-gold">Join / Update</router-link></li>
          <li><router-link to="/sacco/payments" class="transition hover:text-gold">Make a Payment</router-link></li>
          <li><router-link to="/donate" class="transition hover:text-gold">Donation</router-link></li>
          <li><router-link to="/admin/payments" class="transition hover:text-gold">Admin verification / audit</router-link></li>
        </ul>
      </div>

      <div>
        <h3 class="mb-3 font-bold text-gold">Explore</h3>
        <ul class="space-y-2 text-sm text-slate-200">
          <li><router-link to="/store" class="transition hover:text-gold">Store</router-link></li>
          <li><router-link :to="LEAGUE_LINK" class="transition hover:text-gold">SHOSA League</router-link></li>
          <li><a :href="SCHOOL_ALUMNI_URL" target="_blank" rel="noreferrer" class="transition hover:text-gold">Seeta High Schools</a></li>
          <li><router-link to="/contact" class="transition hover:text-gold">Contact</router-link></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10 py-4 text-center text-sm text-slate-300">&copy; 2026 {{ BRAND_FULL_NAME }}. All rights reserved.</div>
  </footer>
</template>

<script setup>
import { BRAND_NAME, BRAND_SUBTITLE, BRAND_FULL_NAME, SCHOOL_ALUMNI_URL, LEAGUE_LINK, BRAND_ASSETS } from '../data/brand'
</script>



