const fs = require('fs');
const path = require('path');
const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const NodeCache = require('node-cache');
const pino = require('pino');
const util = require('util');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const chalk = require('chalk');
const { makeWASocket } = require('../lib/simple.js');

// Initialize global connections array if it doesn't exist
global.conns = global.conns instanceof Array ? global.conns : [];

const MAX_SUBBOTS = 10;
const users = [...new Set([...global.conns
    .filter(conn => conn.user && conn.ws.readyState && conn.ws.readyState !== WebSocket.CONNECTING)
    .map(conn => conn)
])];

async function loadSubbots() {
    const subbotFolders = fs.readdirSync('./sumibots');
    
    for (const folder of subbotFolders) {
        if (users.length >= MAX_SUBBOTS) {
            console.log(chalk.red(`☕ Maximum limit of ${MAX_SUBBOTS} subbots reached. No more will be loaded.`));
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
                    auth: state,
                    browser: ['Ubuntu', 'Chrome', '4.1.0']
                };

                let sock = makeWASocket(socketConfig);
                sock.isInit = false;
                
                let isConnected = true;
                let reconnectAttempts = 0;

                async function connectionUpdate(update) {
                    const { connection, lastDisconnect, isNewLogin } = update;
                    
                    if (isNewLogin) {
                        sock.isInit = true;
                    }

                    const statusCode = lastDisconnect?.error?.output?.statusCode || 
                                     lastDisconnect?.error?.output?.payload?.statusCode;

                    if (statusCode && statusCode === DisconnectReason.loggedOut && sock?.ws.readyState !== null) {
                        let connIndex = global.conns.indexOf(sock);
                        if (connIndex < 0) return;
                        
                        delete global.conns[connIndex];
                        global.conns.splice(connIndex, 1);
                    }

                    if (connection === 'open') {
                        sock.uptime = new Date();
                        sock.isInit = true;
                        global.conns.push(sock);
                    }

                    if (connection === 'close' || connection === 'connecting') {
                        reconnectAttempts++;
                        let delay = 5000;
                        
                        if (reconnectAttempts < 5) {
                            delay = 10000;
                        } else if (reconnectAttempts < 10) {
                            delay = 15000;
                        } else if (reconnectAttempts < 15) {
                            delay = 30000;
                        } else if (reconnectAttempts < 20) {
                            delay = 60000;
                        }

                        setTimeout(async () => {
                            try {
                                sock.ev.off('messages.upsert', sock.handler);
                                sock.ev.off('connection.update', sock.connectionUpdate);
                                sock.ev.off('creds.update', sock.credsUpdate);
                                
                                if (sock.ws.readyState !== WebSocket.CLOSED) {
                                    sock.ws.close();
                                }
                                
                                sock = makeWASocket(socketConfig);
                                await reloadHandler(false);
                            } catch (err) {
                                console.log(chalk.red('Error during reconnection:', err));
                            }
                        }, delay);
                    }

                    if (statusCode === DisconnectReason.loggedOut) {
                        if (fs.existsSync(folderPath)) {
                            fs.rmdirSync(folderPath, { recursive: true });
                            console.log(chalk.cyan(`🌿 Credentials deleted for subbot ${folder}.`));
                        }
                    }
                }

                let handler = await require('../handler');
                let reloadHandler = async (restartConnection) => {
                    try {
                        const newHandler = await require(`../handler.js?update=${Date.now()}`);
                        if (Object.keys(newHandler).length) {
                            handler = newHandler;
                        }
                    } catch (err) {
                        console.log(err);
                    }

                    if (restartConnection) {
                        try {
                            if (sock.ws.readyState !== WebSocket.CLOSED) {
                                sock.ws.close();
                            }
                        } catch {}
                        
                        sock.ev.removeAllListeners();
                        sock = makeWASocket(socketConfig);
                        isConnected = true;
                    }

                    if (!isConnected) {
                        sock.ev.on('messages.upsert', sock.handler);
                        sock.ev.on('connection.update', sock.connectionUpdate);
                        sock.ev.on('creds.update', sock.credsUpdate);
                    }

                    sock.handler = handler.handler.bind(sock);
                    sock.connectionUpdate = connectionUpdate.bind(sock);
                    sock.credsUpdate = saveCreds.bind(sock, true);
                    
                    sock.ev.on('messages.upsert', sock.handler);
                    sock.ev.on('connection.update', sock.connectionUpdate);
                    sock.ev.on('creds.update', sock.credsUpdate);
                    
                    isConnected = false;
                    return true;
                };

                await reloadHandler(false);
            } catch (err) {
                console.error(chalk.red(`Error loading subbot ${folder}:`, err));
            }
        }
    }

    console.log(chalk.green(`🌿 Successfully connected ${global.conns.length} subbots`));
}

await loadSubbots().catch(console.error);
