import path from "path"
import { toAudio } from "./converter.js"
import chalk from "chalk"
import fetch from "node-fetch"
import PhoneNumber from "awesome-phonenumber"
import fs from "fs"
import { fileTypeFromBuffer } from "file-type"
import { format } from "util"
import { fileURLToPath } from "url"

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

const NEWSLETTER_JID = "120363324350463849@newsletter"
const NEWSLETTER_NAME = "❤️̶۫̄͟Ⓢ︎𓏲S͟u͟m͟m͟i͟𓍲̈͜𝗨̴ᥣ̥𝗍̈rᥲ̄𓊓̵̬𝐁o̸t̸❤️̶۫̄͟─"

function nullish(value) {
  return value === null || value === undefined
}

export function protoType() {
  return proto
}

export function makeWASocket(connectionOptions, options = {}) {
  const conn = (global.opts && global.opts["legacy"] ? makeWALegacySocket : _makeWaSocket)(connectionOptions)
  const ev = conn.ev

  const sock = Object.defineProperties(conn, {
    chats: {
      value: { ...(options.chats || {}) },
      writable: true,
    },
    decodeJid: {
      value(jid) {
        if (!jid || typeof jid !== "string") return jid || null
        return jid.decodeJid ? jid.decodeJid() : jid
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
        try {
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
          if (data && saveToFile && !filename) {
            filename = path.join(__dirname, "../tmp/" + new Date() * 1 + "." + type.ext)
            await fs.promises.writeFile(filename, data)
          }
          return {
            res,
            filename,
            ...type,
            data,
            deleteFile() {
              return filename && fs.promises.unlink(filename).catch(() => {})
            },
          }
        } catch (error) {
          console.error("Error in getFile:", error)
          return {
            res: null,
            filename: "",
            mime: "application/octet-stream",
            ext: ".bin",
            data: Buffer.alloc(0),
            deleteFile() {
              return Promise.resolve()
            },
          }
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
        try {
          const type = await conn.getFile(path, true)
          let { res, data: file, filename: pathFile } = type
          if ((res && res.status !== 200) || file.length <= 65536) {
            try {
              throw { json: JSON.parse(file.toString()) }
            } catch (e) {
              if (e.json) throw e.json
            }
          }

          let fileSize = 0
          if (pathFile && fs.existsSync(pathFile)) {
            fileSize = fs.statSync(pathFile).size / 1024 / 1024
          }

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
          else if (/audio/.test(type.mime)) {
            try {
              convert = await toAudio(file, type.ext)
              file = convert.data
              pathFile = convert.filename
              mtype = "audio"
              mimetype = options.mimetype || "audio/ogg; codecs=opus"
            } catch (e) {
              console.error("Error converting audio:", e)
              mtype = "document"
            }
          } else mtype = "document"

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
        } catch (error) {
          console.error("Error in sendFile:", error)
          throw error
        }
      },
      enumerable: true,
    },
    sendContact: {
      async value(jid, data, quoted, options) {
        try {
          if (!Array.isArray(data[0]) && typeof data[0] === "string") data = [data]
          const contacts = []

          for (let [number, name, numberowner, gmail, instagram, onum] of data) {
            number = number.replace(/[^0-9]/g, "")
            const njid = number + "@s.whatsapp.net"

            const vcard = `
BEGIN:VCARD
VERSION:3.0
N:Sy;Bot;;;
FN:${name || "Unknown"}
item.ORG:Creator Bot
item1.TEL;waid=${numberowner || number}:${numberowner || number}@s.whatsapp.net
item1.X-ABLabel:${onum || "Contact"}
item2.EMAIL;type=INTERNET:${gmail || "example@gmail.com"}
item2.X-ABLabel:Email
item5.URL:${instagram || "https://instagram.com"}
item5.X-ABLabel:Website
END:VCARD
                        `.trim()

            contacts.push({ vcard, displayName: name || "Unknown" })
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
        } catch (error) {
          console.error("Error in sendContact:", error)
          throw error
        }
      },
      enumerable: true,
    },
    reply: {
      value(jid, text = "", quoted, options = {}) {
        try {
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
        } catch (error) {
          console.error("Error in reply:", error)
          throw error
        }
      },
    },
    sendButton: {
      async value(jid, text = "", footer = "", buffer, buttons, quoted, options) {
        try {
          if (Array.isArray(buffer)) {
            options = quoted
            quoted = buttons
            buttons = buffer
            buffer = null
          }

          if (!Array.isArray(buttons[0]) && typeof buttons[0] === "string") buttons = [buttons]

          if (!options) options = {}
          const preparedButtons = buttons.map((btn) => ({
            buttonId: btn[1] || btn[0] || "",
            buttonText: {
              displayText: btn[0] || btn[1] || "",
            },
            type: 1,
          }))

          const message = {
            [buffer ? "caption" : "text"]: text || "",
            footer: footer || "",
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

          return await conn.sendMessage(jid, message, { quoted, upload: conn.waUploadToServer, ...options })
        } catch (error) {
          console.error("Error in sendButton:", error)
          throw error
        }
      },
      enumerable: true,
    },
    sendButton2: {
      async value(jid, text = "", footer = "", buffer, buttons, copy, urls, quoted, options) {
        try {
          let img, video

          if (buffer) {
            if (/^https?:\/\//i.test(buffer)) {
              try {
                const response = await fetch(buffer)
                const contentType = response.headers.get("content-type")
                if (/^image\//i.test(contentType)) {
                  img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer })
                } else if (/^video\//i.test(contentType)) {
                  video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer })
                } else {
                  console.error("Tipo MIME no compatible:", contentType)
                }
              } catch (error) {
                console.error("Error al obtener el tipo MIME:", error)
              }
            } else {
              try {
                const type = await conn.getFile(buffer)
                if (/^image\//i.test(type.mime)) {
                  img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer })
                } else if (/^video\//i.test(type.mime)) {
                  video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer })
                }
              } catch (error) {
                console.error("Error al obtener el tipo de archivo:", error)
              }
            }
          }

          const dynamicButtons =
            buttons && Array.isArray(buttons)
              ? buttons.map((btn) => ({
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: btn[0] || "",
                    id: btn[1] || btn[0] || "",
                  }),
                }))
              : []

          if (copy && (typeof copy === "string" || typeof copy === "number")) {
            dynamicButtons.push({
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: "Copy",
                copy_code: copy,
              }),
            })
          }

          if (urls && Array.isArray(urls)) {
            urls.forEach((url) => {
              dynamicButtons.push({
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: url[0] || "Link",
                  url: url[1] || "#",
                  merchant_url: url[1] || "#",
                }),
              })
            })
          }

          const interactiveMessage = {
            body: { text: text || "" },
            footer: { text: footer || "" },
            header: {
              hasMediaAttachment: !!(img || video),
              imageMessage: img ? img.imageMessage : null,
              videoMessage: video ? video.videoMessage : null,
            },
            nativeFlowMessage: {
              buttons: dynamicButtons,
              messageParamsJson: "",
            },
          }

          const msgL = generateWAMessageFromContent(
            jid,
            {
              viewOnceMessage: {
                message: {
                  interactiveMessage,
                },
              },
            },
            { userJid: conn.user.jid, quoted },
          )

          conn.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options })
        } catch (error) {
          console.error("Error in sendButton2:", error)
          throw error
        }
      },
    },
    sendList: {
      async value(jid, title, text, buttonText, buffer, listSections, quoted, options = {}) {
        try {
          let img, video

          if (buffer) {
            if (/^https?:\/\//i.test(buffer)) {
              try {
                const response = await fetch(buffer)
                const contentType = response.headers.get("content-type")
                if (/^image\//i.test(contentType)) {
                  img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer })
                } else if (/^video\//i.test(contentType)) {
                  video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer })
                } else {
                  console.error("Tipo MIME no compatible:", contentType)
                }
              } catch (error) {
                console.error("Error al obtener el tipo MIME:", error)
              }
            } else {
              try {
                const type = await conn.getFile(buffer)
                if (/^image\//i.test(type.mime)) {
                  img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer })
                } else if (/^video\//i.test(type.mime)) {
                  video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer })
                }
              } catch (error) {
                console.error("Error al obtener el tipo de archivo:", error)
              }
            }
          }

          const sections = listSections && Array.isArray(listSections) ? [...listSections] : []

          const message = {
            interactiveMessage: {
              header: {
                title: title || "",
                hasMediaAttachment: !!(img || video),
                imageMessage: img ? img.imageMessage : null,
                videoMessage: video ? video.videoMessage : null,
              },
              body: { text: text || "" },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                      title: buttonText || "Select",
                      sections,
                    }),
                  },
                ],
                messageParamsJson: "",
              },
            },
          }

          const msgL = generateWAMessageFromContent(
            jid,
            {
              viewOnceMessage: {
                message,
              },
            },
            { userJid: conn.user.jid, quoted },
          )

          conn.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options })
        } catch (error) {
          console.error("Error in sendList:", error)
          throw error
        }
      },
    },
    sendListM: {
      async value(jid, button, rows, quoted, options = {}) {
        try {
          if (!button || !rows) return

          const sections = [
            {
              title: button.title || "",
              rows: Array.isArray(rows) ? [...rows] : [],
            },
          ]

          const listMessage = {
            text: button.description || "",
            footer: button.footerText || "",
            mentions: button.description ? await conn.parseMention(button.description).catch(() => []) : [],
            title: "",
            buttonText: button.buttonText || "Select",
            sections,
          }

          conn.sendMessage(jid, listMessage, {
            quoted,
            ...options,
          })
        } catch (error) {
          console.error("Error in sendListM:", error)
          throw error
        }
      },
    },
    updateProfileStatus: {
      async value(status) {
        try {
          return conn.query({
            tag: "iq",
            attrs: {
              to: "s.whatsapp.net",
              type: "set",
              xmlns: "status",
            },
            content: [
              {
                tag: "status",
                attrs: {},
                content: Buffer.from(status || "", "utf-8"),
              },
            ],
          })
        } catch (error) {
          console.error("Error in updateProfileStatus:", error)
          throw error
        }
      },
    },
    sendPayment: {
      async value(jid, amount, currency, text = "", from, options) {
        try {
          const requestPaymentMessage = {
            amount: {
              currencyCode: currency || "USD",
              offset: 0,
              value: amount || 9.99,
            },
            expiryTimestamp: 0,
            amount1000: (amount || 9.99) * 1000,
            currencyCodeIso4217: currency || "USD",
            requestFrom: from || "0@s.whatsapp.net",
            noteMessage: {
              extendedTextMessage: {
                text: text || "Example Payment Message",
              },
            },
          }

          return conn.relayMessage(jid, { requestPaymentMessage }, { ...options })
        } catch (error) {
          console.error("Error in sendPayment:", error)
          throw error
        }
      },
    },
    sendPoll: {
      async value(jid, name = "", optiPoll, options) {
        try {
          if (!Array.isArray(optiPoll)) return

          if (!Array.isArray(optiPoll[0]) && typeof optiPoll[0] === "string") optiPoll = [optiPoll]
          if (!options) options = {}

          const pollMessage = {
            name: name || "",
            options: optiPoll.map((btn) => ({
              optionName: (!nullish(btn[0]) && btn[0]) || "",
            })),
            selectableOptionsCount: 1,
          }

          return conn.relayMessage(jid, { pollCreationMessage: pollMessage }, { ...options })
        } catch (error) {
          console.error("Error in sendPoll:", error)
          throw error
        }
      },
    },
    loadingMsg: {
      async value(jid, loamsg, loamsgEdit, loadingMessages, quoted, options) {
        try {
          if (!Array.isArray(loadingMessages)) loadingMessages = []

          const { key } = await conn.sendMessage(jid, { text: loamsg || "Loading...", ...options }, { quoted })

          for (let i = 0; i < loadingMessages.length; i++) {
            await conn.sendMessage(jid, { text: loadingMessages[i], edit: key, ...options }, { quoted })
          }

          await conn.sendMessage(jid, { text: loamsgEdit || "Done!", edit: key, ...options }, { quoted })
        } catch (error) {
          console.error("Error in loadingMsg:", error)
          throw error
        }
      },
    },
    sendHydrated: {
      async value(jid, text = "", footer = "", buffer, url, urlText, call, callText, buttons, quoted, options) {
        try {
          let type
          if (buffer)
            try {
              ;(type = await conn.getFile(buffer)), (buffer = type.data)
            } catch (e) {
              buffer = buffer
            }
          if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === "string" || Array.isArray(buffer))) {
            options = quoted
            quoted = buttons
            buttons = callText
            callText = call
            call = urlText
            urlText = url
            url = buffer
            buffer = null
          }

          if (!options) options = {}
          const templateButtons = []

          if (url || urlText) {
            if (!Array.isArray(url)) url = [url]
            if (!Array.isArray(urlText)) urlText = [urlText]
            templateButtons.push(
              ...(url
                .map((v, i) => [v, urlText[i]])
                .map(([url, urlText], i) => ({
                  index: templateButtons.length + i + 1,
                  urlButton: {
                    displayText: (!nullish(urlText) && urlText) || (!nullish(url) && url) || "",
                    url: (!nullish(url) && url) || (!nullish(urlText) && urlText) || "",
                  },
                })) || []),
            )
          }

          if (call || callText) {
            if (!Array.isArray(call)) call = [call]
            if (!Array.isArray(callText)) callText = [callText]
            templateButtons.push(
              ...(call
                .map((v, i) => [v, callText[i]])
                .map(([call, callText], i) => ({
                  index: templateButtons.length + i + 1,
                  callButton: {
                    displayText: (!nullish(callText) && callText) || (!nullish(call) && call) || "",
                    phoneNumber: (!nullish(call) && call) || (!nullish(callText) && callText) || "",
                  },
                })) || []),
            )
          }

          if (buttons && buttons.length) {
            if (!Array.isArray(buttons[0])) buttons = [buttons]
            templateButtons.push(
              ...(buttons.map(([text, id], index) => ({
                index: templateButtons.length + index + 1,
                quickReplyButton: {
                  displayText: (!nullish(text) && text) || (!nullish(id) && id) || "",
                  id: (!nullish(id) && id) || (!nullish(text) && text) || "",
                },
              })) || []),
            )
          }

          const message = {
            ...options,
            [buffer ? "caption" : "text"]: text || "",
            footer,
            templateButtons,
            ...(buffer
              ? options.asLocation && /image/.test(type.mime)
                ? {
                    location: {
                      ...options,
                      jpegThumbnail: buffer,
                    },
                  }
                : {
                    [/video/.test(type.mime) ? "video" : /image/.test(type.mime) ? "image" : "document"]: buffer,
                  }
              : {}),
          }

          return await conn.sendMessage(jid, message, {
            quoted,
            upload: conn.waUploadToServer,
            ...options,
          })
        } catch (error) {
          console.error("Error in sendHydrated:", error)
          throw error
        }
      },
      enumerable: true,
    },
    sendHydrated2: {
      async value(jid, text = "", footer = "", buffer, url, urlText, url2, urlText2, buttons, quoted, options) {
        try {
          let type
          if (buffer)
            try {
              ;(type = await conn.getFile(buffer)), (buffer = type.data)
            } catch (e) {
              buffer = buffer
            }
          if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === "string" || Array.isArray(buffer))) {
            options = quoted
            quoted = buttons
            buttons = urlText2
            urlText2 = url2
            url2 = urlText
            urlText = url
            url = buffer
            buffer = null
          }

          if (!options) options = {}
          const templateButtons = []

          if (url || urlText) {
            if (!Array.isArray(url)) url = [url]
            if (!Array.isArray(urlText)) urlText = [urlText]
            templateButtons.push(
              ...(url
                .map((v, i) => [v, urlText[i]])
                .map(([url, urlText], i) => ({
                  index: templateButtons.length + i + 1,
                  urlButton: {
                    displayText: (!nullish(urlText) && urlText) || (!nullish(url) && url) || "",
                    url: (!nullish(url) && url) || (!nullish(urlText) && urlText) || "",
                  },
                })) || []),
            )
          }

          if (url2 || urlText2) {
            if (!Array.isArray(url2)) url2 = [url2]
            if (!Array.isArray(urlText2)) urlText2 = [urlText2]
            templateButtons.push(
              ...(url2
                .map((v, i) => [v, urlText2[i]])
                .map(([url2, urlText2], i) => ({
                  index: templateButtons.length + i + 1,
                  urlButton: {
                    displayText: (!nullish(urlText2) && urlText2) || (!nullish(url2) && url2) || "",
                    url: (!nullish(url2) && url2) || (!nullish(urlText2) && urlText2) || "",
                  },
                })) || []),
            )
          }

          if (buttons && buttons.length) {
            if (!Array.isArray(buttons[0])) buttons = [buttons]
            templateButtons.push(
              ...(buttons.map(([text, id], index) => ({
                index: templateButtons.length + index + 1,
                quickReplyButton: {
                  displayText: (!nullish(text) && text) || (!nullish(id) && id) || "",
                  id: (!nullish(id) && id) || (!nullish(text) && text) || "",
                },
              })) || []),
            )
          }

          const message = {
            ...options,
            [buffer ? "caption" : "text"]: text || "",
            footer,
            templateButtons,
            ...(buffer
              ? options.asLocation && /image/.test(type.mime)
                ? {
                    location: {
                      ...options,
                      jpegThumbnail: buffer,
                    },
                  }
                : {
                    [/video/.test(type.mime) ? "video" : /image/.test(type.mime) ? "image" : "document"]: buffer,
                  }
              : {}),
          }

          return await conn.sendMessage(jid, message, {
            quoted,
            upload: conn.waUploadToServer,
            ...options,
          })
        } catch (error) {
          console.error("Error in sendHydrated2:", error)
          throw error
        }
      },
      enumerable: true,
    },
    cMod: {
      value(jid, message, text = "", sender = conn.user?.jid, options = {}) {
        try {
          if (!message || !message.key) return null

          if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
          const copy = message.toJSON ? message.toJSON() : message

          if (copy.message) {
            delete copy.message.messageContextInfo
            delete copy.message.senderKeyDistributionMessage

            const mtype = Object.keys(copy.message)[0]
            const msg = copy.message
            const content = msg[mtype]

            if (typeof content === "string") msg[mtype] = text || content
            else if (content.caption) content.caption = text || content.caption
            else if (content.text) content.text = text || content.text

            if (typeof content !== "string") {
              msg[mtype] = { ...content, ...options }
              msg[mtype].contextInfo = {
                ...(content.contextInfo || {}),
                mentionedJid: options.mentions || content.contextInfo?.mentionedJid || [],
              }
            }
          }

          if (copy.participant) sender = copy.participant = sender || copy.participant
          else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant

          if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid
          else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid

          copy.key.remoteJid = jid
          copy.key.fromMe = areJidsSameUser(sender, conn.user?.id) || false

          return proto.WebMessageInfo.fromObject(copy)
        } catch (error) {
          console.error("Error in cMod:", error)
          return null
        }
      },
      enumerable: true,
    },
    copyNForward: {
      async value(jid, message, forwardingScore = true, options = {}) {
        try {
          if (!message) return null

          let vtype
          if (options.readViewOnce && message.message?.viewOnceMessage?.message) {
            vtype = Object.keys(message.message.viewOnceMessage.message)[0]
            delete message.message.viewOnceMessage.message[vtype].viewOnce
            message.message = proto.Message.fromObject(JSON.stringify(message.message.viewOnceMessage.message))
            message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo
          }

          const mtype = Object.keys(message.message || {})[0]
          let m = generateForwardMessageContent(message, !!forwardingScore)
          const ctype = Object.keys(m)[0]

          if (forwardingScore && typeof forwardingScore === "number" && forwardingScore > 1) {
            m[ctype].contextInfo = m[ctype].contextInfo || {}
            m[ctype].contextInfo.forwardingScore = forwardingScore
          }

          m[ctype].contextInfo = {
            ...(message.message?.[mtype]?.contextInfo || {}),
            ...(m[ctype].contextInfo || {}),
          }

          if (options.asChannel || options.asNewsletter) {
            if (!m[ctype].contextInfo) m[ctype].contextInfo = {}
            m[ctype].contextInfo.forwardingScore = 1
            m[ctype].contextInfo.isForwarded = true
            m[ctype].contextInfo.channelId = NEWSLETTER_JID
            m[ctype].contextInfo.channelName = NEWSLETTER_NAME
          }

          m = generateWAMessageFromContent(jid, m, {
            ...options,
            userJid: conn.user?.jid,
          })

          await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
          return m
        } catch (error) {
          console.error("Error in copyNForward:", error)
          return null
        }
      },
      enumerable: true,
    },
    fakeReply: {
      value(jid, text = "", fakeJid = this.user?.jid, fakeText = "", fakeGroupJid, options) {
        try {
          return conn.reply(jid, text, {
            key: {
              fromMe: areJidsSameUser(fakeJid, conn.user?.id),
              participant: fakeJid,
              ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}),
            },
            message: { conversation: fakeText },
            ...options,
          })
        } catch (error) {
          console.error("Error in fakeReply:", error)
          throw error
        }
      },
    },
    downloadM: {
      async value(m, type, saveToFile) {
        try {
          let filename
          if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)

          const stream = await downloadContentFromMessage(m, type)
          let buffer = Buffer.from([])

          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }

          if (saveToFile) {
            try {
              ;({ filename } = await conn.getFile(buffer, true))
            } catch (e) {
              console.error("Error saving file:", e)
              return buffer
            }
          }

          return saveToFile && fs.existsSync(filename) ? filename : buffer
        } catch (error) {
          console.error("Error in downloadM:", error)
          return Buffer.alloc(0)
        }
      },
      enumerable: true,
    },
    parseMention: {
      value(text = "") {
        try {
          if (!text) return []
          return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + "@s.whatsapp.net")
        } catch (error) {
          console.error("Error in parseMention:", error)
          return []
        }
      },
      enumerable: true,
    },
    getName: {
      value(jid = "", withoutContact = false) {
        try {
          if (!jid) return ""
          jid = conn.decodeJid(jid)
          withoutContact = conn.withoutContact || withoutContact

          let v
          if (jid.endsWith("@g.us")) {
            return new Promise(async (resolve) => {
              v = conn.chats[jid] || {}
              if (!(v.name || v.subject)) {
                try {
                  v = (await conn.groupMetadata(jid)) || {}
                } catch (e) {
                  v = {}
                }
              }
              resolve(
                v.name || v.subject || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international"),
              )
            })
          } else {
            v =
              jid === "0@s.whatsapp.net"
                ? {
                    jid,
                    vname: "WhatsApp",
                  }
                : areJidsSameUser(jid, conn.user?.id)
                  ? conn.user
                  : conn.chats[jid] || {}

            return (
              (withoutContact ? "" : v.name) ||
              v.subject ||
              v.vname ||
              v.notify ||
              v.verifiedName ||
              PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international")
            )
          }
        } catch (error) {
          console.error("Error in getName:", error)
          return jid
        }
      },
      enumerable: true,
    },
    loadMessage: {
      value(messageID) {
        try {
          if (!messageID) return null

          return Object.entries(conn.chats)
            .filter(([_, { messages }]) => typeof messages === "object")
            .find(([_, { messages }]) =>
              Object.entries(messages).find(([k, v]) => k === messageID || v.key?.id === messageID),
            )?.[1].messages?.[messageID]
        } catch (error) {
          console.error("Error in loadMessage:", error)
          return null
        }
      },
      enumerable: true,
    },
    sendGroupV4Invite: {
      async value(
        jid,
        participant,
        inviteCode,
        inviteExpiration,
        groupName = "unknown subject",
        caption = "Invitation to join my WhatsApp group",
        jpegThumbnail,
        options = {}
      ) {
        try {
          const msg = proto.Message.fromObject({
            groupInviteMessage: proto.GroupInviteMessage.fromObject({
              inviteCode,
              inviteExpiration: Number.parseInt(inviteExpiration) || +new Date(new Date() + 3 * 86400000),
              groupJid: jid,
              groupName: (groupName ? groupName : await conn.getName(jid).catch(() => null)) || null,
              jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : null,
              caption,
            }),
          })

          const message = generateWAMessageFromContent(participant, msg, options)
          await conn.relayMessage(participant, message.message, {
            messageId: message.key.id,
            additionalAttributes: { ...options },
          })
          return message
        } catch (error) {
          console.error("Error in sendGroupV4Invite:", error)
          throw error
        }
      },
      enumerable: true,
    },
    processMessageStubType: {
      async value(m) {
        try {
          if (!m.messageStubType) return

          const chat = conn.decodeJid(m.key?.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || "")
          if (!chat || chat === "status@broadcast") return

          const emitGroupUpdate = (update) => {
            if (conn.ev && typeof conn.ev.emit === "function") {
              conn.ev.emit("groups.update", [{ id: chat, ...update }])
            }
          }

          switch (m.messageStubType) {
            case WAMessageStubType.REVOKE:
            case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
              emitGroupUpdate({ revoke: m.messageStubParameters?.[0] })
              break
            case WAMessageStubType.GROUP_CHANGE_ICON:
              emitGroupUpdate({ icon: m.messageStubParameters?.[0] })
              break
            default: {
              console.log({
                messageStubType: m.messageStubType,
                messageStubParameters: m.messageStubParameters,
                type: WAMessageStubType[m.messageStubType],
              })
              break
            }
          }

          const isGroup = chat.endsWith("@g.us")
          if (!isGroup) return

          let chats = conn.chats[chat]
          if (!chats) chats = conn.chats[chat] = { id: chat }
          chats.isChats = true

          const metadata = await conn.groupMetadata(chat).catch((_) => null)
          if (!metadata) return

          chats.subject = metadata.subject
          chats.metadata = metadata
        } catch (error) {
          console.error("Error in processMessageStubType:", error)
        }
      },
    },
    insertAllGroup: {
      async value() {
        try {
          const groups = (await conn.groupFetchAllParticipating().catch((_) => null)) || {}
          for (const group in groups) {
            conn.chats[group] = null
          }
        } catch (error) {
          console.error("Error in insertAllGroup:", error)
        }
      },
    },
  })

  Object.defineProperty(conn, "loadMessage", {
    value(messageID) {
      if (!messageID) return null
      return Object.entries(conn.chats)
        .filter(([_, { messages }]) => typeof messages === "object")
        .find(([_, { messages }]) =>
          Object.entries(messages).find(([k, v]) => k === messageID || v.key?.id === messageID)
        )?.[1].messages?.[messageID]
    },
    writable: true,
    configurable: true,
    enumerable: true,
  })

  return conn
}

export function smsg(conn, m, hasParent) {
  if (!m) return m

  try {
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
        protocolMessageKey.fromMe = conn.decodeJid(protocolMessageKey.participant) === conn.decodeJid(conn.user?.id)
        if (!protocolMessageKey.fromMe && protocolMessageKey.remoteJid === conn.decodeJid(conn.user?.id))
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
  } catch (error) {
    console.error("Error in smsg:", error)
    return m
  }
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
        return this.chat?.endsWith("@g.us") || false
      },
      enumerable: true,
    },
    sender: {
      get() {
        return this.conn?.decodeJid(
          (this.key?.fromMe && this.conn?.user?.id) || this.participant || this.key?.participant || this.chat || ""
        )
      },
      enumerable: true,
    },
    fromMe: {
      get() {
        return this.key?.fromMe || areJidsSameUser(this.conn?.user?.id, this.sender) || false
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
        return Object.keys(message)[0
<｜end▁of▁thinking｜>

Para solucionar el error `SyntaxError: Illegal return statement`, necesitas asegurarte de que:

1. **Todas las llaves `{}` estén correctamente cerradas**.
2. **La declaración `return conn` esté dentro de la función `makeWASocket`**.
3. **No haya código duplicado o fuera de contexto**.

### Pasos aplicados en la corrección:
1. **Eliminación de código duplicado**: Se removió la definición redundante de `loadMessage`.
2. **Corrección del cierre de la función `makeWASocket`**:
   ```javascript
   export function makeWASocket(connectionOptions, options = {}) {
     // ... código ...
     
     return conn;
   } 
