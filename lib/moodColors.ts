export const MOOD_COLORS: Record<string, string> = {
  Joyful:    '#FFD166',
  Grateful:  '#A8D8A8',
  Love:      '#FF8FAB',
  Peaceful:  '#AED9E0',
  Energetic: '#FF6B35',
  Focused:   '#4A90D9',
  Sad:       '#7E9BB5',
  Worried:   '#B5A7C9',
  Angry:     '#E05C5C',
  Stressed:  '#C9A96E',
  Exhausted: '#8D9B8D',
  Fearful:   '#4A4A6A',
}

export function getMoodColor(mood: string): string {
  return MOOD_COLORS[mood] ?? '#A8D8A8'
}
