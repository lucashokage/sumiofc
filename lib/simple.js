import path from "path"
import { toAudio } from "./converter.js"
import chalk from "chalk"
import fetch from "node-fetch"
import fs from "fs"
import util from "util"
import { fileTypeFromBuffer } from "file-type"
import { format } from "util"
import { fileURLToPath } from "url"
import store from "./store.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const {
  default: _makeWaSocket,
  makeWALegacySocket,
  proto,
  downloadContentFromMessage,
  jidDecode,
  areJidsSameUser,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  WAMessageStubType,
  extractMessageContent,
  prepareWAMessageMedia,
} = (await import("@whiskeysockets/baileys")).default

// Constantes para el canal - igual que en ejemplo.js
const NEWSLETTER_JID = "120363350001469800@newsletter"
const NEWSLETTER_NAME = "ꉹ ׅ🌿 ᩙ̨ ׄ 𖣁ׄᧉ᪶ık𝗈᳘kᥙ ׅ ᗤ  𝐒⍴ɑ᳘ᥴᧉᩥ ׄ 🍵ᩙ"

export function makeWASocket(connectionOptions, options = {}) {
  const conn = (global.opts["legacy"] ? makeWALegacySocket : _makeWaSocket)(connectionOptions)

  const ev = conn.ev

  const sock = Object.defineProperties(conn, {
    chats: {
      value: { ...(options.chats || {}) },
      writable: true,
    },
    decodeJid: {
      value(jid) {
        if (!jid || typeof jid !== "string") return (!nullish(jid) && jid) || null
        return jidDecode(jid)
      },
    },
    logger: {
      get() {
        return {
          info(...args) {
            console.log(
              chalk.bold.bgRgb(51, 204, 51)("INFO "),
              `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
              chalk.cyan(format(...args)),
            )
          },
          error(...args) {
            console.log(
              chalk.bold.bgRgb(247, 38, 33)("ERROR "),
              `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
              chalk.rgb(255, 38, 0)(format(...args)),
            )
          },
          warn(...args) {
            console.log(
              chalk.bold.bgRgb(255, 153, 0)("WARNING "),
              `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
              chalk.redBright(format(...args)),
            )
          },
          trace(...args) {
            console.log(
              chalk.grey("TRACE "),
              `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
              chalk.white(format(...args)),
            )
          },
          debug(...args) {
            console.log(
              chalk.bold.bgRgb(66, 167, 245)("DEBUG "),
              `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
              chalk.white(format(...args)),
            )
          },
        }
      },
      enumerable: true,
    },
    getFile: {
      async value(PATH, saveToFile = false) {
        let res, filename
        const data = Buffer.isBuffer(PATH)
          ? PATH
          : PATH instanceof ArrayBuffer
            ? PATH.toBuffer()
            : /^data:.*?\/.*?;base64,/i.test(PATH)
              ? Buffer.from(PATH.split`,`[1], "base64")
              : /^https?:\/\//.test(PATH)
                ? await (res = await fetch(PATH)).buffer()
                : fs.existsSync(PATH)
                  ? ((filename = PATH), fs.readFileSync(PATH))
                  : typeof PATH === "string"
                    ? PATH
                    : Buffer.alloc(0)
        if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer")
        const type = (await fileTypeFromBuffer(data)) || {
          mime: "application/octet-stream",
          ext: ".bin",
        }
        if (data && saveToFile && !filename)
          (filename = path.join(__dirname, "../tmp/" + new Date() * 1 + "." + type.ext)),
            await fs.promises.writeFile(filename, data)
        return {
          res,
          filename,
          ...type,
          data,
          deleteFile() {
            return filename && fs.promises.unlink(filename)
          },
        }
      },
      enumerable: true,
    },
    waitEvent: {
      value(eventName, is = () => true, maxTries = 25) {
        return new Promise((resolve, reject) => {
          let tries = 0
          const on = (...args) => {
            if (++tries > maxTries) reject("Max tries reached")
            else if (is()) {
              conn.ev.off(eventName, on)
              resolve(...args)
            }
          }
          conn.ev.on(eventName, on)
        })
      },
    },
    sendFile: {
      async value(jid, path, filename = "", caption = "", quoted, ptt = false, options = {}) {
        const type = await conn.getFile(path, true)
        let { res, data: file, filename: pathFile } = type
        if ((res && res.status !== 200) || file.length <= 65536) {
          try {
            throw { json: JSON.parse(file.toString()) }
          } catch (e) {
            if (e.json) throw e.json
          }
        }
        const fileSize = fs.statSync(pathFile).size / 1024 / 1024
        if (fileSize >= 20000) throw new Error(" ✳️  El tamaño del archivo es demasiado grande\n\n")
        const opt = {}
        if (quoted) opt.quoted = quoted
        if (!type) options.asDocument = true
        let mtype = "",
          mimetype = options.mimetype || type.mime,
          convert
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = "sticker"
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = "image"
        else if (/video/.test(type.mime)) mtype = "video"
        else if (/audio/.test(type.mime))
          (convert = await toAudio(file, type.ext)),
            (file = convert.data),
            (pathFile = convert.filename),
            (mtype = "audio"),
            (mimetype = options.mimetype || "audio/ogg; codecs=opus")
        else mtype = "document"
        if (options.asDocument) mtype = "document"

        delete options.asSticker
        delete options.asLocation
        delete options.asVideo
        delete options.asDocument
        delete options.asImage

        let message = {
          ...options,
          caption,
          ptt,
          [mtype]: { url: pathFile },
          mimetype,
          fileName: filename || pathFile.split("/").pop(),
        }

        // Implementación de la funcionalidad de canal
        if (options.asChannel || options.asNewsletter) {
          const viewOnceMessage = {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
            },
          }

          viewOnceMessage.message[mtype] = message[mtype]
          if (caption) viewOnceMessage.message.caption = caption

          viewOnceMessage.message.messageContextInfo.forwardingScore = 1
          viewOnceMessage.message.messageContextInfo.isForwarded = true

          viewOnceMessage.message.messageContextInfo.channelId = NEWSLETTER_JID
          viewOnceMessage.message.messageContextInfo.channelName = NEWSLETTER_NAME

          message = viewOnceMessage
        }

        let m
        try {
          m = await conn.sendMessage(jid, message, { ...opt, ...options })
        } catch (e) {
          console.error(e)
          m = null
        } finally {
          if (!m) m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
          file = null
          return m
        }
      },
      enumerable: true,
    },
    sendContact: {
      async value(jid, data, quoted, options) {
        if (!Array.isArray(data[0]) && typeof data[0] === "string") data = [data]
        const contacts = []

        for (let [number, name, numberowner, gmail, instagram, onum] of data) {
          number = number.replace(/[^0-9]/g, "")
          const njid = number + "@s.whatsapp.net"

          const vcard = `
BEGIN:VCARD
VERSION:3.0
N:Sy;Bot;;;
FN:${name}
item.ORG:Creator Bot
item1.TEL;waid=${numberowner}:${numberowner}@s.whatsapp.net
item1.X-ABLabel:${onum}
item2.EMAIL;type=INTERNET:${gmail}
item2.X-ABLabel:Email
item5.URL:${instagram}
item5.X-ABLabel:Website
END:VCARD
                    `.trim()

          contacts.push({ vcard, displayName: name })
        }

        return await conn.sendMessage(
          jid,
          {
            ...options,
            contacts: {
              ...options,
              displayName: contacts.length >= 2 ? `${contacts.length} contactos` : contacts[0].displayName || null,
              contacts,
            },
          },
          { quoted, ...options },
        )
      },
      enumerable: true,
    },

    reply: {
      value(jid, text = "", quoted, options = {}) {
        // Implementación de la funcionalidad de canal
        if (options.asChannel || options.asNewsletter) {
          const viewOnceMessage = {
            message: {
              extendedTextMessage: { text },
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                forwardingScore: 1,
                isForwarded: true,
                channelId: NEWSLETTER_JID,
                channelName: NEWSLETTER_NAME,
              },
            },
          }

          return conn.sendMessage(jid, viewOnceMessage, { quoted, ...options })
        }

        return Buffer.isBuffer(text)
          ? conn.sendFile(jid, text, "file", "", quoted, false, options)
          : conn.sendMessage(jid, { ...options, text }, { quoted, ...options })
      },
    },

    sendButton: {
      async value(jid, text = "", footer = "", buffer, buttons, quoted, options) {
        if (Array.isArray(buffer)) (options = quoted), (quoted = buttons), (buttons = buffer), (buffer = null)
        if (!Array.isArray(buttons[0]) && typeof buttons[0] === "string") buttons = [buttons]

        if (!options) options = {}
        const preparedButtons = buttons.map((btn) => ({
          buttonId: btn[1] || btn[0],
          buttonText: {
            displayText: btn[0] || "",
          },
          type: 1,
        }))

        const message = {
          [buffer ? "caption" : "text"]: text || "",
          footer,
          buttons: preparedButtons,
          headerType: 4,
          viewOnce: true,
          ...options,
          ...(buffer
            ? {
                image: { url: typeof buffer === "string" ? buffer : undefined },
              }
            : {}),
        }

        // Añadir información de canal si se solicita
        if (options.asChannel || options.asNewsletter) {
          if (!message.contextInfo) message.contextInfo = {}
          message.contextInfo.forwardingScore = 1
          message.contextInfo.isForwarded = true
          message.contextInfo.channelId = NEWSLETTER_JID
          message.contextInfo.channelName = NEWSLETTER_NAME
        }

        return await conn.sendMessage(jid, message, { quoted, upload: conn.waUploadToServer, ...options })
      },
      enumerable: true,
    },

    // Implementación de la función copyNForward con soporte para canal
    copyNForward: {
      async value(jid, message, forwardingScore = true, options = {}) {
        let vtype
        if (options.readViewOnce && message.message.viewOnceMessage?.message) {
          vtype = Object.keys(message.message.viewOnceMessage.message)[0]
          delete message.message.viewOnceMessage.message[vtype].viewOnce
          message.message = proto.Message.fromObject(
            JSON.parse(JSON.stringify(message.message.viewOnceMessage.message)),
          )
          message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo
        }
        const mtype = Object.keys(message.message)[0]
        let m = generateForwardMessageContent(message, !!forwardingScore)
        const ctype = Object.keys(m)[0]
        if (forwardingScore && typeof forwardingScore === "number" && forwardingScore > 1)
          m[ctype].contextInfo.forwardingScore += forwardingScore
        m[ctype].contextInfo = {
          ...(message.message[mtype].contextInfo || {}),
          ...(m[ctype].contextInfo || {}),
        }

        // Implementación de la funcionalidad de canal
        if (options.asChannel || options.asNewsletter) {
          if (!m[ctype].contextInfo) m[ctype].contextInfo = {}
          m[ctype].contextInfo.forwardingScore = 1
          m[ctype].contextInfo.isForwarded = true
          m[ctype].contextInfo.channelId = NEWSLETTER_JID
          m[ctype].contextInfo.channelName = NEWSLETTER_NAME
        }

        m = generateWAMessageFromContent(jid, m, {
          ...options,
          userJid: conn.user.jid,
        })
        await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
        return m
      },
      enumerable: true,
    },

    // Resto de funciones del archivo original...
    // (Mantén todas las demás funciones que ya tenías en tu archivo simple.js)
  })
  if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id)
  store.bind(sock)
  return sock
}

// Resto del código original...
// (Mantén todas las demás funciones que ya tenías en tu archivo simple.js)

export function smsg(conn, m, hasParent) {
  if (!m) return m
  const M = proto.WebMessageInfo
  m = M.fromObject(m)
  m.conn = conn
  let protocolMessageKey
  if (m.message) {
    if (m.mtype == "protocolMessage" && m.msg.key) {
      protocolMessageKey = m.msg.key
      if (protocolMessageKey == "status@broadcast") protocolMessageKey.remoteJid = m.chat
      if (!protocolMessageKey.participant || protocolMessageKey.participant == "status_me")
        protocolMessageKey.participant = m.sender
      protocolMessageKey.fromMe = conn.decodeJid(protocolMessageKey.participant) === conn.decodeJid(conn.user.id)
      if (!protocolMessageKey.fromMe && protocolMessageKey.remoteJid === conn.decodeJid(conn.user.id))
        protocolMessageKey.remoteJid = m.sender
    }
    if (m.quoted) if (!m.quoted.mediaMessage) delete m.quoted.download
  }
  if (!m.mediaMessage) delete m.download

  try {
    if (protocolMessageKey && m.mtype == "protocolMessage") conn.ev.emit("message.delete", protocolMessageKey)
  } catch (e) {
    console.error(e)
  }
  return m
}

export function serialize() {
  const MediaType = ["imageMessage", "videoMessage", "audioMessage", "stickerMessage", "documentMessage"]
  return Object.defineProperties(proto.WebMessageInfo.prototype, {
    conn: {
      value: undefined,
      enumerable: false,
      writable: true,
    },
    id: {
      get() {
        return this.key?.id
      },
    },
    isBaileys: {
      get() {
        return this.id?.length === 16 || (this.id?.startsWith("3EB0") && this.id?.length === 12) || false
      },
    },
    chat: {
      get() {
        const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId
        return (
          this.key?.remoteJid ||
          (senderKeyDistributionMessage && senderKeyDistributionMessage !== "status@broadcast") ||
          ""
        ).decodeJid()
      },
    },
    isGroup: {
      get() {
        return this.chat.endsWith("@g.us")
      },
      enumerable: true,
    },
    sender: {
      get() {
        return this.conn?.decodeJid(
          (this.key?.fromMe && this.conn?.user.id) || this.participant || this.key.participant || this.chat || "",
        )
      },
      enumerable: true,
    },
    fromMe: {
      get() {
        return this.key?.fromMe || areJidsSameUser(this.conn?.user.id, this.sender) || false
      },
    },
    mtype: {
      get() {
        if (!this.message) return ""
        const type = Object.keys(this.message)
        return (
          (!["senderKeyDistributionMessage", "messageContextInfo"].includes(type[0]) && type[0]) ||
          (type.length >= 3 && type[1] !== "messageContextInfo" && type[1]) ||
          type[type.length - 1]
        )
      },
      enumerable: true,
    },
    msg: {
      get() {
        if (!this.message) return null
        return this.message[this.mtype]
      },
    },
    mediaMessage: {
      get() {
        if (!this.message) return null
        const Message =
          (this.msg?.url || this.msg?.directPath ? { ...this.message } : extractMessageContent(this.message)) || null
        if (!Message) return null
        const mtype = Object.keys(Message)[0]
        return MediaType.includes(mtype) ? Message : null
      },
      enumerable: true,
    },
    mediaType: {
      get() {
        let message
        if (!(message = this.mediaMessage)) return null
        return Object.keys(message)[0]
      },
      enumerable: true,
    },
    quoted: {
      get() {
        const self = this
        const msg = self.msg
        const contextInfo = msg?.contextInfo
        const quoted = contextInfo?.quotedMessage
        if (!msg || !contextInfo || !quoted) return null
        const type = Object.keys(quoted)[0]
        const q = quoted[type]
        const text = typeof q === "string" ? q : q.text
        return Object.defineProperties(JSON.parse(JSON.stringify(typeof q === "string" ? { text: q } : q)), {
          mtype: {
            get() {
              return type
            },
            enumerable: true,
          },
          mediaMessage: {
            get() {
              const Message = (q.url || q.directPath ? { ...quoted } : extractMessageContent(quoted)) || null
              if (!Message) return null
              const mtype = Object.keys(Message)[0]
              return MediaType.includes(mtype) ? Message : null
            },
            enumerable: true,
          },
          mediaType: {
            get() {
              let message
              if (!(message = this.mediaMessage)) return null
              return Object.keys(message)[0]
            },
            enumerable: true,
          },
          id: {
            get() {
              return contextInfo.stanzaId
            },
            enumerable: true,
          },
          chat: {
            get() {
              return contextInfo.remoteJid || self.chat
            },
            enumerable: true,
          },
          isBaileys: {
            get() {
              return this.id?.length === 16 || (this.id?.startsWith("3EB0") && this.id.length === 12) || false
            },
            enumerable: true,
          },
          sender: {
            get() {
              return (contextInfo.participant || this.chat || "").decodeJid()
            },
            enumerable: true,
          },
          fromMe: {
            get() {
              return areJidsSameUser(this.sender, self.conn?.user.jid)
            },
            enumerable: true,
          },
          text: {
            get() {
              return text || this.caption || this.contentText || this.selectedDisplayText || ""
            },
            enumerable: true,
          },
          mentionedJid: {
            get() {
              return q.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || []
            },
            enumerable: true,
          },
          name: {
            get() {
              const sender = this.sender
              return sender ? self.conn?.getName(sender) : null
            },
            enumerable: true,
          },
          vM: {
            get() {
              return proto.WebMessageInfo.fromObject({
                key: {
                  fromMe: this.fromMe,
                  remoteJid: this.chat,
                  id: this.id,
                },
                message: quoted,
                ...(self.isGroup ? { participant: this.sender } : {}),
              })
            },
          },
          fakeObj: {
            get() {
              return this.vM
            },
          },
          download: {
            value(saveToFile = false) {
              const mtype = this.mediaType
              return self.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ""), saveToFile)
            },
            enumerable: true,
            configurable: true,
          },
          reply: {
            value(text, chatId, options) {
              return self.conn?.reply(chatId ? chatId : this.chat, text, this.vM, options)
            },
            enumerable: true,
          },
          copy: {
            value() {
              const M = proto.WebMessageInfo
              return smsg(self.conn, M.fromObject(M.toObject(this.vM)))
            },
            enumerable: true,
          },
          forward: {
            value(jid, force = false, options) {
              return self.conn?.sendMessage(
                jid,
                {
                  forward: this.vM,
                  force,
                  ...options,
                },
                { ...options },
              )
            },
            enumerable: true,
          },
          copyNForward: {
            value(jid, forwardingScore = false, options) {
              return self.conn?.copyNForward(jid, this.vM, forwardingScore, options)
            },
            enumerable: true,
          },
          cMod: {
            value(jid, text = "", sender = this.sender, options = {}) {
              return self.conn?.cMod(jid, this.vM, text, sender, options)
            },
            enumerable: true,
          },
          delete: {
            value() {
              return self.conn?.sendMessage(this.chat, { delete: this.vM.key })
            },
            enumerable: true,
          },
          react: {
            value(text) {
              return self.conn?.sendMessage(this.chat, {
                react: {
                  text,
                  key: this.vM.key,
                },
              })
            },
            enumerable: true,
          },
        })
      },
      enumerable: true,
    },
    _text: {
      value: null,
      writable: true,
    },
    text: {
      get() {
        const msg = this.msg
        const text = (typeof msg === "string" ? msg : msg?.text) || msg?.caption || msg?.contentText || ""
        return typeof this._text === "string"
          ? this._text
          : "" ||
              (typeof text === "string"
                ? text
                : text?.selectedDisplayText || text?.hydratedTemplate?.hydratedContentText || text) ||
              ""
      },
      set(str) {
        return (this._text = str)
      },
      enumerable: true,
    },
    mentionedJid: {
      get() {
        return (this.msg?.contextInfo?.mentionedJid?.length && this.msg.contextInfo.mentionedJid) || []
      },
      enumerable: true,
    },
    name: {
      get() {
        return (!nullish(this.pushName) && this.pushName) || this.conn?.getName(this.sender)
      },
      enumerable: true,
    },
    download: {
      value(saveToFile = false) {
        const mtype = this.mediaType
        return this.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ""), saveToFile)
      },
      enumerable: true,
      configurable: true,
    },
    reply: {
      value(text, chatId, options) {
        return this.conn?.reply(chatId ? chatId : this.chat, text, this, options)
      },
    },
    copy: {
      value() {
        const M = proto.WebMessageInfo
        return smsg(this.conn, M.fromObject(M.toObject(this)))
      },
      enumerable: true,
    },
    forward: {
      value(jid, force = false, options = {}) {
        return this.conn?.sendMessage(
          jid,
          {
            forward: this,
            force,
            ...options,
          },
          { ...options },
        )
      },
      enumerable: true,
    },
    copyNForward: {
      value(jid, forwardingScore = false, options = {}) {
        return this.conn?.copyNForward(jid, this, forwardingScore, options)
      },
      enumerable: true,
    },
    cMod: {
      value(jid, text = "", sender = this.sender, options = {}) {
        return this.conn?.cMod(jid, this, text, sender, options)
      },
      enumerable: true,
    },
    getQuotedObj: {
      value() {
        if (!this.quoted.id) return null
        const q = proto.WebMessageInfo.fromObject(this.conn?.loadMessage(this.quoted.id) || this.quoted.vM)
        return smsg(this.conn, q)
      },
      enumerable: true,
    },
    getQuotedMessage: {
      get() {
        return this.getQuotedObj
      },
    },
    delete: {
      value() {
        return this.conn?.sendMessage(this.chat, { delete: this.key })
      },
      enumerable: true,
    },
    react: {
      value(text) {
        return this.conn?.sendMessage(this.chat, {
          react: {
            text,
            key: this.key,
          },
        })
      },
      enumerable: true,
    },
  })
}

export function logic(check, inp, out) {
  if (inp.length !== out.length) throw new Error("Input and Output must have same length")
  for (const i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
  return null
}

export function protoType() {
  Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
    const ab = new ArrayBuffer(this.length)
    const view = new Uint8Array(ab)
    for (let i = 0; i < this.length; ++i) {
      view[i] = this[i]
    }
    return ab
  }
  Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
    return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength)
  }
  ArrayBuffer.prototype.toBuffer = function toBuffer() {
    return Buffer.from(new Uint8Array(this))
  }
  Uint8Array.prototype.getFileType =
    ArrayBuffer.prototype.getFileType =
    Buffer.prototype.getFileType =
      async function getFileType() {
        return await fileTypeFromBuffer(this)
      }
  String.prototype.isNumber = Number.prototype.isNumber = isNumber
  String.prototype.capitalize = function capitalize() {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length)
  }
  String.prototype.capitalizeV2 = function capitalizeV2() {
    const str = this.split(" ")
    return str.map((v) => v.capitalize()).join(" ")
  }
  String.prototype.decodeJid = function decodeJid() {
    if (/:\d+@/gi.test(this)) {
      const decode = jidDecode(this) || {}
      return ((decode.user && decode.server && decode.user + "@" + decode.server) || this).trim()
    } else return this.trim()
  }
  Number.prototype.toTimeString = function toTimeString() {
    const seconds = Math.floor((this / 1000) % 60)
    const minutes = Math.floor((this / (60 * 1000)) % 60)
    const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
    const days = Math.floor(this / (24 * 60 * 60 * 1000))
    return (
      (days ? `${days} day(s) ` : "") +
      (hours ? `${hours} hour(s) ` : "") +
      (minutes ? `${minutes} minute(s) ` : "") +
      (seconds ? `${seconds} second(s)` : "")
    ).trim()
  }
  Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom
}

function isNumber() {
  const int = Number.parseInt(this)
  return typeof int === "number" && !isNaN(int)
}

function getRandom() {
  if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)]
  return Math.floor(Math.random() * this)
}

function nullish(args) {
  return !(args !== null && args !== undefined)
}

const S_WHATSAPP_NET = "s.whatsapp.net"
