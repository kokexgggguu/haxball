import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Terminal, 
  Trophy, 
  MessageSquare,
  Crown,
  Clock,
  Volleyball
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { ChatFeed } from "@/components/ui/chat-feed";
import { CommandPanel } from "@/components/ui/command-panel";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { useWebSocket } from "@/hooks/use-websocket";
import { queryClient } from "@/lib/queryClient";

interface DashboardData {
  roomStats: {
    currentPlayers: number;
    totalPlayersToday: number;
    commandsUsedToday: number;
    discordMessagesToday: number;
    gamesToday: number;
  };
  chatMessages: Array<{
    id: string;
    playerName: string;
    message: string;
    timestamp: Date;
    isCommand: boolean;
    isSystemMessage: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    success?: boolean;
  }>;
  activePlayers: Array<{
    id: string;
    name: string;
    isAdmin: boolean;
    joinedAt: Date;
  }>;
  roomSettings: {
    adminPassword: string;
    discordReminderInterval: number;
    maxPlayers: number;
    roomName: string;
  };
  discordStatus: {
    connected: boolean;
    channelId: string;
  };
}

export default function Dashboard() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  const [roomStats, setRoomStats] = useState({
    currentPlayers: 0,
    totalPlayersToday: 0,
    commandsUsedToday: 0,
    discordMessagesToday: 0,
    gamesToday: 0,
  });
  const [chatMessages, setChatMessages] = useState<DashboardData['chatMessages']>([]);
  const [recentActivity, setRecentActivity] = useState<DashboardData['recentActivity']>([]);
  const [activePlayers, setActivePlayers] = useState<DashboardData['activePlayers']>([]);
  const [roomSettings, setRoomSettings] = useState({
    adminPassword: "1234",
    discordReminderInterval: 180,
    maxPlayers: 16,
    roomName: "Haxball Room",
  });
  const [discordStatus, setDiscordStatus] = useState({
    connected: false,
    channelId: "1402628332335534204",
  });
  const [uptime, setUptime] = useState("0h 0m");

  const { isConnected, lastMessage } = useWebSocket();

  // Handle admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "1234") {
      setIsAdminAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Wrong admin password!");
    }
  };

  // Fetch initial dashboard data
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: isAdminAuthenticated, // Only fetch if authenticated
  });

  // Update state when data is fetched
  useEffect(() => {
    if (data) {
      setRoomStats(data.roomStats);
      setChatMessages(data.chatMessages);
      setRecentActivity(data.recentActivity);
      setActivePlayers(data.activePlayers);
      setRoomSettings(data.roomSettings);
      setDiscordStatus(data.discordStatus);
    }
  }, [data]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'chatMessage':
          setChatMessages(prev => [...prev.slice(-49), {
            id: Date.now().toString(),
            playerName: lastMessage.data.player,
            message: lastMessage.data.message,
            timestamp: new Date(lastMessage.data.timestamp),
            isCommand: lastMessage.data.isCommand || false,
            isSystemMessage: false,
          }]);
          break;

        case 'playerJoin':
          setActivePlayers(prev => [...prev, {
            id: Date.now().toString(),
            name: lastMessage.data.player,
            isAdmin: false,
            joinedAt: new Date(lastMessage.data.timestamp),
          }]);
          setRoomStats(prev => ({
            ...prev,
            currentPlayers: prev.currentPlayers + 1,
            totalPlayersToday: prev.totalPlayersToday + 1,
          }));
          setRecentActivity(prev => [{
            id: Date.now().toString(),
            type: 'player_join',
            message: `${lastMessage.data.player} joined the room`,
            timestamp: new Date(lastMessage.data.timestamp),
          }, ...prev.slice(0, 9)]);
          break;

        case 'playerLeave':
          setActivePlayers(prev => prev.filter(p => p.name !== lastMessage.data.player));
          setRoomStats(prev => ({
            ...prev,
            currentPlayers: Math.max(0, prev.currentPlayers - 1),
          }));
          setRecentActivity(prev => [{
            id: Date.now().toString(),
            type: 'player_leave',
            message: `${lastMessage.data.player} left the room`,
            timestamp: new Date(lastMessage.data.timestamp),
          }, ...prev.slice(0, 9)]);
          break;

        case 'command':
          setRoomStats(prev => ({
            ...prev,
            commandsUsedToday: prev.commandsUsedToday + 1,
          }));
          setRecentActivity(prev => [{
            id: Date.now().toString(),
            type: 'command',
            message: `${lastMessage.data.player} used ${lastMessage.data.command}`,
            timestamp: new Date(lastMessage.data.timestamp),
          }, ...prev.slice(0, 9)]);
          break;

        case 'gameStart':
          setRoomStats(prev => ({
            ...prev,
            gamesToday: prev.gamesToday + 1,
          }));
          setRecentActivity(prev => [{
            id: Date.now().toString(),
            type: 'game_start',
            message: 'Game started',
            timestamp: new Date(lastMessage.data.timestamp),
          }, ...prev.slice(0, 9)]);
          break;

        case 'discordStatus':
          setDiscordStatus(prev => ({
            ...prev,
            connected: lastMessage.data.connected,
          }));
          if (lastMessage.data.connected) {
            setRecentActivity(prev => [{
              id: Date.now().toString(),
              type: 'reminder',
              message: 'Discord bot connected',
              timestamp: new Date(lastMessage.data.timestamp),
            }, ...prev.slice(0, 9)]);
          }
          break;

        case 'discordReminder':
          setRoomStats(prev => ({
            ...prev,
            discordMessagesToday: prev.discordMessagesToday + 1,
          }));
          setRecentActivity(prev => [{
            id: Date.now().toString(),
            type: 'reminder',
            message: 'Discord reminder sent: Join our Discord server!',
            timestamp: new Date(lastMessage.data.timestamp),
          }, ...prev.slice(0, 9)]);
          break;

        case 'passwordChanged':
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
          break;
      }
    }
  }, [lastMessage]);

  // Update uptime
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      setUptime(`${hours}h ${minutes}m`);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handlePasswordChange = (newPassword: string) => {
    setRoomSettings(prev => ({
      ...prev,
      adminPassword: newPassword,
    }));
  };

  // Show login screen if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="text-primary-foreground w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Haxball Admin</h1>
              <p className="text-muted-foreground">Enter admin password to access dashboard</p>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Admin Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter admin password (1234)"
                  data-testid="input-admin-password"
                />
              </div>
              
              {loginError && (
                <div className="text-red-500 text-sm text-center" data-testid="text-login-error">
                  {loginError}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                data-testid="button-admin-login"
              >
                Login as Admin
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Hint: Default password is "1234"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-10">
        {/* Logo/Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Volleyball className="text-primary-foreground w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Haxball Admin</h1>
              <p className="text-sm text-muted-foreground">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a 
            href="#" 
            className="sidebar-nav-item active"
            data-testid="nav-dashboard"
          >
            <i className="fas fa-tachometer-alt mr-3"></i>
            Dashboard
          </a>
          <a 
            href="#" 
            className="sidebar-nav-item"
            data-testid="nav-players"
          >
            <Users className="mr-3 w-4 h-4" />
            Players
          </a>
          <a 
            href="#" 
            className="sidebar-nav-item"
            data-testid="nav-commands"
          >
            <Terminal className="mr-3 w-4 h-4" />
            Commands
          </a>
          <a 
            href="#" 
            className="sidebar-nav-item"
            data-testid="nav-discord"
          >
            <i className="fab fa-discord mr-3"></i>
            Discord Bot
          </a>
          <a 
            href="#" 
            className="sidebar-nav-item"
            data-testid="nav-statistics"
          >
            <i className="fas fa-chart-line mr-3"></i>
            Statistics
          </a>
          <a 
            href="#" 
            className="sidebar-nav-item"
            data-testid="nav-settings"
          >
            <i className="fas fa-cog mr-3"></i>
            Settings
          </a>
        </nav>

        {/* Room Status */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Room Status</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse-green' : 'bg-red-500'}`}></div>
              <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Players:</span>
              <span data-testid="sidebar-player-count">
                {roomStats.currentPlayers}/{roomSettings.maxPlayers}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span data-testid="sidebar-uptime">{uptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Room Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Monitor and control your Haxball room
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Discord Reminder Status */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
                <i className="fab fa-discord"></i>
                <span>Next reminder: 2m 15s</span>
              </div>
              {/* Admin Status */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-primary/20 text-primary rounded-lg text-sm">
                  <Crown className="w-4 h-4" />
                  <span>Owner Mode</span>
                </div>
                <button
                  onClick={() => setIsAdminAuthenticated(false)}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                  data-testid="button-logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Players"
              value={roomStats.currentPlayers}
              icon={Users}
              change={{
                value: `+${Math.max(0, roomStats.totalPlayersToday - roomStats.currentPlayers)}`,
                type: "increase",
                period: "from last hour"
              }}
              iconColor="text-primary"
              iconBgColor="bg-primary/20"
            />
            
            <StatsCard
              title="Commands Used"
              value={roomStats.commandsUsedToday}
              icon={Terminal}
              change={{
                value: "+24",
                type: "increase",
                period: "today"
              }}
              iconColor="text-yellow-500"
              iconBgColor="bg-yellow-500/20"
            />
            
            <StatsCard
              title="Discord Messages"
              value={roomStats.discordMessagesToday}
              icon={MessageSquare}
              change={{
                value: "+156",
                type: "increase",
                period: "today"
              }}
              iconColor="text-purple-400"
              iconBgColor="bg-purple-500/20"
            />
            
            <StatsCard
              title="Games Played"
              value={roomStats.gamesToday}
              icon={Trophy}
              change={{
                value: "+7",
                type: "increase",
                period: "today"
              }}
              iconColor="text-green-500"
              iconBgColor="bg-green-500/20"
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Chat Feed */}
            <div className="lg:col-span-2">
              <ChatFeed 
                messages={chatMessages}
                onNewMessage={(message) => {
                  setChatMessages(prev => [...prev, message]);
                }}
              />
            </div>

            {/* Command Panel */}
            <div>
              <CommandPanel
                discordStatus={discordStatus}
                roomSettings={roomSettings}
                onPasswordChange={handlePasswordChange}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <ActivityFeed activities={recentActivity} />
          </div>
        </main>
      </div>
    </div>
  );
}
