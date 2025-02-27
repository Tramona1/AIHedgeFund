# AI Hedge Fund: How It Works

## Overview

The AI Hedge Fund platform is a sophisticated system designed to provide retail investors with institutional-grade financial intelligence. By leveraging artificial intelligence, data processing, and real-time analytics, the platform delivers actionable insights on market movements, institutional trading patterns, and economic trends.

This document serves as a comprehensive guide to the entire system, explaining both technical implementation details and high-level concepts for all stakeholders.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Web Frontend   │◄───┤   API Server    │◄───┤  Data Pipeline  │
│  (Next.js)      │    │   (Hono/Bun)    │    │   (Python)      │
│                 │    │                 │    │                 │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         │                      │                      │
         │                      ▼                      │
         │             ┌─────────────────┐             │
         └────────────►│                 │◄────────────┘
                       │    Database     │
                       │   (Supabase)    │
                       │                 │
                       └─────────────────┘
```

The AI Hedge Fund system follows a modern microservices architecture with the following components:

1. **Web Frontend**: A Next.js application providing the user interface
2. **API Server**: A Hono/Bun server handling API requests and business logic
3. **Data Pipeline**: Python scripts for data collection, processing, and analysis
4. **Database**: Supabase (PostgreSQL) for data storage and retrieval

The system uses a monorepo structure with Turborepo for efficient builds and dependency management.

## Frontend Application

The frontend is a modern web application built with Next.js and React, offering an intuitive interface for users to interact with financial data.

### Key Components

- **Dashboard**: Central hub displaying aggregated financial insights
- **Preferences**: User settings for customizing data views and alerts
- **Authentication**: Secure login and registration using Clerk
- **UI Components**: Reusable interface elements for consistent user experience

### File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── dashboard/        # Dashboard page and related components
│   │   ├── economic-reports/ # Economic reports page
│   │   ├── interviews/       # Interview transcriptions page
│   │   ├── preferences/      # User preferences settings
│   │   ├── login/ & signup/  # Authentication pages
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── layout/           # Layout components (Header, Footer)
│   │   ├── dashboard/        # Dashboard-specific components
│   ├── lib/
│   │   ├── api.ts            # API client for backend communication
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── utils.ts          # General utility functions
```

### Technology Stack

- **Next.js**: Framework for server-rendered React applications
- **React**: UI component library
- **TailwindCSS**: Utility-first CSS framework
- **Clerk**: Authentication provider
- **TypeScript**: Type-safe JavaScript

## API Server

The API server provides the backend functionality for the web application, serving data from the database and managing business logic.

### Key Modules

- **AI Triggers**: Processes financial events and generates alerts
- **Notifications**: Manages delivery of alerts to users
- **Users**: Handles user preferences and profiles
- **Updates**: Processes and delivers stock updates

### File Structure

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── ai-triggers/      # AI event processing
│   │   ├── notifications/    # Alert delivery system
│   │   ├── users/            # User management
│   │   ├── updates/          # Stock updates handling
│   ├── lib/
│   │   ├── db-utils.ts       # Database utility functions
│   ├── pkg/
│   │   ├── util/             # Utility functions
```

### Technology Stack

- **Hono**: Lightweight, fast web framework
- **Bun**: JavaScript runtime and bundler
- **Drizzle ORM**: Type-safe SQL query builder
- **Zod**: TypeScript-first schema validation

## Data Pipeline

The data pipeline consists of several Python scripts that collect, process, and analyze financial data from various sources.

### Key Components

- **Market Data Fetcher**: Collects stock market data
- **SEC Edgar Fetcher**: Retrieves SEC filings
- **Twitter Scraper**: Monitors financial discussions on Twitter
- **Dark Pool Processor**: Analyzes institutional trading
- **Option Flow Processor**: Tracks options activity
- **Economic Report Fetcher**: Collects economic reports from emails and websites
- **Interview Processor**: Transcribes and analyzes financial interviews

### File Structure

```
apps/data-pipeline/
├── market_data_fetcher.py    # Stock market data collection
├── sec_edgar_fetcher.py      # SEC filing retrieval
├── twitter_scraper.py        # Social media monitoring
├── dark_pool_processor.py    # Institutional trading analysis
├── option_flow_processor.py  # Options activity tracking
├── economic_report_fetcher.py # Economic report collection
├── interview_processor.py    # Interview transcription and analysis
├── scheduler.py              # Orchestrates all data collection jobs
├── dashboard_server.py       # Serves processed data to the frontend
```

### Technology Stack

- **Python**: Primary programming language
- **pandas**: Data manipulation and analysis
- **requests/aiohttp**: HTTP client libraries
- **BeautifulSoup**: Web scraping
- **pdfplumber**: PDF text extraction
- **AssemblyAI**: Audio transcription
- **Google Generative AI**: For summarization and analysis

## Database

The system uses Supabase (PostgreSQL) for data storage, with several tables organized by data type.

### Key Tables

- **user_preferences**: User settings and preferences
- **stock_updates**: Stock-related notifications
- **stock_events**: Raw financial events for processing
- **economic_reports**: Economic analysis reports
- **interviews**: Financial interview transcriptions

### Schema Structure

Each table has a well-defined schema with appropriate indexes for efficient querying. The database schema is managed using Drizzle ORM with migration support.

## Economic Reports System

The economic reports system automatically collects, processes, and displays economic research and analysis.

### Collection Process

1. **Email Integration**: Monitors specific email addresses for reports
2. **Attachment Processing**: Extracts text from PDF attachments
3. **Web Scraping**: Retrieves reports from financial websites
4. **Categorization**: Uses AI to categorize reports by topic

### Storage

Reports are stored in the database with metadata and in a Supabase storage bucket for file retrieval.

### Display

Users can view economic reports in a dedicated dashboard widget and a full reports page with filtering capabilities.

## Interview Processing System

The interview processing system transcribes, analyzes, and displays financial interviews from YouTube.

### Processing Flow

1. **YouTube Integration**: Retrieves video metadata and content
2. **Transcription**: Uses AssemblyAI to convert speech to text
3. **Analysis**: Summarizes key points using AI
4. **Storage**: Saves transcripts and metadata to the database

### Display

Interview transcripts and summaries are accessible via a dashboard widget and a dedicated page.

## Integration Points

The system components integrate through the following mechanisms:

1. **API Client**: Frontend communicates with API server via HTTP
2. **Database Access**: API server and Data Pipeline access the Supabase database
3. **Event Processing**: Data Pipeline processes events and updates the database
4. **Scheduler**: Orchestrates regular data collection and processing tasks

## Development Environment

### Setup Process

1. **Clone Repository**: Get the codebase
2. **Install Dependencies**: Run `pnpm install` at the root
3. **Configure Environment Variables**: Set up `.env` file based on `.env.example`
4. **Start Development Servers**: Run `pnpm dev` to start all services

### Required Tools

- Node.js 18+
- Python 3.9+
- pnpm 8+
- Supabase account
- Various API keys for external services

## Deployment

The system can be deployed using the following infrastructure:

1. **Frontend**: Vercel or any static hosting
2. **API Server**: Containerized deployment on cloud platforms
3. **Data Pipeline**: Virtual machine or dedicated cloud instance
4. **Database**: Supabase managed service

## Security

The system implements several security measures:

1. **Authentication**: Clerk for user authentication
2. **Authorization**: Role-based access control
3. **API Security**: Secure API keys and rate limiting
4. **Data Encryption**: Sensitive data encryption at rest and in transit

## Troubleshooting

### Common Issues and Solutions

#### TypeScript Import Path Issues

**Problem**: Error when importing modules without file extensions:
```
Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'
```

**Solution**: 
1. Add file extensions to import statements:
   ```typescript
   // Change this:
   import { safeEq, selectWhere } from "../../lib/db-utils";
   
   // To this:
   import { safeEq, selectWhere } from "../../lib/db-utils.js";
   ```
2. Or modify `tsconfig.json` to use a different module resolution strategy.

#### Python Missing Dependencies

**Problem**: Import errors for packages like `pdfplumber` or `assemblyai`:
```
Import "pdfplumber" could not be resolved
```

**Solution**:
1. Install the missing package:
   ```bash
   cd apps/data-pipeline
   pip install -r requirements.txt
   ```
2. If using a virtual environment, ensure it's activated before running the scripts.

#### Python Missing Import Statements

**Problem**: Undefined variable errors like:
```
"re" is not defined
```

**Solution**:
1. Add the missing import at the top of the file:
   ```python
   import re
   ```
2. Review the imports section to ensure all required modules are imported.

#### Drizzle ORM Version Conflicts

**Problem**: Type conflicts between different versions of Drizzle ORM in the monorepo.

**Solution**:
1. Use the utility functions in `apps/api/src/lib/db-utils.ts` when working with the database
2. Ensure the pnpm workspace is correctly configured with overrides:
   ```json
   "pnpm": {
     "overrides": {
       "drizzle-orm": "0.30.10"
     }
   }
   ```

#### Database Connection Issues

**Problem**: Errors connecting to Supabase or PostgreSQL database.

**Solution**:
1. Verify environment variables in `.env` file
2. Check network connectivity to the database
3. Ensure the database URL is correctly formatted
4. Validate credentials and permissions

## Conclusion

The AI Hedge Fund platform is a comprehensive financial intelligence system that combines cutting-edge technologies to deliver institutional-grade insights to retail investors. By understanding how each component works and interacts with others, developers and stakeholders can effectively maintain, extend, and utilize the platform's capabilities.

For specific questions or issues not covered in this document, please refer to the team's internal documentation or contact the development team. 