import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, text, args }) => {
  if (!text) return m.reply("🥮 Ingresa el nombre de la canción o artista")
  
  // Buscar en YouTube
  let ytres = await search(args.join(" "))
  if (!ytres.length) return m.reply("No se encontraron resultados para tu búsqueda.")
  
  let video = ytres[0]
  let txt = `🎬 *Título*: ${video.title}
⏱️ *Duración*: ${video.timestamp}
📅 *Publicado*: ${video.ago}
📺 *Canal*: ${video.author.name || 'Desconocido'}
🔗 *Url*: ${video.url}`
  
  await conn.sendFile(m.chat, video.image, 'thumbnail.jpg', txt, m)

  // Intentar descargar con múltiples servicios
  try {
    const audio = await downloadAudio(video.url)
    await conn.sendMessage(
      m.chat,
      { 
        audio: { url: audio }, 
        mimetype: 'audio/mpeg',
        fileName: `${video.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: video.title,
            body: "Audio descargado",
            thumbnailUrl: video.image
          }
        }
      },
      { quoted: m }
    )
  } catch (error) {
    console.error(error)
    m.reply(`❌ Error en todos los servidores de descarga:\n${error.message}`)
  }
}

// Función con múltiples fuentes de descarga
async function downloadAudio(url) {
  const services = [
    // Servidor 1 (API pública)
    async () => {
      let res = await fetch(`https://api.lyrics.ovh/ytdl/audio?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error('Servidor 1 falló')
      return res.url
    },
    
    // Servidor 2 (alternativo)
    async () => {
      let res = await fetch(`https://yt-downloader.cyclic.cloud/audio?url=${encodeURIComponent(url)}`)
      let data = await res.json()
      if (!data.url) throw new Error('Servidor 2 falló')
      return data.url
    },
    
    // Servidor 3 (respaldo)
    async () => {
      let res = await fetch(`https://api.tiklydown.eu.org/api/yta?url=${encodeURIComponent(url)}`)
      let data = await res.json()
      if (!data.audio) throw new Error('Servidor 3 falló')
      return data.audio
    }
  ]

  // Intentar cada servicio hasta que uno funcione
  for (let service of services) {
    try {
      return await service()
    } catch (e) {
      console.log(`Servidor falló: ${e.message}`)
      continue
    }
  }
  throw new Error('Todos los servidores fallaron')
}

handler.command = /^(playaudio|ytmp3)$/i
export default handler

async function search(query) {
  let search = await yts.search({ query, hl: "es", gl: "ES" })
  return search.videos
        }
