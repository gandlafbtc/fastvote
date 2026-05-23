import { browser } from '$app/environment';
import { getUserId, getUsername } from './user';

interface VoteItem {
	id: string;
	name: string;
	suggestedBy: string;
}

interface Vote {
	id: string;
	name: string;
	creatorId: string;
	allowSuggestions: boolean;
	creatorParticipates: boolean;
	status: 'lobby' | 'voting' | 'finished';
	items: VoteItem[];
	participants: string[];
	votes: Record<string, number>;
	createdAt: number;
	lobbyEndsAt: number;
	votingEndsAt?: number;
	lobbyTime: number; // in seconds
	voteTime: number; // in seconds
}

interface WSEvent {
	type: string;
	[key: string]: unknown;
}

class WebSocketStore {
	ws: WebSocket | null = $state(null);
	connected = $state(false);
	currentVote: Vote | null = $state(null);
	error: string | null = $state(null);

	connect() {
		if (!browser) return;

		const wsUrl = 'ws://localhost:3001/ws';
		this.ws = new WebSocket(wsUrl);

		this.ws.onopen = () => {
			this.connected = true;
			this.error = null;
			console.log('WebSocket connected');

			// Send connect event
			this.send({
				type: 'connect',
				userId: getUserId(),
				username: getUsername(),
			});
		};

		this.ws.onmessage = (event) => {
			try {
				const data: WSEvent = JSON.parse(event.data);
				this.handleMessage(data);
			} catch (error) {
				console.error('Error parsing WebSocket message:', error);
			}
		};

		this.ws.onerror = (error) => {
			console.error('WebSocket error:', error);
			this.error = 'Connection error';
		};

		this.ws.onclose = () => {
			this.connected = false;
			console.log('WebSocket disconnected');

			// Attempt to reconnect after 3 seconds
			setTimeout(() => {
				if (!this.connected) {
					console.log('Attempting to reconnect...');
					this.connect();
				}
			}, 3000);
		};
	}

	handleMessage(event: WSEvent) {
		console.log('Received event:', event.type, event);

		switch (event.type) {
			case 'vote_created':
			case 'vote_joined':
			case 'vote_updated':
				this.currentVote = event.vote as Vote;
				break;

			case 'participant_joined':
				if (this.currentVote && !this.currentVote.participants.includes(event.userId as string)) {
					this.currentVote.participants.push(event.userId as string);
				}
				break;

			case 'item_suggested':
				if (this.currentVote) {
					const item = event.item as VoteItem;
					this.currentVote.items.push(item);
					this.currentVote.votes[item.id] = 0;
				}
				break;

			case 'voting_started':
				if (this.currentVote) {
					this.currentVote.status = 'voting';
					this.currentVote.votingEndsAt = event.votingEndsAt as number;
				}
				break;

			case 'vote_cast':
				if (this.currentVote) {
					this.currentVote.votes[event.itemId as string] = event.newCount as number;
				}
				break;

			case 'voting_finished':
				if (this.currentVote) {
					this.currentVote.status = 'finished';
				}
				break;

			case 'error':
				this.error = event.message as string;
				console.error('Server error:', event.message);
				break;
		}
	}

	send(event: WSEvent) {
		if (this.ws && this.connected) {
			this.ws.send(JSON.stringify(event));
		} else {
			console.error('WebSocket not connected');
		}
	}

	createVote(name: string, allowSuggestions: boolean, creatorParticipates: boolean, lobbyTime: number, voteTime: number) {
		this.send({
			type: 'create_vote',
			userId: getUserId(),
			name,
			allowSuggestions,
			creatorParticipates,
			lobbyTime,
			voteTime,
		});
	}

	joinVote(voteId: string) {
		// Wait for connection if not connected yet
		if (!this.connected) {
			const checkConnection = setInterval(() => {
				if (this.connected) {
					clearInterval(checkConnection);
					this.send({
						type: 'join_vote',
						userId: getUserId(),
						voteId,
					});
				}
			}, 100);
			
			// Timeout after 5 seconds
			setTimeout(() => clearInterval(checkConnection), 5000);
		} else {
			this.send({
				type: 'join_vote',
				userId: getUserId(),
				voteId,
			});
		}
	}

	suggestItem(voteId: string, itemName: string) {
		this.send({
			type: 'suggest_item',
			userId: getUserId(),
			voteId,
			itemName,
		});
	}

	startVote(voteId: string) {
		this.send({
			type: 'start_vote',
			userId: getUserId(),
			voteId,
		});
	}

	castVote(voteId: string, itemId: string) {
		this.send({
			type: 'cast_vote',
			userId: getUserId(),
			voteId,
			itemId,
		});
	}

	disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}
}

export const wsStore = new WebSocketStore();
