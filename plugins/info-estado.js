import ws from 'ws';
import { performance } from 'perf_hooks';
import os from 'os';

let handler = async (m, { conn, usedPrefix, isROwner }) => {
    // Obtener tiempos y estadísticas
    let _uptime = process.uptime() * 1000;
    let uptime = clockString(_uptime);
    
    // Estadísticas de base de datos
    let totalreg = Object.keys(global.db.data.users).length;
    let totalchats = Object.keys(global.db.data.chats).length;
    
    // Estadísticas de conexiones
    let conns = [...new Set([...global.conns.filter(conn => conn.user && conn.ws?.socket && conn.ws.socket.readyState !== ws.CLOSED).map(conn => conn)])];
    let totalConnections = conns.length;
    
    // Estadísticas de chats
    const chats = Object.entries(conn.chats).filter(([id, data]) => id && data.isChats);
    const groupsIn = chats.filter(([id]) => id.endsWith('@g.us'));
    const privateChats = chats.length - groupsIn.length;
    
    // Medición de velocidad
    let old = performance.now();
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña espera para medición
    let neww = performance.now();
    let speed = neww - old;
    
    // Uso de memoria
    const used = process.memoryUsage();
    const formatMemory = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    };
    
    // Información del sistema
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Desconocido';
    const platform = os.platform();
    const arch = os.arch();
    const totalMem = formatMemory(os.totalmem());
    const freeMem = formatMemory(os.freemem());
    
    // Construcción del mensaje
    let info = `
╭─「 *ESTADO DEL BOT* 」
│
│ *❖ Creador:* ${conn.getName(conn.user.jid)}
│ *❖ Prefijo:* [ ${usedPrefix} ]
│ *❖ Versión:* 2.0.0
│
│ *📊 Estadísticas:*
│ *◉ Usuarios:* ${totalreg}
│ *◉ Chats privados:* ${privateChats}
│ *◉ Grupos:* ${groupsIn.length}
│ *◉ Chats totales:* ${chats.length}
│
│ *⚡ Rendimiento:*
│ *◉ Uptime:* ${uptime}
│ *◉ Velocidad:* ${speed.toFixed(2)}ms
│ *◉ RAM usada:* ${formatMemory(used.rss)}
│ *◉ Sub-bots:* ${totalConnections}
│
│ *🖥️ Sistema:*
│ *◉ Plataforma:* ${platform}/${arch}
│ *◉ CPU:* ${cpuModel}
│ *◉ Memoria total:* ${totalMem}
│ *◉ Memoria libre:* ${freeMem}
╰───────────────
    `.trim();
    
    // Enviar mensaje con imagen (opcional)
    try {
        await conn.sendMessage(m.chat, { 
            text: info, 
            contextInfo: { 
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true 
            }
        });
    } catch (e) {
        console.error(e);
        await conn.reply(m.chat, info, m);
    }
};

handler.help = ['estado', 'status', 'stats'];
handler.tags = ['info'];
handler.command = /^(estado|status|estate|state|stado|stats|estad[oó]s|estadisticas)$/i;
handler.register = true;

export default handler;

function clockString(ms) {
    let d = Math.floor(ms / (1000 * 60 * 60 * 24));
    let h = Math.floor((ms / (1000 * 60 * 60)) % 24);
    let m = Math.floor((ms / (1000 * 60)) % 60);
    let s = Math.floor((ms / 1000) % 60);
    
    return [
        d > 0 ? d + 'd ' : '',
        h > 0 ? h + 'h ' : '',
        m > 0 ? m + 'm ' : '',
        s > 0 ? s + 's' : ''
    ].join('').trim() || '0s';
}
