# Playtime

[**Playtime**](https://playtime.sophli.in) is a story-driven multiplayer game with lively characters and fun mechanics. The overall vibe is inspired by Nintendo and party games like Gartic Phone.

## Game Engine

The game uses a custom engine for gameplay and dialogue, with a node-based dialogue editor to easily write storylines instead of creating icky JSON or YAML files or worse yet, scripting to port someone else's dialogue engine implementation to the game??

## Music

The game streams songs using a hybrid Spotify and SoundCloud architecture, where Spotify provides the song titles and albums (ground truth) while SoundCloud provides the audio. Currently, only the admin can upload songs and playlists to the library, but I want to later implement an upload feature where users can upload their playlists.

---

# Tech Stack

## **Frontend**

- **Framework**: Next.js 15 with React 19 and TypeScript
- **Styling**: TailwindCSS v4 with PostCSS
- **3D Visuals**: Three.js with React Three Fiber and Drei
- **UI Components**: Radix UI, Material-UI (MUI), Phosphor Icons
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Phosphor Icons
- **Build Tools**: Turbopack

## **Backend**

- **Framework**: Next.js 15 with Node.js
- **Authentication**: Clerk, Auth0, NextAuth.js
- **API Integration**: SoundCloud API, Spotify API
- **Data Validation**: Zod
- **Webhooks**: Pusher, Svix
- **API Routes**: Next.js API Routes

## **Database**

- **Database**: PostgreSQL
- **Schema Management**: Prisma 6 ORM
- **Migrations**: Prisma Migrations
- **Type Safety**: Prisma Client with TypeScript

## **Development Tools**

- **Package Manager**: pnpm
- **Linting**: ESLint 9 with Next.js and Prettier rules
- **Code Formatting**: Prettier with Prisma plugin
- **Type Checking**: TypeScript 5.9
- **Build Optimization**: Turbopack
- **Hot Reloading**: Next.js Fast Refresh

---

# Development

## Getting Started

If you want to play the game without hassle, go to [https://playtime.sophli.in/](https://playtime.sophli.in/). But if you want to set it up locally, boy you're in for a treat. Here's how.

Note that the dialogue and music is stored in Supabase, and no I'm not giving it to you. So this is less like how to run the game locally, but how you can create something similar with a nice existing framework.

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

### Service Configuration

Wow I had a blast doing this, and I'm sure you will too!! Don't worry though, you will only need to do it once.

I'm genuinely not sure why I wrote this part I feel like you're smart enough to figure it out, but I guess this is helpful for me because I keep forgetting how to do some configuration.

#### Supabase

Sign in or create an account on [Supabase](https://supabase.com/).

Create a new project.

Click on Connect (the button up top with a plug icon).

Go to the ORMs tab.

Keep this tab open since you will need to add `DATABASE_URL` and `DIRECT_URL` to `.env` later.

#### SoundCloud

Sign in or create an account on [SoundCloud](https://soundcloud.com/). If it's your first time using SoundCloud, use it for a few weeks. Otherwise, you'll get this message when you request an API key (or at least this is what happened to me):

> Due to a high number of spammers, trying to get access to and abusing our APIs, we decided to no longer grant API access to very new or inactive accounts. You can do the following to mitigate this:
> If this is only a new account for developing, you can send us a link to a different, more active account that you own - we need both the account URL (soundcloud.com/accountname) and the associated email address. It should include actions like comments, playlists, followed artists or uploaded tracks.
> If you just started on SoundCloud, go ahead for a while - like some tracks, create a playlist, comment on a track or even upload your own first track. After that, please reach back out to us, so we can see that your account is used with genuine intention.

Fortunately, I was able to get an API key by talking a little more to the support staff, but it's probably better if you use SoundCloud for a bit.

Request an API key. As of 2025, you will have to do this through the chatbot (had to go on a wild goose chase through the platform to figure this out) at [https://help.soundcloud.com/hc/en-us/requests/new](https://help.soundcloud.com/hc/en-us/requests/new).

Provide the following:

- Website of your app
- Redirect URI
- How you will use the API

Once they approve your request, go to [https://soundcloud.com/you/apps](https://soundcloud.com/you/apps).

Keep this tab open since you will need to add `SOUNDCLOUD_CLIENT_ID` and `SOUNDCLOUD_CLIENT_SECRET` to `.env` later.

#### Spotify

Create an account on [Spotify](https://open.spotify.com/) if you don't already have one.

Sign in to [https://developer.spotify.com/](https://developer.spotify.com/) using your Spotify account.

Create a new app.

Add Redirect URIs, assuming you are developing locally on port 3000:

- http://localhost:3000
- http://localhost:3000/admin

Keep this tab open since you will need to add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to `.env` later.

#### Pusher

Sign in or create an account on [Pusher](https://pusher.com).

Go to [Channels](https://dashboard.pusher.com/channels).

Create a new app.

Go to App Keys to find your tokens.

Keep this tab open since you will need to add `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_APP_KEY`, `PUSHER_APP_SECRET`, and `NEXT_PUBLIC_PUSHER_CLUSTER` to `.env` later.

#### Clerk

Sign in or create an account on [Clerk](https://clerk.com).

Create a new application.

Create a webhook to allow for user creation:

1. Endpoint URL: <YOUR_DEVELOPMENT_DOMAIN>/api/webhooks/clerk

- In local development, `YOUR_DEVELOPMENT_DOMAIN` cannot be an `http` URL like `http://localhost:3000`. You will need to configure an `ngrok` server. When the server terminates, you have to update the URL again on Clerk.

2. Subscribe to events:

- user.created
- user.updated
- email.created

Keep this tab open since you will need to add `CLERK_WEBHOOK_SECRET` to `.env` later.

### Install

Clone the repository and go into the directory:

```
git clone https://github.com/soph-lin/playtime.git

cd playtime
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

**Development**

- **`dev`**: Starts the Next.js development server with Turbopack.
- **`build`**: Builds the Next.js application for production.
- **`start`**: Starts the production Next.js server.
- **`lint`**: Runs ESLint to check for code quality issues.
- **`check`**: Runs both linting and TypeScript type checking.
- **`format`**: Formats the codebase using Prettier.
- **`format:check`**: Checks if the codebase is properly formatted.

**Database Management**

- **`prisma`**: Generates the Prisma client and pushes database schema changes.

**Utilities**

- **`update-playlist-urls`**: Updates playlist URLs using the custom script.

# License

This project is licensed under the MIT License.
