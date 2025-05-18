import fetch from 'node-fetch';
const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `❀ Ingese una url de tiktok`, m);
  }
  const urlPattern = /^https?:\/\/(www\.)?tiktok\.com\/.+|https?:\/\/vm\.tiktok\.com\/.+/i;
  if (!urlPattern.test(text)) {
    return conn.reply(m.chat, `Url no válido para tiktok `, m);
  }
 m.react('🕒');
    const apiUrl = `https://api.dorratz.com/v2/tiktok-dl?url=${encodeURIComponent(text)}`;
    const res = await fetch(apiUrl);
    const json = await res.json();
    if (!json.data || !json.data.media || !json.data.media.org) {
      throw new Error('La API no devolvió un video válido.');
    }
    const videoData     = json.data;
    const videoUrl      = videoData.media.org;
    const videoTitle    = videoData.title      || 'Sin título';
    const videoAuthor   = videoData.author?.nickname || 'Desconocido';
    const videoDuration = videoData.duration   ? `${videoData.duration} segundos` : 'No especificado';
    const videoLikes    = videoData.like       || 0;
    const videoComments = videoData.comment    || 0;
    let txt = `*Título:* ${videoTitle}
*> ✦ Autor:* ${videoAuthor}
*> ⴵ Duración:* ${videoDuration}
*> 🜸 Likes:* ${videoLikes}
*> ✎ Comentarios:* ${videoComments}`
m.react('✅');
await conn.sendFile(m.chat, videoUrl, 'tiktok.mp4', txt, m)
}

handler.command = ['tt', 'tiktok'];
export default handler;