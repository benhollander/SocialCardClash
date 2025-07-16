# Party Cards Game 🎉

A mobile-optimized web game where players in the same room match action cards and perform physical activities together.

## 🎮 How to Play

1. **Create or Join a Room**: One player creates a room and shares the 6-character code
2. **Get Your Deck**: Everyone receives identical randomized decks of 25 action cards
3. **Find Matches**: Yell out your current card to find someone with the same card
4. **Perform Actions**: Do the action together (high-five, dab, swap places, etc.)
5. **Race to Finish**: First player to complete all cards wins!

## 🎯 Card Types

- **High-Five**: Give each other a high-five
- **Dab Me**: Do the dab dance move together
- **Swap Places**: Switch physical positions
- **Kick It**: Do a fun kick move
- **Awkward Turtle**: Make the awkward turtle gesture

## 🚀 Deployment Options

### GitHub Pages (Static Version)
Perfect for local multiplayer on a single device:

1. **Automatic Deployment**: Push to main branch and GitHub Actions will deploy automatically
2. **Manual Deployment**: Copy `dist/public/` contents to `docs/` folder after building
3. **Features**: Works offline, localStorage-based game state, mobile-optimized

### Full-Stack Deployment
For true multiplayer across devices, deploy to:

- **Vercel**: Excellent for React + serverless functions
- **Railway**: Great for full Node.js applications  
- **Render**: Modern Heroku alternative
- **Heroku**: Traditional platform-as-a-service

## 🛠 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Features

- **Dark Theme**: WCAG-compliant contrast for accessibility
- **Mobile-First**: Optimized for smartphones and tablets
- **Real-Time Updates**: Live player lists and game state
- **Progressive Web App**: Can be installed on mobile devices
- **Offline Support**: Works without internet connection

## 📱 Mobile Installation

1. Open the game in your mobile browser
2. Tap the "Add to Home Screen" option
3. Launch from your home screen like a native app

## 🏗 Technical Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Vite
- **Deployment**: GitHub Actions + GitHub Pages

## 🎪 Perfect For

- **House Parties**: Get everyone moving and laughing
- **Team Building**: Office parties and corporate events
- **Game Nights**: Add physical activity to your gaming
- **Ice Breakers**: Help new groups get comfortable
- **Family Gatherings**: Fun for all ages

Have fun playing Party Cards! 🎊