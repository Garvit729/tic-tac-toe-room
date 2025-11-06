/**
 * Nakama JavaScript Runtime Module
 * Multiplayer Tic-Tac-Toe Game Server
 * 
 * @author Vaibhav
 * @version 1.0.0
 */

// ============================================
// MODULE INITIALIZATION
// ============================================

var InitModule = function(ctx, logger, nk, initializer) {
  logger.info('========================================');
  logger.info('🎮 TIC-TAC-TOE SERVER STARTING...');
  logger.info('========================================');

  // Register match handler
  try {
    initializer.registerMatch('tictactoe', {
      matchInit: matchInit,
      matchJoinAttempt: matchJoinAttempt,
      matchJoin: matchJoin,
      matchLeave: matchLeave,
      matchLoop: matchLoop,
      matchTerminate: matchTerminate,
    });
    logger.info('✅ Match handler registered: tictactoe');
  } catch (error) {
    logger.error('❌ Failed to register match handler: ' + error.message);
  }

  // Register RPC endpoints
  try {
    initializer.registerRpc('find_match', rpcFindMatch);
    logger.info('✅ RPC registered: find_match');
    
    initializer.registerRpc('health_check', rpcHealthCheck);
    logger.info('✅ RPC registered: health_check');
    
    initializer.registerRpc('create_match', rpcCreateMatch);
    logger.info('✅ RPC registered: create_match');
  } catch (error) {
    logger.error('❌ Failed to register RPC: ' + error.message);
  }

  logger.info('========================================');
  logger.info('🚀 SERVER READY - ALL SYSTEMS GO!');
  logger.info('========================================');
};

// ============================================
// MATCH LIFECYCLE FUNCTIONS
// ============================================

/**
 * Initialize a new match
 */
function matchInit(ctx, logger, nk, params) {
  logger.info('🎯 New match initializing...');
  
  var state = {
    board: ['', '', '', '', '', '', '', '', ''],
    players: {},
    currentTurn: '',
    winner: null,
    gameStatus: 'waiting', // waiting, active, ended
    moveCount: 0,
    createdAt: Date.now()
  };

  logger.info('✅ Match initialized with state: ' + JSON.stringify(state));

  return {
    state: state,
    tickRate: 1, // 1 tick per second
    label: 'Tic-Tac-Toe Match'
  };
}

/**
 * Check if player can join match
 */
function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  var playerCount = Object.keys(state.players).length;
  
  logger.info('🔍 Join attempt by: ' + presence.username + ' (Current players: ' + playerCount + ')');

  // Only allow 2 players max
  if (playerCount >= 2) {
    logger.warn('❌ Match full, rejecting player: ' + presence.username);
    return {
      state: state,
      accept: false,
      rejectMessage: 'Match is full'
    };
  }

  logger.info('✅ Accepting player: ' + presence.username);
  return {
    state: state,
    accept: true
  };
}

/**
 * Player joined the match
 */
function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
  var playerCount = Object.keys(state.players).length;

  presences.forEach(function(presence) {
    logger.info('👤 Player joined: ' + presence.username + ' [' + presence.userId + ']');
    
    // Assign X or O
    var symbol = playerCount === 0 ? 'X' : 'O';
    
    state.players[presence.userId] = {
      userId: presence.userId,
      username: presence.username,
      symbol: symbol,
      sessionId: presence.sessionId
    };

    // First player gets first turn
    if (playerCount === 0) {
      state.currentTurn = presence.userId;
      logger.info('🎮 ' + presence.username + ' is Player X (goes first)');
    } else {
      logger.info('🎮 ' + presence.username + ' is Player O');
    }

    playerCount++;
  });

  // Start game if 2 players
  if (playerCount >= 2) {
    state.gameStatus = 'active';
    logger.info('🎉 Game starting! Both players connected.');
    
    // Broadcast game state to all players
    var message = JSON.stringify({
      type: 'game_start',
      state: state
    });
    dispatcher.broadcastMessage(1, message);
  }

  return { state: state };
}

/**
 * Player left the match
 */
function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
  presences.forEach(function(presence) {
    logger.info('👋 Player left: ' + presence.username);
    
    // Remove player from state
    delete state.players[presence.userId];

    // End game if someone left
    if (state.gameStatus === 'active') {
      state.gameStatus = 'ended';
      state.winner = 'opponent_left';
      
      var message = JSON.stringify({
        type: 'player_left',
        message: presence.username + ' left the game'
      });
      dispatcher.broadcastMessage(2, message);
    }
  });

  return { state: state };
}

/**
 * Main game loop - processes messages
 */
function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
  // Process each message from players
  messages.forEach(function(message) {
    var data = JSON.parse(nk.binaryToString(message.data));
    
    logger.info('📨 Message received: ' + JSON.stringify(data));

    // Handle different message types
    if (data.type === 'move') {
      handleMove(logger, dispatcher, state, message.sender, data);
    }
  });

  return { state: state };
}

/**
 * Match terminating
 */
function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  logger.info('🛑 Match terminating...');
  return { state: state };
}

// ============================================
// GAME LOGIC FUNCTIONS
// ============================================

/**
 * Handle player move
 */
function handleMove(logger, dispatcher, state, sender, data) {
  var position = data.position;
  
  // Validate move
  if (state.gameStatus !== 'active') {
    logger.warn('⚠️ Move rejected: Game not active');
    return;
  }

  if (state.currentTurn !== sender.userId) {
    logger.warn('⚠️ Move rejected: Not player turn');
    return;
  }

  if (state.board[position] !== '') {
    logger.warn('⚠️ Move rejected: Position already taken');
    return;
  }

  if (position < 0 || position > 8) {
    logger.warn('⚠️ Move rejected: Invalid position');
    return;
  }

  // Make move
  var player = state.players[sender.userId];
  state.board[position] = player.symbol;
  state.moveCount++;

  logger.info('✓ Move accepted: ' + player.username + ' placed ' + player.symbol + ' at position ' + position);

  // Check for winner
  var winner = checkWinner(state.board);
  if (winner) {
    state.winner = sender.userId;
    state.gameStatus = 'ended';
    logger.info('🏆 Winner: ' + player.username + ' (' + winner + ')');
  } else if (state.moveCount >= 9) {
    state.gameStatus = 'ended';
    state.winner = 'draw';
    logger.info('🤝 Game ended in a draw');
  } else {
    // Switch turn
    var playerIds = Object.keys(state.players);
    state.currentTurn = playerIds.find(function(id) {
      return id !== sender.userId;
    });
  }

  // Broadcast updated state
  var message = JSON.stringify({
    type: 'game_update',
    state: state
  });
  dispatcher.broadcastMessage(1, message);
}

/**
 * Check if there's a winner
 */
function checkWinner(board) {
  var winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (var i = 0; i < winPatterns.length; i++) {
    var pattern = winPatterns[i];
    var a = board[pattern[0]];
    var b = board[pattern[1]];
    var c = board[pattern[2]];

    if (a !== '' && a === b && b === c) {
      return a; // Return 'X' or 'O'
    }
  }

  return null; // No winner
}

// ============================================
// RPC FUNCTIONS
// ============================================

/**
 * Find or create a match
 */
function rpcFindMatch(ctx, logger, nk, payload) {
  logger.info('🔍 RPC: Finding match for user...');

  try {
    // Query for available matches
    var limit = 10;
    var authoritative = true;
    var label = '';
    var minSize = 0;
    var maxSize = 1; // Matches with < 2 players
    var query = '';

    var matches = nk.matchList(limit, authoritative, label, minSize, maxSize, query);

    if (matches.length > 0) {
      logger.info('✓ Found existing match: ' + matches[0].matchId);
      return JSON.stringify({
        success: true,
        matchId: matches[0].matchId
      });
    }

    // No match found, create new one
    var matchId = nk.matchCreate('tictactoe', {});
    logger.info('✓ Created new match: ' + matchId);

    return JSON.stringify({
      success: true,
      matchId: matchId
    });
  } catch (error) {
    logger.error('❌ Find match error: ' + error.message);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * Create a new match
 */
function rpcCreateMatch(ctx, logger, nk, payload) {
  logger.info('🎯 RPC: Creating new match...');

  try {
    var matchId = nk.matchCreate('tictactoe', {});
    logger.info('✓ Match created: ' + matchId);

    return JSON.stringify({
      success: true,
      matchId: matchId
    });
  } catch (error) {
    logger.error('❌ Create match error: ' + error.message);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

/**
 * Health check endpoint
 */
function rpcHealthCheck(ctx, logger, nk, payload) {
  return JSON.stringify({
    status: 'healthy',
    timestamp: Date.now(),
    server: 'Tic-Tac-Toe Nakama Server',
    version: '1.0.0'
  });
}

// ============================================
// MODULE EXPORTS
// ============================================

logger.info('📦 Module loaded successfully');
