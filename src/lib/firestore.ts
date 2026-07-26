import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

export function useCollection<T extends { id: string }>(
  name: string,
  orderByField?: string,
) {
  const { user } = useAuth()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const col = collection(db, 'users', user.uid, name)
    const q = orderByField ? query(col, orderBy(orderByField, 'desc')) : query(col)
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user, name, orderByField])

  async function add(item: Omit<T, 'id'>) {
    if (!user) throw new Error('Not authenticated')
    await addDoc(collection(db, 'users', user.uid, name), item)
  }

  async function update(id: string, item: Partial<Omit<T, 'id'>>) {
    if (!user) throw new Error('Not authenticated')
    await updateDoc(doc(db, 'users', user.uid, name, id), item)
  }

  async function remove(id: string) {
    if (!user) throw new Error('Not authenticated')
    await deleteDoc(doc(db, 'users', user.uid, name, id))
  }

  return { data, loading, add, update, remove }
}
