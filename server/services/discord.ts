import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import { storage } from '../storage';
import { WebSocketService } from './websocket.js';

export class DiscordService {
  private static instance: DiscordService;
  private client: Client;
  private websocketService: WebSocketService;
  private channelId: string;
  private isConnected: boolean = false;

  private constructor() {
    this.channelId = process.env.DISCORD_CHANNEL_ID || "1402628332335534204";
    this.websocketService = WebSocketService.getInstance();
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
    this.initialize();
  }

  public static getInstance(): DiscordService {
    if (!DiscordService.instance) {
      DiscordService.instance = new DiscordService();
    }
    return DiscordService.instance;
  }

  private async initialize() {
    try {
      const token = process.env.DISCORD_BOT_TOKEN || "MTM5ODY3NDk3NTg1ODA5ODE4OA.G0UDP2.2ighPwGEGPsjE5LiEBAei2HhThiLILQfpkJbX4";
      await this.client.login(token);
      console.log("Discord bot connected successfully");
    } catch (error) {
      console.error("Failed to connect Discord bot:", error);
      // Continue without Discord for development
      this.isConnected = false;
    }
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
      this.isConnected = true;
      
      // Send startup message
      this.sendMessage("🟢 **Haxball Room Bot is now online!**");
      
      // Broadcast connection status to dashboard
      this.websocketService.broadcast('discordStatus', {
        connected: true,
        timestamp: new Date()
      });
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
      this.isConnected = false;
      
      this.websocketService.broadcast('discordStatus', {
        connected: false,
        timestamp: new Date(),
        error: error.message
      });
    });

    this.client.on('disconnect', () => {
      console.log('Discord bot disconnected');
      this.isConnected = false;
      
      this.websocketService.broadcast('discordStatus', {
        connected: false,
        timestamp: new Date()
      });
    });
  }

  public async sendMessage(content: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log(`[Discord Mock]: ${content}`);
        return false;
      }

      const channel = this.client.channels.cache.get(this.channelId) as TextChannel;
      if (!channel) {
        console.error(`Discord channel ${this.channelId} not found`);
        return false;
      }

      await channel.send(content);
      
      // Log activity
      await storage.createDiscordActivity({
        type: "message",
        message: content,
        success: true
      });

      // Update stats
      const stats = await storage.getRoomStats();
      if (stats) {
        await storage.updateRoomStats({
          discordMessagesToday: (stats.discordMessagesToday ?? 0) + 1
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to send Discord message:', error);
      
      await storage.createDiscordActivity({
        type: "message",
        message: content,
        success: false
      });

      return false;
    }
  }

  public async sendEmbed(title: string, description: string, color: number = 0x3498db): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log(`[Discord Mock Embed]: ${title} - ${description}`);
        return false;
      }

      const channel = this.client.channels.cache.get(this.channelId) as TextChannel;
      if (!channel) {
        console.error(`Discord channel ${this.channelId} not found`);
        return false;
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      
      await storage.createDiscordActivity({
        type: "embed",
        message: `${title}: ${description}`,
        success: true
      });

      return true;
    } catch (error) {
      console.error('Failed to send Discord embed:', error);
      
      await storage.createDiscordActivity({
        type: "embed",
        message: `${title}: ${description}`,
        success: false
      });

      return false;
    }
  }

  public async sendChatMessage(playerName: string, message: string): Promise<boolean> {
    const formattedMessage = `💬 **${playerName}**: ${message}`;
    return await this.sendMessage(formattedMessage);
  }

  public async sendGameResult(winnerTeam: string, score: { red: number; blue: number }, mvp: string, duration: number): Promise<boolean> {
    const embed = new EmbedBuilder()
      .setTitle("🏆 Game Finished!")
      .setDescription(`**${winnerTeam}** team wins!`)
      .addFields(
        { name: "🔴 Red Team", value: score.red.toString(), inline: true },
        { name: "🔵 Blue Team", value: score.blue.toString(), inline: true },
        { name: "⏱️ Duration", value: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`, inline: true },
        { name: "🌟 MVP", value: mvp, inline: false }
      )
      .setColor(winnerTeam === "Red" ? 0xe74c3c : 0x3498db)
      .setTimestamp();

    try {
      if (!this.isConnected) {
        console.log(`[Discord Mock Game Result]: ${winnerTeam} wins ${score.red}-${score.blue}, MVP: ${mvp}`);
        return false;
      }

      const channel = this.client.channels.cache.get(this.channelId) as TextChannel;
      if (!channel) {
        console.error(`Discord channel ${this.channelId} not found`);
        return false;
      }

      await channel.send({ embeds: [embed] });
      
      await storage.createDiscordActivity({
        type: "game_result",
        message: `${winnerTeam} wins ${score.red}-${score.blue}, MVP: ${mvp}`,
        success: true
      });

      return true;
    } catch (error) {
      console.error('Failed to send game result:', error);
      
      await storage.createDiscordActivity({
        type: "game_result",
        message: `${winnerTeam} wins ${score.red}-${score.blue}, MVP: ${mvp}`,
        success: false
      });

      return false;
    }
  }

  public async sendReminder(): Promise<boolean> {
    const reminderMessage = "🎮 **Join our Haxball room!** | 🎯 Skilled players welcome | 💬 https://discord.gg/6eBcNfD4Fn";
    const success = await this.sendMessage(reminderMessage);
    
    await storage.createDiscordActivity({
      type: "reminder",
      message: reminderMessage,
      success: success
    });

    return success;
  }

  public async sendPlayerJoin(playerName: string): Promise<boolean> {
    return await this.sendMessage(`🟢 **${playerName}** joined the room`);
  }

  public async sendPlayerLeave(playerName: string): Promise<boolean> {
    return await this.sendMessage(`🔴 **${playerName}** left the room`);
  }

  public async sendTestMessage(): Promise<boolean> {
    return await this.sendMessage("🧪 **Test message from Haxball Dashboard** - Bot is working correctly!");
  }

  public getConnectionStatus(): { connected: boolean; channelId: string } {
    return {
      connected: this.isConnected,
      channelId: this.channelId
    };
  }
}

export default DiscordService;
