import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface WinProps {
  code: string;
}

export default function Win({ code }: WinProps) {
  const [, setLocation] = useLocation();
  const playerId = localStorage.getItem("playerId");

  const { data } = useQuery({
    queryKey: ["/api/rooms", code],
  });

  const currentPlayer = data?.players?.find((p: any) => p.id === parseInt(playerId || "0"));
  const winner = data?.players?.find((p: any) => p.id === data?.gameState?.winnerId);
  const isWinner = currentPlayer?.id === winner?.id;

  const sortedPlayers = data?.players?.sort((a: any, b: any) => b.cardsCompleted - a.cardsCompleted) || [];

  const handlePlayAgain = () => {
    setLocation(`/room/${code}`);
  };

  const handleBackToHome = () => {
    localStorage.removeItem("playerId");
    localStorage.removeItem("playerName");
    setLocation("/");
  };

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-white shadow-lg">
      <div className="p-6 min-h-screen flex flex-col justify-center text-center">
        <div className="mb-8">
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isWinner ? "You Won!" : `${winner?.name} Won!`}
          </h1>
          <p className="text-gray-600 text-lg">
            {isWinner 
              ? "Congratulations! You completed all your cards first!"
              : "Better luck next time!"
            }
          </p>
        </div>
        
        {/* Winner Stats */}
        <div className="bg-gradient-to-r from-accent/20 to-secondary/20 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Final Results</h3>
          
          <div className="space-y-3">
            {sortedPlayers.map((player: any, index: number) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${index === 0 ? 'bg-accent' : 'bg-gray-400'} rounded-full flex items-center justify-center text-white font-bold text-sm mr-3`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {player.id === parseInt(playerId || "0") ? "You" : player.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{player.cardsCompleted}/25 cards</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={handlePlayAgain}
            className="w-full bg-primary text-white rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg active:scale-95 transition-transform"
          >
            <i className="fas fa-redo mr-2"></i>
            Play Again
          </Button>
          
          <Button
            onClick={handleBackToHome}
            variant="outline"
            className="w-full bg-white border-2 border-gray-200 text-gray-700 rounded-2xl py-4 px-6 text-lg font-semibold active:scale-95 transition-transform"
          >
            <i className="fas fa-home mr-2"></i>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
