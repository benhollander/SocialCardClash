// Firebase Realtime Database for serverless multiplayer
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, off, remove, serverTimestamp } from 'firebase/database';
import { CARD_TYPES, type CardType } from '@shared/schema';

export interface FirebasePlayer {
  id: string;
  name: string;
  isHost: boolean;
  cardsCompleted: number;
  currentCardIndex: number;
  lastSeen: number;
  connected: boolean;
}

export interface FirebaseGameState {
  roomCode: string;
  host: string;
  players: Record<string, FirebasePlayer>;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  winner?: string;
  seed: number;
  createdAt: number;
  lastActivity: number;
}

export class FirebaseGameManager {
  private app: any = null;
  private database: any = null;
  private roomRef: any = null;
  private playerId = '';
  private isInitialized = false;
  private onStateChange?: (state: FirebaseGameState) => void;
  private onError?: (error: string) => void;
  private heartbeatInterval?: number;

  constructor() {
    this.playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Initialize Firebase with user's config
  initialize(config: any): boolean {
    try {
      this.app = initializeApp(config);
      this.database = getDatabase(this.app);
      this.isInitialized = true;
      this.startHeartbeat();
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      this.notifyError('Failed to connect to Firebase. Please check your configuration.');
      return false;
    }
  }

  private startHeartbeat() {
    // Update player's lastSeen every 5 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.roomRef && this.isInitialized) {
        const playerRef = ref(this.database, `${this.roomRef.key}/players/${this.playerId}/lastSeen`);
        set(playerRef, Date.now()).catch(() => {
          // Ignore heartbeat errors
        });
      }
    }, 5000);
  }

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

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createRoom(hostName: string): Promise<{ success: boolean; roomCode?: string; error?: string }> {
    if (!this.isInitialized) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const roomCode = this.generateRoomCode();
      const seed = Date.now();
      
      // Create room in Firebase
      this.roomRef = push(ref(this.database, 'rooms'));
      
      const gameState: FirebaseGameState = {
        roomCode,
        host: hostName,
        players: {
          [this.playerId]: {
            id: this.playerId,
            name: hostName,
            isHost: true,
            cardsCompleted: 0,
            currentCardIndex: 0,
            lastSeen: Date.now(),
            connected: true
          }
        },
        status: 'waiting',
        seed,
        createdAt: Date.now(),
        lastActivity: Date.now()
      };

      await set(this.roomRef, gameState);
      this.setupRoomListener();
      
      return { success: true, roomCode };
    } catch (error) {
      console.error('Failed to create room:', error);
      return { success: false, error: 'Failed to create room. Please try again.' };
    }
  }

  async joinRoom(roomCode: string, playerName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      // Find room by code
      const roomsRef = ref(this.database, 'rooms');
      
      return new Promise((resolve) => {
        onValue(roomsRef, (snapshot) => {
          const rooms = snapshot.val();
          let foundRoom = null;
          let foundRoomKey = null;
          
          if (rooms) {
            for (const [key, room] of Object.entries(rooms)) {
              if ((room as any).roomCode === roomCode) {
                foundRoom = room;
                foundRoomKey = key;
                break;
              }
            }
          }
          
          if (!foundRoom) {
            resolve({ success: false, error: 'Room not found' });
            return;
          }

          const gameState = foundRoom as FirebaseGameState;
          
          if (gameState.status !== 'waiting') {
            resolve({ success: false, error: 'Game already started' });
            return;
          }

          if (Object.keys(gameState.players).length >= 8) {
            resolve({ success: false, error: 'Room is full' });
            return;
          }

          // Add player to room
          this.roomRef = ref(this.database, `rooms/${foundRoomKey}`);
          const playerRef = ref(this.database, `rooms/${foundRoomKey}/players/${this.playerId}`);
          
          const newPlayer: FirebasePlayer = {
            id: this.playerId,
            name: playerName,
            isHost: false,
            cardsCompleted: 0,
            currentCardIndex: 0,
            lastSeen: Date.now(),
            connected: true
          };

          set(playerRef, newPlayer).then(() => {
            this.setupRoomListener();
            resolve({ success: true });
          }).catch(() => {
            resolve({ success: false, error: 'Failed to join room' });
          });
          
          // Stop listening after first attempt
          off(roomsRef);
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      return { success: false, error: 'Failed to join room. Please try again.' };
    }
  }

  private setupRoomListener() {
    if (!this.roomRef) return;
    
    onValue(this.roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data && this.onStateChange) {
        // Clean up disconnected players (haven't been seen for 30 seconds)
        const now = Date.now();
        const cleanedPlayers: Record<string, FirebasePlayer> = {};
        
        for (const [playerId, player] of Object.entries(data.players)) {
          const playerData = player as FirebasePlayer;
          if (now - playerData.lastSeen < 30000) { // 30 seconds
            cleanedPlayers[playerId] = {
              ...playerData,
              connected: now - playerData.lastSeen < 10000 // 10 seconds for "connected" status
            };
          }
        }
        
        const gameState: FirebaseGameState = {
          ...data,
          players: cleanedPlayers
        };
        
        this.onStateChange(gameState);
      }
    });
  }

  async startGame(): Promise<boolean> {
    if (!this.roomRef || !this.isInitialized) return false;

    try {
      await set(ref(this.database, `${this.roomRef.key}/status`), 'countdown');
      await set(ref(this.database, `${this.roomRef.key}/lastActivity`), Date.now());
      
      // Auto-transition to playing after 3 seconds
      setTimeout(async () => {
        try {
          await set(ref(this.database, `${this.roomRef.key}/status`), 'playing');
        } catch (error) {
          console.error('Failed to start game:', error);
        }
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Failed to start game:', error);
      return false;
    }
  }

  async updateProgress(cardIndex: number): Promise<boolean> {
    if (!this.roomRef || !this.isInitialized) return false;

    try {
      const playerRef = ref(this.database, `${this.roomRef.key}/players/${this.playerId}`);
      await set(playerRef, {
        id: this.playerId,
        cardsCompleted: cardIndex,
        currentCardIndex: cardIndex,
        lastSeen: Date.now(),
        connected: true
      });

      // Check if player won (completed all 25 cards)
      if (cardIndex >= 25) {
        await set(ref(this.database, `${this.roomRef.key}/status`), 'finished');
        await set(ref(this.database, `${this.roomRef.key}/winner`), this.playerId);
      }

      await set(ref(this.database, `${this.roomRef.key}/lastActivity`), Date.now());
      return true;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return false;
    }
  }

  getDeck(seed: number): CardType[] {
    return this.generateDeck(seed);
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.roomRef) {
      // Mark player as disconnected
      const playerRef = ref(this.database, `${this.roomRef.key}/players/${this.playerId}/connected`);
      set(playerRef, false).catch(() => {
        // Ignore errors during disconnect
      });
      
      off(this.roomRef);
      this.roomRef = null;
    }
  }

  private notifyError(error: string) {
    if (this.onError) {
      this.onError(error);
    }
  }

  onGameStateChange(callback: (state: FirebaseGameState) => void) {
    this.onStateChange = callback;
  }

  onErrorOccurred(callback: (error: string) => void) {
    this.onError = callback;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getPlayerId(): string {
    return this.playerId;
  }
}

export const firebaseManager = new FirebaseGameManager();