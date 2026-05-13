export const countries = [
  { name: 'Uganda', code: 'UG', dialCode: '+256' },
  { name: 'Kenya', code: 'KE', dialCode: '+254' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250' },
  { name: 'Burundi', code: 'BI', dialCode: '+257' },
  { name: 'South Sudan', code: 'SS', dialCode: '+211' },
  { name: 'Democratic Republic of the Congo', code: 'CD', dialCode: '+243' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234' },
  { name: 'Ghana', code: 'GH', dialCode: '+233' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251' },
  { name: 'Egypt', code: 'EG', dialCode: '+20' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'Qatar', code: 'QA', dialCode: '+974' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'China', code: 'CN', dialCode: '+86' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31' },
  { name: 'Belgium', code: 'BE', dialCode: '+32' },
  { name: 'Sweden', code: 'SE', dialCode: '+46' },
  { name: 'Norway', code: 'NO', dialCode: '+47' },
  { name: 'Denmark', code: 'DK', dialCode: '+45' },
  { name: 'Italy', code: 'IT', dialCode: '+39' },
  { name: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'Ireland', code: 'IE', dialCode: '+353' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41' },
  { name: 'Austria', code: 'AT', dialCode: '+43' },
  { name: 'Turkey', code: 'TR', dialCode: '+90' },
  { name: 'Brazil', code: 'BR', dialCode: '+55' },
  { name: 'Other / Not listed', code: 'OTHER', dialCode: '+' }
]

export const dialCodeOptions = countries.map(country => ({
  label: `${country.name} (${country.dialCode})`,
  value: country.dialCode,
  country: country.name
}))

export function defaultCountry() {
  return countries[0]
}

export function findCountryByName(name) {
  return countries.find(country => country.name === name) || defaultCountry()
}

export function findCountryByDialCode(dialCode) {
  return countries.find(country => country.dialCode === dialCode) || defaultCountry()
}
