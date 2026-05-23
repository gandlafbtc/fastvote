import type { ServerWebSocket } from "bun";

// Types
interface User {
  id: string;
  username?: string;
  connectedAt: number;
}

interface VoteItem {
  id: string;
  name: string;
  suggestedBy: string;
}

interface Participant {
  userId: string;
  username?: string;
}

interface Vote {
  id: string;
  name: string;
  creatorId: string;
  allowSuggestions: boolean;
  creatorParticipates: boolean;
  status: 'lobby' | 'voting' | 'finished';
  items: VoteItem[];
  participants: Participant[];
  votes: Record<string, number>;
  createdAt: number;
  lobbyEndsAt: number;
  votingEndsAt?: number;
  lobbyTime: number; // in seconds
  voteTime: number; // in seconds
}

interface WSData {
  userId: string;
  username?: string;
}

// In-memory storage
const votes = new Map<string, Vote>();
const connections = new Map<string, ServerWebSocket<WSData>>();
const userVotes = new Map<string, string>(); // userId -> voteId

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function broadcastToVote(voteId: string, event: any) {
  const vote = votes.get(voteId);
  if (!vote) return;

  // Send to all participants
  vote.participants.forEach(participant => {
    const ws = connections.get(participant.userId);
    if (ws) {
      ws.send(JSON.stringify(event));
    }
  });

  // Also send to creator if they're not a participant
  const creatorIsParticipant = vote.participants.some(p => p.userId === vote.creatorId);
  if (!creatorIsParticipant) {
    const creatorWs = connections.get(vote.creatorId);
    if (creatorWs) {
      creatorWs.send(JSON.stringify(event));
    }
  }
}

function createVote(userId: string, name: string, allowSuggestions: boolean, creatorParticipates: boolean, lobbyTime: number, voteTime: number): Vote {
  const voteId = generateId();
  const now = Date.now();
  const lobbyTimeMs = lobbyTime * 1000; // convert seconds to milliseconds
  
  const ws = connections.get(userId);
  const vote: Vote = {
    id: voteId,
    name,
    creatorId: userId,
    allowSuggestions,
    creatorParticipates,
    status: 'lobby',
    items: [],
    participants: creatorParticipates ? [{ userId, username: ws?.data.username }] : [],
    votes: {},
    createdAt: now,
    lobbyEndsAt: now + lobbyTimeMs,
    lobbyTime,
    voteTime,
  };

  votes.set(voteId, vote);
  if (creatorParticipates) {
    userVotes.set(userId, voteId);
  }

  // Auto-start after lobby time
  setTimeout(() => {
    const currentVote = votes.get(voteId);
    if (currentVote && currentVote.status === 'lobby') {
      startVote(userId, voteId, true);
    }
  }, lobbyTimeMs);

  return vote;
}

function joinVote(userId: string, voteId: string): Vote | null {
  const vote = votes.get(voteId);
  if (!vote) return null;

  const alreadyJoined = vote.participants.some(p => p.userId === userId);
  if (!alreadyJoined) {
    const ws = connections.get(userId);
    vote.participants.push({ userId, username: ws?.data.username });
    userVotes.set(userId, voteId);
    
    broadcastToVote(voteId, {
      type: 'participant_joined',
      userId,
      username: ws?.data.username,
    });
  }

  return vote;
}

function suggestItem(userId: string, voteId: string, itemName: string): VoteItem | null {
  const vote = votes.get(voteId);
  if (!vote || vote.status !== 'lobby' || !vote.allowSuggestions) return null;
  
  const isParticipant = vote.participants.some(p => p.userId === userId);
  if (!isParticipant) return null;

  // Check if user already suggested an item
  const existingItem = vote.items.find(item => item.suggestedBy === userId);
  if (existingItem) return null;

  const item: VoteItem = {
    id: generateId(),
    name: itemName,
    suggestedBy: userId,
  };

  vote.items.push(item);
  vote.votes[item.id] = 0;

  broadcastToVote(voteId, {
    type: 'item_suggested',
    item,
  });

  return item;
}

function addItem(userId: string, voteId: string, itemName: string): VoteItem | null {
  const vote = votes.get(voteId);
  if (!vote || vote.status !== 'lobby') return null;
  if (vote.creatorId !== userId) return null; // Only creator can add items

  const item: VoteItem = {
    id: generateId(),
    name: itemName,
    suggestedBy: userId,
  };

  vote.items.push(item);
  vote.votes[item.id] = 0;

  broadcastToVote(voteId, {
    type: 'item_added',
    item,
  });

  return item;
}

function startVote(userId: string, voteId: string, autoStart = false): boolean {
  const vote = votes.get(voteId);
  if (!vote || vote.status !== 'lobby') return false;
  
  // Check authorization (unless auto-start)
  if (!autoStart && vote.creatorId !== userId) return false;

  const voteTimeMs = vote.voteTime * 1000; // convert seconds to milliseconds
  vote.status = 'voting';
  vote.votingEndsAt = Date.now() + voteTimeMs;

  broadcastToVote(voteId, {
    type: 'voting_started',
    votingEndsAt: vote.votingEndsAt,
  });

  // Auto-finish after vote time
  setTimeout(() => {
    finishVote(voteId);
  }, voteTimeMs);

  return true;
}

function castVote(userId: string, voteId: string, itemId: string): boolean {
  const vote = votes.get(voteId);
  if (!vote || vote.status !== 'voting') return false;
  
  const isParticipant = vote.participants.some(p => p.userId === userId);
  if (!isParticipant) return false;
  if (!(itemId in vote.votes)) return false;

  vote.votes[itemId] = (vote.votes[itemId] || 0) + 1;

  broadcastToVote(voteId, {
    type: 'vote_cast',
    itemId,
    newCount: vote.votes[itemId],
  });

  return true;
}

function finishVote(voteId: string) {
  const vote = votes.get(voteId);
  if (!vote || vote.status !== 'voting') return;

  vote.status = 'finished';

  const results = vote.items
    .map(item => ({
      itemId: item.id,
      name: item.name,
      count: vote.votes[item.id] || 0,
    }))
    .sort((a, b) => b.count - a.count);

  broadcastToVote(voteId, {
    type: 'voting_finished',
    results,
  });
}

function cleanupOldVotes() {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  for (const [voteId, vote] of votes.entries()) {
    if (now - vote.createdAt > fiveMinutes) {
      // Remove user mappings
      vote.participants.forEach(participant => {
        if (userVotes.get(participant.userId) === voteId) {
          userVotes.delete(participant.userId);
        }
      });
      votes.delete(voteId);
      console.log(`Cleaned up vote: ${voteId}`);
    }
  }
}

// Cleanup service - runs every minute
setInterval(cleanupOldVotes, 60 * 1000);

// WebSocket server
const server = Bun.serve<WSData>({
  port: 3001,
  fetch(req, server) {
    const url = new URL(req.url);
    
    // Upgrade to WebSocket
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req, {
        data: {
          userId: '',
          username: undefined,
        },
      });
      if (upgraded) return undefined;
    }
    
    return new Response("FastVote WebSocket Server", { status: 200 });
  },
  websocket: {
    open(ws) {
      console.log("WebSocket connection opened");
    },
    
    message(ws, message) {
      try {
        const event = JSON.parse(message.toString());
        
        switch (event.type) {
          case 'connect': {
            ws.data.userId = event.userId;
            ws.data.username = event.username;
            connections.set(event.userId, ws);
            console.log(`User connected: ${event.userId} (${event.username || 'Anonymous'})`);
            break;
          }
          
          case 'create_vote': {
            const vote = createVote(
              event.userId, 
              event.name, 
              event.allowSuggestions, 
              event.creatorParticipates,
              event.lobbyTime || 120, // default 2 minutes
              event.voteTime || 10    // default 10 seconds
            );
            ws.send(JSON.stringify({
              type: 'vote_created',
              vote,
            }));
            console.log(`Vote created: ${vote.id} by ${event.userId} (lobby: ${vote.lobbyTime}s, vote: ${vote.voteTime}s)`);
            break;
          }
          
          case 'join_vote': {
            const vote = joinVote(event.userId, event.voteId);
            if (vote) {
              ws.send(JSON.stringify({
                type: 'vote_joined',
                vote,
              }));
              console.log(`User ${event.userId} joined vote ${event.voteId}`);
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Vote not found',
              }));
            }
            break;
          }
          
          case 'suggest_item': {
            const item = suggestItem(event.userId, event.voteId, event.itemName);
            if (!item) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Cannot suggest item',
              }));
            }
            break;
          }
          
          case 'add_item': {
            const item = addItem(event.userId, event.voteId, event.itemName);
            if (!item) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Cannot add item',
              }));
            }
            break;
          }
          
          case 'start_vote': {
            const success = startVote(event.userId, event.voteId);
            if (!success) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Cannot start vote',
              }));
            }
            break;
          }
          
          case 'cast_vote': {
            const success = castVote(event.userId, event.voteId, event.itemId);
            if (!success) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Cannot cast vote',
              }));
            }
            break;
          }
          
          default:
            console.log('Unknown event type:', event.type);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    },
    
    close(ws) {
      if (ws.data.userId) {
        connections.delete(ws.data.userId);
        console.log(`User disconnected: ${ws.data.userId}`);
      }
    },
  },
});

console.log(`🚀 FastVote WebSocket server running on ws://localhost:${server.port}/ws`);
