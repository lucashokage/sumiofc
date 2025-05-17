import ws from "ws"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const readdir = promisify(fs.readdir)

async function handler(m, { usedPrefix, args }) {
  if (!global.conns) global.conns = []

  global.conns.forEach((conn) => {
    if (!conn.startTime) conn.startTime = Date.now()
  })

  const activeConns = global.conns.filter(
    (conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED,
  )
  const totalSubBots = activeConns.length

  const pluginsCount = await countPlugins()

  if (args[0] === "info") {
    const formatTime = (ms) => {
      let seconds = Math.floor(ms / 1000)
      const days = Math.floor(seconds / (3600 * 24))
      seconds %= 3600 * 24
      const hours = Math.floor(seconds / 3600)
      seconds %= 3600
      const minutes = Math.floor(seconds / 60)
      seconds %= 60

      const parts = []
      if (days > 0) parts.push(`${days} día${days !== 1 ? "s" : ""}`)
      if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? "s" : ""}`)
      if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? "s" : ""}`)
      if (seconds > 0) parts.push(`${seconds} segundo${seconds !== 1 ? "s" : ""}`)

      return parts.length > 0 ? parts.join(" ") : "0 segundos"
    }

    // Clasificar conexiones por tipo (QR o código)
    const qrBots = activeConns.filter((conn) => {
      const authPath = conn.authFolder || ""
      return authPath.includes("sumibots2")
    })

    const codeBots = activeConns.filter((conn) => {
      const authPath = conn.authFolder || ""
      return authPath.includes("sumibots") && !authPath.includes("sumibots2")
    })

    const infoList = activeConns
      .map((conn, index) => {
        const number = conn.user.jid.replace(/[^0-9]/g, "")
        const time = formatTime(Date.now() - (conn.startTime || Date.now()))
        const type = (conn.authFolder || "").includes("sumibots2") ? "QR" : "Código"
        return `*${index + 1}.* ➺ Número: ${number} ➺ Tipo: ${type} ➺ Tiempo: ${time}`
      })
      .join("\n")

    const infoMessage = `
*「✦」LISTA DE SUBBOTS*

✧ *Sub-Bots conectados:* ${totalSubBots}
✧ *Por QR:* ${qrBots.length}
✧ *Por Código:* ${codeBots.length}

${infoList}

❒ Total de comandos: ${pluginsCount}
    `.trim()

    return m.reply(infoMessage)
  }

  const summaryMessage = `
*「✦」SUBBOTS ACTIVOS*

❀ Para ser un subbot usa:
   - Por código: *#code*
   - Por QR: *#qr*

✧ *Sub-Bots conectados:* ${totalSubBots}
❒ *Total de comandos:* ${pluginsCount}

Envía *${usedPrefix}bots info* para ver la lista detallada
  `.trim()

  m.reply(summaryMessage)
}

async function countPlugins() {
  try {
    const pluginsDir = "./plugins"

    if (!fs.existsSync(pluginsDir)) {
      console.log("Directorio de plugins no encontrado:", pluginsDir)
      return 0
    }

    const files = await getAllFiles(pluginsDir)

    const pluginFiles = files.filter((file) => file.endsWith(".js") && !file.includes("_") && !file.includes("test"))

    return pluginFiles.length
  } catch (error) {
    console.error("Error al contar plugins:", error)
    return 303
  }
}

async function getAllFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getAllFiles(res) : res
    }),
  )
  return files.flat()
}

handler.help = ["botlist"]
handler.tags = ["sumibot"]
handler.command = ["listbot", "listbots", "bots", "sumibots", "botlist"]

export default handler
