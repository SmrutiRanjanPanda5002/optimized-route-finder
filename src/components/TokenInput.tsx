
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface TokenInputProps {
  onTokenSubmit: (token: string) => void;
}

const TokenInput: React.FC<TokenInputProps> = ({ onTokenSubmit }) => {
  const [token, setToken] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter a valid Mapbox token.",
        variant: "destructive"
      });
      return;
    }
    
    onTokenSubmit(token.trim());
    toast({
      title: "Token Added",
      description: "Your Mapbox token has been set successfully.",
    });
    
    // Save to localStorage for convenience
    localStorage.setItem('mapbox-token', token.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border p-4 animate-fade-in">
      <h2 className="text-lg font-semibold mb-3">Enter Mapbox Token</h2>
      <p className="text-sm text-muted-foreground mb-4">
        To display the map, please enter your Mapbox public token. You can get one by signing up at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            type={isVisible ? "text" : "password"}
            placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="pr-24"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? "Hide" : "Show"}
          </Button>
        </div>
        <Button type="submit" className="w-full">
          Set Token
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground mt-3">
        Your token will be stored locally in your browser and is only used to display the map.
      </p>
    </div>
  );
};

export default TokenInput;
