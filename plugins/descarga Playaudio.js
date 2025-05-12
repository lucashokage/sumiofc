const handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text) return m.reply(`❀ Ingresa un texto para buscar en YouTube.\n> *Ejemplo:* ${usedPrefix + command} Shakira`)

  try {
    const searchMsg = await m.reply("🔍 *Buscando en YouTube...*")

    const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(text)}`
    let searchResponse, searchData

    try {
      searchResponse = await fetch(searchApi, { timeout: 10000 })
      const searchText = await searchResponse.text()

      try {
        searchData = JSON.parse(searchText)
      } catch (jsonError) {
        console.error("JSON inválido recibido:", searchText)
        throw new Error("La API de búsqueda devolvió un JSON inválido")
      }
    } catch (fetchError) {
      console.error("Error en fetch de búsqueda:", fetchError)
      throw new Error("Error al conectar con la API de búsqueda")
    }

    await conn.sendMessage(m.chat, { delete: searchMsg.key })

    if (!searchData?.data || searchData.data.length === 0) {
      return m.reply(`⚠️ No se encontraron resultados para "${text}".`)
    }

    const video = searchData.data[0]
    const videoDetails = ` *「✦」 ${video.title}*

> ✦ *Canal:* » ${video.author.name}
> ⴵ *Duración:* » ${video.duration}
> ✰ *Vistas:* » ${video.views}
> ✐ *Publicado:* » ${video.publishedAt}
> 🜸 *Enlace:* » ${video.url}
`

    await conn.sendMessage(
      m.chat,
      {
        image: { url: video.image },
        caption: videoDetails.trim(),
      },
      { quoted: m },
    )

    const downloadMsg = await m.reply("⏳ *Descargando audio...*")

    const downloadApi = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(video.url)}`
    let downloadResponse, downloadData

    try {
      downloadResponse = await fetch(downloadApi, { timeout: 15000 })
      const downloadText = await downloadResponse.text()

      try {
        downloadData = JSON.parse(downloadText)
      } catch (jsonError) {
        console.error("JSON inválido recibido:", downloadText)
        throw new Error("La API de descarga devolvió un JSON inválido")
      }
    } catch (fetchError) {
      console.error("Error en fetch de descarga:", fetchError)
      throw new Error("Error al conectar con la API de descarga")
    }

    if (!downloadData?.result?.download?.url) {
      await conn.sendMessage(m.chat, { delete: downloadMsg.key })
      return m.reply("❌ No se pudo obtener el audio del video.")
    }

    await conn.sendMessage(m.chat, { delete: downloadMsg.key })

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: downloadData.result.download.url },
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`,
      },
      { quoted: m },
    )

    await m.react("✅")
  } catch (error) {
    console.error(error)
    m.reply(`❌ Error al procesar la solicitud:\n${error.message}`)
  }
}

handler.command = ["playaudio", "play"]
handler.help = ["play <texto>", "playaudio <texto>"]
handler.tags = ["media"]

export default handler
