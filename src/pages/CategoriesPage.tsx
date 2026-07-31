import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useCollection } from '../lib/firestore'
import type { Category, CategoryType } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Label, Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

export function CategoriesPage() {
  const { data: categories, add, update, remove } = useCollection<Category>('categories')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const income = categories.filter((c) => c.type === 'income')
  const expense = categories.filter((c) => c.type === 'expense')

  return (
    <div>
      <PageHeader
        title="Catégories"
        description="Organise tes revenus et dépenses par catégorie."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nouvelle catégorie
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <CategoryGroup title="Revenus" categories={income} onEdit={setEditing} onDelete={remove} />
        <CategoryGroup title="Dépenses" categories={expense} onEdit={setEditing} onDelete={remove} />
      </div>

      {open && <CategoryModal onClose={() => setOpen(false)} onSave={add} />}
      {editing && (
        <CategoryModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async (item) => {
            await update(editing.id, item)
          }}
        />
      )}
    </div>
  )
}

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
      {categories.length === 0 ? (
        <EmptyState icon={<Tags size={28} />} title="Aucune catégorie" />
      ) : (
        <ul className="flex flex-col gap-1">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(c)}
                  className="text-slate-300 hover:text-emerald-500 dark:text-slate-600"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer la catégorie « ${c.name} » ?`)) onDelete(c.id)
                  }}
                  className="text-slate-300 hover:text-red-500 dark:text-slate-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function CategoryModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Category
  onClose: () => void
  onSave: (item: Omit<Category, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<CategoryType>(initial?.type ?? 'expense')
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({ name, type, color })
      onClose()
    } catch {
      setError('Une erreur est survenue, réessaie.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Modifier la catégorie' : 'Nouvelle catégorie'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="cat-name">Nom</Label>
          <Input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cat-type">Type</Label>
          <Select
            id="cat-type"
            value={type}
            onChange={(e) => setType(e.target.value as CategoryType)}
          >
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </Select>
        </div>
        <div>
          <Label>Couleur</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={saving} className="mt-2">
          {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </form>
    </Modal>
  )
}
