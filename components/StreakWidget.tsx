const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface StreakWidgetProps {
  streak: number
  weekDays: boolean[]
  totalEntries: number
}

export default function StreakWidget({ streak, weekDays, totalEntries }: StreakWidgetProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-green-200 bg-white px-4 py-3">
      {/* Left: flame + streak */}
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">🔥</span>
        {streak > 0 ? (
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-gray-900">{streak}</span>
            <span className="text-xs text-gray-400">day streak</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Start your streak today 🌱</span>
        )}
      </div>

      {/* Right: week dots Mon–Sun */}
      <div className="flex items-end gap-1.5">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full ${
                weekDays[i] ? 'bg-green-700' : 'border border-gray-300 bg-transparent'
              }`}
            />
            <span className="text-[10px] leading-none text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
