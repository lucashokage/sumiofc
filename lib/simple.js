import path from "path"
import { toAudio } from "./converter.js"
import chalk from "chalk"
import fetch from "node-fetch"
import PhoneNumber from "awesome-phonenumber"
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

const NEWSLETTER_JID = "120363324350463849@newsletter"
const NEWSLETTER_NAME = "❤️̶۫̄͟Ⓢ︎𓏲S͟u͟m͟m͟i͟𓍲̈͜𝗨̴ᥣ̥𝗍̈rᥲ̄𓊓̵̬𝐁o̸t̸❤️̶۫̄͟─"

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
        return jid.decodeJid()
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

        return await conn.sendMessage(jid, message, { quoted, upload: conn.waUploadToServer, ...options })
      },
      enumerable: true,
    },

    sendButton2: {
      async value(jid, text = "", footer = "", buffer, buttons, copy, urls, quoted, options) {
        let img, video

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

        const dynamicButtons = buttons.map((btn) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: btn[0],
            id: btn[1],
          }),
        }))

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
                display_text: url[0],
                url: url[1],
                merchant_url: url[1],
              }),
            })
          })
        }

        const interactiveMessage = {
          body: { text: text },
          footer: { text: footer },
          header: {
            hasMediaAttachment: false,
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
      },
    },

    sendList: {
      async value(jid, title, text, buttonText, buffer, listSections, quoted, options = {}) {
        let img, video

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

        const sections = [...listSections]

        const message = {
          interactiveMessage: {
            header: {
              title: title,
              hasMediaAttachment: false,
              imageMessage: img ? img.imageMessage : null,
              videoMessage: video ? video.videoMessage : null,
            },
            body: { text: text },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: buttonText,
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
      },
    },

    sendListM: {
      async value(jid, button, rows, quoted, options = {}) {
        const sections = [
          {
            title: button.title,
            rows: [...rows],
          },
        ]
        const listMessage = {
          text: button.description,
          footer: button.footerText,
          mentions: await conn.parseMention(button.description),
          title: "",
          buttonText: button.buttonText,
          sections,
        }
        conn.sendMessage(jid, listMessage, {
          quoted,
        })
      },
    },

    updateProfileStatus: {
      async value(status) {
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
              content: Buffer.from(status, "utf-8"),
            },
          ],
        })
      },
    },
    sendPayment: {
      async value(jid, amount, currency, text = "", from, options) {
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
      },
    },
    sendPoll: {
      async value(jid, name = "", optiPoll, options) {
        if (!Array.isArray(optiPoll[0]) && typeof optiPoll[0] === "string") optiPoll = [optiPoll]
        if (!options) options = {}
        const pollMessage = {
          name: name,
          options: optiPoll.map((btn) => ({
            optionName: (!nullish(btn[0]) && btn[0]) || "",
          })),
          selectableOptionsCount: 1,
        }
        return conn.relayMessage(jid, { pollCreationMessage: pollMessage }, { ...options })
      },
    },
    loadingMsg: {
      async value(jid, loamsg, loamsgEdit, loadingMessages, quoted, options) {
        const { key } = await conn.sendMessage(jid, { text: loamsg, ...options }, { quoted })

        for (let i = 0; i < loadingMessages.length; i++) {
          await conn.sendMessage(jid, { text: loadingMessages[i], edit: key, ...options }, { quoted })
        }
        await conn.sendMessage(jid, { text: loamsgEdit, edit: key, ...options }, { quoted })
      },
    },
    sendHydrated: {
      async value(jid, text = "", footer = "", buffer, url, urlText, call, callText, buttons, quoted, options) {
        let type
        if (buffer)
          try {
            ;(type = await conn.getFile(buffer)), (buffer = type.data)
          } catch {
            buffer = buffer
          }
        if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === "string" || Array.isArray(buffer)))
          (options = quoted),
            (quoted = buttons),
            (buttons = callText),
            (callText = call),
            (call = urlText),
            (urlText = url),
            (url = buffer),
            (buffer = null)
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
        if (buttons.length) {
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
      },
      enumerable: true,
    },

    sendHydrated2: {
      async value(jid, text = "", footer = "", buffer, url, urlText, url2, urlText2, buttons, quoted, options) {
        let type
        if (buffer)
          try {
            ;(type = await conn.getFile(buffer)), (buffer = type.data)
          } catch {
            buffer = buffer
          }
        if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === "string" || Array.isArray(buffer)))
          (options = quoted),
            (quoted = buttons),
            (buttons = callText),
            (callText = call),
            (call = urlText),
            (urlText = url),
            (url = buffer),
            (buffer = null)
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
        if (buttons.length) {
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
      },
      enumerable: true,
    },

    cMod: {
      value(jid, message, text = "", sender = conn.user.jid, options = {}) {
        if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
        const copy = message.toJSON()
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
        if (copy.participant) sender = copy.participant = sender || copy.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
        return proto.WebMessageInfo.fromObject(copy)
      },
      enumerable: true,
    },
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
    fakeReply: {
      value(jid, text = "", fakeJid = this.user.jid, fakeText = "", fakeGroupJid, options) {
        return conn.reply(jid, text, {
          key: {
            fromMe: areJidsSameUser(fakeJid, conn.user.id),
            participant: fakeJid,
            ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}),
          },
          message: { conversation: fakeText },
          ...options,
        })
      },
    },
    downloadM: {
      async value(m, type, saveToFile) {
        let filename
        if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
        const stream = await downloadContentFromMessage(m, type)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }
        if (saveToFile) ({ filename } = await conn.getFile(buffer, true))
        return saveToFile && fs.existsSync(filename) ? filename : buffer
      },
      enumerable: true,
    },
    parseMention: {
      value(text = "") {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + "@s.whatsapp.net")
      },
      enumerable: true,
    },
    getName: {
      value(jid = "", withoutContact = false) {
        jid = conn.decodeJid(jid)
        withoutContact = conn.withoutContact || withoutContact
        let v
        if (jid.endsWith("@g.us"))
          return new Promise(async (resolve) => {
            v = conn.chats[jid] || {}
            if (!(v.name || v.subject)) v = (await conn.groupMetadata(jid)) || {}
            resolve(
              v.name || v.subject || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international"),
            )
          })
        else
          v =
            jid === "0@s.whatsapp.net"
              ? {
                  jid,
                  vname: "WhatsApp",
                }
              : areJidsSameUser(jid, conn.user.id)
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
      },
      enumerable: true,
    },
    loadMessage: {
      value(messageID) {
        return Object.entries(conn.chats)
          .filter(([_, { messages }]) => typeof messages === "object")
          .find(([_, { messages }]) =>
            Object.entries(messages).find(([k, v]) => k === messageID || v.key?.id === messageID),
          )?.[1].messages?.[messageID]
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
        options = {},
      ) {
        const msg = proto.Message.fromObject({
          groupInviteMessage: proto.GroupInviteMessage.fromObject({
            inviteCode,
            inviteExpiration: Number.parseInt(inviteExpiration) || +new Date(new Date() + 3 * 86400000),
            groupJid: jid,
            groupName: (groupName ? groupName : await conn.getName(jid)) || null,
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
      },
      enumerable: true,
    },
    processMessageStubType: {
      async value(m) {
        if (!m.messageStubType) return
        const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || "")
        if (!chat || chat === "status@broadcast") return

        const emitGroupUpdate = (update) => {
          conn.ev.emit("groups.update", [{ id: chat, ...update }])
        }

        switch (m.messageStubType) {
          case WAMessageStubType.REVOKE:
          case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
            emitGroupUpdate({ revoke: m.messageStubParameters[0] })
            break
          case WAMessageStubType.GROUP_CHANGE_ICON:
            emitGroupUpdate({ icon: m.messageStubParameters[0] })
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
      },
    },
    insertAllGroup: {
      async value() {
        const groups = (await conn.groupFetchAllParticipating().catch((_) => null)) || {}
        for (const group in groups)
          conn.chats[group] = {
            ...(conn.chats[group] || {}),
            id: group,
            subject: groups[group].subject,
            isChats: true,
            metadata: groups[group],
          }
        return conn.chats
      },
    },
    pushMessage: {
      async value(m) {
        if (!m) return
        if (!Array.isArray(m)) m = [m]
        for (const message of m) {
          try {
            if (!message) continue
            if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT)
              conn.processMessageStubType(message).catch(console.error)
            const _mtype = Object.keys(message.message || {})
            const mtype =
              (!["senderKeyDistributionMessage", "messageContextInfo"].includes(_mtype[0]) && _mtype[0]) ||
              (_mtype.length >= 3 && _mtype[1] !== "messageContextInfo" && _mtype[1]) ||
              _mtype[_mtype.length - 1]
            const chat = conn.decodeJid(
              message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || "",
            )
            if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
              const context = message.message[mtype].contextInfo
              let participant = conn.decodeJid(context.participant)
              const remoteJid = conn.decodeJid(context.remoteJid || participant)
              const quoted = message.message[mtype].contextInfo.quotedMessage
              if (remoteJid && remoteJid !== "status@broadcast" && quoted) {
                let qMtype = Object.keys(quoted)[0]
                if (qMtype == "conversation") {
                  quoted.extendedTextMessage = { text: quoted[qMtype] }
                  delete quoted.conversation
                  qMtype = "extendedTextMessage"
                }
                if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {}
                quoted[qMtype].contextInfo.mentionedJid =
                  context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || []
                const isGroup = remoteJid.endsWith("g.us")
                if (isGroup && !participant) participant = remoteJid
                const qM = {
                  key: {
                    remoteJid,
                    fromMe: areJidsSameUser(conn.user.jid, remoteJid),
                    id: context.stanzaId,
                    participant,
                  },
                  message: JSON.parse(JSON.stringify(quoted)),
                  ...(isGroup ? { participant } : {}),
                }
                let qChats = conn.chats[participant]
                if (!qChats) qChats = conn.chats[participant] = { id: participant, isChats: !isGroup }
                if (!qChats.messages) qChats.messages = {}
                if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM
                let qChatsMessages
                if ((qChatsMessages = Object.entries(qChats.messages)).length > 40)
                  qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length))
              }
            }
            if (!chat || chat === "status@broadcast") continue
            const isGroup = chat.endsWith("@g.us")
            let chats = conn.chats[chat]
            if (!chats) {
              if (isGroup) await conn.insertAllGroup().catch(console.error)
              chats = conn.chats[chat] = { id: chat, isChats: true, ...(conn.chats[chat] || {}) }
            }
            let metadata, sender
            if (isGroup) {
              if (!chats.subject || !chats.metadata) {
                metadata = (await conn.groupMetadata(chat).catch((_) => ({}))) || {}
                if (!chats.subject) chats.subject = metadata.subject || ""
                if (!chats.metadata) chats.metadata = metadata
              }
              sender = conn.decodeJid(
                (message.key?.fromMe && conn.user.id) || message.participant || message.key?.participant || chat || "",
              )
              if (sender !== chat) {
                let chats = conn.chats[sender]
                if (!chats) chats = conn.chats[sender] = { id: sender }
                if (!chats.name) chats.name = message.pushName || chats.name || ""
              }
            } else if (!chats.name) chats.name = message.pushName || chats.name || ""
            if (["senderKeyDistributionMessage", "messageContextInfo"].includes(mtype)) continue
            chats.isChats = true
            if (!chats.messages) chats.messages = {}
            const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id)
            if (
              !["protocolMessage"].includes(mtype) &&
              !fromMe &&
              message.messageStubType != WAMessageStubType.CIPHERTEXT &&
              message.message
            ) {
              delete message.message.messageContextInfo
              delete message.message.senderKeyDistributionMessage
              chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2))
              let chatsMessages
              if ((chatsMessages = Object.entries(chats.messages)).length > 40)
                chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length))
            }
          } catch (e) {
            console.error(e)
          }
        }
      },
    },
    serializeM: {
      value(m) {
        return smsg(conn, m)
      },
    },
    ...(typeof conn.chatRead !== "function"
      ? {
          chatRead: {
            value(jid, participant = conn.user.jid, messageID) {
              return conn.sendReadReceipt(jid, participant, [messageID])
            },
            enumerable: true,
          },
        }
      : {}),
    ...(typeof conn.setStatus !== "function"
      ? {
          setStatus: {
            value(status) {
              return conn.query({
                tag: "iq",
                attrs: {
                  to: S_WHATSAPP_NET,
                  type: "set",
                  xmlns: "status",
                },
                content: [
                  {
                    tag: "status",
                    attrs: {},
                    content: Buffer.from(status, "utf-8"),
                  },
                ],
              })
            },
            enumerable: true,
          },
        }
      : {}),
  })
  if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id)
  store.bind(sock)
  return sock
}

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
              return smsg(conn, M.fromObject(M.toObject(this.vM)))
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
            value(jid, forceForward = false, options) {
              return self.conn?.copyNForward(jid, this.vM, forceForward, options)
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
    
