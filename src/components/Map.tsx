
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Graph, Point, Route } from '@/utils/routeOptimization';
import { toast } from '@/components/ui/use-toast';
import { MapPin, Navigation } from 'lucide-react';

interface MapProps {
  graph: Graph;
  route: Route | null;
  mapboxToken: string;
  onLocationSelect?: (lng: number, lat: number, type: 'start' | 'destination') => void;
  userLocation?: { lng: number, lat: number } | null;
}

const Map: React.FC<MapProps> = ({ 
  graph, 
  route, 
  mapboxToken, 
  onLocationSelect,
  userLocation
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'start' | 'destination' | null>(null);
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      const initialCenter = userLocation ? 
        [userLocation.lng, userLocation.lat] : 
        [-74.006, 40.7128];
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: initialCenter as [number, number],
        zoom: 13,
        pitch: 45,
        bearing: 0,
        antialias: true
      });

      // Add navigation controls
      newMap.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
      
      // Add geolocate control
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      
      newMap.addControl(geolocateControl, 'top-right');
      
      // Add scale
      newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

      // Add click event for location selection
      newMap.on('click', (e) => {
        if (selectionMode && onLocationSelect) {
          onLocationSelect(e.lngLat.lng, e.lngLat.lat, selectionMode);
          setSelectionMode(null); // Reset selection mode after selecting
          
          // Change cursor back to default
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
          
          toast({
            title: `Location Selected`,
            description: selectionMode === 'start' ? 
              "Starting point has been set." : 
              "Destination has been added.",
          });
        }
      });

      newMap.on('load', () => {
        setMapReady(true);
        
        // Trigger geolocate on load if available
        geolocateControl.trigger();
      });

      newMap.on('error', (e) => {
        console.error('Mapbox error:', e);
        toast({
          title: "Map Error",
          description: "There was an error loading the map. Please check your Mapbox token.",
          variant: "destructive"
        });
      });

      map.current = newMap;

      return () => {
        newMap.remove();
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map Error",
        description: "There was an error initializing the map. Please check your Mapbox token.",
        variant: "destructive"
      });
    }
  }, [mapboxToken]);

  // Update cursor when in selection mode
  useEffect(() => {
    if (!map.current) return;
    
    if (selectionMode) {
      map.current.getCanvas().style.cursor = 'crosshair';
    } else {
      map.current.getCanvas().style.cursor = '';
    }
  }, [selectionMode]);

  // Add markers for all points and update when graph changes
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for all points
    Object.values(graph.points).forEach((point) => {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-200';
      
      // Inner circle with different color for different point types
      const inner = document.createElement('div');
      inner.className = 'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold';
      
      // Style based on point type
      if (point.id === 'A') {
        inner.className += ' bg-primary text-white';
        inner.textContent = 'S';
      } else {
        inner.className += ' bg-secondary text-foreground';
        inner.textContent = point.id;
      }
      
      el.appendChild(inner);

      // Create popup with point information
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<div class="p-2">
          <h3 class="font-semibold">${point.name}</h3>
          <p class="text-xs text-gray-500">ID: ${point.id}</p>
        </div>`);

      // Create and add the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([point.lng, point.lat])
        .setPopup(popup)
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
  }, [graph.points, mapReady]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !mapReady || !userLocation) return;
    
    // Remove existing user marker if it exists
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
    }
    
    // Create user location marker
    const el = document.createElement('div');
    el.className = 'flex items-center justify-center w-10 h-10';
    
    // Add pulsing effect
    const pulse = document.createElement('div');
    pulse.className = 'absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping';
    el.appendChild(pulse);
    
    // Add center point
    const center = document.createElement('div');
    center.className = 'absolute w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center';
    center.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>';
    el.appendChild(center);
    
    // Create and add the marker
    userLocationMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
    
    // Center map on user location if this is initial location
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 2000
    });
    
  }, [userLocation, mapReady]);

  // Draw route path
  useEffect(() => {
    if (!map.current || !mapReady || !route) return;
    
    // Remove existing route layers if they exist
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
    }
    if (map.current.getLayer('route-line-casing')) {
      map.current.removeLayer('route-line-casing');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Extract coordinates for the route path
    const coordinates: [number, number][] = route.path.map(pointId => {
      const point = graph.points[pointId];
      return [point.lng, point.lat];
    });

    // Add the route source and layers
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });

    // Add route casing (the outline)
    map.current.addLayer({
      id: 'route-line-casing',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 8,
        'line-opacity': 0.8
      }
    });

    // Add route line
    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 1,
        'line-dasharray': [0, 2, 1]
      }
    });

    // Fit map to show the entire route
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 1000
    });

    // Add animated dots along the path
    const animateDot = () => {
      if (!map.current) return;

      if (map.current.getLayer('route-dot')) {
        map.current.removeLayer('route-dot');
      }
      
      if (map.current.getSource('dot')) {
        map.current.removeSource('dot');
      }

      // Calculate dot position along the path
      const progress = (Date.now() % 3000) / 3000; // 3-second loop
      const pointIndex = Math.floor(progress * (coordinates.length - 1));
      const remainingProgress = progress * (coordinates.length - 1) - pointIndex;
      
      // Interpolate between points
      const from = coordinates[pointIndex];
      const to = coordinates[Math.min(pointIndex + 1, coordinates.length - 1)];
      
      const lng = from[0] + (to[0] - from[0]) * remainingProgress;
      const lat = from[1] + (to[1] - from[1]) * remainingProgress;

      // Add the animated dot
      map.current.addSource('dot', {
        type: 'geojson',
        data: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      });

      map.current.addLayer({
        id: 'route-dot',
        type: 'circle',
        source: 'dot',
        paint: {
          'circle-radius': 6,
          'circle-color': '#3b82f6',
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      requestAnimationFrame(animateDot);
    };

    // Start animation
    animateDot();

    // No cleanup needed for this animation as it will be replaced in the next render
  }, [graph.points, route, mapReady]);

  const handleSetStartingPoint = () => {
    setSelectionMode('start');
    toast({
      title: "Select Starting Point",
      description: "Click on the map to set your starting location.",
    });
  };

  const handleAddDestination = () => {
    setSelectionMode('destination');
    toast({
      title: "Select Destination",
      description: "Click on the map to add a destination point.",
    });
  };

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainer} className="map-container" />
      
      {/* Map controls */}
      {mapboxToken && mapReady && (
        <div className="absolute bottom-4 left-4 flex flex-col space-y-2">
          <button 
            onClick={handleSetStartingPoint}
            className="flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            title="Set starting point"
          >
            <Navigation className="h-5 w-5 text-primary" />
          </button>
          <button 
            onClick={handleAddDestination}
            className="flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            title="Add destination"
          >
            <MapPin className="h-5 w-5 text-destructive" />
          </button>
        </div>
      )}
      
      {/* Selection mode indicator */}
      {selectionMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium">
          {selectionMode === 'start' ? 'Click to set starting point' : 'Click to add destination'}
        </div>
      )}
      
      {!mapboxToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center p-6 rounded-lg bg-white shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please enter your Mapbox token to display the map.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
