import { useState } from 'react';
import Login from './components/Login';
import Game from './components/Game';
import useGameStore from './store/gameStore';
import nakamaService from './services/nakama';

function App() {
  const { isAuthenticated, setUser, setLoading, isLoading } = useGameStore();

      const handleLogin = async (username) => {
    setLoading(true);

    try {
      // Initialize Nakama
      nakamaService.init();

      // Authenticate
      const authResult = await nakamaService.authenticate(username);

      if (authResult.success) {
        const user = nakamaService.getCurrentUser();
        setUser(user.username, user.userId);
        console.log('✅ Login successful');
      } else {
        // Show error in alert
        const errorMsg = authResult.error || 'Login failed. Please try again.';
        alert('⚠️ ' + errorMsg);
        console.error('Login error:', authResult.error);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('⚠️ Failed to connect to server. Make sure backend is running on localhost:7350');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} isLoading={isLoading} />
      ) : (
        <Game />
      )}
    </div>
  );
}

export default App;
