import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function JoinRoom() {
  const [, setLocation] = useLocation();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleJoin = async () => {
    if (!roomCode.trim() || !playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both room code and your name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", `/api/rooms/${roomCode.toUpperCase()}/join`, {
        playerName: playerName.trim(),
      });
      
      const data = await response.json();
      
      // Store player info in localStorage
      localStorage.setItem("playerId", data.player.id.toString());
      localStorage.setItem("playerName", data.player.name);
      
      setLocation(`/room/${roomCode.toUpperCase()}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-background shadow-lg">
      <div className="p-6 min-h-screen flex flex-col justify-center">
        <div className="mb-8">
          <button onClick={() => setLocation("/")} className="text-primary mb-4">
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
          <h2 className="text-3xl font-bold text-foreground mb-2">Join Room</h2>
          <p className="text-muted-foreground">Enter the room code from your friend</p>
        </div>
        
        <div className="mb-8">
          <Label className="block text-sm font-medium text-foreground mb-2">Room Code</Label>
          <Input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="w-full text-center text-2xl font-bold tracking-widest bg-input border-2 border-border rounded-2xl py-4 px-6 text-card-foreground focus:border-primary focus:outline-none uppercase"
            maxLength={6}
          />
        </div>
        
        <div className="mb-8">
          <Label className="block text-sm font-medium text-foreground mb-2">Your Name</Label>
          <Input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-input border-2 border-border rounded-2xl py-4 px-6 text-lg text-card-foreground focus:border-primary focus:outline-none"
          />
        </div>
        
        <Button
          onClick={handleJoin}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg active:scale-95 transition-transform"
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin mr-2"></i>
          ) : (
            <i className="fas fa-sign-in-alt mr-2"></i>
          )}
          {isLoading ? "Joining..." : "Join Game"}
        </Button>
      </div>
    </div>
  );
}
