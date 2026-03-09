import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: entries } = await supabase
    .from('entries')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!entries || entries.length === 0) {
    return NextResponse.json({ current_streak: 0, week_days: Array(7).fill(false), total_entries: 0 })
  }

  // Normalise each entry to a YYYY-MM-DD string in local time
  const entryDates = new Set(
    entries.map((e) => {
      const d = new Date(e.created_at)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
  )

  // Current streak — walk back from today until a day with no entry
  function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const today = new Date()
  let streak = 0
  const cursor = new Date(today)

  // If today has no entry, start counting from yesterday
  if (!entryDates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (entryDates.has(toDateStr(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  // Week days (Mon–Sun) for the current ISO week
  const dayOfWeek = today.getDay() // 0 = Sun, 1 = Mon, …, 6 = Sat
  // Shift so Monday = index 0
  const mondayOffset = (dayOfWeek + 6) % 7
  const weekDays: boolean[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - mondayOffset + i)
    weekDays.push(entryDates.has(toDateStr(d)))
  }

  return NextResponse.json({
    current_streak: streak,
    week_days: weekDays,
    total_entries: entries.length,
  })
}
