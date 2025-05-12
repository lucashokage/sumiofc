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

const MAX_RECONNECT_ATTEMPTS = 3
const INITIAL_RECONNECT_DELAY = 800000
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
    let authFolderB = crypto.randomBytes(10).toString('hex').slice(0, 8)

    if (!fs.existsSync("./sumibots/"+ authFolderB)){
      fs.mkdirSync("./sumibots/"+ authFolderB, { recursive: true });
    }
    
    args[0] ? fs.writeFileSync("./sumibots/" + authFolderB + "/creds.json", 
      JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t')) : ""
    
    const {state, saveState, saveCreds} = await useMultiFileAuthState(`./sumibots/${authFolderB}`)
    const msgRetryCounterMap = (MessageRetryMap) => { };
    const msgRetryCounterCache = new NodeCache()
    const {version} = await fetchLatestBaileysVersion();
    let phoneNumber = m.sender.split('@')[0]

    const methodCodeQR = process.argv.includes("qr")
    const methodCode = !!phoneNumber || process.argv.includes("code")
    const MethodMobile = process.argv.includes("mobile")

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

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
      retryRequestDelayMs: 1000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    }

    let conn = makeWASocket(connectionOptions)
    let reconnectAttempts = 0
    let reconnectDelay = INITIAL_RECONNECT_DELAY

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
          console.error("Error al solicitar código de emparejamiento:", error);
          await parent.sendMessage(m.chat, { text: "❌ Error al generar el código. Intente nuevamente." }, { quoted: m });
          rl.close();
        }
      }, 3000);
    }

    conn.isInit = false
    let isInit = true
    conn.uptime = new Date()

    async function connectionUpdate(update) {
      const { connection, lastDisconnect, isNewLogin, qr } = update
      if (isNewLogin) conn.isInit = true

      if (connection === 'connecting') {
        console.log(chalk.yellow('Conectando...'));
      }

      const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
      
      if (connection === 'close' || (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null)) {
        let i = global.conns.indexOf(conn)
        if (i < 0) return console.log(await creloadHandler(true).catch(console.error))
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          
          if (reconnectAttempts < 5) {
            reconnectDelay = 10000;
          } else if (reconnectAttempts < 10) {
            reconnectDelay = 15000;
          } else if (reconnectAttempts < 15) {
            reconnectDelay = 30000;
          }
          
          console.log(chalk.yellow(`Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} en ${reconnectDelay/1000} segundos...`));
          
          // Solo mostrar en consola, no enviar al grupo
          if (code !== DisconnectReason.connectionClosed) { 
            console.log(chalk.yellow(`⚠️ Conexión perdida, intentando reconectar... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`));
          }
          
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
              console.log(chalk.red('Error durante la reconexión:', err));
            }
          }, reconnectDelay);
          
          return;
        } else {
          delete global.conns[i]
          global.conns.splice(i, 1)
          
          // Este mensaje sí se envía al grupo porque es el final de los intentos
          parent.sendMessage(m.chat, {
            text: `⛔ La sesión ha sido cerrada después de ${MAX_RECONNECT_ATTEMPTS} intentos fallidos. Deberás conectarte nuevamente.`
          }, { quoted: m }).catch(console.error);
          
          if (code === DisconnectReason.loggedOut) {
            const folderPath = `./sumibots/${authFolderB}`;
            if (fs.existsSync(folderPath)) {
              fs.rmdirSync(folderPath, { recursive: true });
              console.log(chalk.cyan(`🌿 Credenciales eliminadas para subbot ${authFolderB}.`));
            }
          }
        }
      } else if (connection === 'open') {
        reconnectAttempts = 0;
        reconnectDelay = INITIAL_RECONNECT_DELAY;
        conn.uptime = new Date();
      }
      
      if (global.db.data == null) loadDatabase()

      if (connection == 'open') {
        conn.isInit = true
        global.conns.push(conn)
        
        // Siempre enviar el primer mensaje de conexión al grupo
        await parent.sendMessage(m.chat, {
          text: args[0] ? `✅ Conectado exitosamente al bot!` : `(๑˃̵　ᴗ　˂̵)و Bot conectado correctamente con ID: ${conn.user.jid.split`@`[0]}`
        }, { quoted: m })
        
        await sleep(5000)
        if (args[0]) return
        
        await parent.sendMessage(conn.user.jid, {
          text: `*（｡>‿‿<｡ ） ¡Conectado exitosamente! Ahora eres un sub-bot. Usa los comandos normalmente.*`
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
          console.log(chalk.red("Error en ping de conexión:", error));
        }
      }
    }, 60000)
    
    let handler = await import('../handler.js')
    let creloadHandler = async function (restatConn) {
      try {
        const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
        if (Object.keys(Handler || {}).length) handler = Handler
      } catch (e) {
        console.error(e)
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
      
      // FIX: Wrap participantsUpdate in a safe function with null checks
      conn.participantsUpdate = async function(...args) {
        try {
          // Add null check before accessing participants
          if (args[0] && args[0].participants) {
            return await handler.participantsUpdate.apply(this, args);
          }
        } catch (error) {
          console.error('Error in participantsUpdate:', error);
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
            console.error(`Error en manejador de eventos: ${error}`);
          }
        };
      };

      conn.ev.on('messages.upsert', safeEventHandler(conn.handler))
      conn.ev.on('group-participants.update', safeEventHandler(conn.participantsUpdate))
      conn.ev.on('groups.update', safeEventHandler(conn.groupsUpdate))
      conn.ev.on('connection.update', safeEventHandler(conn.connectionUpdate))
      conn.ev.on('creds.update', safeEventHandler(conn.credsUpdate))
      
      conn.ev.on('error', (error) => {
        console.error(chalk.red('Error en la conexión:', error));
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
      console.log(chalk.red(`☕ Límite máximo de ${MAX_SUBBOTS} subbots alcanzado. No se cargarán más.`));
      break;
    }

    const folderPath = './sumibots/' + folder;
    
    if (fs.statSync(folderPath).isDirectory()) {
      try {
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

        let sock = makeWASocket(socketConfig);
        sock.isInit = false;
        sock.uptime = new Date();
        
        let reconnectAttempts = 0;
        let reconnectDelay = INITIAL_RECONNECT_DELAY;
        
        // Marcar como conexión inicial
        initialConnections.set(folder, true);

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
            
            // Solo mostrar en consola para conexiones existentes
            console.log(chalk.green(`🌿 Subbot ${folder} conectado exitosamente`));
            
            reconnectAttempts = 0;
            reconnectDelay = INITIAL_RECONNECT_DELAY;
          }

          if (connection === 'close' || (statusCode && statusCode !== DisconnectReason.loggedOut && sock?.ws.socket == null)) {
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              reconnectAttempts++;
              
              if (reconnectAttempts < 5) {
                reconnectDelay = 10000;
              } else if (reconnectAttempts < 10) {
                reconnectDelay = 15000;
              } else if (reconnectAttempts < 15) {
                reconnectDelay = 30000;
              }
              
              // Solo mostrar en consola
              console.log(chalk.yellow(`Subbot ${folder}: Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} en ${reconnectDelay/1000} segundos...`));
              
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
                  console.log(chalk.red(`Error durante la reconexión de ${folder}:`, err));
                }
              }, reconnectDelay);
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
                  console.log(chalk.cyan(`🌿 Credenciales eliminadas para subbot ${folder}.`));
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
            console.log(err);
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
          
          // FIX: Wrap participantsUpdate in a safe function with null checks
          sock.participantsUpdate = async function(...args) {
            try {
              // Add null check before accessing participants
              if (args[0] && args[0].participants) {
                return await handler.participantsUpdate.apply(this, args);
              }
            } catch (error) {
              console.error('Error in participantsUpdate:', error);
            }
          }
          
          sock.connectionUpdate = connectionUpdate.bind(sock);
          sock.credsUpdate = saveCreds.bind(sock, true);
          
          const safeEventHandler = (eventHandler) => {
            return async (...args) => {
              try {
                await eventHandler(...args);
              } catch (error) {
                console.error(`Error en manejador de eventos: ${error}`);
              }
            };
          };
          
          sock.ev.on('messages.upsert', safeEventHandler(sock.handler));
          sock.ev.on('group-participants.update', safeEventHandler(sock.participantsUpdate));
          sock.ev.on('connection.update', safeEventHandler(sock.connectionUpdate));
          sock.ev.on('creds.update', safeEventHandler(sock.credsUpdate));
          
          sock.ev.on('error', (error) => {
            console.error(chalk.red(`Error en la conexión de ${folder}:`, error));
          });
          
          return true;
        };

        await reloadHandler(false);
        setupPeriodicStateSaving(sock, folder);
      } catch (err) {
        console.error(chalk.red(`Error cargando subbot ${folder}:`, err));
      }
    }
  }

  console.log(chalk.green(`🌿 Conectados exitosamente ${global.conns.length} subbots`));
}

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
  }, 300000);
}

function setupPeriodicHealthCheck() {
  setInterval(async () => {
    const activeConns = global.conns.filter(conn => conn.user && conn.ws.readyState !== ws.CLOSED);
    console.log(chalk.blue(`🔍 Verificación de salud: ${activeConns.length} subbots activos`));
    
    for (let conn of global.conns) {
      if (conn.user && conn.ws.readyState === ws.CLOSED) {
        console.log(chalk.yellow(`🔄 Detectado subbot desconectado, intentando reconectar...`));
        try {
          conn.ev.emit('connection.update', { connection: 'close' });
        } catch (error) {
          console.error(chalk.red(`Error al intentar reconectar:`, error));
        }
      }
    }
  }, 120000);
}

handler.help = ['botclone']
handler.tags = ['subbot']
handler.command = ['code', 'serbot', 'jadibot', 'serbot --code', 'clonebot']
handler.rowner = false

export default handler

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

await loadSubbots().catch(console.error);
setupPeriodicHealthCheck();
