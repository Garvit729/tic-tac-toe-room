import { useState, useEffect } from 'react';
import soundManager from '../utils/sounds.js';
import GameStats from './GameStats';



import Board from './Board';
import useGameStore from '../store/gameStore';
import nakamaService from '../services/nakama';



const Game = () => {
    // Inside Game component
    
    const {
        username,
        userId,
    matchId,
    inMatch,
    board,
    players,
    currentTurn,
    mySymbol,
    winner,
    gameStatus,
    setMatch,
    updateGameState,
    setMySymbol,
    resetGame,
    logout
} = useGameStore();

    const { stats, recordGame, winRate } = GameStats(username);
  const [isSearching, setIsSearching] = useState(false);
  const [opponentName, setOpponentName] = useState('Waiting...');

      useEffect(() => {
    if (inMatch) {
      nakamaService.onMatchData((data) => {
        console.log('📥 Received match data:', data);

        if (data.type === 'game_start') {
          console.log('🎉 Game starting!');
          soundManager.playJoin();
          updateGameState(data.state);
          findMySymbol(data.state.players);
        } else if (data.type === 'game_update') {
          console.log('🔄 Game update');
          updateGameState(data.state);
          
          // Play win/lose sound if game ended
          if (data.state.gameStatus === 'ended') {
            if (data.state.winner === userId) {
              soundManager.playWin();
            } else if (data.state.winner && data.state.winner !== 'draw') {
              soundManager.playLose();
            }
          }
        } else if (data.type === 'player_left') {
          alert(data.message);
          handleLeaveMatch();
        }
      });
    }
  }, [inMatch]);

  useEffect(() => {
    if (gameStatus === 'ended' && winner) {
      // Record stats
      if (winner === userId) {
        recordGame('win');
      } else if (winner === 'draw') {
        recordGame('draw');
      } else {
        recordGame('loss');
      }
    }
  }, [gameStatus, winner, userId]);


  useEffect(() => {
    // Update opponent name when players change
    if (players && Object.keys(players).length > 0) {
      const opponent = Object.values(players).find(p => p.userId !== userId);
      if (opponent) {
        setOpponentName(opponent.username);
      }
    }
  }, [players, userId]);

  const findMySymbol = (playersData) => {
    const myPlayer = Object.values(playersData).find(p => p.userId === userId);
    if (myPlayer) {
      setMySymbol(myPlayer.symbol);
      console.log('🎮 I am playing as:', myPlayer.symbol);
    }
  };

    const handleFindMatch = async () => {
    // Clear any previous game state
    resetGame();
    
    setIsSearching(true);

    try {
      // Connect socket first
      const socketResult = await nakamaService.connectSocket();
      if (!socketResult.success) {
        alert('Failed to connect: ' + socketResult.error);
        setIsSearching(false);
        return;
      }

      // Find match
      const matchResult = await nakamaService.findMatch();
      if (!matchResult.success) {
        alert('Failed to find match: ' + matchResult.error);
        setIsSearching(false);
        return;
      }

      // Join match
      const joinResult = await nakamaService.joinMatch(matchResult.matchId);
      if (!joinResult.success) {
        alert('Failed to join match: ' + joinResult.error);
        setIsSearching(false);
        return;
      }

      // Update state
      setMatch(matchResult.matchId);
      
      console.log('✅ Successfully joined match');
    } catch (error) {
      console.error('❌ Error finding match:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };


    const handleCellClick = (position) => {
    if (gameStatus !== 'active') return;
    if (currentTurn !== userId) return;
    if (board[position] !== '') return;

    // Play sound
    soundManager.playMove();

    // Send move to server
    nakamaService.sendMove(position);
  };


    const handleLeaveMatch = async () => {
    console.log('👋 Leaving match...');
    
    // Leave match on server
    await nakamaService.leaveMatch();
    
    // Reset all game state
    resetGame();
    
    console.log('✅ Match left, state reset');
  };


  const handleLogout = () => {
    nakamaService.disconnect();
    logout();
  };

  const isMyTurn = currentTurn === userId;
  const playersList = Object.values(players);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        {/* Header */}
<div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">
        🎮 Tic-Tac-Toe
      </h1>
      <p className="text-white/70">Welcome, {username}!</p>
      <div className="flex gap-4 mt-2 text-sm text-white/60">
        <span>🏆 {stats.wins}W</span>
        <span>❌ {stats.losses}L</span>
        <span>🤝 {stats.draws}D</span>
        <span>📊 {winRate}% Win Rate</span>
      </div>
    </div>
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-all"
    >
      Logout
    </button>
  </div>
</div>


        {/* Game Area */}
        {!inMatch ? (
          // Lobby - Not in match
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center border border-white/20">
            <div className="mb-8">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Ready to Play?
              </h2>
              <p className="text-white/70 mb-8">
                Find an opponent and start playing!
              </p>
            </div>

            <button
              onClick={handleFindMatch}
              disabled={isSearching}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-xl rounded-xl hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isSearching ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Finding Match...
                </span>
              ) : (
                '🔍 Find Match'
              )}
            </button>
          </div>
        ) : (
          // In Match - Game Board
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            {/* Players Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* You */}
              <div className={`p-4 rounded-xl ${isMyTurn ? 'bg-green-500/30 ring-2 ring-green-400' : 'bg-white/10'}`}>
                <div className="text-white/70 text-sm mb-1">You</div>
                <div className="text-white font-bold text-xl">{username}</div>
                <div className="text-2xl mt-2">{mySymbol || '?'}</div>
              </div>

              {/* Opponent */}
              <div className={`p-4 rounded-xl ${!isMyTurn && gameStatus === 'active' ? 'bg-orange-500/30 ring-2 ring-orange-400' : 'bg-white/10'}`}>
                <div className="text-white/70 text-sm mb-1">Opponent</div>
                <div className="text-white font-bold text-xl">{opponentName}</div>
                <div className="text-2xl mt-2">
                  {mySymbol ? (mySymbol === 'X' ? 'O' : 'X') : '?'}
                </div>
              </div>
            </div>

            {/* Game Status */}
            <div className="text-center mb-6">
              {gameStatus === 'waiting' && (
                <div className="text-yellow-300 text-lg font-semibold animate-pulse">
                  ⏳ Waiting for opponent...
                </div>
              )}
              {gameStatus === 'active' && (
                <div className={`text-lg font-semibold ${isMyTurn ? 'text-green-300' : 'text-orange-300'}`}>
                  {isMyTurn ? '🟢 Your Turn!' : '🟠 Opponent\'s Turn'}
                </div>
              )}
              {gameStatus === 'ended' && winner && (
                <div className="space-y-2">
                  {winner === userId ? (
                    <div className="text-3xl font-bold text-green-400">
                      🎉 You Won! 🏆
                    </div>
                  ) : winner === 'draw' ? (
                    <div className="text-3xl font-bold text-yellow-400">
                      🤝 It's a Draw!
                    </div>
                  ) : winner === 'opponent_left' ? (
                    <div className="text-3xl font-bold text-yellow-400">
                      👋 Opponent Left
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-red-400">
                      😢 You Lost
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Game Board */}
            <div className="flex justify-center mb-6">
              <Board
                board={board}
                onCellClick={handleCellClick}
                disabled={gameStatus !== 'active'}
                mySymbol={mySymbol}
                currentTurn={currentTurn}
                userId={userId}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              {gameStatus === 'ended' && (
                <button
                  onClick={handleLeaveMatch}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  🎮 Play Again
                </button>
              )}
              <button
                onClick={handleLeaveMatch}
                className="px-6 py-3 bg-red-500/80 hover:bg-red-600 text-white font-bold rounded-lg transition-all"
              >
                {gameStatus === 'ended' ? '🚪 Leave' : '⚠️ Forfeit & Leave'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-white/50 text-sm">
          <p>Match ID: {matchId || 'Not in match'}</p>
        </div>
      </div>
    </div>
  );
};

export default Game;
