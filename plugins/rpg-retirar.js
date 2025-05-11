let handler = async (m, { args }) => {
  let user = global.db.data.users[m.sender]
  if (!args[0]) return m.reply(`${global.emoji} Ingresa la cantidad de *${global.moneda}⛀* que deseas Retirar.`)
  if (args[0] == 'all') {
    let count = parseInt(user.bank)
    user.bank -= count * 1
    user.coin += count * 1
    await m.reply(`${global.emoji} Retiraste *${count} ${global.moneda}⛀* del banco.`)
    return !0
  }
  if (!Number(args[0])) return m.reply(`${global.emoji2} Debes retirar una cantidad válida.
> Ejemplo 1 » *#retirar 25000*
> Ejemplo 2 » *#retirar all*`)
  let count = parseInt(args[0])
  if (!user.bank) return m.reply(`${global.emoji2} No tienes suficientes *${global.moneda}⛀* en el banco para retirar.`)
  if (user.bank < count) return m.reply(`${global.emoji2} Solo tienes *${user.bank} ${global.moneda}⛀* en el banco.`)
  user.bank -= count * 1
  user.coin += count * 1
  await m.reply(`${global.emoji} Retiraste *${count} ${global.moneda}⛀* del banco.`)}

handler.help = ['retirar']
handler.tags = ['rpg']
handler.command = ['withdraw', 'retirar', 'ret']
handler.group = true
handler.register = true

export default handler