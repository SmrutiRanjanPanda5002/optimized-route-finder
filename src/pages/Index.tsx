
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Map from '@/components/Map';
import RouteForm from '@/components/RouteForm';
import RouteDetails from '@/components/RouteDetails';
import TokenInput from '@/components/TokenInput';
import { sampleGraph, findOptimalRoute, Route } from '@/utils/routeOptimization';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [calculatedRoute, setCalculatedRoute] = useState<Route | null>(null);
  const { toast } = useToast();

  // Check for token in localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox-token');
    if (savedToken) {
      setMapboxToken(savedToken);
    }
  }, []);

  const handleTokenSubmit = (token: string) => {
    setMapboxToken(token);
  };

  const handleCalculateRoute = (startId: string, destinations: string[]) => {
    try {
      const optimizedRoute = findOptimalRoute(sampleGraph, startId, destinations);
      
      if (!optimizedRoute) {
        toast({
          title: "Route Error",
          description: "Could not calculate a route with the given points. Please check your selections.",
          variant: "destructive"
        });
        return;
      }
      
      setCalculatedRoute(optimizedRoute);
      
      toast({
        title: "Route Calculated",
        description: `Found optimal route visiting ${optimizedRoute.path.length} points.`,
      });
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "Calculation Error",
        description: "An error occurred while calculating the route. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight">Route Optimizer</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Find the most efficient path between multiple destinations with our advanced route optimization algorithm.
          </p>
        </div>
        
        {!mapboxToken ? (
          <div className="max-w-2xl mx-auto mt-8">
            <TokenInput onTokenSubmit={handleTokenSubmit} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-1 space-y-6">
              <RouteForm
                graph={sampleGraph}
                onCalculateRoute={handleCalculateRoute}
              />
              
              <RouteDetails
                graph={sampleGraph}
                route={calculatedRoute}
              />
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border overflow-hidden h-[calc(100vh-20rem)] min-h-[500px]">
              <Map
                graph={sampleGraph}
                route={calculatedRoute}
                mapboxToken={mapboxToken}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
