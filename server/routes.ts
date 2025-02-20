import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/collectibles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const collectibles = await storage.getCollectibles();
    res.json(collectibles);
  });

  app.post("/api/collect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { credits, gamecoins } = req.body;
    
    const user = await storage.updateUserBalance(
      req.user!.id,
      credits || 0,
      gamecoins || 0
    );
    
    res.json(user);
  });

  const httpServer = createServer(app);
  return httpServer;
}
