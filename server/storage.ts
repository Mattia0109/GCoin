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
    // Coordinate approssimative di alcune città principali del mondo con la loro popolazione
    const majorCities = [
      { lat: 41.9028, lng: 12.4964, population: 4.3e6 }, // Roma
      { lat: 45.4642, lng: 9.1900, population: 1.3e6 },  // Milano
      { lat: 40.8518, lng: 14.2681, population: 3.1e6 }, // Napoli
      { lat: 48.8566, lng: 2.3522, population: 2.1e6 },  // Parigi
      { lat: 51.5074, lng: -0.1278, population: 8.9e6 }, // Londra
      { lat: 40.7128, lng: -74.0060, population: 8.4e6 }, // New York
      { lat: 35.6762, lng: 139.6503, population: 9.3e6 }, // Tokyo
      // Aggiungi altre città principali qui
    ];

    // Svuota l'array dei collectibles esistenti
    this.collectibles = [];

    // Genera collectibles basati sulla popolazione delle città
    majorCities.forEach(city => {
      // Calcola il numero di collectibles basato sulla popolazione
      // 1 collectible ogni 100,000 abitanti, con un minimo di 3 e un massimo di 20
      const numCollectibles = Math.min(20, Math.max(3, Math.floor(city.population / 100000)));

      for (let i = 0; i < numCollectibles; i++) {
        // Genera coordinate casuali intorno alla città (raggio di circa 5km)
        const radius = 0.05; // approssimativamente 5km
        const randomLat = city.lat + (Math.random() - 0.5) * radius;
        const randomLng = city.lng + (Math.random() - 0.5) * radius;

        // Più popolazione = più probabilità di GameCoin
        const isGameCoin = Math.random() < (city.population / 1e7); // max 10%

        this.collectibles.push({
          type: isGameCoin ? "gamecoin" : "credit",
          // Più popolazione = più crediti
          amount: isGameCoin ? 1 : Math.floor(Math.random() * (city.population / 1e6)) + 1,
          latitude: randomLat,
          longitude: randomLng,
        });
      }
    });
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