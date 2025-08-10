import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "./db";
import { User } from "@prisma/client";

interface ClerkUser {
  id: string;
  username?: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  return user;
}

export async function getCurrentUserFromDB() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      achievements: true,
    },
  });

  return user;
}

export async function createOrUpdateUser(clerkUser: ClerkUser): Promise<User> {
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existingUser) {
    // Update existing user
    return await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        username: clerkUser.username || existingUser.username,
        email: clerkUser.emailAddresses[0]?.emailAddress || existingUser.email,
        firstName: clerkUser.firstName || existingUser.firstName,
        lastName: clerkUser.lastName || existingUser.lastName,
        avatarUrl: clerkUser.imageUrl || existingUser.avatarUrl,
      },
    });
  } else {
    // Create new user
    return await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        username: clerkUser.username || "New User",
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
        level: 1,
        levelExperience: 0,
        totalExperience: 0,
        averageGuessTime: 0.0,
        totalGames: 0,
        correctGuesses: 0,
        gamesWon: 0,
      },
    });
  }
}

export async function addExperience(userId: string, points: number) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) return null;

  let newLevelExperience = user.levelExperience + points;
  const newTotalExperience = user.totalExperience + points;

  // Check if level up is needed (simplified for now - can be made more complex)
  let newLevel = user.level;
  if (newLevelExperience >= 100) {
    newLevel = user.level + 1;
    newLevelExperience = newLevelExperience - 100; // Reset level experience
  }

  const updatedUser = await prisma.user.update({
    where: { clerkId: userId },
    data: {
      levelExperience: newLevelExperience,
      level: newLevel,
      totalExperience: newTotalExperience,
    },
  });

  // Check for level up achievements
  if (newLevel > user.level) {
    await prisma.achievement.create({
      data: {
        userId: user.id,
        type: "level_up",
        name: `Level ${newLevel}`,
        description: `Reached level ${newLevel}!`,
        icon: "🎯",
      },
    });
  }

  return updatedUser;
}

export async function addPoints(userId: string, points: number) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) return null;

  return await prisma.user.update({
    where: { clerkId: userId },
    data: {
      totalExperience: user.totalExperience + points,
    },
  });
}
