import { motion, AnimatePresence } from 'framer-motion'

export const RightToLeft = (props: { visible: boolean; children: React.ReactNode }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.5 }}
      >
        {props.visible && props.children}
      </motion.div>
    </AnimatePresence>
  )
}
