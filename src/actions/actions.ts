"use server";
import prisma from "@/lib/db";

type Integer = number;
type Float = number;

interface NewData {
  totalPoints?: Integer;
  averageTime?: Float;
  totalGames?: Integer;
  correctGuesses?: Integer;
  gamesWon?: Integer;
}

export async function UpdateStat(id: string, newdata: NewData) {
  const updateData: NewData = {};
  if (newdata.totalPoints !== undefined) {
    updateData.totalPoints = newdata.totalPoints;
  }
  if (newdata.averageTime !== undefined) {
    updateData.averageTime = newdata.averageTime;
  }
  if (newdata.totalGames !== undefined) {
    updateData.totalGames = newdata.totalGames;
  }
  if (newdata.correctGuesses !== undefined) {
    updateData.correctGuesses = newdata.correctGuesses;
  }
  if (newdata.gamesWon !== undefined) {
    updateData.gamesWon = newdata.gamesWon;
  }
  await prisma.user.update({
    where: { id },
    data: updateData,
  });
}

export async function UpdateName(newName: string, id: string) {
  await prisma.user.update({
    where: { id },
    data: {
      userName: newName,
    },
  });
}

export async function GetUser(id: string) {
  const post = await prisma.user.findUnique({
    where: { id },
  });
  return post;
}
