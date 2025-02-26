"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { userPreferencesAPI, UserPreferences } from "@/lib/api";
import { useUser } from "@clerk/nextjs";

export default function Preferences() {
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    tickers: [],
    sectors: [],
    tradingStyle: "Growth",
    updateFrequency: "daily",
    customTriggers: {}
  });
  
  const [newTicker, setNewTicker] = useState("");
  const [newSector, setNewSector] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { isLoaded, user } = useUser();

  // Load user preferences on component mount
  useEffect(() => {
    async function loadUserPreferences() {
      if (!isLoaded || !user) return;
      
      try {
        setIsLoading(true);
        const response = await userPreferencesAPI.get(user.id);
        if (response.userPreferences) {
          setPreferences(response.userPreferences);
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
        // If there's an error, we'll just use the default preferences
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      loadUserPreferences();
    }
  }, [isLoaded, user]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !user) return;
    
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Prepare data for API
      const preferencesData = {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        tickers: preferences.tickers || [],
        sectors: preferences.sectors || [],
        tradingStyle: preferences.tradingStyle || "Growth",
        updateFrequency: preferences.updateFrequency || "daily",
        customTriggers: preferences.customTriggers || {}
      };
      
      // Call API to update preferences
      await userPreferencesAPI.update(preferencesData);
      
      setSaveStatus({
        type: "success",
        message: "Your preferences have been saved successfully."
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveStatus({
        type: "error",
        message: "Failed to save preferences. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding a new ticker
  const handleAddTicker = () => {
    if (newTicker && !preferences.tickers?.includes(newTicker)) {
      setPreferences({
        ...preferences,
        tickers: [...(preferences.tickers || []), newTicker]
      });
      setNewTicker("");
    }
  };

  // Handle removing a ticker
  const handleRemoveTicker = (ticker: string) => {
    setPreferences({
      ...preferences,
      tickers: preferences.tickers?.filter(t => t !== ticker) || []
    });
  };

  // Handle adding a new sector
  const handleAddSector = () => {
    if (newSector && !preferences.sectors?.includes(newSector)) {
      setPreferences({
        ...preferences,
        sectors: [...(preferences.sectors || []), newSector]
      });
      setNewSector("");
    }
  };

  // Handle removing a sector
  const handleRemoveSector = (sector: string) => {
    setPreferences({
      ...preferences,
      sectors: preferences.sectors?.filter(s => s !== sector) || []
    });
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">User Preferences</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={user?.emailAddresses[0]?.emailAddress || ""}
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">Email address cannot be changed here.</p>
          </div>
          
          {/* Trading Style */}
          <div className="mb-6">
            <label htmlFor="tradingStyle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trading Style
            </label>
            <select
              id="tradingStyle"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={preferences.tradingStyle}
              onChange={(e) => setPreferences({ ...preferences, tradingStyle: e.target.value })}
            >
              <option value="Growth">Growth</option>
              <option value="Value">Value</option>
              <option value="Momentum">Momentum</option>
              <option value="Dividend">Dividend</option>
              <option value="Day Trading">Day Trading</option>
            </select>
          </div>
          
          {/* Update Frequency */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Update Frequency
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="updateFrequency"
                  value="realtime"
                  checked={preferences.updateFrequency === "realtime"}
                  onChange={() => setPreferences({ ...preferences, updateFrequency: "realtime" })}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2">Real-time</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="updateFrequency"
                  value="daily"
                  checked={preferences.updateFrequency === "daily"}
                  onChange={() => setPreferences({ ...preferences, updateFrequency: "daily" })}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2">Daily Digest</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="updateFrequency"
                  value="weekly"
                  checked={preferences.updateFrequency === "weekly"}
                  onChange={() => setPreferences({ ...preferences, updateFrequency: "weekly" })}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2">Weekly Summary</span>
              </label>
            </div>
          </div>
          
          {/* Watchlist */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Watchlist Tickers
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {preferences.tickers && preferences.tickers.map((ticker) => (
                <div key={ticker} className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {ticker}
                  <button
                    type="button"
                    onClick={() => handleRemoveTicker(ticker)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add ticker (e.g., GOOG)"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              />
              <Button type="button" onClick={handleAddTicker}>
                Add
              </Button>
            </div>
          </div>
          
          {/* Sectors */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sectors of Interest
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {preferences.sectors && preferences.sectors.map((sector) => (
                <div key={sector} className="inline-flex items-center bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  {sector}
                  <button
                    type="button"
                    onClick={() => handleRemoveSector(sector)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add sector (e.g., Energy)"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
              />
              <Button type="button" onClick={handleAddSector}>
                Add
              </Button>
            </div>
          </div>
          
          {/* Form status */}
          {saveStatus && (
            <div className={`mb-4 p-3 rounded ${saveStatus.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {saveStatus.message}
            </div>
          )}
          
          {/* Submit button */}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </form>
      </div>
    </div>
  );
} 