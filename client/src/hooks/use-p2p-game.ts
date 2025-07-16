import { useState, useEffect, useCallback } from 'react';
import { p2pManager, type P2PGameState, type P2PPlayer } from '@/lib/p2p';

export function useP2PGame() {
  const [gameState, setGameState] = useState<P2PGameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Set up state change listener
    p2pManager.onGameStateChange((state) => {
      setGameState(state);
      setIsConnected(true);
      setConnectionError(null);
    });

    // Cleanup on unmount
    return () => {
      p2pManager.disconnect();
    };
  }, []);

  const createRoom = useCallback(async (hostName: string) => {
    try {
      setConnectionError(null);
      const roomCode = await p2pManager.createRoom(hostName);
      setIsConnected(true);
      return { success: true, roomCode };
    } catch (error) {
      const errorMessage = 'Failed to create room';
      setConnectionError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    try {
      setConnectionError(null);
      const success = await p2pManager.joinRoom(roomCode, playerName);
      if (success) {
        setIsConnected(true);
        return { success: true };
      } else {
        const errorMessage = 'Failed to join room';
        setConnectionError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Failed to join room';
      setConnectionError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const startGame = useCallback(() => {
    try {
      setConnectionError(null);
      return p2pManager.startGame();
    } catch (error) {
      setConnectionError('Failed to start game');
      return false;
    }
  }, []);

  const updateProgress = useCallback((cardIndex: number) => {
    try {
      setConnectionError(null);
      return p2pManager.updateProgress(cardIndex);
    } catch (error) {
      setConnectionError('Failed to update progress');
      return false;
    }
  }, []);

  const getCurrentPlayer = useCallback((): P2PPlayer | null => {
    return p2pManager.getCurrentPlayer();
  }, []);

  const disconnect = useCallback(() => {
    p2pManager.disconnect();
    setGameState(null);
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  return {
    gameState,
    isConnected,
    connectionError,
    createRoom,
    joinRoom,
    startGame,
    updateProgress,
    getCurrentPlayer,
    disconnect
  };
}