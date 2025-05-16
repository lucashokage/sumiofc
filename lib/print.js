import { WAMessageStubType } from "@whiskeysockets/baileys"
import PhoneNumber from "awesome-phonenumber"
import chalk from "chalk"
import { watchFile } from "fs"

const terminalImage = global.opts["img"] ? require("terminal-image") : ""
const urlRegex = (await import("url-regex-safe")).default({ strict: false })

export default async function (m, conn = { user: {} }) {
  try {
    // Skip processing if connection is not valid or not the main bot
    if (
      !conn ||
      !conn.user ||
      !conn.user.jid ||
      !global.conn ||
      !global.conn.user ||
      conn.user.jid !== global.conn.user.jid
    )
      return

    let _name = ""
    try {
      if (m.sender && conn.getName && typeof conn.getName === "function") {
        _name = await conn.getName(m.sender)
      }
    } catch (e) {
      console.error("Error getting sender name:", e)
    }

    let sender = ""
    if (m.sender) {
      sender =
        PhoneNumber("+" + m.sender.replace("@s.whatsapp.net", "")).getNumber("international") +
        (_name ? " ~" + _name : "")
    }

    let chat = ""
    try {
      if (m.chat && conn.getName && typeof conn.getName === "function") {
        chat = await conn.getName(m.chat)
      }
    } catch (e) {
      console.error("Error getting chat name:", e)
    }

    let img
    try {
      if (global.opts["img"]) {
        img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false
      }
    } catch (e) {
      console.error("Error processing image:", e)
    }

    const filesize =
      (m.msg
        ? m.msg.vcard
          ? m.msg.vcard.length
          : m.msg.fileLength
            ? m.msg.fileLength.low || m.msg.fileLength
            : m.msg.axolotlSenderKeyDistributionMessage
              ? m.msg.axolotlSenderKeyDistributionMessage.length
              : m.text
                ? m.text.length
                : 0
        : m.text
          ? m.text.length
          : 0) || 0

    const user = global.DATABASE?.data?.users?.[m.sender] || {}
    const me = PhoneNumber("+" + (conn.user?.jid || "").replace("@s.whatsapp.net", "")).getNumber("international")

    console.log(
      `
${chalk.hex("#FE0041").bold("┎━─━─━─━─━─━─━━──━━──━")}
🤖 ${chalk.cyan("%s")} ⏱️ ${chalk.black(chalk.bgGreen("%s"))} 📂 ${chalk.black(chalk.bgGreen("%s"))} ${chalk.magenta("%s [%s %sB]")} 
👤 ${chalk.redBright("%s")} 🏦 ${chalk.yellow("%s%s")} ${chalk.blueBright("en")} 
👥 ${chalk.green("%s")} ${chalk.black(chalk.bgYellow("%s"))}
${chalk.hex("#FE0041").bold("┕━─━─━─━─━─━─━━──━━──━")}
`.trim(),
      me + (conn.user?.name ? " ~" + conn.user.name : ""),

      (m.messageTimestamp
        ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp))
        : new Date()
      ).toLocaleTimeString("es-ES", { timeZone: "America/Argentina/Buenos_Aires" }),

      m.messageStubType ? WAMessageStubType[m.messageStubType] : "",
      filesize,
      filesize === 0 ? 0 : (filesize / 1009 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1),
      ["", ..."KMGTP"][Math.floor(Math.log(filesize) / Math.log(1000))] || "",
      sender,
      m?.exp || "?",
      user ? "|" + (user.exp || "0") + "|" + (user.diamond || "0") : "" + ("|" + (user.level || "0")),
      (m.chat || "") + (chat ? " ~ " + chat : ""),
      m.mtype
        ? m.mtype
            .replace(/message$/i, "")
            .replace("audio", m.msg?.ptt ? "PTT" : "audio")
            .replace(/^./, (v) => v.toUpperCase())
        : "",
    )

    if (img) console.log(img.trimEnd())

    if (typeof m.text === "string" && m.text) {
      let log = m.text.replace(/\u200e+/g, "")
      const mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
      const mdFormat =
        (depth = 4) =>
        (_, type, text, monospace) => {
          const types = {
            _: "italic",
            "*": "bold",
            "~": "strikethrough",
          }
          text = text || monospace
          return !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)))
        }

      if (log.length < 1024) {
        log = log.replace(urlRegex, (url, i, text) => {
          const end = url.length + i
          return i === 0 || end === text.length || (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1]))
            ? chalk.blueBright(url)
            : url
        })
      }

      log = log.replace(mdRegex, mdFormat(4))

      if (m.mentionedJid && Array.isArray(m.mentionedJid)) {
        for (const user of m.mentionedJid) {
          if (user) {
            try {
              const name = await conn.getName(user)
              log = log.replace("@" + user.split`@`[0], chalk.blueBright("@" + (name || user.split`@`[0])))
            } catch (e) {
              console.error("Error processing mention:", e)
              log = log.replace("@" + user.split`@`[0], chalk.blueBright("@" + user.split`@`[0]))
            }
          }
        }
      }

      console.log(m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log)
    }

    if (m.messageStubParameters && Array.isArray(m.messageStubParameters)) {
      console.log(
        m.messageStubParameters
          .map((jid) => {
            if (!jid) return ""
            jid = conn.decodeJid(jid)
            let name = ""
            try {
              name = conn.getName(jid)
            } catch (e) {}
            return chalk.gray(
              PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international") +
                (name ? " ~" + name : ""),
            )
          })
          .filter(Boolean)
          .join(", "),
      )
    }

    if (/document/i.test(m.mtype)) console.log(`📄 ${m.msg?.fileName || m.msg?.displayName || "Document"}`)
    else if (/ContactsArray/i.test(m.mtype)) console.log(`👨‍👩‍👧‍👦 ${" " || ""}`)
    else if (/contact/i.test(m.mtype)) console.log(`👨 ${m.msg?.displayName || ""}`)
    else if (/audio/i.test(m.mtype)) {
      const duration = m.msg?.seconds || 0
      console.log(
        `${m.msg?.ptt ? "🎤 (PTT " : "🎵 ("}AUDIO) ${Math.floor(duration / 60)
          .toString()
          .padStart(2, 0)}:${(duration % 60).toString().padStart(2, 0)}`,
      )
    }

    console.log()
  } catch (e) {
    console.error("Error in print.js:", e)
  }
}

const file = global.__filename(import.meta.url)
watchFile(file, () => {
  console.log(chalk.redBright("Update 'lib/print.js'"))
})
