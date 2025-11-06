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
    // Register match handler
  try {
    initializer.registerMatch('tictactoe', {
      matchInit: matchInit,
      matchJoinAttempt: matchJoinAttempt,
      matchJoin: matchJoin,
      matchLeave: matchLeave,
      matchLoop: matchLoop,
      matchTerminate: matchTerminate,
      matchSignal: matchSignal  // ← ADD THIS LINE
    });
    logger.info('✅ Match handler registered: tictactoe');
  } catch (error) {
    logger.error('❌ Failed to register match handler: ' + error.message);
  }


  // Register RPC endpoints
    // Register RPC endpoints
  try {
    initializer.registerRpc('find_match', rpcFindMatch);
    logger.info('✅ RPC registered: find_match');
    
    // Register health_check with httpKey (allows unauthenticated access)
    initializer.registerRpc('health_check', rpcHealthCheck, {
      httpKey: 'defaultkey'  // Allow calls with HTTP key instead of auth
    });
    logger.info('✅ RPC registered: health_check (public)');
    
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

function matchInit(ctx, logger, nk, params) {
  logger.info('🎯 New match initializing...');
  
  // Always create fresh state
  var state = {
    board: ['', '', '', '', '', '', '', '', ''],
    players: {},
    currentTurn: '',
    winner: null,
    gameStatus: 'waiting',
    moveCount: 0,
    createdAt: Date.now()
  };

  logger.info('✅ Match initialized with fresh state');
  return { state: state, tickRate: 1, label: 'Tic-Tac-Toe Match' };
}


function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  var playerCount = Object.keys(state.players).length;
  
  logger.info('🔍 Join attempt by: ' + presence.username);

  if (playerCount >= 2) {
    logger.warn('❌ Match full');
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

function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
  var playerCount = Object.keys(state.players).length;

  presences.forEach(function(presence) {
    logger.info('👤 Player joined: ' + presence.username);
    
    var symbol = playerCount === 0 ? 'X' : 'O';
    
    state.players[presence.userId] = {
      userId: presence.userId,
      username: presence.username,
      symbol: symbol,
      sessionId: presence.sessionId
    };

    if (playerCount === 0) {
      state.currentTurn = presence.userId;
      logger.info('🎮 Player X (first turn)');
    }

    playerCount++;
  });

  if (playerCount >= 2) {
    state.gameStatus = 'active';
    logger.info('🎉 Game starting!');
    
    // Make sure this is properly stringified
    var message = JSON.stringify({
      type: 'game_start',
      state: state
    });
    
    logger.info('📤 Broadcasting message: ' + message.substring(0, 100) + '...');
    dispatcher.broadcastMessage(1, message);
  }

  return { state: state };
}

function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
  presences.forEach(function(presence) {
    logger.info('👋 Player left: ' + presence.username);
    delete state.players[presence.userId];

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

  // If all players left, reset state completely
  if (Object.keys(state.players).length === 0) {
    logger.info('🔄 All players left, resetting match state');
    state.board = ['', '', '', '', '', '', '', '', ''];
    state.currentTurn = '';
    state.winner = null;
    state.gameStatus = 'waiting';
    state.moveCount = 0;
  }

  return { state: state };
}


function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
  messages.forEach(function(message) {
    var data = JSON.parse(nk.binaryToString(message.data));
    
    if (data.type === 'move') {
      handleMove(logger, dispatcher, state, message.sender, data);
    }
  });

  return { state: state };
}

function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  logger.info('🛑 Match terminating...');
  return { state: state };
}

// ============================================
// GAME LOGIC FUNCTIONS
// ============================================

function handleMove(logger, dispatcher, state, sender, data) {
  var position = data.position;
  
  if (state.gameStatus !== 'active') {
    return;
  }

  if (state.currentTurn !== sender.userId) {
    return;
  }

  if (state.board[position] !== '') {
    return;
  }

  if (position < 0 || position > 8) {
    return;
  }

  var player = state.players[sender.userId];
  state.board[position] = player.symbol;
  state.moveCount++;

  logger.info('✓ Move: ' + player.symbol + ' at ' + position);

  var winner = checkWinner(state.board);
  if (winner) {
    state.winner = sender.userId;
    state.gameStatus = 'ended';
    logger.info('🏆 Winner: ' + player.username);
  } else if (state.moveCount >= 9) {
    state.gameStatus = 'ended';
    state.winner = 'draw';
    logger.info('🤝 Draw');
  } else {
    var playerIds = Object.keys(state.players);
    state.currentTurn = playerIds.find(function(id) {
      return id !== sender.userId;
    });
  }

  var message = JSON.stringify({
    type: 'game_update',
    state: state
  });
  
  logger.info('📤 Broadcasting game update');
  dispatcher.broadcastMessage(1, message);
}

function checkWinner(board) {
  var winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (var i = 0; i < winPatterns.length; i++) {
    var pattern = winPatterns[i];
    var a = board[pattern[0]];
    var b = board[pattern[1]];
    var c = board[pattern[2]];

    if (a !== '' && a === b && b === c) {
      return a;
    }
  }

  return null;
}

function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  logger.info('🛑 Match terminating...');
  return { state: state };
}

/**
 * Handle match signals
 */
function matchSignal(ctx, logger, nk, dispatcher, tick, state, data) {
  logger.info('📡 Match signal received');
  return { state: state };
}


// ============================================
// RPC FUNCTIONS
// ============================================

function rpcFindMatch(ctx, logger, nk, payload) {
  logger.info('🔍 RPC: Finding match...');

  try {
    var limit = 10;
    var authoritative = true;
    var label = '';
    var minSize = 0;
    var maxSize = 1;
    var query = '';

    var matches = nk.matchList(limit, authoritative, label, minSize, maxSize, query);

    logger.info('📊 Found ' + matches.length + ' available matches');

    if (matches.length > 0) {
      logger.info('✓ Found existing match: ' + matches[0].matchId);
      return JSON.stringify({
        success: true,
        matchId: matches[0].matchId
      });
    }

    // Create new match - THIS LINE IS CRITICAL
    logger.info('🎯 Creating new match with handler: tictactoe');
    var matchId = nk.matchCreate('tictactoe', {});  // ← Must match registered name
    logger.info('✓ Created match: ' + matchId);

    return JSON.stringify({
      success: true,
      matchId: matchId
    });
  } catch (error) {
    logger.error('❌ RPC Error: ' + error.message);
    logger.error('❌ Stack: ' + error.stack);
    return JSON.stringify({
      success: false,
      error: 'error creating match: ' + error.message
    });
  }
}



function rpcCreateMatch(ctx, logger, nk, payload) {
  logger.info('🎯 RPC: Creating match...');

  try {
    var matchId = nk.matchCreate('tictactoe', {});
    logger.info('✓ Match created: ' + matchId);

    return JSON.stringify({
      success: true,
      matchId: matchId
    });
  } catch (error) {
    logger.error('❌ Error: ' + error.message);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}

function rpcHealthCheck(ctx, logger, nk, payload) {
  return JSON.stringify({
    status: 'healthy',
    timestamp: Date.now(),
    server: 'Tic-Tac-Toe Nakama Server',
    version: '1.0.0'
  });
}
