export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  color: string
}

export interface Transaction {
  id: string
  date: string // ISO date (yyyy-MM-dd)
  amount: number // always positive
  type: CategoryType
  categoryId: string
  description: string
}

export type SubscriptionFrequency = 'monthly' | 'annual'

export interface Subscription {
  id: string
  name: string
  amount: number
  frequency: SubscriptionFrequency
  categoryId: string
  nextBillingDate: string // ISO date
  active: boolean
}

export interface Investment {
  id: string
  name: string
  kind: string // e.g. Actions, Crypto, Immobilier, PEA, Assurance-vie...
  amountInvested: number
  currentValue: number
  date: string // ISO date of last valuation / entry
  note?: string
}

export interface SavingsAccount {
  id: string
  name: string
  amount: number
  targetAmount?: number
  note?: string
}

export type PendingIncomeType = 'salaire' | 'indemnite' | 'autre'
export type PendingIncomeStatus = 'pending' | 'received'

export interface PendingIncome {
  id: string
  label: string
  type: PendingIncomeType
  amount: number
  expectedDate: string // ISO date
  status: PendingIncomeStatus
}
