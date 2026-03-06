# Delve & Dash

A modern dungeon crawler inspired by [Bob Whitley's web recreation](https://dndlabyrinth.com/), rebuilt with React, TypeScript, and modern web technologies.

![Game Status](https://img.shields.io/badge/status-v2.2_released-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-web-lightgrey)

## 🙏 Inspiration & Credits

This project was inspired by **[Bob Whitley's web-based recreation](https://dndlabyrinth.com/)** ([GitHub](https://github.com/bobwhitley/dndlabyrinth)) of a classic dungeon crawler game. Bob's faithful recreation introduced me to this classic game and served as the foundation for this modern interpretation.

## 🎮 Features

### Gameplay
- ✅ **Single-player, local 2-player, and VS CPU modes** - Play solo or with a friend
- ✅ **Procedural maze generation** - Unique labyrinth every game
- ✅ **Two difficulty levels** - Level 1 (open passages) and Level 2 (locking doors)
- ✅ **Strategic Waystone placement** - Choose your secret safe room
- ✅ **Dragon AI** - Intelligent enemy that wakes, hunts, and patrols
- ✅ **Treasure hunt** - Find the dragon's treasure and return it to your Waystone
- ✅ **Warrior battles** - Fight for treasure possession in two-player mode
- ✅ **Lives system** - 3 lives per warrior with strategic respawn
- ✅ **Move-based turns** - Tactical gameplay with limited moves per turn
- ✅ **Leaderboards** - Top 100 Leaderboards to flex your skills
- ✅ **Daily Challenge** - Same seeded maze for everyone each day with randomized settings
- ✅ **Replay System** - Watch replays of completed games with transport controls

### Level 2 Advanced Features
- 🚪 **Locking door system** - Doors randomly start locked (35%) or unlocked (65%)
- 🔐 **Unlock attempts** - 50/50 chance to unlock when encountering locked doors
- 🔒 **Auto-locking** - Unlocked doors lock behind you after passage
- 👁️ **Visual distinction** - Solid bars for locked, split bars for unlocked

### Solo Mode Enhancements
- ✨ **Treasure hint system** - Sparkles mark the general treasure area
- 👁️ **Dragon visibility** - See dragon when within 5 tiles (after waking)
- 🎯 **Free exploration** - No move limits until dragon wakes

### Visual & Audio
- 🎨 **Classic dungeon aesthetic** with modern polish
- 🎆 **Visual effects** - Treasure flash, death fade, victory fireworks, battle shake
- 🔊 **13 sound effects** - Complete audio experience with interactive preview
- 📱 **Responsive design** - Perfect on desktop, tablet, and mobile
- 🎭 **Smooth animations** - Fluid transitions powered by Framer Motion

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript 5 + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Audio**: Howler.js
- **State Management**: Zustand
- **Build Tool**: Vite

## 📁 Project Structure

```
dnd-labyrinth-v2/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components (Board, Chamber, Menu, Sidebars)
│   │   ├── game/          # Game logic (GameEngine, MazeGenerator)
│   │   ├── services/      # AudioService for sound management
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript type definitions
│   └── public/
│       └── audio/         # Game sound effects (13 MP3 files)
├── shared/                # Shared types between client/server
├── server/                # Backend (future Phase 3)
├── CHANGELOG.md           # Complete version history
├── LICENSE                # MIT License with attribution
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

**You need to install Node.js first:**
- Download Node.js 18+ from https://nodejs.org
- Verify installation: `node --version` (should show v18 or higher)
- npm comes with Node.js automatically
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GRRRillaNinja/modern-dnd-labyrinth.git
   cd modern-dnd-labyrinth
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies (React, Vite, etc.)
   cd client
   npm install
   ```

3. **Start the development server:**
   ```bash
   # (You should already be in the client folder from step 2)
   npm run dev
   ```

4. **Open your browser:**
   - Visit `http://localhost:3000`
   - The game should load automatically!

**Note:** The game works fully without any additional setup. Leaderboards require a Supabase database - see **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** if you want to enable them (optional).

### Building for Production

```bash
cd client
npm run build
```

The production build will be in `client/dist/`

## 🎮 How to Play

1. **Choose Your Quest**
   - Select Solo Quest (1 player) or Two Warriors (2 players)
   - Choose Level 1 (open passages) or Level 2 (locking doors)

2. **Pick Your Waystone**
   - Click a chamber to set your secret safe room
   - This is where you must return the treasure to win!

3. **Navigate the Labyrinth**
   - Click adjacent chambers to move your warrior
   - Discover walls by attempting to move through them
   - Watch your move count (shown in sidebar when dragon is awake)

4. **Find the Dragon's Treasure**
   - 🐉 Dragon wakes when you get within 3 tiles
   - ✨ Sparkles mark the treasure area (solo mode only)
   - 🏆 Pick up the treasure to win

5. **Return to Your Waystone**
   - Carry the treasure back to your starting Waystone
   - You're safe from the dragon on your own Waystone tile
   - Victory! 🎉

### Level 2 Tips
- 🚪 Some doors start locked, others unlocked
- 🔐 Try locked doors - you have a 50% chance to unlock them
- 🔒 Unlocked doors will lock behind you after you pass
- 🎯 Plan your route carefully!

## ⚙️ Customization

Edit `shared/types/index.ts` to adjust game settings:

```typescript
export const DEFAULT_SETTINGS: GameSettings = {
  maxLives: 3,                    // Lives per warrior
  baseMoves: 2,                   // Base moves per turn
  movesPerLife: 2,                // Additional moves per life
  movesWithTreasure: 4,           // Moves when carrying treasure
  treasureRoomDistance: 3,        // Min distance for treasure spawn
  dragonWakeDistance: 3,          // Distance dragon wakes at
  dragonVisibilityDistance: 5,    // Distance dragon visible (solo mode)
  doorClosedProb: 0.35,           // 35% chance door starts locked
};
```

## 📖 Documentation

- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history and features
- **[LICENSE](LICENSE)** - MIT License with proper attribution
- **In-Game Help** - Toggle help sidebar for tips and legend

## 🎯 Roadmap

### ✅ Version 1.0
- Complete single-player and two-player gameplay
- Two difficulty levels with locking doors
- Full audio and visual effects
- Responsive design

### ✅ Version 2.0
- VS CPU mode with AI opponent
- Variable dungeon sizes (8x8 to 20x20)
- Leaderboards via Supabase

### ✅ Version 2.1
- Replay system with transport controls
- Post-game overlay with replay/score options

### ✅ Version 2.2 (Current)
- Daily Challenge with seeded dungeon generation
- Randomized daily settings (mode, difficulty, size)
- Dedicated daily leaderboard
- Fixed walls discovered percentage tracking

### 🔮 Future Versions

**Phase 3: Online Multiplayer**
- WebSocket real-time gameplay
- Room creation system
- Chat functionality

**Phase 4: New Game Modes**
- Role reversal mode (play as the dragon)
- Co-op mode
- Survival mode
- Custom maze designer

## 🐛 Troubleshooting

**Audio not playing?**
```bash
# From project root
npm run setup
```

**Build errors?**
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
cd client
rm -rf node_modules package-lock.json
npm install
```

**Type errors?**
- Ensure TypeScript 5.0+
- Run `npm install` in both root and client directories

**Port 3000 in use?**
- Edit `client/vite.config.ts` to change port

## 📜 Credits

### Technologies
- Built with ❤️ using React, TypeScript, Tailwind CSS, Framer Motion, and Howler.js
- This is an **independent project**, not affiliated with or endorsed by Bob Whitley

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

This project is inspired by Bob Whitley's classic dungeon crawler recreation.

## 🤝 Contributing

This is a personal tribute project, but suggestions and feedback are welcome!

- Report bugs by opening an issue
- Suggest features or improvements
- Share your experience playing the game

## 🎉 Acknowledgments

Thank you to:
- **Bob Whitley** for creating the web recreation that introduced me to this game and inspired this project
- The open-source community for the amazing tools and libraries
- Everyone who has played and enjoyed this tribute

---

**Ready to brave the labyrinth?** 🐉⚔️💎

```bash
cd client
npm run dev
```

Visit `http://localhost:3000` and begin your adventure!
