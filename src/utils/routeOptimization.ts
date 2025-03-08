// Graph representation for points and connections
export interface Point {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Connection {
  from: string;
  to: string;
  distance: number; // in kilometers
  time: number; // in minutes
}

export interface Graph {
  points: Record<string, Point>;
  connections: Connection[];
}

export interface Route {
  path: string[];
  totalDistance: number;
  totalTime: number;
}

// Dijkstra's algorithm for finding shortest path
export function findShortestPath(
  graph: Graph,
  startId: string,
  endId: string
): Route | null {
  // Create adjacency list from connections
  const adjacencyList: Record<string, { id: string; distance: number; time: number }[]> = {};
  
  // Initialize adjacency list for all points
  Object.keys(graph.points).forEach(pointId => {
    adjacencyList[pointId] = [];
  });
  
  // Populate adjacency list with connections
  graph.connections.forEach(conn => {
    adjacencyList[conn.from].push({
      id: conn.to,
      distance: conn.distance,
      time: conn.time
    });
    // Add reverse connection if bidirectional (assuming all roads are bidirectional)
    adjacencyList[conn.to].push({
      id: conn.from,
      distance: conn.distance,
      time: conn.time
    });
  });
  
  // Initialize distances, times and previous nodes
  const distances: Record<string, number> = {};
  const times: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited: Set<string> = new Set();
  
  // Set initial values
  Object.keys(graph.points).forEach(pointId => {
    distances[pointId] = Infinity;
    times[pointId] = Infinity;
    previous[pointId] = null;
  });
  
  // Distance and time from start to start is 0
  distances[startId] = 0;
  times[startId] = 0;
  
  // Process nodes
  while (visited.size < Object.keys(graph.points).length) {
    // Find unvisited node with minimum distance
    let current: string | null = null;
    let shortestDistance = Infinity;
    
    Object.keys(graph.points).forEach(pointId => {
      if (!visited.has(pointId) && distances[pointId] < shortestDistance) {
        shortestDistance = distances[pointId];
        current = pointId;
      }
    });
    
    // If no reachable nodes or we've reached the end, break
    if (current === null || current === endId) break;
    
    visited.add(current);
    
    // Check neighbors
    adjacencyList[current].forEach(neighbor => {
      if (visited.has(neighbor.id)) return;
      
      const distance = distances[current] + neighbor.distance;
      const time = times[current] + neighbor.time;
      
      if (distance < distances[neighbor.id]) {
        distances[neighbor.id] = distance;
        times[neighbor.id] = time;
        previous[neighbor.id] = current;
      }
    });
  }
  
  // If end is not reachable
  if (distances[endId] === Infinity) return null;
  
  // Reconstruct path
  const path: string[] = [];
  let current: string | null = endId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }
  
  return {
    path,
    totalDistance: distances[endId],
    totalTime: times[endId]
  };
}

// Function to find optimal route visiting multiple points
export function findOptimalRoute(
  graph: Graph,
  startId: string,
  destinations: string[]
): Route | null {
  if (destinations.length === 0) return null;
  
  // If only one destination, just find shortest path to it
  if (destinations.length === 1) {
    return findShortestPath(graph, startId, destinations[0]);
  }
  
  // For multiple destinations, we'll use a greedy approach
  // (not optimal for TSP but good enough for demonstration)
  let currentPosition = startId;
  let remainingDestinations = [...destinations];
  let totalRoute: Route = { path: [startId], totalDistance: 0, totalTime: 0 };
  
  // Keep finding the nearest unvisited destination
  while (remainingDestinations.length > 0) {
    let nearestDestination: string | null = null;
    let shortestRoute: Route | null = null;
    
    // Find the nearest unvisited destination
    for (const destination of remainingDestinations) {
      const route = findShortestPath(graph, currentPosition, destination);
      
      if (!route) continue;
      
      if (!shortestRoute || route.totalDistance < shortestRoute.totalDistance) {
        shortestRoute = route;
        nearestDestination = destination;
      }
    }
    
    // If no reachable destination, break
    if (!shortestRoute || !nearestDestination) break;
    
    // Add this segment to the total route
    // Remove the starting point to avoid duplication
    totalRoute.path = [...totalRoute.path, ...shortestRoute.path.slice(1)];
    totalRoute.totalDistance += shortestRoute.totalDistance;
    totalRoute.totalTime += shortestRoute.totalTime;
    
    // Update current position and remove visited destination
    currentPosition = nearestDestination;
    remainingDestinations = remainingDestinations.filter(d => d !== nearestDestination);
  }
  
  return totalRoute;
}

// Sample graph data
export const sampleGraph: Graph = {
  points: {
    'A': { id: 'A', name: 'Car Park', lat: 40.712776, lng: -74.005974 },
    'B': { id: 'B', name: 'Point B', lat: 40.714541, lng: -74.007089 },
    'C': { id: 'C', name: 'Point C', lat: 40.718617, lng: -74.013392 },
    'D': { id: 'D', name: 'Point D', lat: 40.715120, lng: -74.015610 },
    'E': { id: 'E', name: 'Point E', lat: 40.711614, lng: -74.012262 },
    'V': { id: 'V', name: 'Point V', lat: 40.709749, lng: -74.006168 },
    'Y': { id: 'Y', name: 'Point Y', lat: 40.713051, lng: -74.013735 }
  },
  connections: [
    { from: 'A', to: 'B', distance: 0.5, time: 3 },
    { from: 'A', to: 'E', distance: 0.7, time: 5 },
    { from: 'A', to: 'V', distance: 0.4, time: 2 },
    { from: 'B', to: 'C', distance: 0.8, time: 6 },
    { from: 'B', to: 'Y', distance: 1.1, time: 8 },
    { from: 'C', to: 'D', distance: 0.6, time: 4 },
    { from: 'C', to: 'Y', distance: 0.9, time: 7 },
    { from: 'D', to: 'E', distance: 1.2, time: 10 },
    { from: 'E', to: 'V', distance: 0.6, time: 4 },
    { from: 'E', to: 'Y', distance: 0.5, time: 3 },
    { from: 'V', to: 'Y', distance: 0.9, time: 7 }
  ]
};
