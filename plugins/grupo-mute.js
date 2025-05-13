import fetch from 'node-fetch';

const handler = async (m, { conn, command, text, isAdmin }) => {
    if (command === 'mute') {
        if (!isAdmin) throw '🍬 *Solo un administrador puede ejecutar este comando';
        
        const botOwner = global.owner[0][0] + '@s.whatsapp.net';
        if (m.mentionedJid[0] === botOwner) throw '🍭 *No puedes mutar el bot*';
        
        let target = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text;
        if (target === conn.user.jid) throw '🍭 *No puedes mutar el bot*';
        
        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupAdmin = groupMetadata.participants || m.sender.split`-`[0] + '@s.whatsapp.net';
        
        if (m.mentionedJid[0] === groupAdmin) throw '🍭 *No puedes mutar el creador del grupo*';
        
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
                    jpegThumbnail: await (await fetch('https://telegra.ph/file/f8324d9798fa2ed2317bc.png')).buffer(),
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
        
        const usageMessage = '🍬 *Menciona a la persona que deseas mutar*';
        
        if (!m.mentionedJid[0] && !m.quoted) return conn.reply(m.chat, usageMessage, m);
        if (userData.muted === true) throw '🍭 *Este usuario ya ha sido mutado*';
        
        conn.reply(m.sender, '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 𝗺𝘂𝘁𝗮𝗱𝗼', messageData, null, { mentions: [target] });
        global.db.data.users[target].muted = true;
        
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
