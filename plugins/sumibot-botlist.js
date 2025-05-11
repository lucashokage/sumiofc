import ws from 'ws';

async function handler(m, { usedPrefix, args }) {
  const activeConns = global.conns.filter(conn => 
    conn.user && 
    conn.ws.socket && 
    conn.ws.socket.readyState !== ws.CLOSED
  );
  const totalSubBots = activeConns.length;

  if (args[0] === 'info') {
    const formatTime = (ms) => {
      let seconds = Math.floor(ms / 1000);
      const days = Math.floor(seconds / (3600 * 24));
      seconds %= 3600 * 24;
      const hours = Math.floor(seconds / 3600);
      seconds %= 3600;
      const minutes = Math.floor(seconds / 60);
      seconds %= 60;

      const parts = [];
      if (days > 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`);
      if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);
      if (seconds > 0) parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`);

      return parts.length > 0 ? parts.join(' ') : '0 segundos';
    };

    const infoList = activeConns.map((conn, index) => {
      const number = conn.user.jid.replace(/[^0-9]/g, '');
      const time = formatTime(Date.now() - (conn.startTime || Date.now()));
      return `*${index + 1}.* ➺ Número: ${number} ➺ Tiempo: ${time}`;
    }).join('\n');

    const infoMessage = `
*「✦」LISTA DE SUBBOTS*

✧ *Sub-Bots conectados:* ${totalSubBots}

${infoList}

❒ Total de comandos: 303
    `.trim();

    return m.reply(infoMessage);
  }

  const summaryMessage = `
*「✦」SUBBOTS ACTIVOS*

❀ Para ser un subbot usa el comando *#serbot*

✧ *Sub-Bots conectados:* ${totalSubBots}
❒ *Total de comandos:* 303

Envía *${usedPrefix}bots info* para ver la lista detallada
  `.trim();

  m.reply(summaryMessage);
}

handler.help = ['botlist']
handler.tags = ['sumibot']
handler.command = ['listbot', 'listbots', 'bots', 'sumibots', 'botlist'] 

export default handler;
