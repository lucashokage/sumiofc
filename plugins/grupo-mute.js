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
     if (!isAdmin) throw m.reply('🍬 *Sólo otro administrador puede desmutarte*');
        
        let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text;
        let userData = global.db.data.users[target];
        
        const messageData = {
            key: {
                participants: '0@s.whatsapp.net',
                fromMe: false,
                id: 'Halo'
            },
            message: {
                locationMessage: {
                    name: 'Unlimited',
                    jpegThumbnail: await (await fetch('https://telegra.ph/file/aea704d0b242b8c41bf15.png')).buffer(),
                    vcard: `BEGIN:VCARD
VERSION:3.0
N:;Unlimited;;;
FN:Unlimited
ORG:Unlimited
TITLE:
item1.TEL;waid=19709001746:+1 (970) 900-1746
item1.X-ABLabel:Unlimited
X-WA-BIZ-DESCRIPTION:ofc
X-WA-BIZ-NAME:Unlimited
END:VCARD`
                }
            },
            participant: '0@s.whatsapp.net'
        };
        
        const usageMessage = '🍬 *Menciona a la persona que deseas demutar*';
        
        if (target === m.sender) throw '🍬 *El creador del bot no puede ser mutado*';
        if (!m.mentionedJid[0] && !m.quoted) return conn.reply(m.sender, usageMessage, m);
        if (userData.muted === false) throw '🍭 *Este usuario no ha sido mutado*';
        
        global.db.data.users[target].muted = false;
        conn.reply(m.sender, '*Tus mensajes no serán eliminados*', messageData, null, { mentions: [target] });
    }
};
handler.command = ['mute', 'unmute'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
