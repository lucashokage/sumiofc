const handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text) return m.reply(`❀ Ingresa un texto para buscar en YouTube.\n> *Ejemplo:* ${usedPrefix + command} Shakira`)

  try {
    m.reply(`🔍 Buscando "${text}"...`)

    const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(text)}`
    const searchResponse = await fetch(searchApi, { timeout: 10000 }).catch(() => ({ ok: false }))

    if (!searchResponse.ok) {
      return m.reply(`❌ Error en la búsqueda. Intenta de nuevo más tarde.`)
    }

    let searchData
    try {
      searchData = await searchResponse.json()
    } catch (e) {
      return m.reply(`❌ Error al procesar la respuesta de búsqueda.`)
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

    m.reply(`⬇️ Descargando audio...`)

    const videoId = extractVideoId(video.url)
    if (!videoId) {
      return m.reply(`❌ No se pudo extraer el ID del video.`)
    }

    const audioUrl = await getAudioUrl(videoId, video.url)
    if (!audioUrl) {
      return m.reply(`❌ No se pudo obtener el audio. Intenta con otro video.`)
    }

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`,
      },
      { quoted: m },
    )

    await m.react("✅")
  } catch (error) {
    console.error(error)
    m.reply(`❌ Error al procesar la solicitud. Intenta de nuevo más tarde.`)
  }
}

async function getAudioUrl(videoId, videoUrl) {
  const apis = [
    {
      url: `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(videoUrl)}`,
      extract: (data) => data?.mp3?.result || data?.mp3 || null,
    },
    {
      url: `https://api.botcahx.live/api/dowloader/yt?url=${encodeURIComponent(videoUrl)}`,
      extract: (data) => data?.result?.mp3 || null,
    },
    {
      url: `https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${encodeURIComponent(videoUrl)}`,
      extract: (data) => data?.result?.link?.audio || data?.result?.audio || null,
    },
    {
      url: `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`,
      extract: (data) => data?.result?.download?.url || null,
    },
    {
      url: `https://api.zahwazein.xyz/downloader/youtube?apikey=zenzkey_8bc01f5847&url=${encodeURIComponent(videoUrl)}`,
      extract: (data) => data?.result?.mp3 || null,
    },
    {
      url: `https://ytdl.tiodevhost.my.id/downloadAudio?videoId=${videoId}`,
      extract: (data) => data?.audioUrl || null,
    },
  ]

  for (const api of apis) {
    try {
      const response = await fetch(api.url, { timeout: 8000 }).catch(() => ({ ok: false }))

      if (!response.ok) continue

      const data = await response.json().catch(() => null)
      if (!data) continue

      const audioUrl = api.extract(data)
      if (audioUrl && typeof audioUrl === "string" && audioUrl.startsWith("http")) {
        const validationResponse = await fetch(audioUrl, {
          method: "HEAD",
          timeout: 5000,
        }).catch(() => ({ ok: false }))

        if (validationResponse.ok) {
          return audioUrl
        }
      }
    } catch (e) {
      continue
    }
  }

  return await getFallbackAudioUrl(videoId)
}

async function getFallbackAudioUrl(videoId) {
  try {
    const fallbackApis = [
      `https://yt-downloader-api.vercel.app/api/audio?id=${videoId}`,
      `https://yt-api-omega.vercel.app/api/audio?id=${videoId}`,
      `https://ytdl-api.vercel.app/api/audio?id=${videoId}`,
    ]

    for (const apiUrl of fallbackApis) {
      try {
        const response = await fetch(apiUrl, { timeout: 10000 }).catch(() => ({ ok: false }))

        if (!response.ok) continue

        const data = await response.json().catch(() => null)
        if (data && data.url && typeof data.url === "string" && data.url.startsWith("http")) {
          return data.url
        }
      } catch (e) {
        continue
      }
    }

    return null
  } catch (e) {
    return null
  }
}

function extractVideoId(url) {
  if (!url) return null

  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

handler.command = ["playaudio", "play"]
handler.help = ["play <texto>", "play<texto>"]
handler.tags = ["media"]

export default handler
