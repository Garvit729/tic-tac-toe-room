import { useState, useEffect } from 'react';

const GameStats = ({ username }) => {
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    gamesPlayed: 0
  });

  useEffect(() => {
    // Load stats from localStorage
    const savedStats = localStorage.getItem(`tictactoe_stats_${username}`);
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, [username]);

  const saveStats = (newStats) => {
    localStorage.setItem(`tictactoe_stats_${username}`, JSON.stringify(newStats));
    setStats(newStats);
  };

  const recordGame = (result) => {
    const newStats = { ...stats };
    newStats.gamesPlayed += 1;
    
    if (result === 'win') newStats.wins += 1;
    else if (result === 'loss') newStats.losses += 1;
    else if (result === 'draw') newStats.draws += 1;
    
    saveStats(newStats);
  };

  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.wins / stats.gamesPlayed) * 100) 
    : 0;

  return {
    stats,
    recordGame,
    winRate
  };
};

export default GameStats;
