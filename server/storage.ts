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
      { lat: 45.4064, lng: 11.8768, population: 211e3, name: "Padova" },
      { lat: 44.4949, lng: 11.3426, population: 388e3, name: "Bologna" },
      { lat: 45.6495, lng: 13.7768, population: 204e3, name: "Trieste" },
      { lat: 43.3179, lng: 13.7357, population: 171e3, name: "Ancona" },
      { lat: 41.4622, lng: 12.6916, population: 121e3, name: "Latina" },
      { lat: 45.5415, lng: 10.2118, population: 196e3, name: "Brescia" },
      { lat: 44.8015, lng: 10.3279, population: 194e3, name: "Parma" },

      // Europa
      { lat: 48.8566, lng: 2.3522, population: 2.1e6, name: "Parigi" },
      { lat: 51.5074, lng: -0.1278, population: 8.9e6, name: "Londra" },
      { lat: 52.5200, lng: 13.4050, population: 3.7e6, name: "Berlino" },
      { lat: 40.4168, lng: -3.7038, population: 3.2e6, name: "Madrid" },
      { lat: 59.9139, lng: 10.7522, population: 634e3, name: "Oslo" },
      { lat: 55.6761, lng: 12.5683, population: 602e3, name: "Copenhagen" },
      { lat: 48.2082, lng: 16.3738, population: 1.9e6, name: "Vienna" },
      { lat: 50.0755, lng: 14.4378, population: 1.3e6, name: "Praga" },
      { lat: 52.2297, lng: 21.0122, population: 1.7e6, name: "Varsavia" },
      { lat: 47.4979, lng: 19.0402, population: 1.7e6, name: "Budapest" },
      { lat: 38.7223, lng: -9.1393, population: 505e3, name: "Lisbona" },
      { lat: 41.3851, lng: 2.1734, population: 1.6e6, name: "Barcellona" },
      { lat: 45.7640, lng: 4.8357, population: 513e3, name: "Lione" },
      { lat: 50.8503, lng: 4.3517, population: 174e3, name: "Bruxelles" },

      // Nord America
      { lat: 40.7128, lng: -74.0060, population: 8.4e6, name: "New York" },
      { lat: 34.0522, lng: -118.2437, population: 3.9e6, name: "Los Angeles" },
      { lat: 41.8781, lng: -87.6298, population: 2.7e6, name: "Chicago" },
      { lat: 29.7604, lng: -95.3698, population: 2.3e6, name: "Houston" },
      { lat: 43.6532, lng: -79.3832, population: 2.7e6, name: "Toronto" },
      { lat: 33.7490, lng: -84.3880, population: 498e3, name: "Atlanta" },
      { lat: 42.3601, lng: -71.0589, population: 675e3, name: "Boston" },
      { lat: 39.9526, lng: -75.1652, population: 1.5e6, name: "Philadelphia" },
      { lat: 49.2827, lng: -123.1207, population: 631e3, name: "Vancouver" },
      { lat: 45.5017, lng: -73.5673, population: 1.7e6, name: "Montreal" },
      { lat: 25.7617, lng: -80.1918, population: 454e3, name: "Miami" },
      { lat: 32.7157, lng: -117.1611, population: 1.4e6, name: "San Diego" },

      // Asia
      { lat: 35.6762, lng: 139.6503, population: 9.3e6, name: "Tokyo" },
      { lat: 31.2304, lng: 121.4737, population: 24.9e6, name: "Shanghai" },
      { lat: 22.3193, lng: 114.1694, population: 7.4e6, name: "Hong Kong" },
      { lat: 1.3521, lng: 103.8198, population: 5.6e6, name: "Singapore" },
      { lat: 37.5665, lng: 126.9780, population: 9.7e6, name: "Seoul" },
      { lat: 39.9042, lng: 116.4074, population: 20.9e6, name: "Pechino" },
      { lat: 13.7563, lng: 100.5018, population: 8.3e6, name: "Bangkok" },
      { lat: 19.0760, lng: 72.8777, population: 12.5e6, name: "Mumbai" },
      { lat: 28.6139, lng: 77.2090, population: 16.8e6, name: "Delhi" },
      { lat: 14.5995, lng: 120.9842, population: 1.8e6, name: "Manila" },
      { lat: 3.1390, lng: 101.6869, population: 1.8e6, name: "Kuala Lumpur" },
      { lat: 31.5497, lng: 74.3436, population: 11.1e6, name: "Lahore" },

      // Sud America
      { lat: -23.5505, lng: -46.6333, population: 12.3e6, name: "São Paulo" },
      { lat: -34.6037, lng: -58.3816, population: 3.1e6, name: "Buenos Aires" },
      { lat: -33.4489, lng: -70.6693, population: 6.7e6, name: "Santiago" },
      { lat: -12.0464, lng: -77.0428, population: 10.7e6, name: "Lima" },
      { lat: -22.9068, lng: -43.1729, population: 6.7e6, name: "Rio de Janeiro" },
      { lat: -0.1807, lng: -78.4678, population: 2.7e6, name: "Quito" },
      { lat: 4.7110, lng: -74.0721, population: 7.4e6, name: "Bogotá" },
      { lat: 10.4806, lng: -66.9036, population: 2.9e6, name: "Caracas" },

      // Oceania
      { lat: -33.8688, lng: 151.2093, population: 5.3e6, name: "Sydney" },
      { lat: -37.8136, lng: 144.9631, population: 5.0e6, name: "Melbourne" },
      { lat: -27.4698, lng: 153.0251, population: 2.4e6, name: "Brisbane" },
      { lat: -31.9505, lng: 115.8605, population: 2.1e6, name: "Perth" },
      { lat: -36.8485, lng: 174.7633, population: 1.6e6, name: "Auckland" },
      { lat: -41.2866, lng: 174.7756, population: 212e3, name: "Wellington" },

      // Africa
      { lat: 30.0444, lng: 31.2357, population: 20.9e6, name: "Cairo" },
      { lat: 6.5244, lng: 3.3792, population: 14.8e6, name: "Lagos" },
      { lat: -26.2041, lng: 28.0473, population: 5.8e6, name: "Johannesburg" },
      { lat: -33.9249, lng: 18.4241, population: 4.6e6, name: "Cape Town" },
      { lat: 33.5731, lng: -7.5898, population: 3.4e6, name: "Casablanca" },
      { lat: 36.8065, lng: 10.1815, population: 2.3e6, name: "Tunis" },
      { lat: -1.2921, lng: 36.8219, population: 4.4e6, name: "Nairobi" },
      { lat: 9.0320, lng: 38.7483, population: 3.4e6, name: "Addis Ababa" }
    ];

    // Svuota l'array dei collectibles esistenti
    this.collectibles = [];

    // Genera collectibles basati sulla popolazione delle città
    cities.forEach(city => {
      // Calcola il numero di collectibles basato sulla popolazione
      // 1 collectible ogni 50,000 abitanti, con un minimo di 5 e un massimo di 30
      const numCollectibles = Math.min(30, Math.max(5, Math.floor(city.population / 50000)));

      for (let i = 0; i < numCollectibles; i++) {
        // Genera coordinate casuali in un'area più ampia intorno alla città (raggio di circa 10km)
        const radius = 0.1; // approssimativamente 10km
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