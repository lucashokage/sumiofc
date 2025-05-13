import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`${emoji} Ingresa el nombre de una pelicula\n> *Ejemplo: /cuevana Deadpool*.`)

  try {
    let api = await fetch(`https://delirius-apiofc.vercel.app/search/cuevana?q=${encodeURIComponent(text)}`)
    let json = await api.json()

    // Validate the response structure
    if (!json || !json.data || !Array.isArray(json.data)) {
      return m.reply('⚠️ No se encontraron resultados o la respuesta de la API es inválida.')
    }

    if (json.data.length === 0) {
      return m.reply('🔍 No se encontraron resultados para tu búsqueda.')
    }

    let JT = '📽️ Cuevana - Search 📽️';
    json.data.forEach((app, index) => {
      JT += `\n\n═══════════════════════`;
      JT += `\n☁️ *Nro :* ${index + 1}`
      JT += `\n🖼️ *Imagen:* ${app.image || 'No disponible'}`
      JT += `\n⚜️ *Titulo:* ${app.title || 'Sin título'}`
      JT += `\n📚 *Descripcion:* ${app.description || 'Sin descripción'}`
      JT += `\n🔗 *Link:* ${app.link || 'No disponible'}`
    }) 

    await m.reply(JT)
  } catch (error) {
    console.error(error)
    m.reply('❌ Ocurrió un error al procesar tu solicitud.')
  }
}

handler.command = ['cuevanasearch', 'cuevana']
handler.help = ['cuevana <texto>']
handler.tags = ['search']

export default handler
