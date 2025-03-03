"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/Button"

interface NewsletterInterestFormProps {
  email: string
  onSaveAction: () => void
}

export function NewsletterInterestForm({ email, onSaveAction }: NewsletterInterestFormProps) {
  const [interests, setInterests] = useState({
    stocks: false,
    crypto: false,
    realestate: false,
    commodities: false,
    bonds: false,
    etfs: false,
  })

  const handleInterestChange = (interest: keyof typeof interests) => {
    setInterests(prev => ({
      ...prev,
      [interest]: !prev[interest]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the user's interests
    console.log("Saving interests for email:", email, interests)
    onSaveAction()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(interests).map(([key, value]) => (
            <div className="flex items-center space-x-2" key={key}>
              <input 
                type="checkbox" 
                id={key} 
                checked={value}
                onChange={() => handleInterestChange(key as keyof typeof interests)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor={key} className="text-sm font-medium capitalize">
                {key === "etfs" ? "ETFs" : key === "realestate" ? "Real Estate" : key}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button type="submit">
          Save Preferences
        </Button>
      </div>
    </form>
  )
} 