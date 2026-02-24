import type { IStorage } from "./storage.types";

const hasDatabase = Boolean(process.env.DATABASE_URL);

async function createStorage(): Promise<IStorage> {
  if (hasDatabase) {
    const { DatabaseStorage } = await import("./storage.database");
    return new DatabaseStorage();
  }

  const { MemoryStorage } = await import("./storage.memory");
  return new MemoryStorage();
}

export const storage: IStorage = await createStorage();
export const storageBackend = hasDatabase ? "database" : "memory";

export type { IStorage } from "./storage.types";
