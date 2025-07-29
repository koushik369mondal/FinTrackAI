import { db } from './prisma';

export class DatabaseMonitor {
  constructor() {
    this.isConnected = true;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.listeners = new Set();
  }

  // Add listener for connection status changes
  addListener(callback) {
    this.listeners.add(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  // Notify all listeners of status change
  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }

  // Check database connectivity
  async checkConnection() {
    try {
      await db.$queryRaw`SELECT 1`;
      if (!this.isConnected) {
        this.isConnected = true;
        this.connectionAttempts = 0;
        this.notifyListeners({ connected: true, error: null });
        console.log('Database connection restored');
      }
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error.message);
      this.isConnected = false;
      this.notifyListeners({ 
        connected: false, 
        error: error.message,
        attempts: this.connectionAttempts 
      });
      return false;
    }
  }

  // Retry database operation with exponential backoff
  async retryOperation(operation, maxRetries = this.maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.connectionAttempts = attempt;
        const result = await operation();
        
        // Reset connection attempts on success
        if (this.connectionAttempts > 0) {
          this.connectionAttempts = 0;
          this.isConnected = true;
          this.notifyListeners({ connected: true, error: null });
        }
        
        return result;
      } catch (error) {
        console.log(`Database operation attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          this.isConnected = false;
          this.notifyListeners({ 
            connected: false, 
            error: error.message,
            attempts: attempt 
          });
          throw new Error(`Database operation failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Start periodic connection monitoring
  startMonitoring(intervalMs = 30000) { // Check every 30 seconds
    setInterval(async () => {
      await this.checkConnection();
    }, intervalMs);
  }

  // Get current connection status
  getStatus() {
    return {
      connected: this.isConnected,
      attempts: this.connectionAttempts
    };
  }
}

// Export singleton instance
export const dbMonitor = new DatabaseMonitor();
