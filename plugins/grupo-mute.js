import fetch from 'node-fetch';

// Inicialización de la base de datos (añade esto al inicio de tu bot)
if (!global.db) global.db = { data: { users: {} } };

const handler = async (m, { conn, command, text, isAdmin }) => {
    // Verificación inicial de mute
    if (global.db.data.users[m.sender]?.muted) {
        if (m.isGroup) await conn.sendMessage(m.chat, { delete: m.key });
        return;
    }

    if (command === 'mute') {
        if (!isAdmin) return m.reply('🍬 *Solo administradores pueden usar este comando*');
        
        const botOwner = global.owner[0][0] + '@s.whatsapp.net';
        let target = m.mentionedJid[0] || m.quoted?.sender || text;
        
        if (!target) return m.reply('🍬 *Menciona o responde al usuario*');
        if (target === botOwner) return m.reply('🍭 *No puedes mutar al dueño del bot*');
        if (target === conn.user.jid) return m.reply('🍭 *No puedes mutar al bot*');
        
        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupAdmin = groupMetadata.participants.find(p => p.admin === 'admin')?.id;
        if (target === groupAdmin) return m.reply('🍭 *No puedes mutar al admin del grupo*');
        
        if (!global.db.data.users[target]) global.db.data.users[target] = {};
        if (global.db.data.users[target].muted) return m.reply('🍭 *Este usuario ya está muteado*');
        
        global.db.data.users[target].muted = true;
        
        const vcard = `BEGIN:VCARD...`; // Usa el mismo vCard del código original
        
        await conn.sendMessage(m.chat, { 
            text: `✅ *Usuario muteado*\nNo podrá usar comandos del bot`, 
            mentions: [target] 
        });
        
    } else if (command === 'unmute') {
        // ... (similar al código original de unmute)
    }
};

handler.command = ['mute', 'unmute'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
