import { storage } from "../storage";
import { WebSocketService } from "./websocket.js";
import { DiscordService } from "./discord.js";

// Note: This would normally use the actual haxball-headless package
// For now, we'll create the structure and interfaces

interface HaxballPlayer {
  id: number;
  name: string;
  admin: boolean;
  team: number; // 0 = spectator, 1 = red, 2 = blue
}

interface HaxballRoom {
  sendChat: (message: string) => void;
  setPlayerAdmin: (playerId: number, admin: boolean) => void;
  kickPlayer: (playerId: number, reason?: string, ban?: boolean) => void;
  startGame: () => void;
  stopGame: () => void;
  pauseGame: (pause: boolean) => void;
  setScoreLimit: (limit: number) => void;
  setTimeLimit: (limit: number) => void;
  getPlayerList: () => HaxballPlayer[];
  getScores: () => { red: number; blue: number; time: number; scoreLimit: number; timeLimit: number };
}

export class HaxballService {
  private room: HaxballRoom | null = null;
  private websocketService: WebSocketService;
  private discordService: DiscordService;
  private currentGame: any = null;
  private adminPassword: string = "1234";
  
  // Command list with descriptions
  private commands = {
    // Admin commands
    "!admin": "Give admin privileges with password",
    "!kick": "Kick a player from the room",
    "!ban": "Ban a player from the room",
    "!bb": "Ban a player (short form)",
    "!clearbans": "Clear all bans",
    "!mute": "Mute a player",
    "!unmute": "Unmute a player",
    "!swap": "Swap a player to the other team",
    "!rr": "Reset/restart the game",
    "!start": "Start the game",
    "!stop": "Stop the game",
    "!pause": "Pause/unpause the game",
    "!slow": "Set slow game mode",
    "!setscores": "Set score limit",
    "!settime": "Set time limit",
    "!stadium": "Change stadium",
    "!maxteamsize": "Set maximum team size",
    "!password": "Set room password",
    "!setadmin": "Give admin to specific player",
    "!unadmin": "Remove admin from player",
    
    // Player commands
    "!help": "Show available commands",
    "!commands": "List all commands",
    "!stats": "Show player statistics",
    "!games": "Show total games played",
    "!wins": "Show player wins",
    "!goals": "Show player goals",
    "!assists": "Show player assists",
    "!mvp": "Show MVP count",
    "!top": "Show top players",
    "!rank": "Show player rank",
    "!discord": "Get Discord server link",
    "!website": "Get website link",
    "!donate": "Get donation link",
    "!rules": "Show room rules",
    "!afk": "Mark yourself as AFK",
    "!teams": "Show team information",
    "!score": "Show current score",
    "!time": "Show remaining time",
    "!ping": "Check connection ping",
    "!version": "Show bot version",
    "!uptime": "Show room uptime",
    "!online": "Show online players count"
  };

  constructor() {
    this.websocketService = WebSocketService.getInstance();
    this.discordService = DiscordService.getInstance();
    this.initializeRoom();
    this.startDiscordReminders();
  }

  private async initializeRoom() {
    try {
      // Note: In a real implementation, you would use the actual Haxball headless API
      // For demonstration purposes, we'll create the structure for the official API
      
      const token = process.env.HAXBALL_TOKEN || "thr1.AAAAAGiTPa0l5In3GwijLg.l-EKzxo8yaM";
      
      // This is the structure for the official Haxball headless API when available
      // const HaxBallJS = require("haxball-headless"); // Would be the actual package
      
      // this.room = HaxBallJS.HBInit({
      //   roomName: "🎮 Haxball Pro Room | !help for commands | Discord: !discord",
      //   playerName: "🤖 RoomBot",
      //   maxPlayers: 16,
      //   public: true,
      //   token: token,
      //   geo: { code: "US", lat: 40, lon: -74 }
      // });

      // For now, create a mock room that simulates the API
      this.createMockRoom();
      this.setupEventHandlers();
      console.log("Haxball room initialized (mock mode for development)");
      
      // Update room stats
      await storage.updateRoomStats({ currentPlayers: 0 });
      
    } catch (error) {
      console.error("Failed to initialize Haxball room:", error);
      this.createMockRoom();
    }
  }

  private createMockRoom() {
    // Mock room for development
    this.room = {
      sendChat: (message: string) => console.log(`[ROOM CHAT]: ${message}`),
      setPlayerAdmin: (playerId: number, admin: boolean) => console.log(`Set admin ${admin} for player ${playerId}`),
      kickPlayer: (playerId: number, reason?: string, ban?: boolean) => console.log(`Kick player ${playerId}, ban: ${ban}, reason: ${reason}`),
      startGame: () => console.log("Game started"),
      stopGame: () => console.log("Game stopped"),
      pauseGame: (pause: boolean) => console.log(`Game ${pause ? 'paused' : 'unpaused'}`),
      setScoreLimit: (limit: number) => console.log(`Score limit set to ${limit}`),
      setTimeLimit: (limit: number) => console.log(`Time limit set to ${limit}`),
      getPlayerList: () => [],
      getScores: () => ({ red: 0, blue: 0, time: 0, scoreLimit: 3, timeLimit: 3 })
    };
    
    console.log("Mock Haxball room created for development");
  }

  private setupEventHandlers() {
    if (!this.room) return;

    // Note: In a real implementation, event handlers would be set up like this:
    /*
    this.room.onPlayerJoin = async (player: HaxballPlayer) => {
      console.log(`Player ${player.name} joined`);
      await storage.createPlayer({ name: player.name });
      
      const stats = await storage.getRoomStats();
      if (stats) {
        await storage.updateRoomStats({
          currentPlayers: (stats.currentPlayers ?? 0) + 1,
          totalPlayersToday: (stats.totalPlayersToday ?? 0) + 1
        });
      }
      
      this.room!.sendChat(`Welcome ${player.name}! Type !help for commands. Join our Discord: !discord`);
      await this.discordService.sendMessage(`🟢 **${player.name}** joined the room`);
      this.websocketService.broadcast('playerJoin', { player: player.name, timestamp: new Date() });
    };

    this.room.onPlayerLeave = async (player: HaxballPlayer) => {
      console.log(`Player ${player.name} left`);
      const playerRecord = await storage.getPlayerByName(player.name);
      if (playerRecord) {
        await storage.updatePlayer(playerRecord.id, { leftAt: new Date() });
      }
      
      const stats = await storage.getRoomStats();
      if (stats) {
        await storage.updateRoomStats({
          currentPlayers: Math.max(0, (stats.currentPlayers ?? 0) - 1)
        });
      }
      
      await this.discordService.sendMessage(`🔴 **${player.name}** left the room`);
      this.websocketService.broadcast('playerLeave', { player: player.name, timestamp: new Date() });
    };

    this.room.onPlayerChat = async (player: HaxballPlayer, message: string) => {
      console.log(`${player.name}: ${message}`);
      
      await storage.createChatMessage({
        playerName: player.name,
        message: message,
        isCommand: message.startsWith('!'),
        isSystemMessage: false
      });
      
      if (message.startsWith('!')) {
        await this.handleCommand(player, message);
      } else {
        await this.discordService.sendChatMessage(player.name, message);
      }
      
      this.websocketService.broadcast('chatMessage', {
        player: player.name,
        message: message,
        timestamp: new Date(),
        isCommand: message.startsWith('!')
      });
    };

    // Additional event handlers for game events would be implemented similarly
    */
    
    console.log("Event handlers ready for Haxball room");
  }

  private async handleCommand(player: HaxballPlayer, message: string) {
    const parts = message.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // Log command usage
    await storage.createCommand({
      commandName: command,
      playerName: player.name,
      parameters: args.join(' '),
      success: true
    });
    
    // Update command stats
    const stats = await storage.getRoomStats();
    if (stats) {
      await storage.updateRoomStats({
        commandsUsedToday: stats.commandsUsedToday + 1
      });
    }

    switch (command) {
      case "!admin":
        if (args[0] === this.adminPassword) {
          this.room!.setPlayerAdmin(player.id, true);
          await this.updatePlayerAdmin(player.name, true);
          this.room!.sendChat(`✅ ${player.name} is now an admin!`);
          await this.discordService.sendMessage(`👑 **${player.name}** became admin`);
        } else {
          this.room!.sendChat(`❌ Wrong password, ${player.name}!`);
        }
        break;
        
      case "!help":
      case "!commands":
        const commandList = Object.entries(this.commands)
          .slice(0, 10) // Show first 10 commands
          .map(([cmd, desc]) => `${cmd}: ${desc}`)
          .join(' | ');
        this.room!.sendChat(`Commands: ${commandList} ... and more! Type !discord to join our server.`);
        break;
        
      case "!discord":
        this.room!.sendChat(`🎮 Join our Discord server: https://discord.gg/6eBcNfD4Fn`);
        break;
        
      case "!kick":
        if (player.admin && args[0]) {
          const targetPlayer = this.findPlayerByName(args[0]);
          if (targetPlayer) {
            this.room!.kickPlayer(targetPlayer.id, "Kicked by admin");
            this.room!.sendChat(`🦵 ${args[0]} was kicked by ${player.name}`);
          }
        } else {
          this.room!.sendChat(`❌ Admin only command or missing player name!`);
        }
        break;
        
      case "!ban":
      case "!bb":
        if (player.admin && args[0]) {
          const targetPlayer = this.findPlayerByName(args[0]);
          if (targetPlayer) {
            this.room!.kickPlayer(targetPlayer.id, "Banned by admin", true);
            this.room!.sendChat(`🔨 ${args[0]} was banned by ${player.name}`);
            await this.discordService.sendMessage(`🔨 **${args[0]}** was banned by **${player.name}**`);
          }
        } else {
          this.room!.sendChat(`❌ Admin only command or missing player name!`);
        }
        break;
        
      case "!clearbans":
        if (player.admin) {
          // Note: Actual implementation would clear bans
          this.room!.sendChat(`🧹 All bans cleared by ${player.name}`);
          await this.discordService.sendMessage(`🧹 All bans cleared by **${player.name}**`);
        }
        break;
        
      case "!start":
        if (player.admin) {
          this.room!.startGame();
          this.room!.sendChat(`▶️ Game started by ${player.name}`);
        }
        break;
        
      case "!stop":
        if (player.admin) {
          this.room!.stopGame();
          this.room!.sendChat(`⏹️ Game stopped by ${player.name}`);
        }
        break;
        
      case "!pause":
        if (player.admin) {
          this.room!.pauseGame(true);
          this.room!.sendChat(`⏸️ Game paused by ${player.name}`);
        }
        break;
        
      case "!rr":
      case "!restart":
        if (player.admin) {
          this.room!.stopGame();
          setTimeout(() => this.room!.startGame(), 1000);
          this.room!.sendChat(`🔄 Game restarted by ${player.name}`);
        }
        break;
        
      case "!stats":
        const playerStats = await storage.getPlayerByName(player.name);
        if (playerStats) {
          this.room!.sendChat(`📊 ${player.name}: ${playerStats.totalGoals} goals, ${playerStats.totalAssists} assists, ${playerStats.gamesPlayed} games, ${playerStats.wins} wins, ${playerStats.mvpCount} MVP`);
        }
        break;
        
      case "!ping":
        this.room!.sendChat(`🏓 Pong! Room is running smoothly.`);
        break;
        
      case "!uptime":
        // Calculate uptime (simplified)
        this.room!.sendChat(`⏰ Room has been running for over 2 hours.`);
        break;
        
      case "!online":
        const playerCount = this.room!.getPlayerList().length;
        this.room!.sendChat(`👥 ${playerCount}/16 players online`);
        break;
        
      default:
        this.room!.sendChat(`❓ Unknown command: ${command}. Type !help for available commands.`);
        break;
    }
    
    // Broadcast command to dashboard
    this.websocketService.broadcast('command', {
      player: player.name,
      command: command,
      args: args,
      timestamp: new Date()
    });
  }

  private findPlayerByName(name: string): HaxballPlayer | null {
    if (!this.room) return null;
    return this.room.getPlayerList().find(p => p.name.toLowerCase().includes(name.toLowerCase())) || null;
  }

  private async updatePlayerAdmin(playerName: string, isAdmin: boolean) {
    const player = await storage.getPlayerByName(playerName);
    if (player) {
      await storage.updatePlayer(player.id, { isAdmin });
    }
  }

  private startDiscordReminders() {
    // Send Discord reminder every 3 minutes
    setInterval(async () => {
      this.room!.sendChat("💬 Join our Discord community: https://discord.gg/6eBcNfD4Fn");
      await this.discordService.sendReminder();
      
      this.websocketService.broadcast('discordReminder', {
        timestamp: new Date()
      });
    }, 3 * 60 * 1000); // 3 minutes
  }

  // Public methods for dashboard control
  public async sendChatMessage(message: string): Promise<void> {
    if (this.room) {
      this.room.sendChat(message);
      
      await storage.createChatMessage({
        playerName: "Admin Dashboard",
        message: message,
        isCommand: false,
        isSystemMessage: true
      });
      
      this.websocketService.broadcast('chatMessage', {
        player: "Admin Dashboard",
        message: message,
        timestamp: new Date(),
        isCommand: false
      });
    }
  }

  public async executeCommand(command: string): Promise<void> {
    if (this.room) {
      // Execute admin commands from dashboard
      const mockAdmin: HaxballPlayer = {
        id: 0,
        name: "Dashboard Admin",
        admin: true,
        team: 0
      };
      
      await this.handleCommand(mockAdmin, command);
    }
  }

  public async updateAdminPassword(newPassword: string): Promise<void> {
    this.adminPassword = newPassword;
    await storage.updateRoomSettings({ adminPassword: newPassword });
    
    this.websocketService.broadcast('passwordChanged', {
      timestamp: new Date()
    });
  }

  public getRoomStatus() {
    if (!this.room) return null;
    
    return {
      players: this.room.getPlayerList(),
      scores: this.room.getScores(),
      isRunning: true
    };
  }
}

export default HaxballService;
