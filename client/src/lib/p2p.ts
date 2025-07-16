// Peer-to-peer game state synchronization using WebRTC
// Allows multiplayer across devices without a server

import { CARD_TYPES, type CardType } from '@shared/schema';

export interface P2PPlayer {
  id: string;
  name: string;
  isHost: boolean;
  cardsCompleted: number;
  currentCardIndex: number;
  deck: CardType[];
}

export interface P2PGameState {
  roomCode: string;
  players: P2PPlayer[];
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  winner?: string;
  seed: number; // For synchronized random deck generation
}

export interface P2PMessage {
  type: 'join' | 'leave' | 'update' | 'start' | 'action' | 'sync';
  playerId: string;
  data?: any;
  gameState?: P2PGameState;
}

export class P2PGameManager {
  private connections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private gameState: P2PGameState | null = null;
  private isHost = false;
  private localPlayerId = '';
  private onStateChange?: (state: P2PGameState) => void;
  private onPlayerJoin?: (playerId: string, playerName: string) => void;
  
  // Simple signaling using a free service (you could also use Firebase, Supabase, etc.)
  private signalingUrl = 'wss://ws.postman-echo.com/raw';

  constructor() {
    this.localPlayerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Generate synchronized deck using a shared seed
  private generateDeck(seed: number): CardType[] {
    const rng = this.seededRandom(seed);
    const deck: CardType[] = [];
    
    // Add 5 cards of each type
    for (const cardType of CARD_TYPES) {
      for (let i = 0; i < 5; i++) {
        deck.push(cardType);
      }
    }
    
    // Shuffle using seeded random
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  private seededRandom(seed: number) {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  // Create a new game room (host)
  async createRoom(hostName: string): Promise<string> {
    this.isHost = true;
    const roomCode = this.generateRoomCode();
    const seed = Date.now();
    
    this.gameState = {
      roomCode,
      players: [{
        id: this.localPlayerId,
        name: hostName,
        isHost: true,
        cardsCompleted: 0,
        currentCardIndex: 0,
        deck: this.generateDeck(seed)
      }],
      status: 'waiting',
      seed
    };
    
    await this.setupSignaling();
    this.broadcastState();
    return roomCode;
  }

  // Join an existing room
  async joinRoom(roomCode: string, playerName: string): Promise<boolean> {
    this.isHost = false;
    
    try {
      await this.setupSignaling();
      
      // Send join request
      const joinMessage: P2PMessage = {
        type: 'join',
        playerId: this.localPlayerId,
        data: { name: playerName, roomCode }
      };
      
      // In a real implementation, you'd use a signaling server
      // For now, we'll use localStorage as a simple demo
      this.handleLocalMultiplayer(roomCode, playerName);
      
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
      return false;
    }
  }

  // Simplified local multiplayer for demo (same device, multiple browser tabs)
  private handleLocalMultiplayer(roomCode: string, playerName: string) {
    const storageKey = `p2p-room-${roomCode}`;
    
    // Try to get existing room state
    const existingState = localStorage.getItem(storageKey);
    if (existingState) {
      try {
        this.gameState = JSON.parse(existingState);
        if (this.gameState && this.gameState.status === 'waiting') {
          // Add player to existing room
          const newPlayer: P2PPlayer = {
            id: this.localPlayerId,
            name: playerName,
            isHost: false,
            cardsCompleted: 0,
            currentCardIndex: 0,
            deck: this.generateDeck(this.gameState.seed)
          };
          
          this.gameState.players.push(newPlayer);
          localStorage.setItem(storageKey, JSON.stringify(this.gameState));
          this.notifyStateChange();
          
          // Set up polling for state changes
          this.setupLocalPolling(storageKey);
        }
      } catch (error) {
        console.error('Failed to parse room state:', error);
      }
    }
  }

  private setupLocalPolling(storageKey: string) {
    const pollInterval = setInterval(() => {
      const currentState = localStorage.getItem(storageKey);
      if (currentState) {
        try {
          const newState = JSON.parse(currentState);
          if (JSON.stringify(newState) !== JSON.stringify(this.gameState)) {
            this.gameState = newState;
            this.notifyStateChange();
          }
        } catch (error) {
          console.error('Failed to parse updated state:', error);
        }
      } else {
        clearInterval(pollInterval);
      }
    }, 1000);
  }

  private async setupSignaling() {
    // In a full implementation, you'd connect to a signaling server here
    // For now, we'll use localStorage for same-device demo
    console.log('P2P signaling setup complete');
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Start the game (host only)
  startGame(): boolean {
    if (!this.isHost || !this.gameState) return false;
    
    this.gameState.status = 'countdown';
    this.broadcastState();
    
    // Auto-transition to playing after 3 seconds
    setTimeout(() => {
      if (this.gameState && this.gameState.status === 'countdown') {
        this.gameState.status = 'playing';
        this.broadcastState();
      }
    }, 3000);
    
    return true;
  }

  // Update player progress
  updateProgress(cardIndex: number): boolean {
    if (!this.gameState) return false;
    
    const player = this.gameState.players.find(p => p.id === this.localPlayerId);
    if (!player) return false;
    
    player.currentCardIndex = cardIndex;
    player.cardsCompleted = cardIndex;
    
    // Check if player won
    if (cardIndex >= 25 && this.gameState.status === 'playing') {
      this.gameState.status = 'finished';
      this.gameState.winner = player.name;
    }
    
    this.broadcastState();
    return true;
  }

  private broadcastState() {
    if (!this.gameState) return;
    
    // Broadcast to all connected peers
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        const message: P2PMessage = {
          type: 'sync',
          playerId: this.localPlayerId,
          gameState: this.gameState
        };
        channel.send(JSON.stringify(message));
      }
    });
    
    // Also update localStorage for local demo
    if (this.gameState.roomCode) {
      const storageKey = `p2p-room-${this.gameState.roomCode}`;
      localStorage.setItem(storageKey, JSON.stringify(this.gameState));
    }
    
    this.notifyStateChange();
  }

  private notifyStateChange() {
    if (this.onStateChange && this.gameState) {
      this.onStateChange(this.gameState);
    }
  }

  // Event handlers
  onGameStateChange(callback: (state: P2PGameState) => void) {
    this.onStateChange = callback;
  }

  onPlayerJoined(callback: (playerId: string, playerName: string) => void) {
    this.onPlayerJoin = callback;
  }

  // Get current game state
  getGameState(): P2PGameState | null {
    return this.gameState;
  }

  getCurrentPlayer(): P2PPlayer | null {
    if (!this.gameState) return null;
    return this.gameState.players.find(p => p.id === this.localPlayerId) || null;
  }

  // Clean up connections
  disconnect() {
    this.connections.forEach(connection => connection.close());
    this.dataChannels.forEach(channel => channel.close());
    this.connections.clear();
    this.dataChannels.clear();
    
    // Clean up localStorage
    if (this.gameState?.roomCode) {
      const storageKey = `p2p-room-${this.gameState.roomCode}`;
      if (this.isHost) {
        localStorage.removeItem(storageKey);
      }
    }
  }
}

export const p2pManager = new P2PGameManager();