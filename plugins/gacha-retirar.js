import { promises as fs } from "fs"

const charactersFilePath = "./src/database/characters.json"
const cooldownTime = 3600000

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error al cargar personajes:", error)
    return []
  }
}

async function saveCharacters(characters) {
  try {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), "utf-8")
  } catch (error) {
    console.error("Error al guardar personajes:", error)
  }
}

const handler = async (m, { conn, args, text }) => {
  if (!text)
    return conn.reply(m.chat, "《✧》Por favor, especifica el nombre del personaje que deseas retirar del mercado.", m)

  const characterName = text.trim().toLowerCase()
  const seller = m.sender

  try {
    const characters = await loadCharacters()

    const characterToRemove = characters.find((c) => {
      const nameMatches = c.name.toLowerCase() === characterName
      const isForSale = c.forSale === true
      const isSellerMatch = c.seller === seller

      if (nameMatches && (!isForSale || !isSellerMatch)) {
        console.log(`Personaje encontrado pero no cumple condiciones:`, {
          nombre: c.name,
          enVenta: c.forSale,
          vendedor: c.seller,
          usuario: seller,
          vendedorCoincide: c.seller === seller,
        })
      }

      return nameMatches && isForSale && isSellerMatch
    })

    if (!characterToRemove) {
      const characterExists = characters.find((c) => c.name.toLowerCase() === characterName)

      if (characterExists) {
        if (!characterExists.forSale) {
          return conn.reply(m.chat, `《✧》El personaje *${text}* no está en venta.`, m)
        } else if (characterExists.seller !== seller) {
          return conn.reply(m.chat, `《✧》No eres el vendedor de *${text}*.`, m)
        }
      } else {
        return conn.reply(m.chat, `《✧》No se encontró el personaje *${text}* en el sistema.`, m)
      }

      return conn.reply(m.chat, `《✧》No se encontró el personaje *${text}* en venta o no eres el vendedor.`, m)
    }

    if (characterToRemove.previousPrice) {
      characterToRemove.value = characterToRemove.previousPrice
      delete characterToRemove.previousPrice
    }

    characterToRemove.forSale = false
    characterToRemove.lastRemovedTime = Date.now()
    delete characterToRemove.price
    delete characterToRemove.seller

    await saveCharacters(characters)

    conn.reply(
      m.chat,
      `✅ Has retirado a *${characterToRemove.name}* del mercado. Deberás esperar 1 hora antes de volver a ponerlo en venta.`,
      m,
    )
  } catch (error) {
    console.error("Error completo:", error)
    conn.reply(m.chat, `✘ Error al retirar el personaje: ${error.message}`, m)
  }
}

handler.help = ["retirar <nombre>"]
handler.tags = ["gacha"]
handler.command = ["sacarrw", "withdraw"]
handler.group = true
handler.register = true

export default handler
