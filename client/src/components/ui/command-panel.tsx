import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { 
  Ban, 
  RotateCcw, 
  Play, 
  Pause, 
  Send, 
  Copy,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CommandPanelProps {
  discordStatus: {
    connected: boolean;
    channelId: string;
  };
  roomSettings: {
    adminPassword: string;
  };
  onPasswordChange?: (newPassword: string) => void;
}

export function CommandPanel({ 
  discordStatus, 
  roomSettings, 
  onPasswordChange 
}: CommandPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [newPassword, setNewPassword] = useState(roomSettings.adminPassword);
  const { toast } = useToast();

  const executeQuickCommand = async (action: string) => {
    setIsExecuting(true);
    try {
      await apiRequest("POST", `/api/actions/${action}`, {});
      toast({
        title: "Command executed",
        description: `${action.replace('-', ' ')} command executed successfully.`,
      });
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to execute ${action.replace('-', ' ')} command.`,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const sendDiscordTest = async () => {
    setIsExecuting(true);
    try {
      await apiRequest("POST", "/api/discord/test", {});
      toast({
        title: "Test message sent",
        description: "Discord test message sent successfully.",
      });
    } catch (error) {
      console.error("Failed to send Discord test:", error);
      toast({
        title: "Error",
        description: "Failed to send Discord test message.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword === roomSettings.adminPassword) return;
    
    try {
      await apiRequest("PATCH", "/api/settings", { 
        adminPassword: newPassword 
      });
      
      if (onPasswordChange) {
        onPasswordChange(newPassword);
      }
      
      toast({
        title: "Password updated",
        description: "Admin password has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update password:", error);
      toast({
        title: "Error",
        description: "Failed to update admin password.",
        variant: "destructive",
      });
      setNewPassword(roomSettings.adminPassword);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(roomSettings.adminPassword);
      toast({
        title: "Password copied",
        description: "Admin password copied to clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy password:", error);
      toast({
        title: "Error",
        description: "Failed to copy password to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Commands */}
      <Card data-testid="quick-commands-panel">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Quick Commands
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => executeQuickCommand("clear-bans")}
            disabled={isExecuting}
            className="command-button bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="clear-bans-button"
          >
            <span>Clear Bans</span>
            <Ban className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => executeQuickCommand("reset-game")}
            disabled={isExecuting}
            className="command-button bg-yellow-600 hover:bg-yellow-700 text-white"
            data-testid="reset-game-button"
          >
            <span>Reset Game</span>
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => executeQuickCommand("start-game")}
            disabled={isExecuting}
            className="command-button bg-green-600 hover:bg-green-700 text-white"
            data-testid="start-game-button"
          >
            <span>Start Game</span>
            <Play className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => executeQuickCommand("pause-game")}
            disabled={isExecuting}
            className="command-button bg-red-600 hover:bg-red-700 text-white"
            data-testid="pause-game-button"
          >
            <span>Pause Game</span>
            <Pause className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Discord Status */}
      <Card data-testid="discord-status-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Discord Bot
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  discordStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <span 
                className={`text-sm ${
                  discordStatus.connected ? 'text-green-500' : 'text-red-500'
                }`}
                data-testid="discord-connection-status"
              >
                {discordStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Channel:</span>
              <span className="text-foreground" data-testid="discord-channel-id">
                #{discordStatus.channelId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge 
                variant={discordStatus.connected ? "default" : "destructive"}
                data-testid="discord-status-badge"
              >
                {discordStatus.connected ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
          <Button
            onClick={sendDiscordTest}
            disabled={isExecuting || !discordStatus.connected}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            data-testid="discord-test-button"
          >
            {isExecuting ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Test Message
          </Button>
        </CardContent>
      </Card>

      {/* Admin Password */}
      <Card data-testid="admin-password-panel">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Current Password
            </label>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 bg-muted border-border"
                data-testid="admin-password-input"
              />
              <Button
                onClick={copyPassword}
                variant="outline"
                size="sm"
                className="px-3"
                data-testid="copy-password-button"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={updatePassword}
            disabled={newPassword === roomSettings.adminPassword}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            data-testid="change-password-button"
          >
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
