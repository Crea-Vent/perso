export function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(iso: string) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export const MONTH_LABELS_SHORT = [
  'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc',
]
