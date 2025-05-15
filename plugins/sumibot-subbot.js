import { 
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket as makeWASocketOriginal
} from 'baileys';
import pino from 'pino';
import fs from 'fs/promises';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import path from 'path';
import { Boom } from '@hapi/boom';
import WebSocket from 'ws';
import { randomUUID } from 'crypto';

const CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 15,
  RECONNECT_INTERVAL: 5 * 60 * 1000,
  HEALTH_CHECK_INTERVAL: 60 * 1000,
  STATE_SAVE_INTERVAL: 2 * 60 * 1000,
  CONNECTION_TIMEOUT: 90 * 1000,
  KEEP_ALIVE_INTERVAL: 30 * 1000,
  MAX_SUBBOTS: 150,
  EXPONENTIAL_BACKOFF: true,
  LOG_LEVEL: 'silent',
  AUTH_FOLDER: './sumibots',
  BACKUP_ENABLED: true
};

class SubBotManager {
  constructor() {
    this.connections = new Map();
    this.reconnectTimers = new Map();
    this.activeTokens = new Set();
    this.connectionStats = new Map();
    this.logger = pino({ 
      level: CONFIG.LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    });
    
    if (!existsSync(CONFIG.AUTH_FOLDER)) {
      mkdirSync(CONFIG.AUTH_FOLDER, { recursive: true });
    }
    
    this.handleReconnect = this.handleReconnect.bind(this);
    this.setupEventHandlers = this.setupEventHandlers.bind(this);
    this.loadAllSubbots = this.loadAllSubbots.bind(this);
  }

  createConnectionOptions(state, version) {
    return {
      logger: this.logger.child({ level: 'fatal' }),
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger.child({ level: "fatal" })),
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      defaultQueryTimeoutMs: CONFIG.CONNECTION_TIMEOUT,
      version: version || [2, 2323, 4],
      connectTimeoutMs: CONFIG.CONNECTION_TIMEOUT,
      keepAliveIntervalMs: CONFIG.KEEP_ALIVE_INTERVAL,
      retryRequestDelayMs: 15000,
      fireInitQueries: true,
      emitOwnEvents: true,
      shouldIgnoreJid: jid => false,
      patchMessageBeforeSending: msg => msg,
      transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 }
    };
  }

  calculateBackoffTime(attempts) {
    if (!CONFIG.EXPONENTIAL_BACKOFF) return CONFIG.RECONNECT_INTERVAL;
    
    const baseTime = 30 * 1000;
    const maxTime = 30 * 60 * 1000;
    const backoffTime = baseTime * Math.pow(1.5, attempts);
    
    return Math.min(backoffTime, maxTime);
  }

  async handleReconnect(conn, authFolder, reconnectToken, attempts = 0) {
    let auth;
    let state, saveCreds;
    try {
      const folderPath = path.join(CONFIG.AUTH_FOLDER, authFolder);
      if (this.reconnectTimers.has(reconnectToken)) {
        clearTimeout(this.reconnectTimers.get(reconnectToken));
        this.reconnectTimers.delete(reconnectToken);
      }
      
      if (attempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
        this.activeTokens.delete(reconnectToken);
        
        try {
          const folderPath = path.join(CONFIG.AUTH_FOLDER, authFolder);
          if (existsSync(folderPath)) {
            await fs.rm(folderPath, { recursive: true, force: true });
          }
        } catch (e) {
          this.logger.error(`Failed to remove auth folder for ${reconnectToken}: ${e.message}`);
        }
        
        return;
      }
      
      const waitTime = this.calculateBackoffTime(attempts);
      
      const timer = setTimeout(async () => {
        try {
          const folderPath = path.join(CONFIG.AUTH_FOLDER, authFolder);
          if (!existsSync(folderPath)) {
            this.activeTokens.delete(reconnectToken);
            return;
          }
          
          this.cleanupConnection(conn);
          
          
          try {
            const authResult = await useMultiFileAuthState(folderPath);
            auth = authResult;
            state = authResult.state;
            saveCreds = authResult.saveCreds;
          } catch (error) {
            this.activeTokens.delete(reconnectToken);
            return;
          }
          
          
          if (!state.creds || !state.creds.me) {
            this.activeTokens.delete(reconnectToken);
            return;
          }
          
          let version;
          try {
            const versionInfo = await fetchLatestBaileysVersion();
            version = versionInfo.version;
          } catch (error) {
            version = [2, 2323, 4];
          }
          
          const options = this.createConnectionOptions(state, version);
          
          const newConn = makeWASocketOriginal(options);
          
          this.setupEventHandlers(newConn, authFolder, reconnectToken, saveCreds);
          
          this.connections.set(reconnectToken, newConn);
          
          this.connectionStats.set(reconnectToken, {
            lastReconnect: new Date(),
            attempts: attempts + 1,
            uptime: 0,
            status: 'reconnecting'
          });
          
        } catch (error) {
          this.handleReconnect(conn, authFolder, reconnectToken, attempts + 1);
        }
      }, waitTime);
      
      this.reconnectTimers.set(reconnectToken, timer);
      
    } catch (error) {
      setTimeout(() => {
        this.handleReconnect(conn, authFolder, reconnectToken, attempts + 1);
      }, 10000);
    }
  }

  cleanupConnection(conn) {
    if (!conn) return;
    
    try {
      if (conn.stateInterval) clearInterval(conn.stateInterval);
      if (conn.healthInterval) clearInterval(conn.healthInterval);
      if (conn.presenceInterval) clearInterval(conn.presenceInterval);
      
      if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.close();
      }
      
      if (conn.ev) {
        conn.ev.removeAllListeners();
      }
    } catch (error) {
      this.logger.error(`Error cleaning up connection: ${error.message}`);
    }
  }

  setupEventHandlers(conn, authFolder, reconnectToken, saveCreds) {
    conn.ev.on('connection.update', async (update) => {
      try {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
          this.connectionStats.set(reconnectToken, {
            lastConnect: new Date(),
            attempts: 0,
            uptime: 0,
            status: 'connected'
          });
          
          this.setupPeriodicStateSaving(conn, authFolder);
          this.setupHealthCheck(conn, authFolder, reconnectToken);
          this.setupPresenceUpdates(conn);
        }
        
        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const reason = lastDisconnect?.error?.output?.payload?.error;
          
          if (statusCode !== DisconnectReason.loggedOut) {
            const stats = this.connectionStats.get(reconnectToken) || {};
            this.connectionStats.set(reconnectToken, {
              ...stats,
              lastDisconnect: new Date(),
              status: 'disconnected',
              statusCode,
              reason
            });
            
            this.handleReconnect(conn, authFolder, reconnectToken);
          } else {
            this.activeTokens.delete(reconnectToken);
            this.connections.delete(reconnectToken);
            
            this.cleanupConnection(conn);
            
            try {
              const folderPath = path.join(CONFIG.AUTH_FOLDER, authFolder);
              if (existsSync(folderPath)) {
                await fs.rm(folderPath, { recursive: true, force: true });
              }
            } catch (e) {
              this.logger.error(`Failed to remove auth folder for ${reconnectToken}: ${e.message}`);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error handling connection update for ${reconnectToken}: ${error.message}`);
      }
    });
    
    conn.ev.on('creds.update', async () => {
      try {
        await saveCreds();
      } catch (error) {
        this.logger.error(`Error saving credentials for ${reconnectToken}: ${error.message}`);
      }
    });
    
    conn.ev.on('error', (err) => {
      this.logger.error(`Error event for ${reconnectToken}: ${err.message}`);
    });
  }

  setupPeriodicStateSaving(conn, authFolder) {
    const interval = setInterval(async () => {
      try {
        if (!conn.user || !conn.authState) {
          clearInterval(interval);
          return;
        }
        
        await conn.authState.saveState();
        
        if (CONFIG.BACKUP_ENABLED) {
          const credsPath = path.join(CONFIG.AUTH_FOLDER, authFolder, 'creds.json');
          const backupPath = path.join(CONFIG.AUTH_FOLDER, authFolder, 'creds.backup.json');
          
          if (existsSync(credsPath)) {
            copyFileSync(credsPath, backupPath);
          }
        }
      } catch (error) {
        this.logger.error(`Error saving state for ${authFolder}: ${error.message}`);
      }
    }, CONFIG.STATE_SAVE_INTERVAL);
    
    conn.stateInterval = interval;
  }

  setupHealthCheck(conn, authFolder, reconnectToken) {
    const interval = setInterval(async () => {
      try {
        if (!conn.ws) {
          clearInterval(interval);
          return;
        }
        
        if (conn.ws.readyState !== WebSocket.OPEN) {
          if (conn.ws.readyState === WebSocket.CLOSED) {
            clearInterval(interval);
            conn.ev.emit('connection.update', { 
              connection: 'close', 
              lastDisconnect: { 
                error: new Boom('WebSocket closed', { statusCode: DisconnectReason.connectionClosed }) 
              } 
            });
          }
        } else {
          const stats = this.connectionStats.get(reconnectToken) || {};
          if (stats.lastConnect) {
            const uptime = (new Date() - stats.lastConnect) / 1000 / 60;
            this.connectionStats.set(reconnectToken, {
              ...stats,
              uptime,
              lastHealthCheck: new Date()
            });
          }
          
          try {
            await conn.sendPresenceUpdate('available');
          } catch (error) {
            this.logger.warn(`Failed to send presence update for ${reconnectToken}: ${error.message}`);
          }
        }
      } catch (error) {
        this.logger.error(`Error in health check for ${reconnectToken}: ${error.message}`);
      }
    }, CONFIG.HEALTH_CHECK_INTERVAL);
    
    conn.healthInterval = interval;
  }

  setupPresenceUpdates(conn) {
    const interval = setInterval(async () => {
      try {
        if (!conn.user) {
          clearInterval(interval);
          return;
        }
        
        await conn.sendPresenceUpdate('available');
      } catch (error) {
        this.logger.error(`Error updating presence: ${error.message}`);
      }
    }, 60000);
    
    conn.presenceInterval = interval;
  }

  async loadAllSubbots() {
    try {
      if (!existsSync(CONFIG.AUTH_FOLDER)) {
        await fs.mkdir(CONFIG.AUTH_FOLDER, { recursive: true });
        return;
      }
      
      const subbotFolders = await fs.readdir(CONFIG.AUTH_FOLDER);
      
      const foldersToLoad = subbotFolders.slice(0, CONFIG.MAX_SUBBOTS);
      
      const loadPromises = foldersToLoad.map(async (folder) => {
        try {
          const folderPath = path.join(CONFIG.AUTH_FOLDER, folder);
          
          const stats = await fs.stat(folderPath);
          if (!stats.isDirectory()) return;
          
          const credsPath = path.join(folderPath, 'creds.json');
          if (!existsSync(credsPath)) return;
          
          try {
            const credsData = JSON.parse(await fs.readFile(credsPath, 'utf8'));
            if (!credsData.me) {
              return;
            }
          } catch (error) {
            return;
          }
          
          const match = folder.match(/(.+)sbt-(.+)/);
          if (!match) {
            return;
          }
          
          const [_, phoneNumber, subbotId] = match;
          const reconnectToken = `${phoneNumber}+${subbotId}`;
          
          if (this.activeTokens.has(reconnectToken)) {
            return;
          }
          
          this.activeTokens.add(reconnectToken);
          
          let auth;
          let state, saveCreds;
          try {
            const authResult = await useMultiFileAuthState(folderPath);
            auth = authResult;
            state = authResult.state;
            saveCreds = authResult.saveCreds;
          } catch (error) {
            this.activeTokens.delete(reconnectToken);
            return;
          }
          
          
          if (!state.creds || !state.creds.me) {
            this.activeTokens.delete(reconnectToken);
            return;
          }
          
          let version;
          try {
            const versionInfo = await fetchLatestBaileysVersion();
            version = versionInfo.version;
          } catch (error) {
            version = [2, 2323, 4];
          }
          
          const options = this.createConnectionOptions(state, version);
          
          const conn = makeWASocketOriginal(options);
          
          this.setupEventHandlers(conn, folder, reconnectToken, saveCreds);
          
          this.connections.set(reconnectToken, conn);
        } catch (error) {
          this.logger.error(`Error loading subbot ${folder}: ${error.message}`);
        }
      });
      
      await Promise.allSettled(loadPromises);
    } catch (error) {
      this.logger.error(`Error loading subbots: ${error.message}`);
    }
  }

  getConnectionStats() {
    const stats = {
      total: this.activeTokens.size,
      connected: 0,
      disconnected: 0,
      reconnecting: 0,
      details: []
    };
    
    for (const [token, data] of this.connectionStats.entries()) {
      if (data.status === 'connected') stats.connected++;
      else if (data.status === 'disconnected') stats.disconnected++;
      else if (data.status === 'reconnecting') stats.reconnecting++;
      
      stats.details.push({
        token,
        ...data
      });
    }
    
    return stats;
  }

  async createSubbot(phoneNumber) {
    try {
      const subbotId = randomUUID().slice(0, 8);
      const authFolder = `${phoneNumber}sbt-${subbotId}`;
      const folderPath = path.join(CONFIG.AUTH_FOLDER, authFolder);
      
      await fs.mkdir(folderPath, { recursive: true });
      
      const { state, saveCreds } = await useMultiFileAuthState(folderPath);
      
      const { version } = await fetchLatestBaileysVersion();
      
      const options = this.createConnectionOptions(state, version);
      
      const conn = makeWASocketOriginal(options);
      
      const reconnectToken = `${phoneNumber}+${subbotId}`;
      this.activeTokens.add(reconnectToken);
      
      this.setupEventHandlers(conn, authFolder, reconnectToken, saveCreds);
      
      this.connections.set(reconnectToken, conn);
      
      return {
        reconnectToken,
        authFolder,
        qr: null
      };
    } catch (error) {
      this.logger.error(`Error creating subbot: ${error.message}`);
      throw error;
    }
  }

  async removeSubbot(reconnectToken) {
    try {
      if (!this.activeTokens.has(reconnectToken)) {
        throw new Error(`Subbot ${reconnectToken} not found`);
      }
      
      const conn = this.connections.get(reconnectToken);
      
      this.cleanupConnection(conn);
      
      this.activeTokens.delete(reconnectToken);
      this.connections.delete(reconnectToken);
      this.connectionStats.delete(reconnectToken);
      
      if (this.reconnectTimers.has(reconnectToken)) {
        clearTimeout(this.reconnectTimers.get(reconnectToken));
        this.reconnectTimers.delete(reconnectToken);
      }
      
      const [phoneNumber, subbotId] = reconnectToken.split('+');
      const authFolder = `${phoneNumber}sbt-${subbotId}`;
      
      const folderPath = path.join(CONFIG.AUTH_FOLDER, authFolder);
      if (existsSync(folderPath)) {
        await fs.rm(folderPath, { recursive: true, force: true });
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error removing subbot ${reconnectToken}: ${error.message}`);
      throw error;
    }
  }
}

const manager = new SubBotManager();
await manager.loadAllSubbots();

setInterval(() => {
  const stats = manager.getConnectionStats();
  console.log(`SubBot Manager Stats: Total: ${stats.total}, Connected: ${stats.connected}, Disconnected: ${stats.disconnected}, Reconnecting: ${stats.reconnecting}`);
}, 5 * 60 * 1000);

export default manager;
