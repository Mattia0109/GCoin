import { User, InsertUser, Collectible } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(
    userId: number,
    credits: number,
    gamecoins: number
  ): Promise<User>;
  getCollectibles(): Promise<Collectible[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collectibles: Collectible[];
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.collectibles = [];
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.generateCollectibles();
  }

  private generateCollectibles() {
    // Generate some initial collectibles
    for (let i = 0; i < 50; i++) {
      this.collectibles.push({
        type: Math.random() > 0.9 ? "gamecoin" : "credit",
        amount: Math.random() > 0.9 ? 1 : Math.floor(Math.random() * 5) + 1,
        latitude: 40 + Math.random() * 10,
        longitude: -100 + Math.random() * 50,
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      credits: 0,
      gamecoins: 0,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(
    userId: number,
    credits: number,
    gamecoins: number
  ): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      credits: user.credits + credits,
      gamecoins: user.gamecoins + gamecoins,
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getCollectibles(): Promise<Collectible[]> {
    return this.collectibles;
  }
}

export const storage = new MemStorage();
