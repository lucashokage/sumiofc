const handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text) return m.reply(`❀ Ingresa un texto para buscar en YouTube.\n> *Ejemplo:* ${usedPrefix + command} Shakira`)

  try {
    const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(text)}`
    const searchResponse = await fetch(searchApi)

    if (!searchResponse.ok) {
      return m.reply(`❌ Error en la búsqueda: ${searchResponse.status} ${searchResponse.statusText}`)
    }

    let searchData
    try {
      searchData = await searchResponse.json()
    } catch (jsonError) {
      console.error("Error al parsear JSON de búsqueda:", jsonError)
      return m.reply("❌ Error al procesar la respuesta de búsqueda. Intenta de nuevo más tarde.")
    }

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

    const downloadApi = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(video.url)}`
    const downloadResponse = await fetch(downloadApi)

    if (!downloadResponse.ok) {
      return m.reply(`❌ Error en la descarga: ${downloadResponse.status} ${downloadResponse.statusText}`)
    }

    let downloadData
    try {
      downloadData = await downloadResponse.json()
    } catch (jsonError) {
      console.error("Error al parsear JSON de descarga:", jsonError)
      return m.reply("❌ Error al procesar la respuesta de descarga. Intenta de nuevo más tarde.")
    }

    if (!downloadData?.result?.download?.url) {
      return m.reply("❌ No se pudo obtener el audio del video.")
    }

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
    console.error("Error completo:", error)
    m.reply(`❌ Error al procesar la solicitud: ${error.message || "Error desconocido"}`)
  }
}

handler.command = ["playaudio", "play"]
handler.help = ["play <texto>", "play<texto>"]
handler.tags = ["media"]

export default handler
