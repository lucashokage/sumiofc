const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion, 
    MessageRetryMap,
    makeCacheableSignalKeyStore, 
    jidNormalizedUser,
    PHONENUMBER_MCC
} = await import('@whiskeysockets/baileys')
import moment from 'moment-timezone'
import NodeCache from 'node-cache'
import readline from 'readline'
import qrcode from "qrcode"
import crypto from 'crypto'
import fs from "fs"
import pino from 'pino'
import * as ws from 'ws'
import chalk from 'chalk'
import { spawn, exec } from 'child_process'
import path from 'path'
import util from 'util'
const { CONNECTING, CLOSED } = ws
import { Boom } from '@hapi/boom'
import { makeWASocket } from '../lib/simple.js'

// Inicializar array de conexiones si no existe
if (global.conns instanceof Array) console.log()
else global.conns = []

// Configuración centralizada para fácil ajuste
const CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 10 * 60 * 1000,
  HEALTH_CHECK_INTERVAL: 60 * 1000,
  STATE_SAVE_INTERVAL: 2 * 60 * 1000,
  PRESENCE_UPDATE_INTERVAL: 60 * 1000,
  MAX_SUBBOTS: 120,
  AUTH_FOLDER: './sumibots',
  BACKUP_ENABLED: true,
  CONNECTION_TIMEOUT: 60000,
  RETRY_REQUEST_DELAY: 15000,
  LOG_LEVEL: 'silent'
}

// Mapas y conjuntos para seguimiento de conexiones
const initialConnections = new Map()
const reconnectTimers = new Map()
const activeConnections = new Set()
const connectionStats = new Map()
const userSubbotCount = new Map()

// Variables globales
let store
let loadDatabase

/**
 * Handler principal para el comando .code
 */
let handler = async (m, { conn: _conn, args, usedPrefix, command, isOwner }) => {
  // Verificar si el comando se está ejecutando desde el bot principal
  let parent = args[0] && args[0] == 'plz' ? _conn : await global.conn
  if (!((args[0] && args[0] == 'plz') || (await global.conn).user.jid == _conn.user.jid)) {
    throw `📌 No puedes usar este bot como sub-bot\n\n wa.me/${global.conn.user.jid.split`@`[0]}?text=${usedPrefix}.code`
  }

  // Función principal para crear un sub-bot
  async function bbts() {
    try {
      // Obtener información del remitente
      let phoneNumber = m.sender.split('@')[0]
      let subbotId = crypto.randomBytes(4).toString('hex')
      let authFolderB = `${phoneNumber}sbt-${subbotId}`
      let authFolderPath = path.join(CONFIG.AUTH_FOLDER, authFolderB)

      // Limitar el número de sub-bots por usuario
      const userSubbots = Array.from(activeConnections)
        .filter(token => token.startsWith(phoneNumber + '+'))
        .length
      
      if (userSubbots >= 2 && !isOwner) {
        await parent.sendMessage(m.chat, { 
          text: "❌ Has alcanzado el límite de sub-bots permitidos (2). Desconecta alguno antes de crear uno nuevo." 
        }, { quoted: m })
        return
      }

      // Crear carpeta para el sub-bot si no existe
      if (!fs.existsSync(authFolderPath)){
        fs.mkdirSync(authFolderPath, { recursive: true });
      }
      
      // Si se proporcionan credenciales (reconexión), guardarlas
      if (args[0] && args[0] !== 'plz') {
        try {
          const credsData = JSON.parse(Buffer.from(args[0], "base64").toString("utf-8"))
          fs.writeFileSync(path.join(authFolderPath, "creds.json"), JSON.stringify(credsData, null, '\t'))
        } catch (error) {
          await parent.sendMessage(m.chat, { text: "❌ Error al procesar las credenciales. Formato inválido." }, { quoted: m })
          return
        }
      }
      
      // Inicializar estado de autenticación
      let state = null
      let saveCreds = null
      try {
        const authResult = await useMultiFileAuthState(authFolderPath);
        state = authResult.state;
        saveCreds = authResult.saveCreds;
      } catch (error) {
        await parent.sendMessage(m.chat, { text: "❌ Error al inicializar el estado de autenticación." }, { quoted: m })
        return;
      }

      // Obtener la versión más reciente de Baileys
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 2323, 4] }));

      // Configurar caché y contadores de reintentos
      const msgRetryCounterMap = (MessageRetryMap) => { };
      const msgRetryCounterCache = new NodeCache()

      // Determinar el método de conexión
      const methodCodeQR = process.argv.includes("qr")
      const methodCode = !!phoneNumber || process.argv.includes("code")
      const MethodMobile = process.argv.includes("mobile")

      // Configurar readline para entrada/salida
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

      // Opciones de conexión para Baileys
      const connectionOptions = {
        logger: pino({ level: CONFIG.LOG_LEVEL }),
        printQRInTerminal: false,
        mobile: MethodMobile, 
        browser: [ "Ubuntu", "Chrome", "20.0.04" ], 
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true, 
        generateHighQualityLinkPreview: true, 
        getMessage: async (clave) => {
          let jid = jidNormalizedUser(clave.remoteJid)
          let msg = await store?.loadMessage(jid, clave.id)
          return msg?.message || ""
        },
        msgRetryCounterCache,
        msgRetryCounterMap,
        defaultQueryTimeoutMs: CONFIG.CONNECTION_TIMEOUT,
        version,
        retryRequestDelayMs: CONFIG.RETRY_REQUEST_DELAY,
        connectTimeoutMs: CONFIG.CONNECTION_TIMEOUT,
        keepAliveIntervalMs: CONFIG.RECONNECT_INTERVAL
      }

      // Crear la conexión
      let conn = makeWASocket(connectionOptions)
      let reconnectAttempts = 0
      let autoReconnectTimer = null
      
      // Determinar si es una reconexión
      const isReconnect = !!args[0] && args[0] !== 'plz'
      const reconnectToken = `${phoneNumber}+${subbotId}`

      // Si es un nuevo sub-bot, solicitar código de vinculación
      if (methodCode && !conn.authState.creds.registered) {
        if (!phoneNumber) {
          rl.close();
          return;
        }
        
        let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (!Object.keys(PHONENUMBER_MCC).some(v => cleanedNumber.startsWith(v))) {
          await parent.sendMessage(m.chat, { text: "❌ Número de teléfono inválido." }, { quoted: m })
          rl.close();
          return;
        }

        setTimeout(async () => {
          try {
            let codeBot = await conn.requestPairingCode(cleanedNumber);
            codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
            
            await parent.sendFile(m.chat, 'https://i.ibb.co/SKKdvRb/code.jpg', 'qrcode.png', 
              `❀ CODE DE VINCULACION ❀\n\n❍ Conexion Sub-Bot Mode Code\n\n$ ✿ Usa este Código para convertirte en un Sub-Bot Temporal.\n\n1 » Haga clic en los tres puntos en la esquina superior derecha\n\n2 » Toque dispositivos vinculados\n\n3 » Selecciona Vincular con el número de teléfono\n\n4 » Escriba el Código para iniciar sesion con el bot\n\n❏  No es recomendable usar tu cuenta principal.`, m)
            
            await parent.sendMessage(m.chat, { text: codeBot }, { quoted: m })
            
            rl.close();
          } catch (error) {
            await parent.sendMessage(m.chat, { text: "❌ Error al generar el código. Intente nuevamente." }, { quoted: m });
            rl.close();
          }
        }, 3000);
      }

      // Inicializar estado de la conexión
      conn.isInit = false
      let isInit = true
      conn.uptime = new Date()

      // Programar reconexión automática
      function scheduleAutoReconnect() {
        if (autoReconnectTimer) clearTimeout(autoReconnectTimer);
        
        autoReconnectTimer = setTimeout(() => {
          if (conn.ws && conn.ws.readyState !== CLOSED) {
            conn.ws.close();
          }
        }, CONFIG.RECONNECT_INTERVAL);
      }

      // Función para limpiar recursos de conexión
      function cleanupConnection(connection) {
        try {
          if (connection.handler) connection.ev.off('messages.upsert', connection.handler);
          if (connection.participantsUpdate) connection.ev.off('group-participants.update', connection.participantsUpdate);
          if (connection.groupsUpdate) connection.ev.off('groups.update', connection.groupsUpdate);
          if (connection.onCall) connection.ev.off('call', connection.onCall);
          if (connection.connectionUpdate) connection.ev.off('connection.update', connection.connectionUpdate);
          if (connection.credsUpdate) connection.ev.off('creds.update', connection.credsUpdate);
          
          if (connection.ws && connection.ws.readyState !== CLOSED) {
            connection.ws.close();
          }
          
          if (connection.stateInterval) clearInterval(connection.stateInterval);
          if (connection.healthInterval) clearInterval(connection.healthInterval);
          if (connection.presenceInterval) clearInterval(connection.presenceInterval);
          
          connection.ev.removeAllListeners();
        } catch (error) {}
      }
      
      // Función para limpiar y eliminar un sub-bot
      function cleanupAndRemove() {
        try {
          let i = global.conns.indexOf(conn);
          if (i >= 0) {
            delete global.conns[i];
            global.conns.splice(i, 1);
          }
          
          cleanupConnection(conn);
          
          if (fs.existsSync(authFolderPath)) {
            fs.rmdirSync(authFolderPath, { recursive: true });
          }
          
          activeConnections.delete(reconnectToken);
          connectionStats.delete(reconnectToken);
          
          if (reconnectTimers.has(reconnectToken)) {
            clearTimeout(reconnectTimers.get(reconnectToken));
            reconnectTimers.delete(reconnectToken);
          }
        } catch (error) {}
      }

      // Manejar actualizaciones de conexión
      async function connectionUpdate(update) {
        try {
          const { connection, lastDisconnect, isNewLogin, qr } = update
          if (isNewLogin) conn.isInit = true

          const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
          
          if (connection === 'close') {
            let i = global.conns.indexOf(conn)
            if (i < 0) return console.log(await creloadHandler(true).catch(() => {}))
            
            if (code !== DisconnectReason.loggedOut) {
              if (reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                
                const waitTime = 5000 * Math.pow(1.5, reconnectAttempts);
                
                connectionStats.set(reconnectToken, {
                  lastDisconnect: new Date(),
                  reconnectAttempt: reconnectAttempts,
                  nextReconnect: new Date(Date.now() + waitTime),
                  status: 'disconnected'
                });
                
                if (reconnectTimers.has(reconnectToken)) {
                  clearTimeout(reconnectTimers.get(reconnectToken));
                }
                
                const timer = setTimeout(async () => {
                  try {
                    cleanupConnection(conn);
                    
                    if (!fs.existsSync(authFolderPath)) {
                      activeConnections.delete(reconnectToken);
                      return;
                    }
                    
                    try {
                      const authResult = await useMultiFileAuthState(authFolderPath);
                      state = authResult.state;
                      saveCreds = authResult.saveCreds;
                      
                      connectionOptions.auth = {
                        creds: state.creds,
                        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                      };
                      
                      conn = makeWASocket(connectionOptions);
                      await creloadHandler(false);
                      
                      connectionStats.set(reconnectToken, {
                        lastReconnect: new Date(),
                        reconnectAttempt: reconnectAttempts,
                        status: 'reconnecting'
                      });
                    } catch (error) {
                      if (reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                        setTimeout(() => connectionUpdate({ connection: 'close', lastDisconnect: { error: new Boom('Reconnection failed', { statusCode: DisconnectReason.connectionClosed }) } }), 10000);
                      } else {
                        cleanupAndRemove();
                      }
                    }
                  } catch (err) {
                    if (reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                      setTimeout(() => connectionUpdate({ connection: 'close', lastDisconnect: { error: new Boom('Reconnection failed', { statusCode: DisconnectReason.connectionClosed }) } }), 10000);
                    } else {
                      cleanupAndRemove();
                    }
                  }
                }, waitTime);
                
                reconnectTimers.set(reconnectToken, timer);
              } else {
                cleanupAndRemove();
              }
            } else {
              cleanupAndRemove();
            }
          } else if (connection === 'open') {
            reconnectAttempts = 0;
            conn.uptime = new Date();
            
            connectionStats.set(reconnectToken, {
              lastConnect: new Date(),
              uptime: 0,
              status: 'connected'
            });
            
            scheduleAutoReconnect();
            setupPeriodicStateSaving(conn, authFolderB);
            setupHealthCheck(conn, authFolderB, reconnectToken);
          }
          
          if (global.db && global.db.data == null) loadDatabase();

          if (connection == 'open') {
            conn.isInit = true
            
            if (!global.conns.includes(conn)) {
              global.conns.push(conn)
            }
            
            if (!activeConnections.has(reconnectToken)) {
              activeConnections.add(reconnectToken);
              
              await parent.sendMessage(m.chat, {
                text: `✅ Conectado exitosamente al bot!`
              }, { quoted: m });
              
              await sleep(5000);
              
              if (!isReconnect) {
                await parent.sendMessage(conn.user.jid, {
                  text: `*✅ ¡Conectado exitosamente!*\n\nPara reconectarte usa: .rconect ${reconnectToken}`
                });
              }
            }
          }
        } catch (error) {}
      }

      // Configurar actualizaciones de presencia
      setupPresenceUpdates(conn);
      
      // Cargar el manejador de eventos
      let handler = await import('../handler.js')
      let creloadHandler = async function (restatConn) {
        try {
          const Handler = await import(`../handler.js?update=${Date.now()}`).catch(() => {})
          if (Object.keys(Handler || {}).length) handler = Handler
        } catch (e) {}
        
        if (restatConn) {
          try { 
            cleanupConnection(conn);
            conn = makeWASocket(connectionOptions)
            isInit = true
          } catch (error) {}
        }

        if (!isInit) {
          cleanupConnection(conn);
        }
        
        // Copiar propiedades del bot principal
        conn.welcome = global.conn.welcome + ''
        conn.bye = global.conn.bye + ''
        conn.spromote = global.conn.spromote + ''
        conn.sdemote = global.conn.sdemote + ''

        // Configurar manejadores de eventos
        conn.handler = handler.handler.bind(conn)
        
        conn.participantsUpdate = async function(...args) {
          try {
            if (args[0] && args[0].participants) {
              return await handler.participantsUpdate.apply(this, args);
            }
          } catch (error) {}
        }
        
        conn.groupsUpdate = handler.groupsUpdate.bind(conn)
        conn.connectionUpdate = connectionUpdate.bind(conn)
        conn.credsUpdate = saveCreds.bind(conn, true)

        // Envolver manejadores de eventos con manejo de errores
        const safeEventHandler = (eventHandler) => {
          return async (...args) => {
            try {
              await eventHandler(...args);
            } catch (error) {}
          };
        };

        // Registrar manejadores de eventos
        conn.ev.on('messages.upsert', safeEventHandler(conn.handler))
        conn.ev.on('group-participants.update', safeEventHandler(conn.participantsUpdate))
        conn.ev.on('groups.update', safeEventHandler(conn.groupsUpdate))
        conn.ev.on('connection.update', safeEventHandler(conn.connectionUpdate))
        conn.ev.on('creds.update', safeEventHandler(conn.credsUpdate))
        
        conn.ev.on('error', (error) => {});
        
        isInit = false
        return true
      }
      
      // Inicializar el manejador
      await creloadHandler(false)
    } catch (error) {
      console.error("Error en bbts:", error);
      await parent.sendMessage(m.chat, { text: "❌ Ocurrió un error al iniciar el sub-bot. Intente nuevamente." }, { quoted: m });
    }
  }
  
  // Ejecutar la función principal
  await bbts()
}

/**
 * Cargar sub-bots existentes al iniciar
 */
async function loadSubbots() {
  try {
    if (!fs.existsSync(CONFIG.AUTH_FOLDER)) {
      fs.mkdirSync(CONFIG.AUTH_FOLDER, { recursive: true });
      return;
    }
    
    const subbotFolders = fs.readdirSync(CONFIG.AUTH_FOLDER);
    const foldersToLoad = subbotFolders.slice(0, CONFIG.MAX_SUBBOTS);
    
    console.log(`Cargando ${foldersToLoad.length} sub-bots...`);
    
    for (const folder of foldersToLoad) {
      const folderPath = path.join(CONFIG.AUTH_FOLDER, folder);
      
      if (!fs.statSync(folderPath).isDirectory()) continue;
      
      const credsPath = path.join(folderPath, 'creds.json');
      if (!fs.existsSync(credsPath)) continue;
      
      try {
        const match = folder.match(/(.+)sbt-(.+)/);
        if (!match) continue;
        
        const [_, phoneNumber, subbotId] = match;
        const reconnectToken = `${phoneNumber}+${subbotId}`;
        
        if (activeConnections.has(reconnectToken)) continue;
        
        // Verificar si las credenciales son válidas
        let credsData;
        try {
          credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
          if (!credsData.me) {
            console.log(`Credenciales inválidas para ${reconnectToken}, omitiendo`);
            continue;
          }
        } catch (error) {
          console.error(`Error al leer credenciales para ${folder}:`, error.message);
          continue;
        }
        
        // Obtener estado de autenticación
        let state = null
        let saveCreds = null
        try {
          const authResult = await useMultiFileAuthState(folderPath);
          state = authResult.state;
          saveCreds = authResult.saveCreds;
          
          if (!state.creds || !state.creds.me) {
            console.log(`Estado de autenticación inválido para ${reconnectToken}, omitiendo`);
            continue;
          }
        } catch (error) {
          console.error(`Error al obtener estado de autenticación para ${reconnectToken}:`, error.message);
          continue;
        }
        
        // Obtener versión de Baileys
        const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 2323, 4] }));
        
        // Configurar opciones de conexión
        const socketConfig = {
          version,
          keepAliveIntervalMs: CONFIG.RECONNECT_INTERVAL,
          printQRInTerminal: false,
          logger: pino({ level: CONFIG.LOG_LEVEL }),
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
          },
          browser: ['Ubuntu', 'Chrome', '20.0.04'],
          markOnlineOnConnect: true,
          generateHighQualityLinkPreview: true,
          defaultQueryTimeoutMs: CONFIG.CONNECTION_TIMEOUT,
          retryRequestDelayMs: CONFIG.RETRY_REQUEST_DELAY,
          connectTimeoutMs: CONFIG.CONNECTION_TIMEOUT
        };

        // Crear conexión
        let sock = makeWASocket(socketConfig);
        sock.isInit = false;
        sock.uptime = new Date();
        
        activeConnections.add(reconnectToken);
        
        let reconnectAttempts = 0;
        let autoReconnectTimer = null;
        
        initialConnections.set(folder, true);

        // Programar reconexión automática
        function scheduleAutoReconnect() {
          if (autoReconnectTimer) clearTimeout(autoReconnectTimer);
          
          autoReconnectTimer = setTimeout(() => {
            if (sock.ws && sock.ws.readyState !== CLOSED) {
              sock.ws.close();
            }
          }, CONFIG.RECONNECT_INTERVAL);
        }

        // Función para limpiar recursos de conexión
        function cleanupConnection(connection) {
          try {
            if (connection.handler) connection.ev.off('messages.upsert', connection.handler);
            if (connection.participantsUpdate) connection.ev.off('group-participants.update', connection.participantsUpdate);
            if (connection.groupsUpdate) connection.ev.off('groups.update', connection.groupsUpdate);
            if (connection.onCall) connection.ev.off('call', connection.onCall);
            if (connection.connectionUpdate) connection.ev.off('connection.update', connection.connectionUpdate);
            if (connection.credsUpdate) connection.ev.off('creds.update', connection.credsUpdate);
            
            if (connection.ws && connection.ws.readyState !== CLOSED) {
              connection.ws.close();
            }
            
            if (connection.stateInterval) clearInterval(connection.stateInterval);
            if (connection.healthInterval) clearInterval(connection.healthInterval);
            if (connection.presenceInterval) clearInterval(connection.presenceInterval);
            
            connection.ev.removeAllListeners();
          } catch (error) {}
        }
        
        // Función para limpiar y eliminar un sub-bot
        function cleanupAndRemove() {
          try {
            let i = global.conns.indexOf(sock);
            if (i >= 0) {
              delete global.conns[i];
              global.conns.splice(i, 1);
            }
            
            cleanupConnection(sock);
            
            if (fs.existsSync(folderPath)) {
              fs.rmdirSync(folderPath, { recursive: true });
            }
            
            activeConnections.delete(reconnectToken);
            connectionStats.delete(reconnectToken);
            
            if (reconnectTimers.has(reconnectToken)) {
              clearTimeout(reconnectTimers.get(reconnectToken));
              reconnectTimers.delete(reconnectToken);
            }
          } catch (error) {}
        }

        // Manejar actualizaciones de conexión
        async function connectionUpdate(update) {
          try {
            const { connection, lastDisconnect, isNewLogin } = update;
            
            if (isNewLogin) {
              sock.isInit = true;
            }

            const statusCode = lastDisconnect?.error?.output?.statusCode || 
                            lastDisconnect?.error?.output?.payload?.statusCode;

            if (connection === 'open') {
              sock.uptime = new Date();
              sock.isInit = true;
              
              if (!global.conns.includes(sock)) {
                global.conns.push(sock);
              }
              
              reconnectAttempts = 0;
              
              connectionStats.set(reconnectToken, {
                lastConnect: new Date(),
                uptime: 0,
                status: 'connected'
              });
              
              scheduleAutoReconnect();
              setupPeriodicStateSaving(sock, folder);
              setupHealthCheck(sock, folder, reconnectToken);
            }

            if (connection === 'close') {
              if (statusCode !== DisconnectReason.loggedOut) {
                if (reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                  reconnectAttempts++;
                  
                  const waitTime = 5000 * Math.pow(1.5, reconnectAttempts);
                  
                  connectionStats.set(reconnectToken, {
                    lastDisconnect: new Date(),
                    reconnectAttempt: reconnectAttempts,
                    nextReconnect: new Date(Date.now() + waitTime),
                    status: 'disconnected'
                  });
                  
                  if (reconnectTimers.has(reconnectToken)) {
                    clearTimeout(reconnectTimers.get(reconnectToken));
                  }
                  
                  const timer = setTimeout(async () => {
                    try {
                      cleanupConnection(sock);
                      
                      if (!fs.existsSync(folderPath)) {
                        activeConnections.delete(reconnectToken);
                        return;
                      }
                      
                      try {
                        const authResult = await useMultiFileAuthState(folderPath);
                        state = authResult.state;
                        saveCreds = authResult.saveCreds;
                        
                        socketConfig.auth = {
                          creds: state.creds,
                          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                        };
                        
                        sock = makeWASocket(socketConfig);
                        await reloadHandler(false);
                        
                        connectionStats.set(reconnectToken, {
                          lastReconnect: new Date(),
                          reconnectAttempt: reconnectAttempts,
                          status: 'reconnecting'
                        });
                      } catch (error) {
                        if (reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                          setTimeout(() => connectionUpdate({ connection: 'close', lastDisconnect: { error: new Boom('Reconnection failed', { statusCode: DisconnectReason.connectionClosed }) } }), 10000);
                        } else {
                          cleanupAndRemove();
                        }
                      }
                    } catch (err) {
                      if (reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                        setTimeout(() => connectionUpdate({ connection: 'close', lastDisconnect: { error: new Boom('Reconnection failed', { statusCode: DisconnectReason.connectionClosed }) } }), 10000);
                      } else {
                        cleanupAndRemove();
                      }
                    }
                  }, waitTime);
                  
                  reconnectTimers.set(reconnectToken, timer);
                } else {
                  cleanupAndRemove();
                }
              } else {
                cleanupAndRemove();
              }
            }
          } catch (error) {}
        }

        // Cargar manejador de eventos
        let handler = await import('../handler.js');
        let reloadHandler = async (restartConnection) => {
          try {
            const newHandler = await import(`../handler.js?update=${Date.now()}`);
            if (Object.keys(newHandler).length) {
              handler = newHandler;
            }
          } catch (err) {}

          if (restartConnection) {
            try {
              cleanupConnection(sock);
              sock = makeWASocket(socketConfig);
            } catch (error) {}
          }

          // Configurar manejadores de eventos
          sock.handler = handler.handler.bind(sock);
          
          sock.participantsUpdate = async function(...args) {
            try {
              if (args[0] && args[0].participants) {
                return await handler.participantsUpdate.apply(this, args);
              }
            } catch (error) {}
          }
          
          sock.groupsUpdate = handler.groupsUpdate.bind(sock);
          sock.connectionUpdate = connectionUpdate.bind(sock);
          sock.credsUpdate = saveCreds.bind(sock, true);
          
          // Envolver manejadores de eventos con manejo de errores
          const safeEventHandler = (eventHandler) => {
            return async (...args) => {
              try {
                await eventHandler(...args);
              } catch (error) {}
            };
          };
          
          // Registrar manejadores de eventos
          sock.ev.on('messages.upsert', safeEventHandler(sock.handler));
          sock.ev.on('group-participants.update', safeEventHandler(sock.participantsUpdate));
          sock.ev.on('groups.update', safeEventHandler(sock.groupsUpdate));
          sock.ev.on('connection.update', safeEventHandler(sock.connectionUpdate));
          sock.ev.on('creds.update', safeEventHandler(sock.credsUpdate));
          
          sock.ev.on('error', (error) => {});
          
          return true;
        };

        // Inicializar manejador
        await reloadHandler(false);
        setupPresenceUpdates(sock);
      } catch (err) {
        console.error(`Error al cargar sub-bot ${folder}:`, err);
      }
    }
    
    console.log(`Se cargaron ${activeConnections.size} sub-bots correctamente.`);
  } catch (error) {
    console.error("Error al cargar sub-bots:", error);
  }
}

/**
 * Configurar guardado periódico de estado
 */
function setupPeriodicStateSaving(conn, authFolder) {
  const interval = setInterval(async () => {
    try {
      if (conn.user && conn.authState) {
        await conn.authState.saveState();
        
        if (CONFIG.BACKUP_ENABLED) {
          const credsPath = path.join(CONFIG.AUTH_FOLDER, authFolder, 'creds.json');
          const backupPath = path.join(CONFIG.AUTH_FOLDER, authFolder, 'creds.backup.json');
          
          if (fs.existsSync(credsPath)) {
            fs.copyFileSync(credsPath, backupPath);
          }
        }
      } else {
        clearInterval(interval);
      }
    } catch (error) {}
  }, CONFIG.STATE_SAVE_INTERVAL);
  
  conn.stateInterval = interval;
}

/**
 * Configurar verificación periódica de salud
 */
function setupHealthCheck(conn, authFolder, reconnectToken) {
  const interval = setInterval(async () => {
    try {
      if (!conn.ws) {
        clearInterval(interval);
        return;
      }
      
      if (conn.ws.readyState !== ws.OPEN) {
        if (conn.ws.readyState === ws.CLOSED) {
          clearInterval(interval);
          conn.ev.emit('connection.update', { 
            connection: 'close', 
            lastDisconnect: { 
              error: new Boom('WebSocket closed', { statusCode: DisconnectReason.connectionClosed }) 
            } 
          });
        }
      } else {
        const stats = connectionStats.get(reconnectToken) || {};
        if (stats.lastConnect) {
          const uptime = (new Date() - stats.lastConnect) / 1000 / 60;
          connectionStats.set(reconnectToken, {
            ...stats,
            uptime,
            lastHealthCheck: new Date()
          });
        }
      }
    } catch (error) {}
  }, CONFIG.HEALTH_CHECK_INTERVAL);
  
  conn.healthInterval = interval;
}

/**
 * Configurar actualizaciones periódicas de presencia
 */
function setupPresenceUpdates(conn) {
  const interval = setInterval(async () => {
    try {
      if (conn.user) {
        await conn.sendPresenceUpdate('available');
      } else {
        clearInterval(interval);
      }
    } catch (error) {}
  }, CONFIG.PRESENCE_UPDATE_INTERVAL);
  
  conn.presenceInterval = interval;
}

/**
 * Configurar verificación periódica de salud global
 */
function setupPeriodicHealthCheck() {
  setInterval(async () => {
    try {
      const activeConns = global.conns.filter(conn => conn.user && conn.ws && conn.ws.readyState !== ws.CLOSED);
      
      for (let conn of global.conns) {
        if (conn.user && conn.ws && conn.ws.readyState === ws.CLOSED) {
          try {
            conn.ev.emit('connection.update', { 
              connection: 'close', 
              lastDisconnect: { 
                error: new Boom('WebSocket closed', { statusCode: DisconnectReason.connectionClosed }) 
              } 
            });
          } catch (error) {}
        }
      }
      
      console.log(`Sub-bots activos: ${activeConns.length}/${global.conns.length}`);
    } catch (error) {}
  }, 120000);
}

/**
 * Función de utilidad para esperar
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Manejador para el comando de reconexión
 */
global.handleReconnectCommand = async (m, { conn, args, usedPrefix }) => {
  if (!args[0]) return conn.reply(m.chat, `Formato incorrecto. Uso: ${usedPrefix}rconect [token]`, m);
  
  const token = args[0];
  const tokenParts = token.split('+');
  
  if (tokenParts.length !== 2) return conn.reply(m.chat, 'Token inválido. Debe tener formato: número+ID', m);
  
  const [phoneNumber, subbotId] = tokenParts;
  const authFolderB = `${phoneNumber}sbt-${subbotId}`;
  const folderPath = path.join(CONFIG.AUTH_FOLDER, authFolderB);
  
  if (!fs.existsSync(folderPath)) {
    return conn.reply(m.chat, 'No se encontró ninguna sesión con ese token.', m);
  }
  
  if (activeConnections.has(token)) {
    return conn.reply(m.chat, 'Este bot ya está conectado.', m);
  }
  
  try {
    const credsBase64 = Buffer.from(fs.readFileSync(path.join(folderPath, 'creds.json'), "utf-8")).toString("base64");
    
    await handler(m, { conn, args: [credsBase64], usedPrefix, command: 'code' });
    return;
  } catch (error) {
    return conn.reply(m.chat, '❌ Error al procesar la solicitud. Intente nuevamente.', m);
  }
}

/**

 */
global.handleStatusCommand = async (m, { conn }) => {
  try {
    const totalBots = activeConnections.size;
    const connectedBots = Array.from(connectionStats.values()).filter(stat => stat.status === 'connected').length;
    const reconnectingBots = Array.from(connectionStats.values()).filter(stat => stat.status === 'reconnecting').length;
    const disconnectedBots = Array.from(connectionStats.values()).filter(stat => stat.status === 'disconnected').length;
    
    let message = `*📊 Estado de Sub-Bots*\n\n`;
    message += `Total: ${totalBots}\n`;
    message += `Conectados: ${connectedBots}\n`;
    message += `Reconectando: ${reconnectingBots}\n`;
    message += `Desconectados: ${disconnectedBots}\n\n`;
    
    if (m.sender.split('@')[0] === global.conn.user.jid.split('@')[0] || m.isOwner) {
      message += `*Detalles de conexiones:*\n\n`;
      
      for (const [token, stats] of connectionStats.entries()) {
        const [phone, id] = token.split('+');
        const maskedPhone = phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
        
        message += `ID: ${maskedPhone}+${id.substring(0, 4)}\n`;
        message += `Estado: ${stats.status}\n`;
        
        if (stats.uptime) {
          message += `Tiempo activo: ${Math.floor(stats.uptime)} minutos\n`;
        }
        
        if (stats.lastConnect) {
          message += `Última conexión: ${formatDate(stats.lastConnect)}\n`;
        }
        
        if (stats.lastDisconnect) {
          message += `Última desconexión: ${formatDate(stats.lastDisconnect)}\n`;
        }
        
        message += `\n`;
      }
    }
    
    await conn.reply(m.chat, message, m);
  } catch (error) {
    await conn.reply(m.chat, '❌ Error al obtener el estado de los sub-bots.', m);
  }
}

/**
 * Función de utilidad para formatear fechas
 */
function formatDate(date) {
  return moment(date).format('DD/MM/YY HH:mm:ss');
}

await loadSubbots().catch((error) => {
  console.error("Error en carga inicial de sub-bots:", error);
});

setupPeriodicHealthCheck();

// Configuración del handler
handler.help = ['botclone']
handler.tags = ['subbot']
handler.command = ['code']
handler.rowner = false

export default handler
