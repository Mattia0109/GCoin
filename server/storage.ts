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
    // Coordinate approssimative di città con almeno 50.000 abitanti
    const cities = [
      // Italia
      { lat: 41.9028, lng: 12.4964, population: 4.3e6, name: "Roma" },
      { lat: 45.4642, lng: 9.1900, population: 1.3e6, name: "Milano" },
      { lat: 40.8518, lng: 14.2681, population: 3.1e6, name: "Napoli" },
      { lat: 45.0703, lng: 7.6869, population: 886e3, name: "Torino" },
      { lat: 44.4056, lng: 8.9463, population: 583e3, name: "Genova" },
      { lat: 43.7696, lng: 11.2558, population: 382e3, name: "Firenze" },
      { lat: 45.4371, lng: 10.9917, population: 257e3, name: "Verona" },

      // Europa
      { lat: 48.8566, lng: 2.3522, population: 2.1e6, name: "Parigi" },
      { lat: 51.5074, lng: -0.1278, population: 8.9e6, name: "Londra" },
      { lat: 52.5200, lng: 13.4050, population: 3.7e6, name: "Berlino" },
      { lat: 40.4168, lng: -3.7038, population: 3.2e6, name: "Madrid" },
      { lat: 59.9139, lng: 10.7522, population: 634e3, name: "Oslo" },
      { lat: 55.6761, lng: 12.5683, population: 602e3, name: "Copenhagen" },

      // Nord America
      { lat: 40.7128, lng: -74.0060, population: 8.4e6, name: "New York" },
      { lat: 34.0522, lng: -118.2437, population: 3.9e6, name: "Los Angeles" },
      { lat: 41.8781, lng: -87.6298, population: 2.7e6, name: "Chicago" },
      { lat: 29.7604, lng: -95.3698, population: 2.3e6, name: "Houston" },
      { lat: 43.6532, lng: -79.3832, population: 2.7e6, name: "Toronto" },

      // Asia
      { lat: 35.6762, lng: 139.6503, population: 9.3e6, name: "Tokyo" },
      { lat: 31.2304, lng: 121.4737, population: 24.9e6, name: "Shanghai" },
      { lat: 22.3193, lng: 114.1694, population: 7.4e6, name: "Hong Kong" },
      { lat: 1.3521, lng: 103.8198, population: 5.6e6, name: "Singapore" },
      { lat: 37.5665, lng: 126.9780, population: 9.7e6, name: "Seoul" },

      // Sud America
      { lat: -23.5505, lng: -46.6333, population: 12.3e6, name: "São Paulo" },
      { lat: -34.6037, lng: -58.3816, population: 3.1e6, name: "Buenos Aires" },
      { lat: -33.4489, lng: -70.6693, population: 6.7e6, name: "Santiago" },

      // Oceania
      { lat: -33.8688, lng: 151.2093, population: 5.3e6, name: "Sydney" },
      { lat: -37.8136, lng: 144.9631, population: 5.0e6, name: "Melbourne" }
    ];

    // Svuota l'array dei collectibles esistenti
    this.collectibles = [];

    // Genera collectibles basati sulla popolazione delle città
    cities.forEach(city => {
      // Calcola il numero di collectibles basato sulla popolazione
      // 1 collectible ogni 50,000 abitanti, con un minimo di 5 e un massimo di 30
      const numCollectibles = Math.min(30, Math.max(5, Math.floor(city.population / 50000)));

      for (let i = 0; i < numCollectibles; i++) {
        // Genera coordinate casuali intorno alla città (raggio di circa 5km)
        const radius = 0.05; // approssimativamente 5km
        const randomLat = city.lat + (Math.random() - 0.5) * radius;
        const randomLng = city.lng + (Math.random() - 0.5) * radius;

        // Più popolazione = più probabilità di GameCoin e più crediti
        const isGameCoin = Math.random() < (city.population / 1e7); // max 10%

        this.collectibles.push({
          type: isGameCoin ? "gamecoin" : "credit",
          // Più popolazione = più crediti (da 1 a 10 crediti basati sulla popolazione)
          amount: isGameCoin ? 1 : Math.max(1, Math.floor(Math.random() * (city.population / 1e6)) + 1),
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