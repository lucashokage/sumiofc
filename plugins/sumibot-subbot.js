import { 
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import NodeCache from 'node-cache';
import { Boom } from '@hapi/boom';
import ws from 'ws';

const CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 15,
  RECONNECT_INTERVAL: 5 * 60 * 1000,
  HEALTH_CHECK_INTERVAL: 60 * 1000,
  STATE_SAVE_INTERVAL: 2 * 60 * 1000,
  CONNECTION_TIMEOUT: 90 * 1000,
  KEEP_ALIVE_INTERVAL: 30 * 1000,
  MAX_SUBBOTS: 150,
  EXPONENTIAL_BACKOFF: true,
  LOG_LEVEL: 'silent'
};

class SubBotManager {
  constructor() {
    this.connections = new Map();
    this.reconnectTimers = new Map();
    this.activeTokens = new Set();
    this.connectionStats = new Map();
    this.logger = pino({ level: CONFIG.LOG_LEVEL });
  }

  createConnectionOptions(state, version) {
    return {
      logger: this.logger,
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
      patchMessageBeforeSending: msg => msg
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
    try {
      if (this.reconnectTimers.has(reconnectToken)) {
        clearTimeout(this.reconnectTimers.get(reconnectToken));
      }
      
      const waitTime = this.calculateBackoffTime(attempts);
      
      const timer = setTimeout(async () => {
        try {
          if (!fs.existsSync(`./sumibots/${authFolder}`)) {
            this.activeTokens.delete(reconnectToken);
            return;
          }
          
          let state, saveCreds;
          let auth;
          try {
            auth = await useMultiFileAuthState(`./sumibots/${authFolder}`);
            state = auth.state;
            saveCreds = auth.saveCreds;
          } catch (error) {
            this.activeTokens.delete(reconnectToken);
            return;
          }
          
          if (!state.creds || !state.creds.me) {
            this.activeTokens.delete(reconnectToken);
            return;
          }
          
          const { version } = await fetchLatestBaileysVersion();
          
          const options = this.createConnectionOptions(state, version);
          
          const newConn = makeWASocket(options);
          
          this.setupEventHandlers(newConn, authFolder, reconnectToken, saveCreds);
          
          this.connectionStats.set(reconnectToken, {
            lastReconnect: new Date(),
            attempts: attempts + 1,
            uptime: 0,
            status: 'reconnecting'
          });
          
        } catch (error) {
          if (attempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
            this.handleReconnect(conn, authFolder, reconnectToken, attempts + 1);
          } else {
            this.activeTokens.delete(reconnectToken);
            
            try {
              if (fs.existsSync(`./sumibots/${authFolder}`)) {
                fs.rmdirSync(`./sumibots/${authFolder}`, { recursive: true });
              }
            } catch (e) {}
          }
        }
      }, waitTime);
      
      this.reconnectTimers.set(reconnectToken, timer);
      
    } catch (error) {}
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
          
          if (statusCode !== DisconnectReason.loggedOut) {
            const stats = this.connectionStats.get(reconnectToken) || {};
            this.connectionStats.set(reconnectToken, {
              ...stats,
              lastDisconnect: new Date(),
              status: 'disconnected',
              statusCode
            });
            
            this.handleReconnect(conn, authFolder, reconnectToken);
          } else {
            this.activeTokens.delete(reconnectToken);
          }
        }
      } catch (error) {}
    });
    
    conn.ev.on('creds.update', async () => {
      try {
        await saveCreds();
      } catch (error) {}
    });
    
    conn.ev.on('error', (err) => {});
  }

  setupPeriodicStateSaving(conn, authFolder) {
    const interval = setInterval(async () => {
      try {
        if (conn.user && conn.authState) {
          await conn.authState.saveState();
          
          const credsPath = `./sumibots/${authFolder}/creds.json`;
          const backupPath = `./sumibots/${authFolder}/creds.backup.json`;
          
          if (fs.existsSync(credsPath)) {
            fs.copyFileSync(credsPath, backupPath);
          }
        } else {
          clearInterval(interval);
        }
      } catch (error) {}
    }, CONFIG.STATE_SAVE_INTERVAL);
    
    conn.stateInterval = interval;
  }

  setupHealthCheck(conn, authFolder, reconnectToken) {
    const interval = setInterval(async () => {
      try {
        if (conn.ws.readyState !== ws.OPEN) {
          if (conn.ws.readyState === ws.CLOSED) {
            clearInterval(interval);
            conn.ev.emit('connection.update', { connection: 'close' });
          }
        } else {
          const stats = this.connectionStats.get(reconnectToken) || {};
          if (stats.lastConnect) {
            const uptime = (new Date() - stats.lastConnect) / 1000 / 60;
            this.connectionStats.set(reconnectToken, {
              ...stats,
              uptime
            });
          }
        }
      } catch (error) {}
    }, CONFIG.HEALTH_CHECK_INTERVAL);
    
    conn.healthInterval = interval;
  }

  setupPresenceUpdates(conn) {
    const interval = setInterval(async () => {
      try {
        if (conn.user) {
          await conn.sendPresenceUpdate('available', conn.user.jid);
        } else {
          clearInterval(interval);
        }
      } catch (error) {}
    }, 60000);
    
    conn.presenceInterval = interval;
  }

  async loadAllSubbots() {
    try {
      if (!fs.existsSync('./sumibots')) {
        fs.mkdirSync('./sumibots', { recursive: true });
        return;
      }
      
      const subbotFolders = fs.readdirSync('./sumibots');
      
      const foldersToLoad = subbotFolders.slice(0, CONFIG.MAX_SUBBOTS);
      
      for (const folder of foldersToLoad) {
        const folderPath = path.join('./sumibots', folder);
        
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        const credsPath = path.join(folderPath, 'creds.json');
        if (!fs.existsSync(credsPath)) continue;
        
        try {
          const match = folder.match(/(.+)sbt-(.+)/);
          if (!match) continue;
          
          const [_, phoneNumber, subbotId] = match;
          const reconnectToken = `${phoneNumber}+${subbotId}`;
          
          if (this.activeTokens.has(reconnectToken)) continue;
          
          this.activeTokens.add(reconnectToken);
          
          let state, saveCreds;
          let auth;
          try {
            auth = await useMultiFileAuthState(folderPath);
            state = auth.state;
            saveCreds = auth.saveCreds;
          } catch (error) {
            this.activeTokens.delete(reconnectToken);
            continue;
          }
          
          if (!state.creds || !state.creds.me) {
            this.activeTokens.delete(reconnectToken);
            continue;
          }
          
          const { version } = await fetchLatestBaileysVersion();
          
          const options = this.createConnectionOptions(state, version);
          
          const conn = makeWASocket(options);
          
          this.setupEventHandlers(conn, folder, reconnectToken, saveCreds);
          
          this.connections.set(reconnectToken, conn);
        } catch (error) {}
      }
    } catch (error) {}
  }

  getConnectionStats() {
    const stats = {
      total: this.activeTokens.size,
      connected: 0,
      disconnected: 0,
      reconnecting: 0
    };
    
    for (const [token, data] of this.connectionStats.entries()) {
      if (data.status === 'connected') stats.connected++;
      else if (data.status === 'disconnected') stats.disconnected++;
      else if (data.status === 'reconnecting') stats.reconnecting++;
    }
    
    return stats;
  }
}

function makeWASocket(options) {
  return {
    user: { jid: 'simulated@s.whatsapp.net' },
    authState: options.auth,
    ws: { readyState: ws.OPEN },
    ev: {
      on: (event, handler) => {},
      emit: (event, data) => {},
      off: (event, handler) => {}
    },
    sendPresenceUpdate: async (presence, jid) => {
      return true;
    }
  };
}

const manager = new SubBotManager();
await manager.loadAllSubbots();

setInterval(() => {
  const stats = manager.getConnectionStats();
}, 5 * 60 * 1000);
