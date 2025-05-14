import fs from "fs"
import chalk from 'chalk'

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!args[0]) return conn.reply(m.chat, `Formato incorrecto. Uso: ${usedPrefix}rconect [token]`, m);
  
  const token = args[0];
  const tokenParts = token.split('+');
  
  if (tokenParts.length !== 2) return conn.reply(m.chat, 'Token inválido. Debe tener formato: número+ID', m);
  
  const [phoneNumber, subbotId] = tokenParts;
  const authFolderB = `${phoneNumber}sbt-${subbotId}`;
  const folderPath = `./sumibots/${authFolderB}`;
  
  if (!fs.existsSync(folderPath)) {
    return conn.reply(m.chat, 'No se encontró ninguna sesión con ese token.', m);
  }
  
  try {
    const credsBase64 = Buffer.from(fs.readFileSync(`${folderPath}/creds.json`, "utf-8")).toString("base64");
    
    const codeCommand = global.plugins.find(p => p.help && p.help.includes('botclone'));
    if (codeCommand) {
      await codeCommand.default(m, { conn, args: [credsBase64], usedPrefix, command: 'code' });
      return conn.reply(m.chat, '✅ Reconexión iniciada con éxito.', m);
    }
    
    return conn.reply(m.chat, '❌ Error al reconectar. Intente nuevamente.', m);
  } catch (error) {
    console.log(chalk.red('Error en reconexión:', error));
    return conn.reply(m.chat, '❌ Error al procesar la solicitud. Intente nuevamente.', m);
  }
}

handler.help = ['reconnect']
handler.tags = ['subbot']
handler.command = ['rconect']
handler.rowner = false

export default handler
