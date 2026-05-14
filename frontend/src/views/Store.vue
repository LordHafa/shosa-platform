<template>
  <div class="space-y-8">
    <section class="rounded-3xl bg-navy p-6 text-white shadow-xl md:p-8">
      <p class="font-bold text-gold">Official merchandise</p>
      <h1 class="mt-2 text-3xl font-black md:text-4xl">Wear the SHOSA identity with pride.</h1>
      <p class="mt-4 max-w-3xl leading-8 text-slate-200">
        Browse official items, choose preferred colours or variants, build an order request,
        and send one clean WhatsApp-ready summary for follow-up.
      </p>
    </section>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="card text-center"><div class="text-3xl font-black text-gold">CAP</div><strong>Caps</strong></div>
      <div class="card text-center"><div class="text-3xl font-black text-gold">TEE</div><strong>T-Shirts / Polos</strong></div>
      <div class="card text-center"><div class="text-3xl font-black text-gold">HDY</div><strong>Hoodies</strong></div>
      <div class="card text-center"><div class="text-3xl font-black text-gold">WRB</div><strong>Wristbands</strong></div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_390px]">
      <section>
        <h2 class="mb-5 text-2xl font-black text-navy dark:text-gold">Signature collection</h2>

        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="product in products" :key="product.id" class="card overflow-hidden p-0">
            <div class="flex h-60 items-center justify-center bg-gradient-to-br from-cream via-white to-gold/10 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-navy/50 sm:h-64">
              <img
                :src="selectedVariant(product).image"
                :alt="`${product.name} - ${selectedVariant(product).label}`"
                class="max-h-full max-w-full rounded-2xl object-contain drop-shadow"
              />
            </div>

            <div class="p-5">
              <p class="text-sm font-bold text-gold">{{ product.tag }}</p>
              <h3 class="text-xl font-black">{{ product.name }}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ product.description }}</p>

              <div class="mt-4">
                <p class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Choose option</p>
                <div class="flex snap-x gap-2 overflow-x-auto pb-2">
                  <button
                    v-for="variant in product.variants"
                    :key="variant.id"
                    type="button"
                    class="min-w-[82px] snap-start rounded-xl border p-1.5 text-xs transition"
                    :class="selectedVariantId(product.id) === variant.id
                      ? 'border-gold bg-gold/20 text-navy ring-2 ring-gold/30 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'"
                    @click="selectVariant(product.id, variant.id)"
                  >
                    <span class="mb-1 flex h-14 items-center justify-center rounded-lg bg-cream p-1 dark:bg-slate-900">
                      <img :src="variant.image" :alt="variant.label" class="max-h-full max-w-full object-contain" />
                    </span>
                    <span class="block truncate">{{ variant.label }}</span>
                  </button>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between gap-3">
                <strong class="text-navy dark:text-gold">{{ money(product.price) }}</strong>
                <div class="flex items-center gap-2">
                  <button class="min-h-10 rounded-lg bg-slate-200 px-3 py-1 dark:bg-slate-700" type="button" @click="decrease(product)">-</button>
                  <span class="min-w-5 text-center font-bold">{{ quantity(product) }}</span>
                  <button class="min-h-10 rounded-lg bg-gold px-3 py-1 font-bold text-navy" type="button" @click="increase(product)">+</button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <aside class="card h-fit lg:sticky lg:top-24">
        <h2 class="text-xl font-black text-navy dark:text-gold">Send a merchandise request</h2>
        <p class="mt-2 text-sm text-slate-500">
          Build your order, add your details, then send it directly to the SHOSA WhatsApp line or copy it for admin follow-up.
        </p>

        <div class="mt-5 space-y-3">
          <input v-model="customer.name" class="input" placeholder="Full name" />
          <input v-model="customer.phone" class="input" placeholder="Phone / WhatsApp" />
          <input v-model="customer.email" class="input" placeholder="Email" />
          <select v-model="customer.delivery" class="input">
            <option>Pick up from school/alumni desk</option>
            <option>Delivery / rider arrangement</option>
            <option>Reserve for next event</option>
          </select>
          <textarea v-model="customer.notes" class="input" placeholder="Preferred sizes, dates needed, extra notes"></textarea>
        </div>

        <div class="mt-5 rounded-2xl bg-cream p-4 dark:bg-slate-800">
          <h3 class="font-black">Live order summary</h3>
          <p v-if="!selectedItems.length" class="mt-2 text-sm text-slate-500">No items added yet. Use the + buttons.</p>

          <div v-else class="mt-3 space-y-2 text-sm">
            <div v-for="item in selectedItems" :key="item.key" class="flex justify-between gap-3">
              <span>{{ item.qty }} x {{ item.name }} <span class="text-slate-500">({{ item.variantLabel }})</span></span>
              <strong>{{ money(item.qty * item.price) }}</strong>
            </div>
            <div class="border-t pt-2 text-right text-base font-black">Total: {{ money(total) }}</div>
          </div>
        </div>

        <div class="mt-5 grid gap-3">
          <button
            class="w-full btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="!selectedItems.length"
            @click="sendOrderToWhatsApp"
          >
            Send order on WhatsApp
          </button>

          <button
            class="w-full btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="!selectedItems.length"
            @click="copySummary"
          >
            Copy order summary
          </button>
        </div>

        <p v-if="message" class="mt-3 rounded-lg bg-green-100 p-3 text-sm text-green-700">{{ message }}</p>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { SHOSA_WHATSAPP_NUMBER } from '../data/brand'
import { defaultVariant, money, products } from '../data/storeProducts'

const message = ref('')
const customer = reactive({
  name: '',
  phone: '',
  email: '',
  delivery: 'Pick up from school/alumni desk',
  notes: ''
})

const selectedVariants = reactive({})
const cart = reactive({})

function selectedVariantId(productId) {
  const product = products.find(p => p.id === productId)
  return selectedVariants[productId] || defaultVariant(product).id
}

function selectedVariant(product) {
  return product.variants.find(v => v.id === selectedVariantId(product.id)) || defaultVariant(product)
}

function selectVariant(productId, variantId) {
  selectedVariants[productId] = variantId
}

function cartKey(product) {
  return `${product.id}:${selectedVariant(product).id}`
}

function quantity(product) {
  return cart[cartKey(product)] || 0
}

const selectedItems = computed(() => {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const [productId, variantId] = key.split(':')
      const product = products.find(p => String(p.id) === productId)
      const variant = product?.variants.find(v => v.id === variantId)
      return {
        key,
        id: product?.id,
        name: product?.name || 'Item',
        variantLabel: variant?.label || 'Default',
        price: product?.price || 0,
        qty
      }
    })
})

const total = computed(() => selectedItems.value.reduce((sum, item) => sum + item.qty * item.price, 0))

const orderSummary = computed(() => {
  return [
    'SHOSA STORE ORDER',
    `Name: ${customer.name || '-'}`,
    `Phone: ${customer.phone || '-'}`,
    `Email: ${customer.email || '-'}`,
    `Delivery: ${customer.delivery}`,
    '',
    'Items:',
    ...selectedItems.value.map(i => `- ${i.qty} x ${i.name} (${i.variantLabel}) = ${money(i.qty * i.price)}`),
    '',
    `Total: ${money(total.value)}`,
    `Notes: ${customer.notes || '-'}`
  ].join('\n')
})

function increase(product) {
  const key = cartKey(product)
  cart[key] = (cart[key] || 0) + 1
}

function decrease(product) {
  const key = cartKey(product)
  cart[key] = Math.max(0, (cart[key] || 0) - 1)
}

async function copySummary() {
  await navigator.clipboard.writeText(orderSummary.value)
  message.value = 'Order summary copied. You can paste it into WhatsApp or a message.'
}

function sendOrderToWhatsApp() {
  if (!selectedItems.value.length) {
    message.value = 'Please add at least one item before sending an order.'
    return
  }

  const number = String(SHOSA_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  const url = `https://wa.me/${number}?text=${encodeURIComponent(orderSummary.value)}`
  window.open(url, '_blank', 'noopener,noreferrer')
  message.value = 'WhatsApp order opened. Confirm and send it to SHOSA.'
}
</script>