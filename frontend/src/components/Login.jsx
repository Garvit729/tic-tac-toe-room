import React, { useState } from 'react';

const Login = ({ onLogin, isLoading }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const validateUsername = (name) => {
    // Remove spaces
    const cleaned = name.trim().replace(/\s+/g, '');
    
    if (!cleaned) {
      return { valid: false, error: 'Please enter a username' };
    }

    if (cleaned.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (cleaned.length > 20) {
      return { valid: false, error: 'Username must be less than 20 characters' };
    }

    // Only alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
      return { valid: false, error: 'Username can only contain letters, numbers, and underscore' };
    }

    return { valid: true, cleaned };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = validateUsername(username);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError('');
    onLogin(validation.cleaned);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (error) setError(''); // Clear error on typing
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 Tic-Tac-Toe
          </h1>
          <p className="text-white/70">Multiplayer Game</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-white/90 font-medium mb-2">
              Enter Your Name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="player123"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              disabled={isLoading}
              autoFocus
              maxLength={20}
            />
            <p className="text-white/50 text-xs mt-2">
              Letters, numbers, and underscore only (no spaces)
            </p>
          </div>

          {error && (
            <p className="text-red-300 text-sm bg-red-500/20 p-3 rounded-lg border border-red-400/30">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </span>
            ) : (
              'Start Playing'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-white/60 text-sm">
          <p>Powered by Nakama</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
