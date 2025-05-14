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

if (global.conns instanceof Array) console.log()
else global.conns = []

// Configuración principal
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_INTERVAL = 25 * 60 * 1000
const MAX_SUBBOTS = 120

const initialConnections = new Map()

let store
let loadDatabase

let handler = async (m, { conn: _conn, args, usedPrefix, command, isOwner }) => {
  let parent = args[0] && args[0] == 'plz' ? _conn : await global.conn
  if (!((args[0] && args[0] == 'plz') || (await global.conn).user.jid == _conn.user.jid)) {
    throw `📌 No puedes usar este bot como sub-bot\n\n wa.me/${global.conn.user.jid.split`@`[0]}?text=${usedPrefix}.code`
  }

  async function bbts() {
    let phoneNumber = m.sender.split('@')[0]
    let subbotId = crypto.randomBytes(4).toString('hex')
    let authFolderB = `${phoneNumber}sbt-${subbotId}`

    if (!fs.existsSync("./sumibots/"+ authFolderB)){
      fs.mkdirSync("./sumibots/"+ authFolderB, { recursive: true });
    }
    
    args[0] ? fs.writeFileSync("./sumibots/" + authFolderB + "/creds.json", 
      JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t')) : ""
    
    const {state, saveState, saveCreds} = await useMultiFileAuthState(`./sumibots/${authFolderB}`)
    const msgRetryCounterMap = (MessageRetryMap) => { };
    const msgRetryCounterCache = new NodeCache()
    const {version} = await fetchLatestBaileysVersion();

    const methodCodeQR = process.argv.includes("qr")
    const methodCode = !!phoneNumber || process.argv.includes("code")
    const MethodMobile = process.argv.includes("mobile")

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

    // Configuración de conexión optimizada
    const connectionOptions = {
      logger: pino({ level: 'silent' }),
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
        let msg = await store.loadMessage(jid, clave.id)
        return msg?.message || ""
      },
      msgRetryCounterCache,
      msgRetryCounterMap,
      defaultQueryTimeoutMs: 60000,
      version,
      retryRequestDelayMs: 800000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: RECONNECT_INTERVAL,
    }

    let conn = makeWASocket(connectionOptions)
    let reconnectAttempts = 0
    let reconnectTimer = null
    let autoReconnectTimer = null

    if (methodCode && !conn.authState.creds.registered) {
      if (!phoneNumber) {
        process.exit(0);
      }
      let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
      if (!Object.keys(PHONENUMBER_MCC).some(v => cleanedNumber.startsWith(v))) {
        process.exit(0);
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

    conn.isInit = false
    let isInit = true
    conn.uptime = new Date()

    function scheduleAutoReconnect() {
      if (autoReconnectTimer) clearTimeout(autoReconnectTimer);
      
      autoReconnectTimer = setTimeout(() => {
        // Solo un mensaje en consola para la reconexión automática
        console.log(chalk.blue(`🔄 Reconexión automática para ${authFolderB}`));
        
        if (conn.ws.readyState !== CLOSED) {
          conn.ws.close();
        }
      }, RECONNECT_INTERVAL);
    }

    async function connectionUpdate(update) {
      const { connection, lastDisconnect, isNewLogin, qr } = update
      if (isNewLogin) conn.isInit = true

      const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
      
      if (connection === 'close' || (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null)) {
        let i = global.conns.indexOf(conn)
        if (i < 0) return console.log(await creloadHandler(true).catch(() => {}))
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          
          console.log(chalk.yellow(`Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} en 10 segundos...`));
          
          setTimeout(async () => {
            try {
              if (conn.handler) conn.ev.off('messages.upsert', conn.handler)
              if (conn.participantsUpdate) conn.ev.off('group-participants.update', conn.participantsUpdate)
              if (conn.groupsUpdate) conn.ev.off('groups.update', conn.groupsUpdate)
              if (conn.onCall) conn.ev.off('call', conn.onCall)
              if (conn.connectionUpdate) conn.ev.off('connection.update', conn.connectionUpdate)
              if (conn.credsUpdate) conn.ev.off('creds.update', conn.credsUpdate)
              
              if (conn.ws.readyState !== CLOSED) {
                conn.ws.close();
              }
              
              conn = makeWASocket(connectionOptions)
              await creloadHandler(false);
            } catch (err) {
            }
          }, 10000);
          
          return;
        } else {
          delete global.conns[i]
          global.conns.splice(i, 1)
          
          parent.sendMessage(m.chat, {
            text: `⛔ La sesión ha sido cerrada después de ${MAX_RECONNECT_ATTEMPTS} intentos fallidos.`
          }, { quoted: m }).catch(() => {});
          
          if (code === DisconnectReason.loggedOut) {
            const folderPath = `./sumibots/${authFolderB}`;
            if (fs.existsSync(folderPath)) {
              fs.rmdirSync(folderPath, { recursive: true });
            }
          }
        }
      } else if (connection === 'open') {
        reconnectAttempts = 0;
        conn.uptime = new Date();
        
        scheduleAutoReconnect();
      }
      
      if (global.db.data == null) loadDatabase()

      if (connection == 'open') {
        conn.isInit = true
        global.conns.push(conn)
        
        await parent.sendMessage(m.chat, {
          text: args[0] ? `✅ Conectado exitosamente al bot!` : `✅ Bot conectado correctamente con ID: ${conn.user.jid.split`@`[0]}`
        }, { quoted: m })
        
        await sleep(5000)
        if (args[0]) return
        
        const reconnectToken = `${phoneNumber}+${subbotId}`
        await parent.sendMessage(conn.user.jid, {
          text: `*✅ ¡Conectado exitosamente!*\n\nPara reconectarte usa: .rconect ${reconnectToken}`
        }, { quoted: m })
        
        const codeText = usedPrefix + command + " " + Buffer.from(fs.readFileSync("./sumibots/" + authFolderB + "/creds.json"), "utf-8").toString("base64")
        await parent.sendMessage(conn.user.jid, {text: codeText}, { quoted: m })
      }
    }

    setInterval(async () => {
      if (!conn.user) {
        try { conn.ws.close() } catch { }
        conn.ev.removeAllListeners()
        let i = global.conns.indexOf(conn)
        if (i < 0) return
        delete global.conns[i]
        global.conns.splice(i, 1)
      } else {
        try {
          await conn.sendPresenceUpdate('available', conn.user.jid);
        } catch (error) {
        }
      }
    }, 60000)
    
    let handler = await import('../handler.js')
    let creloadHandler = async function (restatConn) {
      try {
        const Handler = await import(`../handler.js?update=${Date.now()}`).catch(() => {})
        if (Object.keys(Handler || {}).length) handler = Handler
      } catch (e) {
      }
      
      if (restatConn) {
        try { 
          if (conn.ws.readyState !== CLOSED) {
            conn.ws.close() 
          }
        } catch { }
        conn.ev.removeAllListeners()
        conn = makeWASocket(connectionOptions)
        isInit = true
      }

      if (!isInit) {
        if (conn.handler) conn.ev.off('messages.upsert', conn.handler)
        if (conn.participantsUpdate) conn.ev.off('group-participants.update', conn.participantsUpdate)
        if (conn.groupsUpdate) conn.ev.off('groups.update', conn.groupsUpdate)
        if (conn.onCall) conn.ev.off('call', conn.onCall)
        if (conn.connectionUpdate) conn.ev.off('connection.update', conn.connectionUpdate)
        if (conn.credsUpdate) conn.ev.off('creds.update', conn.credsUpdate)
      }
      
      conn.welcome = global.conn.welcome + ''
      conn.bye = global.conn.bye + ''
      conn.spromote = global.conn.spromote + ''
      conn.sdemote = global.conn.sdemote + ''

      conn.handler = handler.handler.bind(conn)
      
      // Manejador de participantes seguro
      conn.participantsUpdate = async function(...args) {
        try {
          if (args[0] && args[0].participants) {
            return await handler.participantsUpdate.apply(this, args);
          }
        } catch (error) {
        }
      }
      
      conn.groupsUpdate = handler.groupsUpdate.bind(conn)
      conn.connectionUpdate = connectionUpdate.bind(conn)
      conn.credsUpdate = saveCreds.bind(conn, true)

      const safeEventHandler = (eventHandler) => {
        return async (...args) => {
          try {
            await eventHandler(...args);
          } catch (error) {
          }
        };
      };

      conn.ev.on('messages.upsert', safeEventHandler(conn.handler))
      conn.ev.on('group-participants.update', safeEventHandler(conn.participantsUpdate))
      conn.ev.on('groups.update', safeEventHandler(conn.groupsUpdate))
      conn.ev.on('connection.update', safeEventHandler(conn.connectionUpdate))
      conn.ev.on('creds.update', safeEventHandler(conn.credsUpdate))
      
      conn.ev.on('error', (error) => {
        // Silenciar errores
      });
      
      isInit = false
      return true
    }
    
    await creloadHandler(false)
    
    setupPeriodicStateSaving(conn, authFolderB)
  }
  
  await bbts()
}

async function loadSubbots() {
  console.log(chalk.green('🔄 Cargando subbots existentes...'));
  
  const subbotFolders = fs.readdirSync('./sumibots');
  const users = [...new Set([...global.conns
    .filter(conn => conn.user && conn.ws.readyState && conn.ws.readyState !== ws.CONNECTING)
    .map(conn => conn)
  ])];
  
  for (const folder of subbotFolders) {
    if (users.length >= MAX_SUBBOTS) {
      console.log(chalk.red(`☕ Límite máximo de ${MAX_SUBBOTS} subbots alcanzado.`));
      break;
    }

    const folderPath = './sumibots/' + folder;
    
    if (fs.statSync(folderPath).isDirectory()) {
      try {
        const { state, saveCreds } = await useMultiFileAuthState(folderPath);
        const { version } = await fetchLatestBaileysVersion();
        
        const socketConfig = {
          version,
          keepAliveIntervalMs: RECONNECT_INTERVAL,
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

        let sock = makeWASocket(socketConfig);
        sock.isInit = false;
        sock.uptime = new Date();
        
        let reconnectAttempts = 0;
        let autoReconnectTimer = null;
        
        initialConnections.set(folder, true);

        function scheduleAutoReconnect() {
          if (autoReconnectTimer) clearTimeout(autoReconnectTimer);
          
          autoReconnectTimer = setTimeout(() => {
            console.log(chalk.blue(`🔄 Reconexión automática para ${folder}`));
            
            if (sock.ws.readyState !== CLOSED) {
              sock.ws.close();
            }
          }, RECONNECT_INTERVAL);
        }

        async function connectionUpdate(update) {
          const { connection, lastDisconnect, isNewLogin } = update;
          
          if (isNewLogin) {
            sock.isInit = true;
          }

          const statusCode = lastDisconnect?.error?.output?.statusCode || 
                           lastDisconnect?.error?.output?.payload?.statusCode;

          if (connection === 'open') {
            sock.uptime = new Date();
            sock.isInit = true;
            global.conns.push(sock);
            
            // Solo un mensaje en consola para conexiones exitosas
            console.log(chalk.green(`✅ Subbot ${folder} conectado exitosamente`));
            
            reconnectAttempts = 0;
            scheduleAutoReconnect();
          }

          if (connection === 'close' || (statusCode && statusCode !== DisconnectReason.loggedOut && sock?.ws.socket == null)) {
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              reconnectAttempts++;
              
              console.log(chalk.yellow(`Subbot ${folder}: Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} en 10 segundos...`));
              
              setTimeout(async () => {
                try {
                  sock.ev.off('messages.upsert', sock.handler);
                  sock.ev.off('connection.update', sock.connectionUpdate);
                  sock.ev.off('creds.update', sock.credsUpdate);
                  
                  if (sock.ws.readyState !== ws.CLOSED) {
                    sock.ws.close();
                  }
                  
                  sock = makeWASocket(socketConfig);
                  await reloadHandler(false);
                } catch (err) {
                  // Silenciar errores
                }
              }, 10000);
            } else {
              console.log(chalk.red(`Subbot ${folder}: Máximo de intentos de reconexión alcanzado.`));
              
              let i = global.conns.indexOf(sock);
              if (i >= 0) {
                delete global.conns[i];
                global.conns.splice(i, 1);
              }
              
              if (statusCode === DisconnectReason.loggedOut) {
                if (fs.existsSync(folderPath)) {
                  fs.rmdirSync(folderPath, { recursive: true });
                }
              }
            }
          }
        }

        let handler = await import('../handler.js');
        let reloadHandler = async (restartConnection) => {
          try {
            const newHandler = await import(`../handler.js?update=${Date.now()}`);
            if (Object.keys(newHandler).length) {
              handler = newHandler;
            }
          } catch (err) {
            // Silenciar errores
          }

          if (restartConnection) {
            try {
              if (sock.ws.readyState !== ws.CLOSED) {
                sock.ws.close();
              }
            } catch {}
            
            sock.ev.removeAllListeners();
            sock = makeWASocket(socketConfig);
          }

          sock.handler = handler.handler.bind(sock);
          
          sock.participantsUpdate = async function(...args) {
            try {
              if (args[0] && args[0].participants) {
                return await handler.participantsUpdate.apply(this, args);
              }
            } catch (error) {
            }
          }
          
          sock.connectionUpdate = connectionUpdate.bind(sock);
          sock.credsUpdate = saveCreds.bind(sock, true);
          
          const safeEventHandler = (eventHandler) => {
            return async (...args) => {
              try {
                await eventHandler(...args);
              } catch (error) {
              }
            };
          };
          
          sock.ev.on('messages.upsert', safeEventHandler(sock.handler));
          sock.ev.on('group-participants.update', safeEventHandler(sock.participantsUpdate));
          sock.ev.on('connection.update', safeEventHandler(sock.connectionUpdate));
          sock.ev.on('creds.update', safeEventHandler(sock.credsUpdate));
          
          sock.ev.on('error', (error) => {
            // Silenciar errores
          });
          
          return true;
        };

        await reloadHandler(false);
        setupPeriodicStateSaving(sock, folder);
      } catch (err) {
        // Silenciar errores
      }
    }
  }

  console.log(chalk.green(`✅ Conectados exitosamente ${global.conns.length} subbots`));
}
function setupPeriodicStateSaving(conn, authFolder) {
  setInterval(async () => {
    if (conn.user) {
      try {
        await conn.authState.saveState();
      } catch (error) {
        // Silenciar errores
      }
    }
  }, 300000);
}

function setupPeriodicHealthCheck() {
  setInterval(async () => {
    const activeConns = global.conns.filter(conn => conn.user && conn.ws.readyState !== ws.CLOSED);
    // Solo un mensaje de verificación de salud
    console.log(chalk.blue(`🔍 Verificación: ${activeConns.length} subbots activos`));
    
    for (let conn of global.conns) {
      if (conn.user && conn.ws.readyState === ws.CLOSED) {
        try {
          conn.ev.emit('connection.update', { connection: 'close' });
        } catch (error) {
          // Silenciar errores
        }
      }
    }
  }, 120000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

await loadSubbots().catch(() => {});
setupPeriodicHealthCheck();

handler.help = ['botclone']
handler.tags = ['subbot']
handler.command = ['code']
handler.rowner = false

export default handler
