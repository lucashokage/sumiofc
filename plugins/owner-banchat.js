
let handler = async (m, { conn, isOwner, isAdmin, isROwner }) => {
    if (!(isAdmin || isOwner)) return dfail('admin', m, conn)
    global.db.data.chats[m.chat].isBanned = true
    m.reply(`ℹ️ =͟͟͞❀ sᥙmі - sᥲkᥙrᥲsᥲᥕᥲ  ⏤͟͟͞͞★ desactivado en este chat.`)
}
handler.help = ['banchat']
handler.tags = ['owner']
handler.command = ['banchat', 'chatoff', 'bot off'] 
handler.group = true

export default handler
 
