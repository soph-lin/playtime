# Name That Tune Documentation

## Overview

**Name That Tune** is a web-based multiplayer game where players compete asynchronously to guess song titles as quickly as possible. The game features interactive 3D visuals, a cumulative leaderboard, and the ability to create and share custom playlists. It integrates with the SoundCloud API to fetch and play songs.

---

## Features

### Core Features
1. **Guess the Song**: Players listen to short audio clips and guess the song title. They are awarded more points for guessing faster and the first person to guess correctly wins the points.
2. **Leaderboard**: Tracks player performance, including total points, average time, and games won.
3. **Playlists**: Players have a large selection of songs and playlists created by admin.
4. **Interactive 3D Visuals**: Powered by Three.js, the game includes dynamic 3D elements like animated titles and music notes.
5. **Game Modes**: Players can select genres, artists, or playlists to customize their game experience.
6. **Statistics**: Players can view past game statistics and achievements.

### Additional Features
- **Dynamic Difficulty**: Adjust game difficulty and round settings.
- **Social Sharing**: Invite friends to play via shareable links.
- **Responsive Design**: Optimized for desktop and mobile devices.

---

## Tech Stack

### **Frontend**
- **Framework**: React.js with TypeScript
- **Styling**: TailwindCSS
- **3D Visuals**: Three.js with React Three Fiber and Drei
- **UI Components**: Radix UI, Phosphor Icons

### **Backend**
- **Framework**: Node.js with Next.js
- **Authentication**: JSON Web Tokens (JWT)
- **API Integration**: SoundCloud API
- **Data Validation**: Zod
- **ORM**: Prisma

### **Database**
- **Database**: PostgreSQL
- **Schema Management**: Prisma ORM

---

## Project Structure

### Directory Layout

```
cs222/ 
├── prisma/ # Prisma schema and seed files 
├── public/ # Static assets 
├── src/ 
│ ├── app/ # Next.js app directory 
│ │ ├── api/ # API routes 
│ │ ├── components/ # React components 
│ │ ├── lib/ # Utility libraries and helpers 
│ │ ├── scripts/ # Scripts for database and track management 
│ │ ├── types/ # TypeScript type definitions 
│ │ ├── globals.css # Global CSS styles 
│ │ ├── layout.tsx # Root layout 
│ │ └── page.tsx # Main page 
├── .github/ # GitHub workflows and templates 
├── .gitignore # Git ignore rules 
├── package.json # Project dependencies and scripts 
├── tsconfig.json # TypeScript configuration 
└── README.md # Project documentation
```

---

## Key Components

### **Frontend Components**
1. **3D Visuals**
   - `CanvasWrapper`: Sets up the Three.js canvas.
   - `TitleScene`: Combines 3D elements like the title, music notes, and record.
   - `MusicNotes`: Animated floating music notes.
   - `Record`: Rotating record with grooves and a label.

2. **UI Components**
   - `Button`: Customizable button component.
   - `Dropdown`: Searchable dropdown for selecting songs.
   - `Input`: Styled input field.
   - `Popover`: Popover component for additional UI interactions.

3. **Game Components**
   - `SongCard`: Displays the song player and handles playback controls.
   - `DevPage`: Development page for testing the game logic.

### **Backend API**
1. **SoundCloud API Integration**
   - `/api/soundcloud/search`: Fetches tracks from SoundCloud based on a query.
   - `/api/soundcloud`: Handles track search and retrieval.

2. **Playlists API**
   - `/api/playlists`: CRUD operations for playlists.
   - `/api/playlists/[playlistId]`: Manage tracks within a specific playlist.

3. **Database Management**
   - Prisma ORM is used to manage the PostgreSQL database schema and queries.

---

## Database Schema

### **User**
Tracks player statistics and playlists.
```prisma
model User {
  id             String     @id @default(uuid())
  userName       String     @default("New User")
  totalPoints    Int        @default(0)
  averageTime    Float      @default(0.0)
  totalGames     Int        @default(0)
  correctGuesses Int        @default(0)
  gamesWon       Int        @default(0)
  playlists      Playlist[]
}
```

### **Playlist**
Stores playlists created by users.

```prisma
model Playlist {
  id         String   @id @default(uuid())
  name       String
  user_id    String
  created_at DateTime @default(now())
  updated_at DateTime @default(now())
  user       User     @relation(fields: [user_id], references: [id])
  songs      PlaylistSong[] @relation("PlaylistToSongs")
}
```

### **Song**
Represents individual songs.

```prisma
model Song {
  id            String   @id
  spotify_id    String   @unique
  soundcloud_id String?  @unique
  title         String
  artist        String
  album         String?
  cover_url     String?
  permalink_url String?
  duration      Int?
  status        String   @default("pending")
  added_by      String?
  created_at    DateTime @default(now())
  updatedAt     DateTime
  playlists     PlaylistSong[] @relation("SongToPlaylists")
}
```

## Scripts

### **Database Management**
- **`prisma`**: Pulls the database schema and generates the Prisma client.
- **`build-db`**: Populates the database with tracks from SoundCloud.

### **Development**
- **`dev`**: Starts the Next.js development server.
- **`lint`**: Runs ESLint to check for code quality issues.
- **`format`**: Formats the codebase using Prettier.

---

## Environment Variables

### **Required Variables**
- **`SOUNDCLOUD_CLIENT_ID`**: SoundCloud API client ID.
- **`SOUNDCLOUD_CLIENT_SECRET`**: SoundCloud API client secret.
- **`DATABASE_URL`**: PostgreSQL database connection string.

### **Optional Variables**
- **`DIRECT_URL`**: Direct database connection URL for Prisma.

---

## Deployment

### **Local Development**
1. Clone the repository:
```bash
   git clone <repository-url>
   cd cs222
   ```


2. Set up environment variables in .env.local.
```bash
  .env.local
```

3. Start the development server:
```bash
  npm run dev
```

### **Production**
1. Build the project:
```bash
  npm run build
```

2. Start the production server:
```bash
  npm run start
```
## Testing

### **Linting**
Run ESLint to check for code quality issues:
```bash
npm run lint
```

### **Formatting**
Check code formatting with Prettier:
```bash
npm run format:check
```

## Unit Tests

Add unit tests using Jest and React Testing Library to ensure the functionality and reliability of the application.

---

## Contribution Guidelines

1. Fork the repository and create a new branch for your feature or bug fix.
2. Follow the existing code style and naming conventions.
3. Write tests for new features or changes.
4. Submit a pull request with a detailed description of your changes.

---

## Known Issues

- **Rate Limiting**: The SoundCloud API may enforce rate limits during heavy usage.
- **3D Performance**: Older devices may experience lag with Three.js visuals.

---

## Future Enhancements

1. **Multiplayer Mode**: Real-time gameplay with friends.
2. **Spotify Integration**: Support for Spotify tracks.
3. **Achievements**: Add badges and rewards for milestones.
4. **Advanced Analytics**: Provide detailed player statistics.
5. **User Authentication**: Provide several options for account management. 

---

## Potential Competition

1. **SongQuiz.io**: Awards points to all players that guess correctly, plays full snippet every round.
2. **Songlio**: Each round, one player picks a song for the others to guess.
3. **Heardle**: Singleplayer only, one second played at first with seconds added if player needs.

---

## Authors

**Team 41**  
- Kaavya Mahajan (kaavyam2): UI, External APIs
- Zia Lu (zixuan43): Web Server, Database
- Sophie Lin (sophiel4): UI, External APIs
- Sriram Koritala (sriramk3): Web Server, Database

---

## License

This project is licensed under the MIT License. 
