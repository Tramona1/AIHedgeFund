# Email Newsletter System

This document outlines the email newsletter system implemented in the AI Hedge Fund application.

## Overview

The email newsletter system allows users to subscribe to weekly investment insights based on their preferences. The system includes:

1. A user-friendly subscription form
2. Database storage for user preferences
3. A weekly newsletter generation service
4. A scheduler for automated delivery

## Components

### 1. User Interface

- **Newsletter Subscription Form**: Located on the main page, allows users to enter their email and select investment interests.
- **Interest Popup**: A modal component that collects detailed user preferences.
- **User Preferences Page**: Allows users to update their preferences or unsubscribe.

### 2. Database Schema

User preferences are stored in the `user_preferences` table with the following fields:

- `id`: Unique identifier
- `userId`: User ID (if registered)
- `email`: User's email address
- `tickers`: Array of stock tickers the user is interested in
- `sectors`: Array of market sectors the user is interested in
- `tradingStyle`: User's trading style (day-trading, swing-trading, long-term)
- `updateFrequency`: How often the user wants to receive updates (default: weekly)
- `createdAt`: Timestamp when the preferences were created
- `updatedAt`: Timestamp when the preferences were last updated
- `customTriggers`: Custom notification triggers

### 3. API Endpoints

- `POST /api/users/preferences`: Creates or updates user preferences
- `POST /api/notifications/send-stock-update`: Sends stock update emails to interested users
- `POST /api/notifications/send-weekly-newsletter`: Generates and sends weekly newsletters to all subscribed users

### 4. Services

- **Weekly Newsletter Service**: Generates personalized newsletters based on user preferences
- **Notifications Service**: Handles sending emails via SendGrid

### 5. Scheduler

The data pipeline scheduler includes a job to send weekly newsletters every Monday at 8 AM.

## Configuration

### Environment Variables

- `SENDGRID_API_KEY`: API key for SendGrid
- `SENDGRID_FROM_EMAIL`: Email address to send from
- `API_BASE_URL`: Base URL for the API (used by the scheduler)

## Testing

To manually test the newsletter generation:

1. Run the test script:
   ```
   cd apps/data-pipeline
   python test_newsletter.py
   ```

## Workflow

1. User subscribes via the newsletter form on the main page
2. User preferences are stored in the database
3. Every Monday at 8 AM, the scheduler triggers the newsletter generation
4. The newsletter service fetches all subscribed users
5. For each user, a personalized newsletter is generated based on their preferences
6. Emails are sent via SendGrid
7. Results are logged for monitoring

## Customization

Users can customize their newsletter content by:
- Selecting specific stocks they're interested in
- Choosing market sectors to follow
- Specifying their trading style for tailored recommendations
- Setting their preferred update frequency 