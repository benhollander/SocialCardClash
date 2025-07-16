import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const [hostName, setHostName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!hostName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/rooms", {
        hostName: hostName.trim(),
      });
      
      const data = await response.json();
      
      // Store player info in localStorage
      localStorage.setItem("playerId", data.player.id.toString());
      localStorage.setItem("playerName", data.player.name);
      
      setLocation(`/room/${data.room.code}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create room",
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Create Room</h2>
          <p className="text-muted-foreground">Set up a new game room</p>
        </div>
        
        <div className="mb-8">
          <Label className="block text-sm font-medium text-foreground mb-2">Your Name</Label>
          <Input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-input border-2 border-border rounded-2xl py-4 px-6 text-lg text-card-foreground focus:border-primary focus:outline-none"
          />
        </div>
        
        <Button
          onClick={handleCreate}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg active:scale-95 transition-transform"
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin mr-2"></i>
          ) : (
            <i className="fas fa-plus mr-2"></i>
          )}
          {isLoading ? "Creating..." : "Create Game"}
        </Button>
      </div>
    </div>
  );
}
