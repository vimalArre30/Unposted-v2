export default function WaveDivider({ color = '#f9fafb' }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 480 24"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: '24px', display: 'block' }}
      aria-hidden="true"
    >
      <path
        d="M0 12 C80 0, 160 24, 240 12 C320 0, 400 24, 480 12 L480 24 L0 24 Z"
        fill={color}
      />
    </svg>
  )
}
