import db from '../lib/database.js'

let handler = async (m, { conn, usedPrefix }) => {
    let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
    if (who == conn.user.jid) return m.react('✖️')
    if (!(who in global.db.data.users)) return m.reply(`${global.emoji} El usuario no se encuentra en mi base de datos*`)
  
    let user = global.db.data.users[who]
    let total = (user.coin || 0) + (user.bank || 0);

    const texto = `ᥫ᭡ Informacion -  Economia ❀
 
ᰔᩚ Usuario » *${conn.getName(who)}*   
⛀ Dinero » *${user.coin} ${global.moneda}*
⚿ Banco » *${user.bank} ${global.moneda}*
⛁ Total » *${total} ${global.moneda}*

> *Para proteger tu dinero, ¡depósitalo en el banco usando #deposit!*`;

    await conn.reply(m.chat, texto, m)
}

handler.help = ['bal']
handler.tags = ['rpg']
handler.command = ['bal', 'balance', 'bank'] 
handler.register = true 
handler.group = true 

export default handler