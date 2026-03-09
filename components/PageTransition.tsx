'use client'

import { motion } from 'framer-motion'

export default function PageTransition({
  children,
  id,
}: {
  children: React.ReactNode
  id?: string
}) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
