import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoomSchema, insertPlayerSchema, CARD_TYPES } from "@shared/schema";
import { z } from "zod";

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create room
  app.post("/api/rooms", async (req, res) => {
    try {
      const { hostName } = req.body;
      if (!hostName) {
        return res.status(400).json({ error: "Host name is required" });
      }

      const code = generateRoomCode();
      const socketId = Math.random().toString(36).substring(7);

      const room = await storage.createRoom({
        code,
        hostId: socketId,
        status: 'waiting'
      });

      const player = await storage.createPlayer({
        roomId: room.id,
        name: hostName,
        socketId,
        isHost: true
      });

      await storage.createGameState({
        roomId: room.id,
        countdownStarted: false,
        allPlayersSwipedLeft: false
      });

      res.json({ room, player });
    } catch (error) {
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Join room
  app.post("/api/rooms/:code/join", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerName } = req.body;

      if (!playerName) {
        return res.status(400).json({ error: "Player name is required" });
      }

      const room = await storage.getRoomByCode(code.toUpperCase());
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (room.status !== 'waiting') {
        return res.status(400).json({ error: "Game already in progress" });
      }

      const existingPlayers = await storage.getPlayersByRoomId(room.id);
      if (existingPlayers.length >= 8) {
        return res.status(400).json({ error: "Room is full" });
      }

      const socketId = Math.random().toString(36).substring(7);
      const player = await storage.createPlayer({
        roomId: room.id,
        name: playerName,
        socketId,
        isHost: false
      });

      res.json({ room, player });
    } catch (error) {
      res.status(500).json({ error: "Failed to join room" });
    }
  });

  // Get room status
  app.get("/api/rooms/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const room = await storage.getRoomByCode(code.toUpperCase());
      
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const players = await storage.getPlayersByRoomId(room.id);
      const gameState = await storage.getGameStateByRoomId(room.id);

      res.json({ room, players, gameState });
    } catch (error) {
      res.status(500).json({ error: "Failed to get room status" });
    }
  });

  // Start game
  app.post("/api/rooms/:code/start", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId } = req.body;

      const room = await storage.getRoomByCode(code.toUpperCase());
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const player = await storage.getPlayerById(playerId);
      if (!player || !player.isHost) {
        return res.status(403).json({ error: "Only host can start the game" });
      }

      await storage.updateRoomStatus(room.id, 'countdown');
      const countdownEnd = new Date(Date.now() + 3000);
      
      await storage.updateGameState(room.id, {
        countdownStarted: true,
        countdownEnd
      });

      // After countdown, start the game
      setTimeout(async () => {
        await storage.updateRoomStatus(room.id, 'playing');
      }, 3000);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to start game" });
    }
  });

  // Player action (swipe)
  app.post("/api/rooms/:code/action", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId, action } = req.body; // action: 'swipe_left' | 'swipe_right'

      const room = await storage.getRoomByCode(code.toUpperCase());
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const player = await storage.getPlayerById(playerId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      if (action === 'swipe_right') {
        // Player found a match, advance to next card
        const newCardIndex = player.currentCardIndex + 1;
        const cardsCompleted = player.cardsCompleted + 1;
        
        await storage.updatePlayer(playerId, {
          currentCardIndex: newCardIndex,
          cardsCompleted
        });

        // Check for winner (completed all 25 cards)
        if (cardsCompleted >= 25) {
          await storage.updateRoomStatus(room.id, 'finished');
          await storage.updateGameState(room.id, {
            winnerId: playerId
          });
        }
      } else if (action === 'swipe_left') {
        // Check if all players swiped left
        const allPlayers = await storage.getPlayersByRoomId(room.id);
        // For simplicity, we'll just advance the card after swipe left
        const newCardIndex = player.currentCardIndex + 1;
        
        await storage.updatePlayer(playerId, {
          currentCardIndex: newCardIndex
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process action" });
    }
  });

  // Leave room
  app.post("/api/rooms/:code/leave", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId } = req.body;

      const room = await storage.getRoomByCode(code.toUpperCase());
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      await storage.removePlayer(playerId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to leave room" });
    }
  });

  // Get card types
  app.get("/api/card-types", async (req, res) => {
    res.json(CARD_TYPES);
  });

  const httpServer = createServer(app);
  return httpServer;
}
