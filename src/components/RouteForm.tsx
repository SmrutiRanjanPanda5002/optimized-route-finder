
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Graph, Point } from '@/utils/routeOptimization';
import { PlusCircle, MinusCircle, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RouteFormProps {
  graph: Graph;
  onCalculateRoute: (startId: string, destinations: string[]) => void;
}

const RouteForm: React.FC<RouteFormProps> = ({ graph, onCalculateRoute }) => {
  const [startId, setStartId] = useState('A'); // Default to 'A' (Car Park)
  const [destinations, setDestinations] = useState<string[]>(['D']); // Default to 'D'
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get sorted points for dropdowns
  const sortedPoints = Object.values(graph.points).sort((a, b) => a.id.localeCompare(b.id));

  const handleAddDestination = () => {
    setDestinations([...destinations, '']);
  };

  const handleRemoveDestination = (index: number) => {
    const newDestinations = [...destinations];
    newDestinations.splice(index, 1);
    setDestinations(newDestinations);
  };

  const handleChangeDestination = (index: number, value: string) => {
    const newDestinations = [...destinations];
    newDestinations[index] = value;
    setDestinations(newDestinations);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!startId) {
      toast({
        title: "Starting Point Required",
        description: "Please select a starting point.",
        variant: "destructive"
      });
      return;
    }
    
    const validDestinations = destinations.filter(d => d);
    if (validDestinations.length === 0) {
      toast({
        title: "Destinations Required",
        description: "Please add at least one destination.",
        variant: "destructive"
      });
      return;
    }
    
    // Check for duplicate destinations
    const uniqueDestinations = new Set(validDestinations);
    if (uniqueDestinations.size !== validDestinations.length) {
      toast({
        title: "Duplicate Destinations",
        description: "Please remove duplicate destinations.",
        variant: "destructive"
      });
      return;
    }

    // Simulate loading state for better UX
    setIsLoading(true);
    setTimeout(() => {
      onCalculateRoute(startId, validDestinations);
      setIsLoading(false);
    }, 800);
  };

  const resetForm = () => {
    setStartId('A');
    setDestinations(['D']);
    toast({
      title: "Form Reset",
      description: "Your route has been reset to default values.",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Route Settings</h2>
        <Button variant="ghost" size="sm" onClick={resetForm} className="h-8">
          <RotateCw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="starting-point">Starting Point</Label>
          <Select value={startId} onValueChange={setStartId}>
            <SelectTrigger id="starting-point">
              <SelectValue placeholder="Select starting point" />
            </SelectTrigger>
            <SelectContent>
              {sortedPoints.map((point) => (
                <SelectItem key={point.id} value={point.id}>
                  {point.name} ({point.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Destinations</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddDestination}
              className="h-8"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          {destinations.map((destination, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-1">
                <Select 
                  value={destination} 
                  onValueChange={(value) => handleChangeDestination(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedPoints
                      .filter(point => point.id !== startId)
                      .map((point) => (
                        <SelectItem key={point.id} value={point.id}>
                          {point.name} ({point.id})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              {destinations.length > 1 && (
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveDestination(index)}
                  className="h-8 w-8"
                >
                  <MinusCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <div className="pt-2">
          <Badge variant="outline" className="mb-4">
            {destinations.filter(Boolean).length} destination{destinations.filter(Boolean).length !== 1 ? 's' : ''}
          </Badge>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Calculating..." : "Find Optimal Route"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RouteForm;
