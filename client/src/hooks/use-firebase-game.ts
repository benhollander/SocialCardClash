import { useState, useEffect, useCallback } from 'react';
import { firebaseManager, type FirebaseGameState, type FirebasePlayer } from '@/lib/firebase';

export function useFirebaseGame() {
  const [gameState, setGameState] = useState<FirebaseGameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase with user's config
  const initialize = useCallback((firebaseConfig: any) => {
    const success = firebaseManager.initialize(firebaseConfig);
    setIsInitialized(success);
    if (success) {
      setError(null);
    }
    return success;
  }, []);

  useEffect(() => {
    // Set up state change listener
    firebaseManager.onGameStateChange((state) => {
      setGameState(state);
      setIsConnected(true);
      setError(null);
    });

    // Set up error listener  
    firebaseManager.onErrorOccurred((errorMessage) => {
      setError(errorMessage);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      firebaseManager.disconnect();
    };
  }, []);

  const createRoom = useCallback(async (hostName: string) => {
    if (!isInitialized) {
      return { success: false, error: 'Please configure Firebase first' };
    }
    
    setError(null);
    const result = await firebaseManager.createRoom(hostName);
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  }, [isInitialized]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    if (!isInitialized) {
      return { success: false, error: 'Please configure Firebase first' };
    }
    
    setError(null);
    const result = await firebaseManager.joinRoom(roomCode, playerName);
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  }, [isInitialized]);

  const startGame = useCallback(async () => {
    setError(null);
    const success = await firebaseManager.startGame();
    if (!success) {
      setError('Failed to start game');
    }
    return success;
  }, []);

  const updateProgress = useCallback(async (cardIndex: number) => {
    setError(null);
    const success = await firebaseManager.updateProgress(cardIndex);
    if (!success) {
      setError('Failed to update progress');
    }
    return success;
  }, []);

  const getCurrentPlayer = useCallback((): (FirebasePlayer & { deck: any[] }) | null => {
    if (!gameState) return null;
    
    const playerId = firebaseManager.getPlayerId();
    const player = gameState.players[playerId];
    
    if (!player) return null;
    
    const deck = firebaseManager.getDeck(gameState.seed);
    
    return {
      ...player,
      deck
    };
  }, [gameState]);

  const disconnect = useCallback(() => {
    firebaseManager.disconnect();
    setGameState(null);
    setIsConnected(false);
    setError(null);
  }, []);

  const getPlayersArray = useCallback((): FirebasePlayer[] => {
    if (!gameState) return [];
    return Object.values(gameState.players);
  }, [gameState]);

  return {
    gameState,
    isConnected,
    isInitialized,
    error,
    initialize,
    createRoom,
    joinRoom,
    startGame,
    updateProgress,
    getCurrentPlayer,
    getPlayersArray,
    disconnect
  };
}