
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Map from '@/components/Map';
import RouteForm from '@/components/RouteForm';
import RouteDetails from '@/components/RouteDetails';
import TokenInput from '@/components/TokenInput';
import { findOptimalRoute, Route, Graph, Point } from '@/utils/routeOptimization';
import { useToast } from '@/components/ui/use-toast';
import { nanoid } from 'nanoid';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [calculatedRoute, setCalculatedRoute] = useState<Route | null>(null);
  const [customGraph, setCustomGraph] = useState<Graph>({
    points: {},
    connections: []
  });
  const [userLocation, setUserLocation] = useState<{ lng: number, lat: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { toast } = useToast();

  // Check for token in localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox-token');
    if (savedToken) {
      setMapboxToken(savedToken);
    }
    
    // Try to get user's location
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoadingLocation(false);
          
          // Add user's location as starting point A
          addCustomPoint('A', 'Current Location', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
          toast({
            title: "Location Error",
            description: "Could not get your current location. Please allow location access or set a manual starting point.",
            variant: "destructive"
          });
        }
      );
    }
  }, []);

  // Handle token submission
  const handleTokenSubmit = (token: string) => {
    setMapboxToken(token);
  };

  // Add a custom point to the graph
  const addCustomPoint = (id: string, name: string, lat: number, lng: number) => {
    setCustomGraph(prevGraph => {
      const newPoints = { ...prevGraph.points };
      newPoints[id] = { id, name, lat, lng };
      
      return {
        ...prevGraph,
        points: newPoints
      };
    });
  };

  // Add connection between two points
  const addConnection = (fromId: string, toId: string, distance: number, time: number) => {
    setCustomGraph(prevGraph => {
      return {
        ...prevGraph,
        connections: [
          ...prevGraph.connections,
          { from: fromId, to: toId, distance, time }
        ]
      };
    });
  };

  // Handle location selection from map
  const handleLocationSelect = (lng: number, lat: number, type: 'start' | 'destination') => {
    if (type === 'start') {
      // If there's already a point A, update it
      addCustomPoint('A', 'Starting Point', lat, lng);
      
      // Update user location
      setUserLocation({ lng, lat });
    } else {
      // For destinations, generate a new ID
      const newId = `D${Object.keys(customGraph.points).filter(id => id.startsWith('D')).length + 1}`;
      addCustomPoint(newId, `Destination ${newId}`, lat, lng);
      
      // Add connections from this point to all existing points
      Object.keys(customGraph.points).forEach(existingId => {
        if (existingId !== newId) {
          const existingPoint = customGraph.points[existingId];
          const distance = calculateDistance(
            lat, lng, 
            existingPoint.lat, existingPoint.lng
          );
          // Estimate time based on distance (assuming 60 km/h average speed)
          const time = (distance / 60) * 60; // convert to minutes
          
          // Add bidirectional connections
          addConnection(newId, existingId, distance, time);
          addConnection(existingId, newId, distance, time);
        }
      });
    }
  };

  // Calculate distance between two points in kilometers using the Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  // Handle calculate route
  const handleCalculateRoute = (startId: string, destinations: string[]) => {
    try {
      // Use custom graph if it has points, otherwise use sample graph
      const graphToUse = Object.keys(customGraph.points).length > 0 ? customGraph : undefined;
      
      if (!graphToUse) {
        toast({
          title: "No Points",
          description: "Please add points to the map first by clicking the map or allowing location access.",
          variant: "destructive"
        });
        return;
      }
      
      const optimizedRoute = findOptimalRoute(graphToUse, startId, destinations);
      
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

  // Determine which graph to use
  const activeGraph = Object.keys(customGraph.points).length > 0 ? customGraph : { 
    points: { 'A': { id: 'A', name: 'Starting Point', lat: 40.712776, lng: -74.005974 } },
    connections: []
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight">Route Optimizer</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Find the most efficient path between multiple destinations with our advanced route optimization algorithm.
          </p>
          {isLoadingLocation && (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="animate-spin mr-2 h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Getting your location...</span>
            </div>
          )}
        </div>
        
        {!mapboxToken ? (
          <div className="max-w-2xl mx-auto mt-8">
            <TokenInput onTokenSubmit={handleTokenSubmit} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-1 space-y-6">
              <RouteForm
                graph={activeGraph}
                onCalculateRoute={handleCalculateRoute}
              />
              
              <RouteDetails
                graph={activeGraph}
                route={calculatedRoute}
              />
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border overflow-hidden h-[calc(100vh-20rem)] min-h-[500px]">
              <Map
                graph={activeGraph}
                route={calculatedRoute}
                mapboxToken={mapboxToken}
                onLocationSelect={handleLocationSelect}
                userLocation={userLocation}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
