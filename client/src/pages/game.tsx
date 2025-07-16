import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CARD_TYPES } from "@shared/schema";

interface GameProps {
  code: string;
}

export default function Game({ code }: GameProps) {
  const [, setLocation] = useLocation();
  const [showMatchModal, setShowMatchModal] = useState(false);
  const { toast } = useToast();
  const playerId = localStorage.getItem("playerId");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/rooms", code],
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (data?.room?.status === "finished") {
      setLocation(`/room/${code}/win`);
    }
  }, [data?.room?.status, code, setLocation]);

  const currentPlayer = data?.players?.find((p: any) => p.id === parseInt(playerId || "0"));
  
  if (!currentPlayer || !currentPlayer.cards) {
    return <div>Loading...</div>;
  }

  const currentCardType = currentPlayer.cards[currentPlayer.currentCardIndex];
  const currentCard = CARD_TYPES.find(card => card.id === currentCardType);
  
  const cardsRemaining = 25 - currentPlayer.cardsCompleted;
  const progress = (currentPlayer.cardsCompleted / 25) * 100;

  const handleSwipeLeft = async () => {
    try {
      await apiRequest("POST", `/api/rooms/${code}/action`, {
        playerId: parseInt(playerId || "0"),
        action: "swipe_left",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive",
      });
    }
  };

  const handleSwipeRight = () => {
    setShowMatchModal(true);
  };

  const handleConfirmMatch = async () => {
    try {
      await apiRequest("POST", `/api/rooms/${code}/action`, {
        playerId: parseInt(playerId || "0"),
        action: "swipe_right",
      });
      setShowMatchModal(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process match",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen bg-background shadow-lg flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-background shadow-lg">
      {/* Game Status Bar */}
      <div className="bg-card shadow-sm p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="text-muted-foreground">Cards left:</span>
            <span className="font-bold text-primary ml-1">{cardsRemaining}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Players:</span>
            <span className="font-bold text-secondary ml-1">{data?.players?.length || 0}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Main Game Area */}
      <div className="p-6 flex flex-col justify-center min-h-[calc(100vh-120px)]">
        {/* Current Card Display */}
        <div className="mb-8">
          <div className="bg-card rounded-3xl shadow-xl p-8 text-center border-4 border-primary transform hover:scale-105 transition-transform">
            {/* Card Icon/Emoji */}
            <div className="text-8xl mb-4">{currentCard?.emoji}</div>
            
            {/* Card Name */}
            <h2 className="text-2xl font-bold text-card-foreground mb-3">{currentCard?.name}</h2>
            
            {/* Card Description */}
            <p className="text-muted-foreground text-lg">{currentCard?.description}</p>
          </div>
        </div>
        
        {/* Action Instructions */}
        <div className="bg-card rounded-2xl p-4 mb-8 border border-border">
          <div className="text-center">
            <p className="text-accent font-semibold text-lg">🗣️ Yell out your card!</p>
            <p className="text-muted-foreground text-sm mt-1">Find someone with the same card to match</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={handleSwipeLeft}
            className="flex-1 bg-error text-destructive-foreground rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg active:scale-95 transition-transform"
          >
            <i className="fas fa-times mr-2"></i>
            No Match
          </Button>
          
          <Button
            onClick={handleSwipeRight}
            className="flex-1 bg-secondary text-secondary-foreground rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg active:scale-95 transition-transform"
          >
            <i className="fas fa-check mr-2"></i>
            Found Match!
          </Button>
        </div>
      </div>

      {/* Match Confirmation Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-3xl p-6 text-center max-w-sm w-full border border-border">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-card-foreground mb-2">Match Found!</h3>
            <p className="text-muted-foreground mb-6">Did you both complete the action?</p>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowMatchModal(false)}
                variant="outline"
                className="flex-1 bg-muted text-muted-foreground rounded-xl py-3 px-4 font-semibold border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmMatch}
                className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-3 px-4 font-semibold"
              >
                Yes, Done!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
