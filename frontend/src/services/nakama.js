import { Client, Session } from "@heroiclabs/nakama-js";

class NakamaService {
  constructor() {
    this.client = null;
    this.session = null;
    this.socket = null;
    this.currentMatch = null;
  }

  /**
   * Initialize Nakama client
   */
  init() {
    const useSSL = false; // Local development
    const serverKey = "defaultkey";
    const host = "localhost";
    const port = "7350";

    this.client = new Client(serverKey, host, port, useSSL);
    console.log("✅ Nakama client initialized");
  }

    /**
   * Authenticate user with email
   */
  async authenticate(username) {
    try {
      if (!this.client) this.init();

      // Validate username
      if (!username || username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      // Remove any spaces or special characters
      const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '');

      // Generate email from username
      const email = `${cleanUsername.toLowerCase()}@tictactoe.com`;
      const password = "password123";
      const create = true; // Auto-create account if not exists

      console.log('🔐 Authenticating:', cleanUsername);

      this.session = await this.client.authenticateEmail(
        email,
        password,
        create,
        cleanUsername
      );

      console.log("✅ Authenticated:", this.session.username);
      return { success: true, username: this.session.username };
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      
      // Better error messages
      let errorMessage = error.message;
      if (error.message.includes('400')) {
        errorMessage = "Invalid username format. Use only letters, numbers, and underscore.";
      } else if (error.message.includes('network')) {
        errorMessage = "Cannot connect to server. Make sure backend is running.";
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Connect to WebSocket
   */
  async connectSocket() {
    try {
      if (!this.session) {
        throw new Error("Must authenticate before connecting socket");
      }

      this.socket = this.client.createSocket(false, false);
      
      await this.socket.connect(this.session, true);
      
      console.log("✅ Socket connected");
      return { success: true };
    } catch (error) {
      console.error("❌ Socket connection failed:", error);
      return { success: false, error: error.message };
    }
  }

    /**
   * Find or create a match
   */
  async findMatch() {
    try {
      const rpcid = "find_match";
      const payload = "{}"; // Must be string, not object
      
      console.log('🔍 Calling find_match RPC...');
      
      const response = await this.client.rpc(this.session, rpcid, payload);
      
      console.log('📦 Raw RPC response:', response);
      
      // response.payload is already a string
      let result;
      if (typeof response.payload === 'string') {
        result = JSON.parse(response.payload);
      } else {
        result = response.payload;
      }

      console.log('✅ Parsed result:', result);

      if (result.success) {
        console.log("✅ Match found:", result.matchId);
        return { success: true, matchId: result.matchId };
      } else {
        throw new Error(result.error || "Failed to find match");
      }
    } catch (error) {
      console.error("❌ Find match failed:", error);
      return { success: false, error: error.message };
    }
  }


  /**
   * Join a match
   */
      async joinMatch(matchId) {
    try {
      if (!this.socket) {
        await this.connectSocket();
      }

      console.log('🔗 Joining match:', matchId);

      this.currentMatch = await this.socket.joinMatch(matchId);
      
      // DEBUG: Log entire match object
      console.log("🔍 Full match object:", this.currentMatch);
      console.log("🔍 Match keys:", Object.keys(this.currentMatch || {}));
      console.log("🔍 Presences:", this.currentMatch?.presences);
      
      console.log("✅ Joined match:", matchId);

      return { 
        success: true, 
        match: this.currentMatch 
      };
    } catch (error) {
      console.error("❌ Join match failed:", error);
      return { success: false, error: error.message };
    }
  }




  /**
   * Send move to server
   */
  sendMove(position) {
    try {
      if (!this.currentMatch) {
        throw new Error("Not in a match");
      }

      const opCode = 1; // Game move operation
      const data = JSON.stringify({
        type: "move",
        position: position
      });

      this.socket.sendMatchState(
        this.currentMatch.match_id,
        opCode,
        data
      );

      console.log("📤 Move sent:", position);
      return { success: true };
    } catch (error) {
      console.error("❌ Send move failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listen for match updates
   */
    onMatchData(callback) {
    if (!this.socket) {
      console.error("Socket not connected");
      return;
    }

    this.socket.onmatchdata = (matchData) => {
      try {
        console.log('📦 Raw match data received:', matchData);
        console.log('📦 Data type:', typeof matchData.data);
        
        let data;
        
        // matchData.data could be string or Uint8Array
        if (typeof matchData.data === 'string') {
          data = JSON.parse(matchData.data);
        } else if (matchData.data instanceof Uint8Array) {
          // Convert Uint8Array to string first
          const decoder = new TextDecoder();
          const jsonString = decoder.decode(matchData.data);
          console.log('📝 Decoded string:', jsonString);
          data = JSON.parse(jsonString);
        } else {
          // Already an object
          data = matchData.data;
        }
        
        console.log("📥 Parsed match data:", data);
        callback(data);
      } catch (error) {
        console.error("❌ Failed to parse match data:", error);
        console.error("❌ Raw data was:", matchData.data);
        console.error("❌ Data constructor:", matchData.data?.constructor?.name);
      }
    };
  }


  /**
   * Leave current match
   */
  async leaveMatch() {
    try {
      if (this.currentMatch) {
        await this.socket.leaveMatch(this.currentMatch.match_id);
        console.log("👋 Left match");
        this.currentMatch = null;
      }
      return { success: true };
    } catch (error) {
      console.error("❌ Leave match failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("🔌 Disconnected");
    }
  }

  /**
   * Get current user info
   */
  getCurrentUser() {
    if (!this.session) return null;
    
    return {
      userId: this.session.user_id,
      username: this.session.username
    };
  }
}

// Export singleton instance
export default new NakamaService();
