import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, text, args }) => {
  if (!text) {
    return m.reply("🥮 Ingresa el texto de lo que quieres buscar")
  }

  let ytres = await search(args.join(" "))
  if (!ytres.length) {
    return m.reply("No se encontraron resultados para tu búsqueda.")
  }

  let izumi = ytres[0]
  let txt = `🎬 *Título*: ${izumi.title}
⏱️ *Duración*: ${izumi.timestamp}
📅 *Publicado*: ${izumi.ago}
📺 *Canal*: ${izumi.author.name || 'Desconocido'}
🔗 *Url*: ${izumi.url}`
  
  // Primero envía la miniatura con la información
  await conn.sendFile(m.chat, izumi.image, 'thumbnail.jpg', txt, m)

  try {
    // Servidor de descarga alternativo (más estable)
    const apiUrl = `https://api.dhamzxploit.my.id/api/yta?url=${encodeURIComponent(izumi.url)}`
    const response = await fetch(apiUrl)
    const data = await response.json()

    if (!data.result) throw new Error('Error al obtener el audio')

    const audioUrl = data.result.link || data.result
    
    // Enviar el audio con metadatos
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: `${izumi.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: izumi.title,
            body: `Audio descargado`,
            thumbnail: await (await fetch(izumi.image)).buffer()
          }
        }
      },
      { quoted: m }
    )
    
  } catch (error) {
    console.error('Error en la descarga:', error)
    m.reply(`❌ Error al descargar el audio. Intenta con otro servidor.\nMensaje de error: ${error.message}`)
    
    // Intento con servidor de respaldo
    try {
      const backupApi = `https://api.lolhuman.xyz/api/ytaudio2?apikey=TUPUEDESUSARELMIODW&url=${encodeURIComponent(izumi.url)}`
      const backupRes = await fetch(backupApi)
      const backupData = await backupRes.json()
      
      if (backupData.result) {
        await conn.sendMessage(
          m.chat,
          {
            audio: { url: backupData.result.link },
            mimetype: 'audio/mpeg',
            fileName: `${izumi.title}.mp3`
          },
          { quoted: m }
        )
      }
    } catch (backupError) {
      console.error('Error en servidor de respaldo:', backupError)
      m.reply('⚠️ Todos los servidores de descarga fallaron. Intenta más tarde.')
    }
  }
}

handler.help = ['playaudio <búsqueda>']
handler.tags = ['downloader']
handler.command = /^(playaudio|ytmp3|play)$/i
handler.limit = true

export default handler

async function search(query, options = {}) {
  let search = await yts.search({ query, hl: "es", gl: "ES", ...options })
  return search.videos
}
