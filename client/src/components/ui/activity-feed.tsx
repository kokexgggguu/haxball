import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { 
  UserPlus, 
  Trophy, 
  Crown, 
  MessageSquare, 
  Users,
  Target,
  Ban,
  Play
} from "lucide-react";

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  success?: boolean;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "chat":
        return MessageSquare;
      case "game_result":
        return Trophy;
      case "player_join":
        return UserPlus;
      case "reminder":
        return MessageSquare;
      case "admin":
        return Crown;
      case "command":
        return Target;
      case "ban":
        return Ban;
      case "game_start":
        return Play;
      default:
        return Users;
    }
  };

  const getActivityIconColor = (type: string, success?: boolean) => {
    if (success === false) return "text-red-500";
    
    switch (type) {
      case "chat":
      case "reminder":
        return "text-purple-400";
      case "game_result":
        return "text-primary";
      case "player_join":
        return "text-green-500";
      case "admin":
        return "text-yellow-500";
      case "command":
        return "text-blue-500";
      case "ban":
        return "text-red-500";
      case "game_start":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  const getActivityIconBg = (type: string, success?: boolean) => {
    if (success === false) return "bg-red-500/20";
    
    switch (type) {
      case "chat":
      case "reminder":
        return "bg-purple-500/20";
      case "game_result":
        return "bg-primary/20";
      case "player_join":
        return "bg-green-500/20";
      case "admin":
        return "bg-yellow-500/20";
      case "command":
        return "bg-blue-500/20";
      case "ban":
        return "bg-red-500/20";
      case "game_start":
        return "bg-green-500/20";
      default:
        return "bg-gray-500/20";
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  return (
    <Card data-testid="activity-feed">
      <CardHeader className="p-6 border-b border-border">
        <CardTitle className="text-xl font-semibold text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const iconColor = getActivityIconColor(activity.type, activity.success);
              const iconBg = getActivityIconBg(activity.type, activity.success);

              return (
                <div 
                  key={activity.id} 
                  className="activity-item"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}>
                    <Icon className={`${iconColor} w-5 h-5`} />
                  </div>
                  <div className="flex-1">
                    <p 
                      className="text-foreground font-medium"
                      data-testid={`activity-message-${activity.id}`}
                    >
                      {activity.message}
                    </p>
                    <p 
                      className="text-sm text-muted-foreground"
                      data-testid={`activity-time-${activity.id}`}
                    >
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  {activity.success === false && (
                    <div className="text-red-500 text-sm font-medium">
                      Failed
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
