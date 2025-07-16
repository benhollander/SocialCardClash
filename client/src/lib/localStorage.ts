// Simple localStorage-based game state for GitHub Pages deployment
// This allows local multiplayer on a single device

interface GameRoom {
  code: string;
  host: string;
  players: Array<{
    id: string;
    name: string;
    isHost: boolean;
    cardsCompleted: number;
    currentCardIndex: number;
  }>;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  createdAt: number;
}

interface GameState {
  rooms: Record<string, GameRoom>;
  currentPlayer?: {
    id: string;
    name: string;
    roomCode: string;
  };
}

const STORAGE_KEY = 'party-cards-game';
const ROOM_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export class LocalGameStorage {
  private getGameState(): GameState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { rooms: {} };
      
      const state: GameState = JSON.parse(stored);
      // Clean up expired rooms
      const now = Date.now();
      Object.keys(state.rooms).forEach(code => {
        if (now - state.rooms[code].createdAt > ROOM_EXPIRY) {
          delete state.rooms[code];
        }
      });
      
      return state;
    } catch {
      return { rooms: {} };
    }
  }

  private saveGameState(state: GameState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save game state:', error);
    }
  }

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(hostName: string): { code: string; playerId: string } {
    const state = this.getGameState();
    const code = this.generateRoomCode();
    const playerId = Date.now().toString();
    
    state.rooms[code] = {
      code,
      host: hostName,
      players: [{
        id: playerId,
        name: hostName,
        isHost: true,
        cardsCompleted: 0,
        currentCardIndex: 0
      }],
      status: 'waiting',
      createdAt: Date.now()
    };
    
    state.currentPlayer = {
      id: playerId,
      name: hostName,
      roomCode: code
    };
    
    this.saveGameState(state);
    return { code, playerId };
  }

  joinRoom(code: string, playerName: string): { success: boolean; playerId?: string; error?: string } {
    const state = this.getGameState();
    const room = state.rooms[code];
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }
    
    if (room.status !== 'waiting') {
      return { success: false, error: 'Game already started' };
    }
    
    if (room.players.length >= 8) {
      return { success: false, error: 'Room is full' };
    }
    
    const playerId = Date.now().toString();
    room.players.push({
      id: playerId,
      name: playerName,
      isHost: false,
      cardsCompleted: 0,
      currentCardIndex: 0
    });
    
    state.currentPlayer = {
      id: playerId,
      name: playerName,
      roomCode: code
    };
    
    this.saveGameState(state);
    return { success: true, playerId };
  }

  getRoom(code: string): GameRoom | null {
    const state = this.getGameState();
    return state.rooms[code] || null;
  }

  getCurrentPlayer(): { id: string; name: string; roomCode: string } | null {
    const state = this.getGameState();
    return state.currentPlayer || null;
  }

  startGame(code: string, playerId: string): boolean {
    const state = this.getGameState();
    const room = state.rooms[code];
    
    if (!room) return false;
    
    const player = room.players.find(p => p.id === playerId);
    if (!player?.isHost) return false;
    
    room.status = 'countdown';
    this.saveGameState(state);
    
    // Auto-transition to playing after 3 seconds
    setTimeout(() => {
      const currentState = this.getGameState();
      if (currentState.rooms[code]?.status === 'countdown') {
        currentState.rooms[code].status = 'playing';
        this.saveGameState(currentState);
      }
    }, 3000);
    
    return true;
  }

  updatePlayerProgress(code: string, playerId: string, cardIndex: number): boolean {
    const state = this.getGameState();
    const room = state.rooms[code];
    
    if (!room) return false;
    
    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;
    
    player.currentCardIndex = cardIndex;
    player.cardsCompleted = cardIndex;
    
    // Check if player won (completed all 25 cards)
    if (cardIndex >= 25 && room.status === 'playing') {
      room.status = 'finished';
    }
    
    this.saveGameState(state);
    return true;
  }

  leaveRoom(code: string, playerId: string): void {
    const state = this.getGameState();
    const room = state.rooms[code];
    
    if (!room) return;
    
    room.players = room.players.filter(p => p.id !== playerId);
    
    // Remove room if empty
    if (room.players.length === 0) {
      delete state.rooms[code];
    }
    
    // Clear current player if they're leaving
    if (state.currentPlayer?.id === playerId) {
      delete state.currentPlayer;
    }
    
    this.saveGameState(state);
  }

  clearCurrentPlayer(): void {
    const state = this.getGameState();
    delete state.currentPlayer;
    this.saveGameState(state);
  }
}

export const gameStorage = new LocalGameStorage();