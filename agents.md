# FastVote - Real-Time Voting Application

## Overview
FastVote is a real-time voting application where users can create and participate in live voting sessions. Users receive random IDs, can create votes with QR code sharing, and see live ranking results as votes stream in via WebSockets.

## Tech Stack
- **Frontend**: SvelteKit (Svelte 5), Tailwind CSS, DaisyUI
- **Backend**: Bun with WebSocket server
- **Storage**: In-memory only (no database)
- **Real-time**: WebSockets for bidirectional communication

## User Flow

### 1. Entry
- User visits website → receives random UUID
- UUID stored in localStorage
- Optional: Add username
- UUID acts as authentication token

### 2. Create Vote
- Creator sets vote name and toggles "allow item suggestions"
- Vote created with unique ID
- QR code generated for sharing
- 3-minute lobby countdown starts
- Creator can start vote early using their user-id as auth

### 3. Join Vote
- Users scan QR code or enter vote ID
- Join lobby and see other participants
- If suggestions enabled: submit one item suggestion
- Wait for creator to start or timer to expire

### 4. Voting Phase
- 10-second countdown timer
- Users tap items unlimited times
- Votes stream in real-time via WebSockets
- Creator sees live animated ranking bars

### 5. Results
- Final rankings displayed
- Vote data cleaned up after 5 minutes

## Data Models

### User
```typescript
interface User {
  id: string;              // UUID
  username?: string;       // Optional display name
  connectedAt: number;     // Timestamp
}
```

### Vote
```typescript
interface Vote {
  id: string;              // Unique vote ID
  name: string;            // Vote title
  creatorId: string;       // Creator's user ID (used for auth)
  allowSuggestions: boolean;
  status: 'lobby' | 'voting' | 'finished';
  items: VoteItem[];
  participants: string[];  // Array of user IDs
  votes: Record<string, number>; // itemId -> vote count
  createdAt: number;       // Timestamp for cleanup
  lobbyEndsAt: number;     // Timestamp (createdAt + 3 min)
  votingEndsAt?: number;   // Timestamp (start + 10 sec)
}
```

### VoteItem
```typescript
interface VoteItem {
  id: string;
  name: string;
  suggestedBy: string;     // User ID
}
```

## WebSocket Protocol

### Client → Server Events

```typescript
// Connect with user info
{ type: 'connect', userId: string, username?: string }

// Create new vote
{ type: 'create_vote', userId: string, name: string, allowSuggestions: boolean }

// Join existing vote
{ type: 'join_vote', userId: string, voteId: string }

// Suggest item (during lobby)
{ type: 'suggest_item', userId: string, voteId: string, itemName: string }

// Start vote (creator only)
{ type: 'start_vote', userId: string, voteId: string }

// Cast vote (during voting phase)
{ type: 'cast_vote', userId: string, voteId: string, itemId: string }
```

### Server → Client Events

```typescript
// Vote created successfully
{ type: 'vote_created', vote: Vote }

// Joined vote successfully
{ type: 'vote_joined', vote: Vote }

// Vote state updated
{ type: 'vote_updated', vote: Vote }

// New participant joined
{ type: 'participant_joined', userId: string, username?: string }

// Item suggested
{ type: 'item_suggested', item: VoteItem }

// Voting started
{ type: 'voting_started', votingEndsAt: number }

// Vote cast (real-time update)
{ type: 'vote_cast', itemId: string, newCount: number }

// Voting finished
{ type: 'voting_finished', results: Array<{ itemId: string, name: string, count: number }> }

// Error
{ type: 'error', message: string }
```

## Backend Architecture

### WebSocket Server (Bun)
```typescript
// Main server setup
Bun.serve({
  port: 3001,
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response("WebSocket server");
  },
  websocket: {
    message(ws, message) { /* handle events */ },
    open(ws) { /* connection opened */ },
    close(ws) { /* connection closed */ }
  }
});
```

### Vote Manager (In-Memory)
- Store votes in `Map<voteId, Vote>`
- Store WebSocket connections in `Map<userId, WebSocket>`
- Cleanup service runs every minute, removes votes older than 5 minutes

### Key Functions
- `createVote(userId, name, allowSuggestions)` - Create new vote
- `joinVote(userId, voteId)` - Add user to vote
- `suggestItem(userId, voteId, itemName)` - Add item suggestion
- `startVote(userId, voteId)` - Start voting (auth check: userId === vote.creatorId)
- `castVote(userId, voteId, itemId)` - Increment vote count
- `broadcastToVote(voteId, event)` - Send event to all participants
- `cleanupOldVotes()` - Remove votes older than 5 minutes

### Timers
- **Lobby Timer**: 3 minutes from creation, auto-starts vote
- **Voting Timer**: 10 seconds from start, auto-finishes vote
- **Cleanup Timer**: Runs every 60 seconds, removes old votes

## Frontend Architecture

### Routes
```
/                           - Home page (create or join)
/vote/[id]/lobby           - Lobby/waiting room (creator view with QR)
/vote/[id]/join            - Join vote page
/vote/[id]/vote            - Active voting interface
/vote/[id]/results         - Live results with ranking bars
```

### Key Components

#### `QRCode.svelte`
- Generate QR code for vote URL
- Use `qr` package (already in dependencies)

#### `Timer.svelte`
- Countdown display (3 min lobby, 10 sec voting)
- Props: `endTime: number`
- Auto-updates every second

#### `RankingBars.svelte`
- Animated horizontal bars showing vote counts
- Real-time updates as votes come in
- Sort by vote count (descending)
- Use Tailwind transitions for smooth animations

#### `VoteItem.svelte`
- Clickable card for voting
- Shows item name and current count
- Haptic feedback on click (if supported)
- DaisyUI card styling

#### `ParticipantList.svelte`
- Display connected users
- Show usernames or "Anonymous User"
- Real-time updates as users join

### State Management
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- WebSocket connection in global store
- Current user info in localStorage + store
- Vote state synced from WebSocket events

### WebSocket Client
```typescript
// stores/websocket.ts
class WebSocketStore {
  ws: WebSocket | null = $state(null);
  connected: boolean = $state(false);
  
  connect() {
    this.ws = new WebSocket('ws://localhost:3001');
    this.ws.onopen = () => this.connected = true;
    this.ws.onmessage = (event) => this.handleMessage(event);
  }
  
  send(event: any) {
    this.ws?.send(JSON.stringify(event));
  }
}
```

### User ID Management
```typescript
// stores/user.ts
function getUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('userId', userId);
  }
  return userId;
}
```

## Security & Authorization
- **Creator Auth**: User ID acts as secret token
- Only creator (userId === vote.creatorId) can:
  - Start vote early
  - Potentially end vote early (optional feature)
- No passwords or sessions needed
- Votes auto-cleanup after 5 minutes

## Styling Guidelines

### DaisyUI Components
- Use `btn`, `btn-primary`, `btn-secondary` for buttons
- Use `card`, `card-body` for vote items
- Use `badge` for participant counts
- Use `progress` for timers
- Use `alert` for error messages

### Tailwind Utilities
- Responsive grid: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Animations: `transition-all duration-300 ease-in-out`
- Hover effects: `hover:scale-105 active:scale-95`

### Color Scheme
- Primary: DaisyUI primary color
- Success: Green for active voting
- Warning: Yellow for lobby countdown
- Error: Red for errors

## Implementation Checklist

### Backend
1. Set up Bun WebSocket server
2. Implement vote manager with in-memory storage
3. Handle all WebSocket events
4. Implement lobby timer (3 min)
5. Implement voting timer (10 sec)
6. Implement cleanup service (5 min)
7. Add creator authentication check

### Frontend
1. Set up user ID generation and storage
2. Create WebSocket store and connection
3. Build home page (create/join options)
4. Build lobby page with QR code
5. Build voting interface with clickable items
6. Build results page with animated ranking bars
7. Implement real-time updates for all events
8. Add countdown timers
9. Style with Tailwind + DaisyUI

### Testing Scenarios
1. Create vote → Generate QR → Join from another device
2. Test suggestion flow (enabled/disabled)
3. Test lobby timer auto-start
4. Test creator manual start
5. Test rapid voting (multiple clicks)
6. Test real-time ranking updates
7. Test cleanup after 5 minutes
8. Test creator auth (only creator can start)

## Development Commands
```bash
# Start both frontend and backend
bun run dev

# Start backend only
bun run dev:backend

# Start frontend only
bun run dev:frontend
```

## Notes
- All data is ephemeral (in-memory only)
- No persistence between server restarts
- WebSocket reconnection should be handled gracefully
- Consider adding loading states for better UX
- QR codes should include full URL (e.g., `https://fastvote.app/vote/[id]/join`)
