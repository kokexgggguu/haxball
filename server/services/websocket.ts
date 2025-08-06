import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server: server, 
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');
      this.clients.add(ws);

      // Send initial connection message
      this.sendToClient(ws, {
        type: 'connected',
        data: { message: 'Connected to Haxball Dashboard' },
        timestamp: new Date()
      });

      // Handle messages from client
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('WebSocket server initialized on path /ws');
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    console.log('Received WebSocket message:', message);

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: new Date() },
          timestamp: new Date()
        });
        break;

      case 'requestStats':
        // Handle stats request
        this.handleStatsRequest(ws);
        break;

      case 'executeCommand':
        // Handle command execution from dashboard
        this.handleCommandExecution(message.data);
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
        break;
    }
  }

  private async handleStatsRequest(ws: WebSocket): Promise<void> {
    try {
      const { storage } = await import('../storage');
      
      const [
        roomStats,
        chatMessages,
        recentActivity,
        activePlayers,
        roomSettings
      ] = await Promise.all([
        storage.getRoomStats(),
        storage.getChatMessages(50),
        storage.getDiscordActivity(10),
        storage.getActivePlayers(),
        storage.getRoomSettings()
      ]);

      this.sendToClient(ws, {
        type: 'statsUpdate',
        data: {
          roomStats,
          chatMessages,
          recentActivity,
          activePlayers,
          roomSettings
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      this.sendToClient(ws, {
        type: 'error',
        data: { message: 'Failed to fetch stats' },
        timestamp: new Date()
      });
    }
  }

  private async handleCommandExecution(data: any): Promise<void> {
    try {
      // Import HaxballService dynamically to avoid circular dependencies
      const { default: HaxballService } = await import('./haxball');
      const haxballService = new HaxballService();
      
      if (data.command) {
        await haxballService.executeCommand(data.command);
      } else if (data.message) {
        await haxballService.sendChatMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  }

  public broadcast(type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date()
    };

    const messageString = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageString);
        } catch (error) {
          console.error('Failed to broadcast WebSocket message:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });

    console.log(`Broadcasted ${type} to ${this.clients.size} clients`);
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public sendStats(stats: any): void {
    this.broadcast('statsUpdate', stats);
  }

  public sendChatMessage(playerName: string, message: string, isCommand: boolean = false): void {
    this.broadcast('chatMessage', {
      player: playerName,
      message,
      isCommand,
      timestamp: new Date()
    });
  }

  public sendPlayerActivity(type: 'join' | 'leave', playerName: string): void {
    this.broadcast('playerActivity', {
      type,
      player: playerName,
      timestamp: new Date()
    });
  }

  public sendGameEvent(type: string, data: any): void {
    this.broadcast('gameEvent', {
      type,
      data,
      timestamp: new Date()
    });
  }

  public sendDiscordActivity(activity: any): void {
    this.broadcast('discordActivity', activity);
  }
}

export default WebSocketService;
