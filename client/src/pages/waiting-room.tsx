import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WaitingRoomProps {
  code: string;
}

export default function WaitingRoom({ code }: WaitingRoomProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const playerId = localStorage.getItem("playerId");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/rooms", code],
    refetchInterval: 1000, // Poll every second
  });

  useEffect(() => {
    if (data?.room?.status === "countdown") {
      setLocation(`/room/${code}/countdown`);
    } else if (data?.room?.status === "playing") {
      setLocation(`/room/${code}/game`);
    }
  }, [data?.room?.status, code, setLocation]);

  const currentPlayer = data?.players?.find((p: any) => p.id === parseInt(playerId || "0"));
  const isHost = currentPlayer?.isHost;

  const handleStartGame = async () => {
    try {
      await apiRequest("POST", `/api/rooms/${code}/start`, {
        playerId: parseInt(playerId || "0"),
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await apiRequest("POST", `/api/rooms/${code}/leave`, {
        playerId: parseInt(playerId || "0"),
      });
      localStorage.removeItem("playerId");
      localStorage.removeItem("playerName");
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen bg-white shadow-lg flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-white shadow-lg">
      <div className="p-6 min-h-screen">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Waiting Room</h2>
            <button onClick={handleLeaveRoom} className="text-error">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div className="bg-accent/10 rounded-2xl p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Room Code</p>
              <p className="text-3xl font-bold tracking-widest text-accent">{code}</p>
              <p className="text-xs text-gray-500 mt-1">Share this code with your friends</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Players <span className="text-primary">({data?.players?.length || 0}/8)</span>
          </h3>
          
          <div className="space-y-3">
            {data?.players?.map((player: any) => (
              <div key={player.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    <span>{player.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="ml-3 font-medium">{player.name}</span>
                  {player.isHost && <span className="ml-2 text-xs bg-accent text-white px-2 py-1 rounded">HOST</span>}
                </div>
                <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="bg-blue-50 rounded-2xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">How to Play:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Everyone gets the same randomized deck</li>
              <li>• Find someone with a matching card</li>
              <li>• Do the action together and swipe right</li>
              <li>• First to finish all cards wins!</li>
            </ul>
          </div>
          
          {isHost && (
            <Button
              onClick={handleStartGame}
              className="w-full bg-secondary text-white rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg active:scale-95 transition-transform"
            >
              <i className="fas fa-play mr-2"></i>
              Start Game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
