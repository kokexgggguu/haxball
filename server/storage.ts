import { 
  type User, 
  type InsertUser,
  type Player,
  type InsertPlayer,
  type Game,
  type InsertGame,
  type ChatMessage,
  type InsertChatMessage,
  type Command,
  type InsertCommand,
  type RoomStats,
  type InsertRoomStats,
  type DiscordActivity,
  type InsertDiscordActivity,
  type RoomSettings,
  type InsertRoomSettings
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Player operations
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerByName(name: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  getActivePlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  
  // Game operations
  getGame(id: string): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  getGamesByDate(date: Date): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Chat operations
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Command operations
  getCommands(limit?: number): Promise<Command[]>;
  getCommandsByDate(date: Date): Promise<Command[]>;
  createCommand(command: InsertCommand): Promise<Command>;
  
  // Room stats operations
  getRoomStats(): Promise<RoomStats | undefined>;
  updateRoomStats(stats: Partial<RoomStats>): Promise<RoomStats>;
  
  // Discord activity operations
  getDiscordActivity(limit?: number): Promise<DiscordActivity[]>;
  createDiscordActivity(activity: InsertDiscordActivity): Promise<DiscordActivity>;
  
  // Room settings operations
  getRoomSettings(): Promise<RoomSettings>;
  updateRoomSettings(settings: Partial<RoomSettings>): Promise<RoomSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private players: Map<string, Player>;
  private games: Map<string, Game>;
  private chatMessages: ChatMessage[];
  private commands: Command[];
  private roomStats: RoomStats;
  private discordActivity: DiscordActivity[];
  private roomSettings: RoomSettings;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.games = new Map();
    this.chatMessages = [];
    this.commands = [];
    this.discordActivity = [];
    
    // Initialize default room stats
    this.roomStats = {
      id: randomUUID(),
      currentPlayers: 0,
      totalPlayersToday: 0,
      commandsUsedToday: 0,
      discordMessagesToday: 0,
      gamesToday: 0,
      lastUpdated: new Date(),
    };
    
    // Initialize default room settings
    this.roomSettings = {
      id: randomUUID(),
      adminPassword: "1234",
      discordReminderInterval: 180,
      maxPlayers: 16,
      roomName: "Haxball Room",
      isPublic: true,
      lastPasswordChange: new Date(),
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Player operations
  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerByName(name: string): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(player => player.name === name);
  }

  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getActivePlayers(): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => !player.leftAt);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = {
      ...insertPlayer,
      id,
      joinedAt: new Date(),
      leftAt: null,
      totalGoals: 0,
      totalAssists: 0,
      gamesPlayed: 0,
      wins: 0,
      mvpCount: 0,
      isAdmin: false,
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  // Game operations
  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGamesByDate(date: Date): Promise<Game[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.games.values()).filter(game => 
      game.startedAt && game.startedAt >= startOfDay && game.startedAt <= endOfDay
    );
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const game: Game = {
      ...insertGame,
      id,
      startedAt: new Date(),
      endedAt: null,
      redScore: 0,
      blueScore: 0,
      winnerTeam: null,
      mvpPlayerId: null,
      duration: null,
    };
    this.games.set(id, game);
    return game;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  // Chat operations
  async getChatMessages(limit: number = 100): Promise<ChatMessage[]> {
    return this.chatMessages.slice(-limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      isCommand: insertMessage.isCommand ?? false,
      isSystemMessage: insertMessage.isSystemMessage ?? false,
    };
    this.chatMessages.push(message);
    
    // Keep only last 1000 messages
    if (this.chatMessages.length > 1000) {
      this.chatMessages = this.chatMessages.slice(-1000);
    }
    
    return message;
  }

  // Command operations
  async getCommands(limit: number = 100): Promise<Command[]> {
    return this.commands.slice(-limit);
  }

  async getCommandsByDate(date: Date): Promise<Command[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.commands.filter(command => 
      command.timestamp && command.timestamp >= startOfDay && command.timestamp <= endOfDay
    );
  }

  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const id = randomUUID();
    const command: Command = {
      ...insertCommand,
      id,
      timestamp: new Date(),
      success: insertCommand.success ?? true,
      parameters: insertCommand.parameters ?? null,
    };
    this.commands.push(command);
    
    // Keep only last 1000 commands
    if (this.commands.length > 1000) {
      this.commands = this.commands.slice(-1000);
    }
    
    return command;
  }

  // Room stats operations
  async getRoomStats(): Promise<RoomStats | undefined> {
    return this.roomStats;
  }

  async updateRoomStats(updates: Partial<RoomStats>): Promise<RoomStats> {
    this.roomStats = { ...this.roomStats, ...updates, lastUpdated: new Date() };
    return this.roomStats;
  }

  // Discord activity operations
  async getDiscordActivity(limit: number = 100): Promise<DiscordActivity[]> {
    return this.discordActivity.slice(-limit);
  }

  async createDiscordActivity(insertActivity: InsertDiscordActivity): Promise<DiscordActivity> {
    const id = randomUUID();
    const activity: DiscordActivity = {
      ...insertActivity,
      id,
      timestamp: new Date(),
      success: insertActivity.success ?? true,
    };
    this.discordActivity.push(activity);
    
    // Keep only last 500 activities
    if (this.discordActivity.length > 500) {
      this.discordActivity = this.discordActivity.slice(-500);
    }
    
    return activity;
  }

  // Room settings operations
  async getRoomSettings(): Promise<RoomSettings> {
    return this.roomSettings;
  }

  async updateRoomSettings(updates: Partial<RoomSettings>): Promise<RoomSettings> {
    this.roomSettings = { ...this.roomSettings, ...updates };
    if (updates.adminPassword) {
      this.roomSettings.lastPasswordChange = new Date();
    }
    return this.roomSettings;
  }
}

export const storage = new MemStorage();
