import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

function getGrowthStage(n: number): string {
  if (n === 0) return 'seed'
  if (n <= 6)  return 'sapling'
  if (n <= 15) return 'plant'
  if (n <= 35) return 'tree'
  return 'ancient tree'
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch fingerprint and recent entries in parallel
  const [fpResult, entriesResult] = await Promise.all([
    supabase
      .from('emotion_fingerprint')
      .select('themes, dominant_emotions, entry_count')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('entries')
      .select('mood_word, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const fp = fpResult.data
  const entries = entriesResult.data ?? []
  const recentMoods = entries.map((e) => e.mood_word).filter(Boolean)
  const totalEntries = fp?.entry_count ?? entries.length
  const growthStage = getGrowthStage(totalEntries)

  // Generate inner weather words
  let innerWeather = 'still · reaching · tender'
  try {
    const themes = (fp?.themes as string[] | null)?.join(', ') || 'unknown'
    const emotions = (fp?.dominant_emotions as string[] | null)?.join(', ') || 'unknown'
    const moodsStr = recentMoods.join(', ') || 'unknown'

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Based on these emotional signals and themes, generate exactly 3 words that describe this person's current inner state. These are "inner weather" words.

Rules: lowercase only, evocative not clinical, poetic not generic, avoid common words like "anxious" or "happy". Each word should feel slightly unexpected. Examples: "restless · building · tender" or "still · reaching · tangled".

Themes: ${themes}
Dominant emotions: ${emotions}
Recent moods: ${moodsStr}

Return only the 3 words separated by · with no other text.`,
        },
      ],
      max_tokens: 20,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    if (raw) innerWeather = raw
  } catch (err) {
    console.error('Inner weather generation failed:', err)
  }

  // Generate and persist referral code
  const referralCode = user.id.replace(/-/g, '').slice(0, 6).toUpperCase()
  await supabase
    .from('profiles')
    .upsert({ user_id: user.id, referral_code: referralCode }, { onConflict: 'user_id' })

  return NextResponse.json({ innerWeather, recentMoods, totalEntries, growthStage, referralCode })
}
