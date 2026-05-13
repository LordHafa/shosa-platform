const assetBase = '/assets/store-merchandise'

export const products = [
  {
    id: 1,
    tag: 'Best seller',
    name: 'Seeta Alumni T-Shirt',
    description: 'Classic unisex alumni tee for reunions, volunteering, sports days, and everyday Seeta pride.',
    price: 35000,
    variants: [
      { id: 'white', label: 'White', image: `${assetBase}/03_tshirts_unisex/tshirt_unisex_white.png` },
      { id: 'navy_blue', label: 'Navy Blue', image: `${assetBase}/03_tshirts_unisex/tshirt_unisex_navy_blue.png` },
      { id: 'black', label: 'Black', image: `${assetBase}/03_tshirts_unisex/tshirt_unisex_black.png` },
      { id: 'maroon', label: 'Maroon', image: `${assetBase}/03_tshirts_unisex/tshirt_unisex_maroon.png` }
    ]
  },
  {
    id: 2,
    tag: 'Women',
    name: "Women's Seeta Alumni T-Shirt",
    description: "A fitted women's tee for alumni events, casual wear, and proud Seeta representation.",
    price: 35000,
    variants: [
      { id: 'white', label: 'White', image: `${assetBase}/04_tshirts_women/tshirt_women_white.png` },
      { id: 'navy_blue', label: 'Navy Blue', image: `${assetBase}/04_tshirts_women/tshirt_women_navy_blue.png` },
      { id: 'black', label: 'Black', image: `${assetBase}/04_tshirts_women/tshirt_women_black.png` },
      { id: 'light_pink', label: 'Light Pink', image: `${assetBase}/04_tshirts_women/tshirt_women_light_pink.png` }
    ]
  },
  {
    id: 3,
    tag: 'Smart wear',
    name: 'Collared Polo Shirt',
    description: 'A sharper branded look for committee work, official school visits, and alumni functions.',
    price: 55000,
    variants: [
      { id: 'white', label: 'White', image: `${assetBase}/05_polo_shirts/polo_white.png` },
      { id: 'navy_blue', label: 'Navy Blue', image: `${assetBase}/05_polo_shirts/polo_navy_blue.png` },
      { id: 'black', label: 'Black', image: `${assetBase}/05_polo_shirts/polo_black.png` },
      { id: 'maroon', label: 'Maroon', image: `${assetBase}/05_polo_shirts/polo_maroon.png` }
    ]
  },
  {
    id: 4,
    tag: 'Premium',
    name: 'Alumni Hoodie',
    description: 'Warm premium layer for travel, evenings, league weekends, and alumni outdoor events.',
    price: 80000,
    variants: [
      { id: 'forest_green', label: 'Forest Green', image: `${assetBase}/02_hoodies/hoodie_forest_green.png` },
      { id: 'navy_blue', label: 'Navy Blue', image: `${assetBase}/02_hoodies/hoodie_navy_blue.png` },
      { id: 'black', label: 'Black', image: `${assetBase}/02_hoodies/hoodie_black.png` },
      { id: 'heather_grey', label: 'Heather Grey', image: `${assetBase}/02_hoodies/hoodie_heather_grey.png` }
    ]
  },
  {
    id: 5,
    tag: 'Outdoor',
    name: 'Seeta Alumni Cap',
    description: 'A simple branded cap for outreach days, road trips, school activity, and casual wear.',
    price: 30000,
    variants: [
      { id: 'white', label: 'White', image: `${assetBase}/01_caps/cap_white.png` },
      { id: 'navy_blue', label: 'Navy Blue', image: `${assetBase}/01_caps/cap_navy_blue.png` },
      { id: 'black', label: 'Black', image: `${assetBase}/01_caps/cap_black.png` },
      { id: 'beige', label: 'Beige', image: `${assetBase}/01_caps/cap_beige.png` }
    ]
  },
  {
    id: 6,
    tag: 'Budget friendly',
    name: 'Wristband',
    description: 'Affordable for awareness campaigns, team identity, giveaway bags, and youth engagement.',
    price: 5000,
    variants: [
      { id: 'green', label: 'Green', image: `${assetBase}/06_wristbands/wristband_green.png` },
      { id: 'maroon', label: 'Maroon', image: `${assetBase}/06_wristbands/wristband_maroon.png` },
      { id: 'navy_blue', label: 'Navy Blue', image: `${assetBase}/06_wristbands/wristband_navy_blue.png` },
      { id: 'gold_yellow', label: 'Gold Yellow', image: `${assetBase}/06_wristbands/wristband_gold_yellow.png` }
    ]
  },
  {
    id: 7,
    tag: 'Daily use',
    name: 'Alumni Tote Bag',
    description: 'A practical bag for events, documents, giveaways, and campus visits.',
    price: 25000,
    variants: [
      { id: 'natural', label: 'Natural', image: `${assetBase}/07_tote_bags/tote_bag_natural.png` },
      { id: 'navy_blue', label: 'Navy Blue', image: `${assetBase}/07_tote_bags/tote_bag_navy_blue.png` },
      { id: 'black', label: 'Black', image: `${assetBase}/07_tote_bags/tote_bag_black.png` },
      { id: 'maroon', label: 'Maroon', image: `${assetBase}/07_tote_bags/tote_bag_maroon.png` }
    ]
  },
  {
    id: 8,
    tag: 'Giftable',
    name: 'Sticker Pack',
    description: 'Great for laptops, notebooks, gifts, and small event packs that keep the brand visible.',
    price: 10000,
    variants: [
      { id: 'seeta_high_rectangle', label: 'Rectangle', image: `${assetBase}/08_stickers/sticker_seeta_high_made_me_rectangle.png` },
      { id: 'seeta_round', label: 'Round', image: `${assetBase}/08_stickers/sticker_seeta_high_made_me_round.png` },
      { id: 'together_beyond_school', label: 'Together', image: `${assetBase}/08_stickers/sticker_together_beyond_school.png` },
      { id: 'full_pack', label: 'Full Pack', image: `${assetBase}/08_stickers/_full_stickers_sheet.png` }
    ]
  }
]

export function defaultVariant(product) {
  return product?.variants?.[0]
}

export function money(value) {
  return 'UGX ' + Number(value || 0).toLocaleString('en-UG')
}
