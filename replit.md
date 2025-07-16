# Party Cards Game - replit.md

## Overview

Party Cards is a real-time multiplayer party game where players in the same room match action cards and perform physical activities together. The application features a modern web stack with React frontend, Express backend, and in-memory storage. Players get identical randomized decks of 25 cards, yell out their current card to find matches, perform actions together, and compete to finish their deck first.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack monorepo architecture with clear separation between client and server components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Storage**: Connect-pg-simple for PostgreSQL session storage
- **Real-time**: HTTP polling (refetchInterval) for live updates

### Database Architecture
- **Primary Database**: PostgreSQL via Neon Database
- **Schema Management**: Drizzle migrations in `/migrations` directory
- **Fallback Storage**: In-memory storage implementation for development

## Key Components

### Game Logic
- **Room Management**: Create rooms with unique 6-character codes, join existing rooms
- **Player Management**: Host and guest player roles with real-time player lists
- **Game States**: Waiting → Countdown → Playing → Finished state flow
- **Card System**: 25 predefined card types with swipe left/right mechanics

### Database Schema
- **Rooms Table**: Stores room codes, host information, and game status
- **Players Table**: Player names, socket IDs, card decks, and progress tracking
- **Game State Table**: Countdown timers, game flow control, and winner tracking

### API Endpoints
- `POST /api/rooms` - Create new game room
- `POST /api/rooms/:code/join` - Join existing room
- `POST /api/rooms/:code/start` - Start game (host only)
- `POST /api/rooms/:code/action` - Handle player actions (swipe left/right)
- `GET /api/rooms/:code` - Get room state and player list

### Frontend Pages
- **Home**: Landing page with create/join options
- **Create Room**: Host creates room and becomes first player
- **Join Room**: Players enter room code and name
- **Waiting Room**: Pre-game lobby with player list and start button
- **Countdown**: 3-second countdown before game starts
- **Game**: Main gameplay with card swiping interface
- **Win**: Game completion screen with results

## Data Flow

### Room Creation Flow
1. Host enters name and creates room
2. System generates unique 6-character room code
3. Host becomes first player and room enters "waiting" state
4. Room data stored in database with initial game state

### Player Join Flow
1. Player enters room code and name
2. System validates room exists and is joinable
3. Player added to room's player list
4. Real-time polling updates all players' views

### Game Start Flow
1. Host initiates game start
2. Room status changes to "countdown" 
3. All players redirected to countdown page
4. After 3 seconds, status changes to "playing"
5. Players redirected to game interface

### Gameplay Flow
1. Each player receives shuffled deck of 25 cards
2. Players swipe left (don't like) or right (like) on current card
3. Progress tracked by cards completed count
4. First player to complete all cards wins
5. Game status changes to "finished" and players see results

## External Dependencies

### UI and Styling
- **Radix UI**: Comprehensive primitive components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library built on Radix UI
- **class-variance-authority**: Component variant management
- **Lucide React**: Icon library

### Data Management
- **TanStack Query**: Server state management with caching and real-time updates
- **Drizzle ORM**: Type-safe database queries and migrations
- **Drizzle Zod**: Schema validation integration
- **Zod**: Runtime type validation

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **connect-pg-simple**: PostgreSQL session store for Express

## Deployment Strategy

### Development Environment
- Vite dev server serves frontend with HMR
- Express server handles API routes and serves static files in production
- Database migrations managed via `drizzle-kit push`
- Environment variables for database connection

### Production Build
1. Frontend built to `/dist/public` directory
2. Backend bundled with ESBuild to `/dist/index.js`
3. Static assets served by Express in production
4. Database schema pushed via Drizzle migrations

### GitHub Pages Deployment
- **Static Version**: Uses localStorage for single-device multiplayer
- **Automated Deployment**: GitHub Actions workflow deploys on push to main
- **Build Output**: `dist/public/` directory contains all static assets
- **Base Path**: Configured for `/SocialCardClash/` repository path
- **Features**: Works offline, mobile PWA support, dark theme with WCAG compliance

### Architecture Decisions

**Polling vs WebSockets**: Chose HTTP polling over WebSockets for simplicity and reliability. The 1-second polling interval provides sufficient real-time feel for the game mechanics while being easier to implement and debug.

**In-Memory Fallback**: Implemented memory storage as fallback to ensure development works without database setup. Production uses PostgreSQL for persistence and scalability.

**Monorepo Structure**: Single repository with shared schema types between client and server reduces duplication and ensures type safety across the full stack.

**Component Library Choice**: Selected shadcn/ui over custom components for rapid development while maintaining design system consistency and accessibility standards.

**Database ORM**: Chose Drizzle over Prisma for better TypeScript integration and more control over query generation without runtime overhead.