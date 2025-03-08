
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Graph, Point, Route } from '@/utils/routeOptimization';
import { toast } from '@/components/ui/use-toast';

interface MapProps {
  graph: Graph;
  route: Route | null;
  mapboxToken: string;
}

const Map: React.FC<MapProps> = ({ graph, route, mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.006, 40.7128],
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
      
      // Add scale
      newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

      newMap.on('load', () => {
        setMapReady(true);
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

  // Add markers for all points
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Create an array to track added markers for cleanup
    const markers: mapboxgl.Marker[] = [];

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
        inner.textContent = 'P';
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
      
      markers.push(marker);
    });

    // Cleanup function
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [graph.points, mapReady]);

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

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainer} className="map-container" />
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
