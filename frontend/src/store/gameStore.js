import { create } from 'zustand';

const useGameStore = create((set) => ({
  // User state
  username: null,
  userId: null,
  isAuthenticated: false,

  // Match state
  matchId: null,
  inMatch: false,
  
  // Game state
    // Game state
  board: ['', '', '', '', '', '', '', '', ''],
  players: {},
  currentTurn: '',
  mySymbol: null,
  winner: null,
  winningLine: null,  // ADD THIS
  gameStatus: 'idle',

  
  // UI state
  isLoading: false,
  error: null,
  message: null,

  // Actions
  setUser: (username, userId) => set({ 
    username, 
    userId, 
    isAuthenticated: true 
  }),

  setMatch: (matchId) => set({ 
    matchId, 
    inMatch: true,
    gameStatus: 'waiting'
  }),

  updateGameState: (gameState) => set({ 
    board: gameState.board,
    players: gameState.players,
    currentTurn: gameState.currentTurn,
    winner: gameState.winner,
    gameStatus: gameState.gameStatus
  }),

  setMySymbol: (symbol) => set({ mySymbol: symbol }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setMessage: (message) => set({ message }),

    resetGame: () => set({
    board: ['', '', '', '', '', '', '', '', ''],
    players: {},
    currentTurn: '',
    winner: null,
    winningLine: null,  // ADD THIS
    gameStatus: 'idle',
    matchId: null,
    inMatch: false,
    mySymbol: null,
    error: null,
    message: null,
    isLoading: false
  }),


  logout: () => set({
    username: null,
    userId: null,
    isAuthenticated: false,
    board: ['', '', '', '', '', '', '', '', ''],
    players: {},
    currentTurn: '',
    winner: null,
    gameStatus: 'idle',
    matchId: null,
    inMatch: false,
    mySymbol: null,
    error: null,
    message: null
  })
}));

export default useGameStore;
