"use client"

import React from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NewsletterInterestForm } from './NewsletterInterestForm'

interface InterestPopupProps {
  email: string
  isOpen: boolean
  onCloseAction: () => void
}

export function InterestPopup({ email, isOpen, onCloseAction }: InterestPopupProps) {
  const handleSave = () => {
    onCloseAction()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-2xl bg-background rounded-lg shadow-xl p-6 mx-4"
          >
            <button 
              onClick={onCloseAction}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Customize Your Newsletter</h2>
              <p className="text-muted-foreground mt-2">
                Select the investments you're interested in to receive personalized weekly updates.
              </p>
            </div>
            
            <NewsletterInterestForm 
              email={email} 
              onSaveAction={handleSave} 
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 