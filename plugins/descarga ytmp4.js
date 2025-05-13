import fetch from "node-fetch";

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("❀ Ingresa un enlace válido de YouTube.\nEjemplo: .ytmp4 https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  try {
    // Mostrar mensaje de espera
    await m.react('⏳');
    
    let apiUrl = `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(text)}`;
    let response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    let data = await response.json();

    if (!data?.result?.download?.url) {
      return m.reply("❌ No se pudo obtener el video. Verifica el enlace.");
    }

    // Verificar si la URL del video es válida
    const videoUrl = data.result.download.url;
    if (!videoUrl.match(/^https?:\/\//i)) {
      throw new Error("URL de video inválida");
    }

    // Enviar el video con más opciones
    await conn.sendMessage(m.chat, {
      video: { 
        url: videoUrl,
        mimetype: 'video/mp4',
        caption: `✦ *Título:* ${data.result.title || "Sin título"}\n> ❏ *Duración:* ${data.result.duration || "Desconocida"}\n> ❏ *Tamaño:* ${data.result.HumanReadable || "Desconocido"}\n> 🜸 *Enlace original:* ${text}`
      },
      contextInfo: {
        externalAdReply: {
          title: data.result.title || "Video de YouTube",
          body: "Descargado usando YTMP4",
          thumbnail: await (await fetch(data.result.thumbnail || 'https://i.ibb.co/0jw5J0B/youtube.png')).buffer(),
          mediaType: 2,
          mediaUrl: text
        }
      }
    }, { quoted: m });

    await m.react("✅");
  } catch (error) {
    console.error("Error en ytmp4:", error);
    await m.reply(`❌ Error al descargar el video:\n${error.message}`);
    await m.react("❌");
  }
};

handler.command = ["ytmp4", "ytv"];
handler.help = ["ytmp4 <enlace> - Descarga video de YouTube"];
handler.tags = ["downloader"];

export default handler;
