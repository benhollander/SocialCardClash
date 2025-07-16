import { rooms, players, gameState, type Room, type Player, type GameState, type InsertRoom, type InsertPlayer, type InsertGameState, CARD_TYPES } from "@shared/schema";

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getRoomById(id: number): Promise<Room | undefined>;
  updateRoomStatus(roomId: number, status: string): Promise<Room | undefined>;
  
  // Player operations
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByRoomId(roomId: number): Promise<Player[]>;
  getPlayerById(id: number): Promise<Player | undefined>;
  updatePlayer(playerId: number, updates: Partial<Player>): Promise<Player | undefined>;
  removePlayer(playerId: number): Promise<void>;
  
  // Game state operations
  createGameState(gameState: InsertGameState): Promise<GameState>;
  getGameStateByRoomId(roomId: number): Promise<GameState | undefined>;
  updateGameState(roomId: number, updates: Partial<GameState>): Promise<GameState | undefined>;
}

export class MemStorage implements IStorage {
  private rooms: Map<number, Room>;
  private players: Map<number, Player>;
  private gameStates: Map<number, GameState>;
  private currentRoomId: number;
  private currentPlayerId: number;
  private currentGameStateId: number;

  constructor() {
    this.rooms = new Map();
    this.players = new Map();
    this.gameStates = new Map();
    this.currentRoomId = 1;
    this.currentPlayerId = 1;
    this.currentGameStateId = 1;
  }

  // Room operations
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const room: Room = { 
      ...insertRoom, 
      id, 
      createdAt: new Date(),
      currentRound: 0
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.code === code);
  }

  async getRoomById(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async updateRoomStatus(roomId: number, status: string): Promise<Room | undefined> {
    const room = this.rooms.get(roomId);
    if (room) {
      const updatedRoom = { ...room, status };
      this.rooms.set(roomId, updatedRoom);
      return updatedRoom;
    }
    return undefined;
  }

  // Player operations
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    
    // Generate shuffled deck of 25 cards (5 of each type)
    const deck: string[] = [];
    CARD_TYPES.forEach(cardType => {
      for (let i = 0; i < 5; i++) {
        deck.push(cardType.id);
      }
    });
    
    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    const player: Player = { 
      id,
      name: insertPlayer.name,
      roomId: insertPlayer.roomId || null,
      socketId: insertPlayer.socketId,
      cards: deck,
      currentCardIndex: 0,
      isReady: false,
      isHost: insertPlayer.isHost || false,
      cardsCompleted: 0
    };
    this.players.set(id, player);
    return player;
  }

  async getPlayersByRoomId(roomId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.roomId === roomId);
  }

  async getPlayerById(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async updatePlayer(playerId: number, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(playerId);
    if (player) {
      const updatedPlayer = { ...player, ...updates };
      this.players.set(playerId, updatedPlayer);
      return updatedPlayer;
    }
    return undefined;
  }

  async removePlayer(playerId: number): Promise<void> {
    this.players.delete(playerId);
  }

  // Game state operations
  async createGameState(insertGameState: InsertGameState): Promise<GameState> {
    const id = this.currentGameStateId++;
    const gameState: GameState = { 
      id,
      roomId: insertGameState.roomId || null,
      countdownStarted: insertGameState.countdownStarted || false,
      countdownEnd: insertGameState.countdownEnd || null,
      allPlayersSwipedLeft: insertGameState.allPlayersSwipedLeft || false,
      winnerId: insertGameState.winnerId || null
    };
    this.gameStates.set(id, gameState);
    return gameState;
  }

  async getGameStateByRoomId(roomId: number): Promise<GameState | undefined> {
    return Array.from(this.gameStates.values()).find(gs => gs.roomId === roomId);
  }

  async updateGameState(roomId: number, updates: Partial<GameState>): Promise<GameState | undefined> {
    const gameState = Array.from(this.gameStates.values()).find(gs => gs.roomId === roomId);
    if (gameState) {
      const updatedGameState = { ...gameState, ...updates };
      this.gameStates.set(gameState.id, updatedGameState);
      return updatedGameState;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
