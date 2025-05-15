import fs from 'fs'
import FormData from 'form-data'
import axios from 'axios'
import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
  if (!m.quoted || !m.quoted.mimetype || !m.quoted.mimetype.startsWith('image/')) {
    return m.reply(`${emoji} Por favor, responde a una imagen válida.`)
  }

  await m.react('🕓')
  
  try {
    const media = await m.quoted.download()
    const form = new FormData()
    
    form.append('image', media, {
      filename: 'upload.jpg',
      contentType: m.quoted.mimetype
    })

    const response = await axios.post('https://api.imgbb.com/1/upload', form, {
      params: {
        key: '10604ee79e478b08aba6de5005e6c798'
      },
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })

    if (response.data.success) {
      const { data } = response.data
      const txt = `*乂 IBB - UPLOADER*\n\n` +
        `  *» Titulo* : ${data.title || 'Sin título'}\n` +
        `  *» Id* : ${data.id}\n` +
        `  *» Enlace* : ${data.url}\n` +
        `  *» Directo* : ${data.url_viewer}\n` +
        `  *» Mime* : ${data.image.mime || m.quoted.mimetype}\n` +
        `  *» Tamaño* : ${formatBytes(data.size)}\n` +
        `  *» Extension* : ${data.image.extension}\n` +
        `  *» Delete* : ${data.delete_url}\n\n` +
        `> *${dev}*`

      await conn.sendFile(m.chat, data.url, 'ibb.jpg', txt, m)
      await m.react('✅')
    } else {
      throw new Error('La API no devolvió un resultado exitoso')
    }
  } catch (error) {
    console.error('Error en ibb upload:', error)
    let errorMsg = '❌ Ocurrió un error al subir la imagen'
    
    if (error.response) {
      errorMsg += `\nCódigo: ${error.response.status}`
      if (error.response.data && error.response.data.error) {
        errorMsg += `\nMensaje: ${error.response.data.error.message || JSON.stringify(error.response.data.error)}`
      }
    } else if (error.request) {
      errorMsg += '\nNo se recibió respuesta del servidor'
    } else {
      errorMsg += `\n${error.message}`
    }
    
    await m.reply(errorMsg)
    await m.react('❌')
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

handler.help = ['ibb']
handler.tags = ['tools']
handler.command = ['ibb', 'tourl3']
handler.register = true
export default handler
