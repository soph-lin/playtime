import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient(); // creates a single global instance of prisma
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
