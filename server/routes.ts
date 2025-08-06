import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import HaxballService from "./services/haxball";
import DiscordService from "./services/discord";
import WebSocketService from "./services/websocket";

let haxballService: HaxballService;
let discordService: DiscordService;
let websocketService: WebSocketService;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize services
  websocketService = WebSocketService.getInstance();
  websocketService.initialize(httpServer);
  
  discordService = DiscordService.getInstance();
  haxballService = new HaxballService();
  
  // Room stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const roomStats = await storage.getRoomStats();
      res.json(roomStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Chat messages endpoint
  app.get("/api/chat", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getChatMessages(limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Send chat message endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      await haxballService.sendChatMessage(message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Execute command endpoint
  app.post("/api/command", async (req, res) => {
    try {
      const { command } = req.body;
      if (!command) {
        return res.status(400).json({ message: "Command is required" });
      }

      await haxballService.executeCommand(command);
      res.json({ success: true });
    } catch (error) {
      console.error("Error executing command:", error);
      res.status(500).json({ message: "Failed to execute command" });
    }
  });

  // Players endpoint
  app.get("/api/players", async (req, res) => {
    try {
      const active = req.query.active === 'true';
      const players = active ? await storage.getActivePlayers() : await storage.getAllPlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  // Games endpoint
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Commands history endpoint
  app.get("/api/commands", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const commands = await storage.getCommands(limit);
      res.json(commands);
    } catch (error) {
      console.error("Error fetching commands:", error);
      res.status(500).json({ message: "Failed to fetch commands" });
    }
  });

  // Discord activity endpoint
  app.get("/api/discord/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activity = await storage.getDiscordActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching Discord activity:", error);
      res.status(500).json({ message: "Failed to fetch Discord activity" });
    }
  });

  // Discord status endpoint
  app.get("/api/discord/status", async (req, res) => {
    try {
      const status = discordService.getConnectionStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching Discord status:", error);
      res.status(500).json({ message: "Failed to fetch Discord status" });
    }
  });

  // Send Discord test message endpoint
  app.post("/api/discord/test", async (req, res) => {
    try {
      const success = await discordService.sendTestMessage();
      res.json({ success });
    } catch (error) {
      console.error("Error sending Discord test message:", error);
      res.status(500).json({ message: "Failed to send test message" });
    }
  });

  // Room settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getRoomSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateRoomSettings(updates);
      
      // If admin password was updated, notify Haxball service
      if (updates.adminPassword) {
        await haxballService.updateAdminPassword(updates.adminPassword);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Room status endpoint
  app.get("/api/room/status", async (req, res) => {
    try {
      const status = haxballService.getRoomStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching room status:", error);
      res.status(500).json({ message: "Failed to fetch room status" });
    }
  });

  // Dashboard data endpoint (combined data for dashboard)
  app.get("/api/dashboard", async (req, res) => {
    try {
      const [
        roomStats,
        chatMessages,
        recentActivity,
        activePlayers,
        roomSettings,
        discordStatus
      ] = await Promise.all([
        storage.getRoomStats(),
        storage.getChatMessages(50),
        storage.getDiscordActivity(10),
        storage.getActivePlayers(),
        storage.getRoomSettings(),
        discordService.getConnectionStatus()
      ]);

      res.json({
        roomStats,
        chatMessages,
        recentActivity,
        activePlayers,
        roomSettings,
        discordStatus,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Quick actions endpoints
  app.post("/api/actions/clear-bans", async (req, res) => {
    try {
      await haxballService.executeCommand("!clearbans");
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing bans:", error);
      res.status(500).json({ message: "Failed to clear bans" });
    }
  });

  app.post("/api/actions/reset-game", async (req, res) => {
    try {
      await haxballService.executeCommand("!rr");
      res.json({ success: true });
    } catch (error) {
      console.error("Error resetting game:", error);
      res.status(500).json({ message: "Failed to reset game" });
    }
  });

  app.post("/api/actions/start-game", async (req, res) => {
    try {
      await haxballService.executeCommand("!start");
      res.json({ success: true });
    } catch (error) {
      console.error("Error starting game:", error);
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  app.post("/api/actions/pause-game", async (req, res) => {
    try {
      await haxballService.executeCommand("!pause");
      res.json({ success: true });
    } catch (error) {
      console.error("Error pausing game:", error);
      res.status(500).json({ message: "Failed to pause game" });
    }
  });

  return httpServer;
}
