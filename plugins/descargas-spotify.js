import fetch from "node-fetch"
import { fileTypeFromBuffer } from "file-type"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text) {
      await m.react("❌")
      return m.reply(`✖ Debes ingresar un nombre de canción\n\nEjemplo: *${usedPrefix + command}* Believer`)
    }

    await m.react("🕒")

    // Ensure the URL is properly encoded and valid
    const apiUrl = `https://api.nekorinn.my.id/downloader/spotifyplay?q=${encodeURIComponent(text)}`

    // Add error handling for the API request
    let songResponse
    try {
      songResponse = await fetch(apiUrl)
    } catch (fetchError) {
      console.error("Fetch error:", fetchError)
      await m.react("❌")
      return m.reply(`✖ Error al conectar con la API: ${fetchError.message}`)
    }

    if (!songResponse.ok) {
      await m.react("❌")
      return m.reply(`✖ Error al buscar la canción (${songResponse.status}): ${songResponse.statusText}`)
    }

    const songData = await songResponse.json()

    // Validate the response data
    if (!songData?.result?.downloadUrl) {
      await m.react("❌")
      return m.reply(`✖ No se encontró "${text}" en Spotify o la respuesta no contiene una URL de descarga`)
    }

    // Validate URLs before fetching
    const downloadUrl = songData.result.downloadUrl
    const thumbnailUrl = songData.result.thumbnail

    if (!isValidUrl(downloadUrl) || !isValidUrl(thumbnailUrl)) {
      await m.react("❌")
      return m.reply("✖ Las URLs de descarga o miniatura no son válidas")
    }

    // Fetch audio and image with proper error handling
    let audioBuffer, thumbnail
    try {
      const [audioResponse, imageResponse] = await Promise.all([fetch(downloadUrl), fetch(thumbnailUrl)])

      if (!audioResponse.ok) {
        throw new Error(`Error al descargar audio: ${audioResponse.status}`)
      }

      if (!imageResponse.ok) {
        throw new Error(`Error al descargar miniatura: ${imageResponse.status}`)
      }

      audioBuffer = Buffer.from(await audioResponse.arrayBuffer())
      thumbnail = Buffer.from(await imageResponse.arrayBuffer())
    } catch (downloadError) {
      console.error("Download error:", downloadError)
      await m.react("❌")
      return m.reply(`✖ Error al descargar: ${downloadError.message}`)
    }

    // Validate audio file type
    const fileType = await fileTypeFromBuffer(audioBuffer)
    if (!fileType || !fileType.mime.startsWith("audio/")) {
      await m.react("❌")
      return m.reply("✖ El archivo descargado no es un audio válido")
    }

    // Send the messages
    await conn.sendMessage(
      m.chat,
      {
        image: thumbnail,
        caption: `🎵 ${songData.result.title || text}\n👤 ${songData.result.artist || "Artista desconocido"}`,
        footer: "Powered by Spotify Downloader",
        templateButtons: [
          {
            urlButton: {
              displayText: "🔗 Ver en Spotify",
              url: songData.result.url || "#",
            },
          },
        ],
      },
      { quoted: m },
    )

    await conn.sendMessage(
      m.chat,
      {
        audio: audioBuffer,
        mimetype: fileType.mime,
        fileName: `${(songData.result.title || text).substring(0, 64)}.${fileType.ext}`,
      },
      { quoted: m },
    )

    await m.react("✅")
  } catch (error) {
    console.error("General error:", error)
    await m.react("❌")
    return m.reply(`✖ Ocurrió un error: ${error.message}. Intenta nuevamente`)
  }
}

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

handler.help = ["spotify <canción>"]
handler.tags = ["descargas"]
handler.command = /^(spotify|sp)$/i
handler.limit = true

export default handler
