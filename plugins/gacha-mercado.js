import { promises as fs } from "fs"

const charactersFilePath = "./src/database/characters.json"

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

const handler = async (m, { conn, args }) => {
  try {
    const characters = await loadCharacters()
    const forSaleCharacters = characters.filter((c) => c.forSale === true)

    if (forSaleCharacters.length === 0) {
      return conn.reply(m.chat, "《✧》No hay personajes a la venta en el mercado actualmente.", m)
    }

    const page = Number.parseInt(args[0]) || 1
    const itemsPerPage = 10
    const totalPages = Math.ceil(forSaleCharacters.length / itemsPerPage)

    if (page < 1 || page > totalPages) {
      return conn.reply(m.chat, `《✧》Página no válida. Hay un total de *${totalPages}* páginas.`, m)
    }

    const startIndex = (page - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, forSaleCharacters.length)
    const charactersToShow = forSaleCharacters.slice(startIndex, endIndex)

    let message = "❀ *Personajes en venta:*\n\n"

    for (let i = 0; i < charactersToShow.length; i++) {
      const character = charactersToShow[i]
      message += `${startIndex + i + 1}. *${character.name}*\n`
      message += `   ⚥ Género: *${character.gender}*\n`
      message += `   ✰ Precio: *${character.price} coin*\n`
      message += `   ❖ Fuente: *${character.source}*\n`
      message += `   ♡ Vendedor: *@${character.seller.split("@")[0]}*\n\n`
    }

    message += `> • Página *${page}* de *${totalPages}*\n`
    message += `> • Para comprar usa: *.comprar <nombre>*`

    conn.reply(m.chat, message, m, {
      mentions: charactersToShow.map((c) => c.seller),
    })
  } catch (error) {
    conn.reply(m.chat, `✘ Error al cargar el mercado: ${error.message}`, m)
  }
}

handler.help = ["mercado [página]"]
handler.tags = ["gacha"]
handler.command = ["mercado", "market"]
handler.group = true
handler.register = true

export default handler
