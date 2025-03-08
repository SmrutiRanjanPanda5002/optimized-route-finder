
import React from 'react';
import { Graph, Route } from '@/utils/routeOptimization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Clock, Route as RouteIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RouteDetailsProps {
  graph: Graph;
  route: Route | null;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ graph, route }) => {
  if (!route) {
    return (
      <Card className="border shadow-sm animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Route Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No route calculated yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format time from minutes to hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours === 0) {
      return `${mins} min${mins !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  };

  // Format distance to 1 decimal place
  const formatDistance = (km: number) => {
    return `${km.toFixed(1)} km`;
  };

  return (
    <Card className={cn(
      "border shadow-sm animate-fade-in",
      route ? "bg-white" : "bg-muted/50"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Route Details</CardTitle>
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-primary/5">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(route.totalTime)}
            </Badge>
            <Badge variant="outline" className="bg-primary/5">
              <RouteIcon className="h-3 w-3 mr-1" />
              {formatDistance(route.totalDistance)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="font-medium">Optimized Route:</div>
          </div>
          
          <div className="pl-2 space-y-2">
            {route.path.map((pointId, index) => (
              <React.Fragment key={pointId}>
                <div className="flex items-center">
                  <div className="relative">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                      index === 0 ? "bg-primary text-white" : "bg-secondary text-foreground"
                    )}>
                      {pointId}
                    </div>
                    
                    {/* Vertical line connecting points */}
                    {index < route.path.length - 1 && (
                      <div className="absolute top-6 left-1/2 h-6 w-0.5 -ml-px bg-muted-foreground/20" />
                    )}
                  </div>
                  
                  <div className="ml-3">
                    <div className="font-medium">{graph.points[pointId].name}</div>
                    {index < route.path.length - 1 && (
                      <div className="text-xs text-muted-foreground">
                        {/* Show distance and time to next point if available */}
                        {graph.connections.find(c => 
                          (c.from === pointId && c.to === route.path[index + 1]) || 
                          (c.to === pointId && c.from === route.path[index + 1])
                        ) && (
                          <>
                            {formatDistance(graph.connections.find(c => 
                              (c.from === pointId && c.to === route.path[index + 1]) || 
                              (c.to === pointId && c.from === route.path[index + 1])
                            )!.distance)} • {
                              formatTime(graph.connections.find(c => 
                                (c.from === pointId && c.to === route.path[index + 1]) || 
                                (c.to === pointId && c.from === route.path[index + 1])
                              )!.time)
                            }
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex justify-between items-center text-sm">
            <div className="text-muted-foreground">Total Distance:</div>
            <div className="font-semibold">{formatDistance(route.totalDistance)}</div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="text-muted-foreground">Estimated Time:</div>
            <div className="font-semibold">{formatTime(route.totalTime)}</div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            This route visits {route.path.length} points in the optimal order.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteDetails;
