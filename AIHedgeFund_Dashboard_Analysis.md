# AI Hedge Fund Dashboard: Functionality and Data Flow Analysis

## Overview
The AI Hedge Fund dashboard provides a comprehensive platform for tracking financial market data and making informed investment decisions. The dashboard integrates real-time market data with user preferences to deliver a personalized experience focused on the user's watchlist of tickers.

## Core Components & Functionality

### Dashboard Homepage (`apps/web/src/app/dashboard/page.tsx`)
- **Current Watchlist Display**: Shows current ticker prices, changes, and volumes
- **Data Refresh Mechanism**: Periodic refreshing of market data
- **User Preferences Integration**: Syncs with both local storage and backend API
- **Ticker Management**:
  - `addTicker()`: Adds new tickers to watchlist, updates both local storage and API
  - `removeTicker()`: Removes tickers from watchlist, updates both local storage and API
  - `refreshTickerData()`: Fetches fresh data for all tickers in the watchlist

### Market Intelligence Section (`MarketIntelligenceSection.tsx`)
The dashboard features a comprehensive market intelligence section with tabbed content including:
- **Hedge Fund Activity**: Notable buys/sells by major hedge funds
- **Insider Trading**: Executive and insider transactions
- **Options Flow**: Options activity indicating potential market movements
- **Technical Signals**: Technical analysis alerts for watchlist tickers

### Content-Specific Components
Each content type has a dedicated component handling specific data fetching and display:
- `HedgeFundContent.tsx`: Fetches and displays hedge fund activities from the API
- `InsiderTradingContent.tsx`: Fetches and displays insider trading data from the API
- `OptionsFlowContent.tsx`: Fetches and displays options flow data from the API
- `TechnicalContent.tsx`: Fetches and displays technical signals from the API
- `AlertsContent.tsx`: Manages and displays custom user alerts

### Settings & Preferences (`apps/web/src/app/dashboard/settings/page.tsx`)
The settings page allows users to:
- View and manage their watchlist tickers
- Configure email notification preferences (daily digest, weekly reports, etc.)
- Toggle specific alerts (price alerts, insider trading alerts, hedge fund activity)
- Save preferences to both local storage and the backend API

### Additional Dashboard Sections
- **Economic Reports** (`EconomicReports.tsx`): Displays recent economic reports fetched from the API
- **Interviews** (`Interviews.tsx`): Shows recent expert interviews with financial insights

## Data Flow Architecture

### Client-Side Data Management

#### Local Storage
- **Key**: `'user_tickers'`
- **Storage Format**: JSON object containing ticker symbols and related data
- **Usage**: Provides immediate access to watchlist data between sessions
- **Sync Process**: Synchronized with API data when changes occur or on page load

#### State Management
- **User State**: Managed via React `useState` hooks storing ticker data and preferences
- **Loading States**: Used to indicate data fetching in progress
- **Error States**: Track and display API errors with appropriate retry mechanisms

### API Layer

#### Market Data API (`api.ts`)
- **`getStockData(symbol)`**: Fetches data for individual ticker
- **`getBatchStockData(symbols)`**: Retrieves data for multiple tickers simultaneously
- **Source**: Supabase database with real-time financial data

#### User Preferences API (`api.ts`)
- **`get(userId)`**: Retrieves user preferences including watchlist, sectors, and notification settings
- **`update(preferences)`**: Updates user preferences including watchlist and notification settings
- **Storage**: Supabase database

#### Stock Updates API
- **`getAll()`**: Retrieves all stock updates for market intelligence sections
- **Filtering**: Each content component filters by relevant event types (insider trading, hedge fund activity, etc.)
- **Sorting**: Updates are sorted by timestamp, newest first

#### Economic Reports & Interviews APIs
- **`economicReportsAPI.getRecent(limit)`**: Fetches recent economic reports
- **`interviewsAPI.getRecent(limit)`**: Fetches recent expert interviews

### Database Architecture

#### Tables
- **`stock_updates`**: Stores market events like hedge fund activities, insider trading, options flow
- **`user_preferences`**: Stores user watchlists and notification settings
- **`economic_reports`**: Stores economic data and announcements
- **`interviews`**: Stores expert interviews and related metadata

## Notifications System

### Email Notifications
Managed through user preferences with toggles for:
- Daily market digests
- Weekly performance reports
- Price movement alerts
- Insider trading alerts
- Hedge fund activity alerts

### In-App Notifications
- Toasts for immediate feedback when adding/removing tickers
- Error alerts for API failures or other issues

## AI Integration

### AI Chat Functionality
- Integrated directly in the dashboard for context-aware assistance
- Access to user's watchlist and preferences for personalized recommendations
- Capability to answer market-related questions

## Performance Considerations

### Data Loading Optimization
- Batch requests for multiple tickers rather than individual calls
- Loading states with skeleton screens for better user experience
- Error handling with retry mechanisms

### Real-Time Updates
- Periodic refresh of market data (configurable frequency)
- Immediate updates when user actions occur (add/remove tickers)

## Issues and Considerations

### Data Consistency
- Synchronization between local storage and API data
- Handling offline scenarios and data staleness

### User Experience
- Progressive loading of components
- Clear feedback for user actions
- Handling API failures gracefully

## Future Enhancements

### Real-Time Data
- WebSocket integration for true real-time market data updates
- Push notifications for critical alerts

### AI Capabilities
- Enhanced AI analysis of market trends specific to user's watchlist
- Predictive analytics for potential market movements

### User Preferences
- More granular control over alert thresholds
- Custom dashboard layouts and widgets

---

This document provides a comprehensive overview of the AI Hedge Fund dashboard's functionality and data flow. It serves as a reference for understanding the system architecture and identifying areas for future enhancement. 