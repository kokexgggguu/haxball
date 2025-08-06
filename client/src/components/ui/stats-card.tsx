import { Card, CardContent } from "./card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    type: "increase" | "decrease";
    period: string;
  };
  iconColor?: string;
  iconBgColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  iconColor = "text-primary",
  iconBgColor = "bg-primary/20"
}: StatsCardProps) {
  return (
    <Card className="stats-card" data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`${iconColor} text-xl w-6 h-6`} />
          </div>
        </div>
        {change && (
          <div className="flex items-center mt-4 text-sm">
            <i className={`fas fa-arrow-${change.type === 'increase' ? 'up' : 'down'} ${
              change.type === 'increase' ? 'text-green-500' : 'text-red-500'
            } mr-1`}></i>
            <span className={change.type === 'increase' ? 'text-green-500' : 'text-red-500'}>
              {change.value}
            </span>
            <span className="text-muted-foreground ml-1">{change.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
