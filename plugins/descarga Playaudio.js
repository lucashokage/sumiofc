let handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text) return m.reply(`❀ Ingresa un texto para buscar en YouTube.\n> *Ejemplo:* ${usedPrefix + command} Shakira`);

  try {
    // Buscar en YouTube
    const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${text}`;
    const searchResponse = await fetch(searchApi);
    const searchData = await searchResponse.json();

    if (!searchData?.data || searchData.data.length === 0) {
      return m.reply(`⚠️ No se encontraron resultados para "${text}".`);
    }

    const video = searchData.data[0];
    const videoDetails = ` *「✦」 ${video.title}*

> ✦ *Canal:* » ${video.author.name}
> ⴵ *Duración:* » ${video.duration}
> ✰ *Vistas:* » ${video.views}
> ✐ *Publicado:* » ${video.publishedAt}
> 🜸 *Enlace:* » ${video.url}
`;

    await conn.sendMessage(m.chat, {
      image: { url: video.image },
      caption: videoDetails.trim()
    }, { quoted: m });

    // Opción 1: API vreden.my.id
    const downloadFromVreden = async () => {
      const apiUrl = `https://api.vreden.my.id/api/ytmp3?url=${video.url}`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data?.result?.download?.url) {
          return {
            url: data.result.download.url,
            source: 'vreden.my.id'
          };
        }
      } catch (e) {
        console.log('Error con vreden API:', e.message);
        return null;
      }
    };

    // Opción 2: API alternativa (delirius)
    const downloadFromDelirius = async () => {
      const apiUrl = `https://delirius-apiofc.vercel.app/download/ytmp3?url=${video.url}`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data?.result?.url) {
          return {
            url: data.result.url,
            source: 'delirius'
          };
        }
      } catch (e) {
        console.log('Error con delirius API:', e.message);
        return null;
      }
    };

    // Intentar con ambas APIs
    let audioData = await downloadFromVreden();
    if (!audioData) {
      audioData = await downloadFromDelirius();
    }

    if (!audioData) {
      return m.reply("❌ No se pudo obtener el audio del video. Ambas APIs fallaron.");
    }

    await conn.sendMessage(m.chat, {
      audio: { url: audioData.url },
      mimetype: 'audio/mpeg',
      fileName: `${video.title}.mp3`
    }, { quoted: m });

    await m.reply(`✅ Audio descargado usando API: ${audioData.source}`);
    await m.react("✅");
  } catch (error) {
    console.error(error);
    m.reply(`❌ Error al procesar la solicitud:\n${error.message}`);
    await m.react("✖️");
  }
};

handler.command = ['playaudio', 'play'];
handler.help = ['play <texto>', 'playaudio <texto>'];
handler.tags = ['media'];

export default handler;
