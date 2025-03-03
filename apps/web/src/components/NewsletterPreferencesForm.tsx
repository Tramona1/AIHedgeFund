"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/Button"
// Comment out missing Checkbox component
// import { Checkbox } from "@/components/ui/Checkbox"
import { Label } from "@/components/ui/label"
// Comment out missing RadioGroup component
// import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loader2 } from "lucide-react"
// Comment out missing Spinner component
// import { Spinner } from '@/components/ui/Spinner'

interface NewsletterPreferencesFormProps {
  userId: string
  email: string
  successRedirectUrl?: string
}

interface NewsletterPreferences {
  isSubscribed: boolean
  stocks: boolean
  options: boolean
  crypto: boolean
  forex: boolean
  commodities: boolean
  weeklyMarketSummary: boolean
  weeklyWatchlistUpdates: boolean
  weeklyOptionsFlow: boolean
  weeklyDarkPoolActivity: boolean
  frequency: string
  preferredDay: string
}

export function NewsletterPreferencesForm({ userId, email, successRedirectUrl }: NewsletterPreferencesFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NewsletterPreferences>({
    isSubscribed: true,
    stocks: true,
    options: false,
    crypto: false,
    forex: false,
    commodities: false,
    weeklyMarketSummary: true,
    weeklyWatchlistUpdates: true,
    weeklyOptionsFlow: false,
    weeklyDarkPoolActivity: false,
    frequency: 'weekly',
    preferredDay: 'sunday'
  })

  // Fetch user's newsletter preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) return
      
      setLoading(true)
      try {
        const response = await fetch('/api/newsletter/preferences')
        const data = await response.json()
        
        if (data.success && data.data) {
          setPreferences({
            isSubscribed: data.data.isSubscribed,
            stocks: data.data.stocks,
            options: data.data.options,
            crypto: data.data.crypto,
            forex: data.data.forex,
            commodities: data.data.commodities,
            weeklyMarketSummary: data.data.weeklyMarketSummary,
            weeklyWatchlistUpdates: data.data.weeklyWatchlistUpdates,
            weeklyOptionsFlow: data.data.weeklyOptionsFlow,
            weeklyDarkPoolActivity: data.data.weeklyDarkPoolActivity,
            frequency: data.data.frequency || 'weekly',
            preferredDay: data.data.preferredDay
          })
        }
      } catch (error) {
        console.error('Error fetching newsletter preferences:', error)
        toast({
          title: "Error",
          description: "Failed to load your newsletter preferences",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchPreferences()
  }, [userId, toast])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSaving(true)
    try {
      const response = await fetch('/api/newsletter/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Your newsletter preferences have been saved",
          variant: "default"
        })
        
        if (successRedirectUrl) {
          window.location.href = successRedirectUrl;
        }
      } else {
        throw new Error(data.message || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving newsletter preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save your newsletter preferences",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle checkbox changes
  const handleCheckboxChange = (field: keyof NewsletterPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }))
  }

  // Handle radio button changes
  const handleFrequencyChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      frequency: value
    }))
  }

  // Handle preferred day changes
  const handleDayChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredDay: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="ml-2">Loading newsletter preferences...</span>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Newsletter Preferences</CardTitle>
        <CardDescription>
          Customize your newsletter experience to receive updates on the topics that matter most to you.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Subscription Status */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="isSubscribed" 
                checked={preferences.isSubscribed}
                onChange={(e) => handleCheckboxChange('isSubscribed')}
              />
              <Label htmlFor="isSubscribed" className="font-medium">
                Subscribe to our newsletter
              </Label>
            </div>
            <p className="text-sm text-gray-500 ml-6">
              You'll receive updates based on your preferences below
            </p>
          </div>
          
          {/* Interest Areas */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Interest Areas</h3>
            <p className="text-sm text-gray-500">
              Select the topics you're interested in receiving updates about
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="stocks" 
                  checked={preferences.stocks}
                  onChange={(e) => handleCheckboxChange('stocks')}
                />
                <Label htmlFor="stocks">Stocks</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="options" 
                  checked={preferences.options}
                  onChange={(e) => handleCheckboxChange('options')}
                />
                <Label htmlFor="options">Options</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="crypto" 
                  checked={preferences.crypto}
                  onChange={(e) => handleCheckboxChange('crypto')}
                />
                <Label htmlFor="crypto">Cryptocurrency</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="forex" 
                  checked={preferences.forex}
                  onChange={(e) => handleCheckboxChange('forex')}
                />
                <Label htmlFor="forex">Forex</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="commodities" 
                  checked={preferences.commodities}
                  onChange={(e) => handleCheckboxChange('commodities')}
                />
                <Label htmlFor="commodities">Commodities</Label>
              </div>
            </div>
          </div>
          
          {/* Newsletter Content */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Newsletter Content</h3>
            <p className="text-sm text-gray-500">
              Choose what content you'd like to receive in your newsletter
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="weeklyMarketSummary" 
                  checked={preferences.weeklyMarketSummary}
                  onChange={(e) => handleCheckboxChange('weeklyMarketSummary')}
                />
                <Label htmlFor="weeklyMarketSummary">Market Summary</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="weeklyWatchlistUpdates" 
                  checked={preferences.weeklyWatchlistUpdates}
                  onChange={(e) => handleCheckboxChange('weeklyWatchlistUpdates')}
                />
                <Label htmlFor="weeklyWatchlistUpdates">Watchlist Updates</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="weeklyOptionsFlow" 
                  checked={preferences.weeklyOptionsFlow}
                  onChange={(e) => handleCheckboxChange('weeklyOptionsFlow')}
                />
                <Label htmlFor="weeklyOptionsFlow">Options Flow Insights</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="weeklyDarkPoolActivity" 
                  checked={preferences.weeklyDarkPoolActivity}
                  onChange={(e) => handleCheckboxChange('weeklyDarkPoolActivity')}
                />
                <Label htmlFor="weeklyDarkPoolActivity">Dark Pool Activity</Label>
              </div>
            </div>
          </div>
          
          {/* Delivery Frequency */}
          <div className="mt-6">
            <h3 className="font-medium mb-2">Frequency</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="frequency-weekly"
                  name="frequency"
                  value="weekly"
                  checked={preferences.frequency === "weekly"}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                />
                <Label htmlFor="frequency-weekly">Weekly</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="frequency-biweekly"
                  name="frequency"
                  value="biweekly"
                  checked={preferences.frequency === "biweekly"}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                />
                <Label htmlFor="frequency-biweekly">Bi-weekly</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="frequency-monthly"
                  name="frequency"
                  value="monthly"
                  checked={preferences.frequency === "monthly"}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                />
                <Label htmlFor="frequency-monthly">Monthly</Label>
              </div>
            </div>
          </div>
          
          {/* Delivery Day */}
          <div className="mt-6">
            <h3 className="font-medium mb-2">Preferred Day</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="day-monday"
                  name="preferredDay"
                  value="monday"
                  checked={preferences.preferredDay === "monday"}
                  onChange={(e) => handleDayChange(e.target.value)}
                />
                <Label htmlFor="day-monday">Monday</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="day-wednesday"
                  name="preferredDay"
                  value="wednesday"
                  checked={preferences.preferredDay === "wednesday"}
                  onChange={(e) => handleDayChange(e.target.value)}
                />
                <Label htmlFor="day-wednesday">Wednesday</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="day-friday"
                  name="preferredDay"
                  value="friday"
                  checked={preferences.preferredDay === "friday"}
                  onChange={(e) => handleDayChange(e.target.value)}
                />
                <Label htmlFor="day-friday">Friday</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="day-sunday"
                  name="preferredDay"
                  value="sunday"
                  checked={preferences.preferredDay === "sunday"}
                  onChange={(e) => handleDayChange(e.target.value)}
                />
                <Label htmlFor="day-sunday">Sunday</Label>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Preferences'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 