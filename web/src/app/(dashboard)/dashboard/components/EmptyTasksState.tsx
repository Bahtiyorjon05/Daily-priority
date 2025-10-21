'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function EmptyTasksState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="p-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            No tasks yet
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Great! You're all caught up. Start by creating your first task to stay organized and productive.
          </p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="success"
              className="bg-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 hover:bg-emerald-700 hover:from-emerald-700 hover:to-teal-700 !text-white hover:!text-white shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Task
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
