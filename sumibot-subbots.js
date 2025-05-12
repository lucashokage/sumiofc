import chalk from 'chalk'
import * as ws from 'ws'
import { fetchLatestBaileysVersion, useMultiFileAuthState, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import fs from 'fs'
import pino from 'pino'
import { makeWASocket } from './lib/simple.js'

/**
 * @param {string} targetJid
 * @returns {Promise<boolean>} 
 */
export async function resetSubbot(targetJid) {
  try {
    console.log(chalk.yellow(`🔄 Intentando reiniciar subbot: ${targetJid}`));
    
    // Buscar el subbot en las conexiones globales
    const targetBot = global.conns.find(conn => 
      conn.user && conn.user.jid === targetJid
    );
    
    if (!targetBot) {
      console.log(chalk.red(`❌ No se encontró el subbot con JID: ${targetJid}`));
      return false;
    }
  
    const subbotFolders = fs.readdirSync('./sumibots');
    let subbotFolder = null;
    
    // Buscar la carpeta correspondiente al subbot
    for (const folder of subbotFolders) {
      const folderPath = './sumibots/' + folder;
      
      if (fs.existsSync(`${folderPath}/creds.json`)) {
        try {
          const credsData = JSON.parse(fs.readFileSync(`${folderPath}/creds.json`, 'utf8'));
          if (credsData.me && credsData.me.id === targetJid) {
            subbotFolder = folder;
            break;
          }
        } catch (e) {
          console.error(chalk.red(`Error al leer credenciales en carpeta ${folder}:`, e));
        }
      }
    }
    
    if (!subbotFolder) {
      console.log(chalk.red(`❌ No se encontró la carpeta de credenciales para el subbot: ${targetJid}`));
      return false;
    }
    
    console.log(chalk.blue(`📁 Carpeta de subbot encontrada: ${subbotFolder}`));
    
    // Cerrar la conexión actual
    try {
      if (targetBot.ws.readyState !== ws.CLOSED) {
        targetBot.ws.close();
      }
      targetBot.ev.removeAllListeners();
      
      const index = global.conns.indexOf(targetBot);
      if (index >= 0) {
        delete global.conns[index];
        global.conns.splice(index, 1);
      }
      
      console.log(chalk.blue(`🔌 Conexión anterior cerrada correctamente`));
    } catch (error) {
      console.error(chalk.red(`Error al cerrar la conexión anterior:`, error));
    
    try {
      const folderPath = './sumibots/' + subbotFolder;
      const { state, saveCreds } = await useMultiFileAuthState(folderPath);
      const { version } = await fetchLatestBaileysVersion();
      
      const socketConfig = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: false,
        logger: pino({ level: 'fatal' }),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        browser: ['Ubuntu', 'Chrome', '4.1.0'],
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: 60000,
        retryRequestDelayMs: 1000,
        connectTimeoutMs: 60000,
      };
      
      let newConn = makeWASocket(socketConfig);
      newConn.isInit = false;
      newConn.uptime = new Date();
      
    
      let handler = await import('./handler.js');
      
      async function connectionUpdate(update) {
        const { connection, lastDisconnect, isNewLogin } = update;
        
        if (isNewLogin) {
          newConn.isInit = true;
        }
        
        if (connection === 'open') {
          newConn.uptime = new Date();
          newConn.isInit = true;
          global.conns.push(newConn);
          console.log(chalk.green(`✅ Subbot ${targetJid} reiniciado exitosamente`));
        }
      }
      
      newConn.handler = handler.handler.bind(newConn);
      newConn.connectionUpdate = connectionUpdate.bind(newConn);
      newConn.credsUpdate = saveCreds.bind(newConn, true);
      
  
      const safeEventHandler = (eventHandler) => {
        return async (...args) => {
          try {
            await eventHandler(...args);
          } catch (error) {
            console.error(`Error en manejador de eventos: ${error}`);
          }
        };
      };
      
      newConn.ev.on('messages.upsert', safeEventHandler(newConn.handler));
      newConn.ev.on('connection.update', safeEventHandler(newConn.connectionUpdate));
      newConn.ev.on('creds.update', safeEventHandler(newConn.credsUpdate));
      
      
      setupPeriodicStateSaving(newConn, subbotFolder);
      
      console.log(chalk.green(`🔄 Proceso de reinicio completado para ${targetJid}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Error al reiniciar subbot:`, error));
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`Error general en resetSubbot:`, error));
    return false;
  }
}

/**
 * @param {Object} conn 
 * @param {string} authFolder
 */
function setupPeriodicStateSaving(conn, authFolder) {
  setInterval(async () => {
    if (conn.user) {
      try {
        await conn.authState.saveState();
        console.log(chalk.blue(`Estado guardado correctamente para ${authFolder}`));
      } catch (error) {
        console.error(chalk.red(`Error al guardar estado para ${authFolder}:`, error));
      }
    }
  }, 300000); // Cada 5 minutos
}

/**
 * @returns {Array}
 */
export function getActiveSubbots() {
  return global.conns
    .filter(conn => conn.user && conn.ws.readyState !== ws.CLOSED)
    .map(conn => ({
      jid: conn.user.jid,
      name: conn.user.name || 'Sin nombre',
      uptime: conn.uptime ? new Date() - conn.uptime : 0,
      connected: conn.ws.readyState === ws.OPEN
    }));
}
