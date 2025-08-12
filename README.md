# Playtime

**Playtime** is a web-based multiplayer game where players compete asynchronously to guess song titles as quickly as possible. The game features interactive 3D visuals, a cumulative leaderboard, and the ability to create and share custom playlists. It integrates with the SoundCloud API to fetch and play songs.

---

# Features

## Core Features

1. **Guess the Song**: Players listen to short audio clips and guess the song title. They are awarded more points for guessing faster and the first person to guess correctly wins the points.
2. **Leaderboard**: Tracks player performance, including total points, average time, and games won.
3. **Playlists**: Players have a large selection of songs and playlists created by admin.
4. **Interactive 3D Visuals**: Powered by Three.js, the game includes dynamic 3D elements like animated titles and music notes.
5. **Game Modes**: Players can select genres, artists, or playlists to customize their game experience.
6. **Statistics**: Players can view past game statistics and achievements.

## Additional Features

- **Dynamic Difficulty**: Adjust game difficulty and round settings.
- **Social Sharing**: Invite friends to play via shareable links.
- **Responsive Design**: Optimized for desktop and mobile devices.

---

# Tech Stack

## **Frontend**

- **Framework**: React.js with TypeScript
- **Styling**: TailwindCSS
- **3D Visuals**: Three.js with React Three Fiber and Drei
- **UI Components**: Radix UI, Phosphor Icons

## **Backend**

- **Framework**: Node.js with Next.js
- **Authentication**: JSON Web Tokens (JWT)
- **API Integration**: SoundCloud API
- **Data Validation**: Zod
- **ORM**: Prisma

## **Database**

- **Database**: PostgreSQL
- **Schema Management**: Prisma ORM

---

# Project Structure

## Directory Layout

```
playtime/
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

# Development

## Getting Started

The below guide is if you want to set up the website locally. Otherwise, go to [https://playtime.sophli.in/](https://playtime.sophli.in/).

### Install pnpm package manager

`pnpm` is a package manager built on top of `npm` and is much faster than `npm`, being highly disk efficient and solving inherent issues in `npm`.

Install `pnpm` if you don't already have it:

```
npm install -g pnpm
```

**Optional: set up a shorter alias like pn instead**

For POSIX systems, add the following to your .bashrc, .zshrc, or config.fish:

`alias pn=pnpm`

For Powershell (Windows), go to a Powershell window with admin rights and run:

`notepad $profile.AllUsersAllHosts`

In the profile.ps1 file that opens, put:

`set-alias -name pn -value pnpm`

Now whenever you have to run a `pnpm` cmd, you can type in `pn` (or whatever alias you created) instead.

### Configure Clerk

Sign in or create an account on Clerk.

Create an application.

Create a webhook to allow for user creation:

1. Endpoint URL: <YOUR_DEVELOPMENT_DOMAIN>/api/webhooks/clerk

- In local development, `YOUR_DEVELOPMENT_DOMAIN` cannot be an `http` URL like `http://localhost:3000`. You will need to configure an `ngrok` server.

2. Subscribe to events:

- user.created
- user.updated
- email.created

Keep this tab open since you will need to add the necessary environment variables to `.env` later.

### Install

Clone the repository and go into the directory:

```
git clone https://github.com/careerday23/prototype.git

cd prototype
```

Install packages:

```
pnpm i
```

Create `.env` file and configure variables:

```
# Database
DATABASE_URL=<...>
DIRECT_URL=<...>

# Song API
SOUNDCLOUD_CLIENT_ID=<...>
SOUNDCLOUD_CLIENT_SECRET=<...>
SPOTIFY_CLIENT_ID=<...>
SPOTIFY_CLIENT_SECRET=<...>

# Pusher
PUSHER_APP_ID=<...>
NEXT_PUBLIC_PUSHER_APP_KEY=<...>
PUSHER_APP_SECRET=<...>
NEXT_PUBLIC_PUSHER_CLUSTER=<...>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<...>
CLERK_SECRET_KEY=<...>
CLERK_WEBHOOK_SECRET=<...>
```

Run the development server:

```
pnpm dev
```

## Package Scripts

**Database Management**

- **`prisma`**: Pulls the database schema and generates the Prisma client.

**Development**

- **`dev`**: Starts the Next.js development server.
- **`lint`**: Runs ESLint to check for code quality issues.
- **`format`**: Formats the codebase using Prettier.

# License

This project is licensed under the MIT License.
