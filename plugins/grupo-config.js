import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!m.isGroup) return m.reply('❌ *Este comando solo funciona en grupos*')

    try {
        const groupMetadata = await conn.groupMetadata(m.chat)
        if (!groupMetadata) throw new Error('No se pudo obtener la información del grupo')

        const isUserAdmin = (jid) => {
            const participant = groupMetadata.participants.find(p => {
                const normalizedJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`
                const participantNum = p.id.split('@')[0]
                const inputNum = normalizedJid.split('@')[0]
                return p.id === normalizedJid || participantNum === inputNum
            })
            return participant && ['admin', 'superadmin'].includes(participant.admin)
        }

        const currentBotJid = conn.user.jid
        if (!isUserAdmin(currentBotJid)) {
            return m.reply('❌ *Necesito ser administrador para ejecutar este comando*')
        }

        const action = (args[0] || '').toLowerCase()
        const actionsMap = {
            'open': 'not_announcement',
            'close': 'announcement',
            'abrir': 'not_announcement', 
            'cerrar': 'announcement',
            'abierto': 'not_announcement',
            'cerrado': 'announcement'
        }

        if (!actionsMap[action]) {
            return m.reply(`
🔧 *Configuración de Grupo* 🔧

▢ *${usedPrefix}${command} abrir* - Todos pueden escribir
▢ *${usedPrefix}${command} cerrar* - Solo admins pueden escribir
▢ *${usedPrefix}${command} open* - (Versión en inglés)
▢ *${usedPrefix}${command} close* - (Versión en inglés)
            `.trim())
        }

        await conn.groupSettingUpdate(m.chat, actionsMap[action])

        const resultMessage = actionsMap[action] === 'not_announcement'
            ? '✅ *Grupo abierto*\nAhora todos los miembros pueden escribir'
            : '🔒 *Grupo cerrado*\nSolo administradores pueden escribir'

        await m.reply(resultMessage)

    } catch (error) {
        console.error('Error en comando group:', error)
        m.reply(`❌ *Error:* ${error.message || 'Ocurrió un error al procesar el comando'}`)
    }
}

handler.help = ['group <abrir/cerrar>', 'grupo <open/close>']
handler.tags = ['group']
handler.command = /^(group|grupo)$/i
handler.admin = true
handler.botAdmin = true

export default handler


this.sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
        const message = messages[0]
        if (!message) return

        if (message.key?.participant?.endsWith('@lid')) {
            const realId = this.mapId?.[message.key.participant]
            if (realId) message.key.participant = realId
        }

        if (message.messageStubType) {
            this.sock.ev.emit('stubtype.upsert', message)
            return
        }

        if (!message.message || message.key.remoteJid === 'status@broadcast') return
        
        const msgType = Object.keys(message.message)[0]
        if (["protocolMessage", "senderKeyDistributionMessage"].includes(msgType)) return

        const m = await Serialize(this.sock, message, this.store, this.groupCache)
        await new Client({ sock: this.sock, m }).handler()

    } catch (error) {
        console.error('Error en messages.upsert:', error)
    }
})

this.sock.ev.on('stubtype.upsert', async (message) => {
    try {
        const { messageStubType, key } = message
        
        if (messageStubType === 27 || messageStubType === 28) {
            const isGroupClosed = messageStubType === 27
            const actor = message.messageStubParameters?.[0] || 'unknown'
            
            console.log(`Grupo ${isGroupClosed ? 'cerrado' : 'abierto'} por ${actor}`)
        }

    } catch (error) {
        console.error('Error en stubtype.upsert:', error)
    }
})
