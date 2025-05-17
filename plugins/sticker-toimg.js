
import { spawn } from 'child_process'
import { format } from 'util'
let handler = async (m, { conn, usedPrefix, command }) => {
 
  if (!global.support.convert && !global.support.magick && !global.support.gm) return handler.disabled = true  
    if (!m.quoted) throw `${emoji} Debes citar un sticker para convertir a imagen.`
    let q = m.quoted
    if (/sticker/.test(q.mediaType)) {
        let sticker = await q.download()
        if (!sticker) throw sticker
        let bufs = []
        const [_spawnprocess, ..._spawnargs] = [...(global.support.gm ? ['gm'] : global.support.magick ? ['magick'] : []), 'convert', 'webp:-', 'png:-']
        let im = spawn(_spawnprocess, _spawnargs)
        im.on('error', e => m.reply(format(e)))
        im.stdout.on('data', chunk => bufs.push(chunk))
        im.stdin.write(sticker)
        im.stdin.end()
        im.on('exit', () => {
            conn.sendFile(m.chat, Buffer.concat(bufs), 'img.png', `*✅ tu imagen*`, m)
        })
    } else throw `eror`
}
handler.help = ['toimg <sticker>']
handler.tags = ['sticker']
handler.command = ['toimg', 'jpg', 'aimg'] 

export default handler
