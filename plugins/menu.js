const { plugin, commands, mode } = require('../lib');
const { BOT_INFO, PREFIX } = require('../config');
const { version } = require('../package.json');
const { isUrls } = require('../lib/extra');
const os = require('os');

const runtime = (secs) => {
  const pad = (s) => s.toString().padStart(2, '0');
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
};

const readMore = String.fromCharCode(8206).repeat(4001);

const channelJid = "120363420641018865@newsletter";
const channelName = "𝐑4𝐁𝐁𝐈𝐓-𝐌𝐈𝐍𝐈";
const serverMessageId = 1;

plugin({
  pattern: 'menu|help|list',
  desc: 'Stylish command list',
  type: 'whatsapp',
  fromMe: mode
}, async (message) => {

  const [botName, rawMediaUrl] = BOT_INFO.split(';');
  const mediaUrl = rawMediaUrl?.replace(/&gif/g, '');
  const isGif = rawMediaUrl?.includes('&gif');

  const usedGB = ((os.totalmem() - os.freemem()) / 1073741824).toFixed(2);
  const totGB = (os.totalmem() / 1073741824).toFixed(2);
  const ram = `${usedGB} / ${totGB} GB`;

  let menuText = `
╭━━━〔 ⚡ ${botName} ⚡ 〕━━━╮
│ 💀 *ᴠᴇʀꜱɪᴏɴ:* v${version}
│ ⚙️ *ᴍᴏᴅᴇ:* ${mode ? 'Private' : 'Public'}
│ 💾 *ʀᴀᴍ:* ${ram}
│ ⏱️ *ᴜᴘᴛɪᴍᴇ:* ${runtime(process.uptime())}
│ 💬 *ᴘʀᴇꜰɪx:* ${PREFIX}
╰━━━━━━━━━━━━━━━━━━╯
${readMore}
╭──❰ 💫 ᴄᴏᴍᴍᴀɴᴅ ʟɪꜱᴛ 💫 ❱──╮
`;

  let cmnd = [], category = [];

  for (const command of commands) {
    const cmd = command.pattern?.toString().match(/(\W*)([A-Za-züşiğöç1234567890]*)/)?.[2];
    if (!command.dontAddCommandList && cmd) {
      const type = (command.type || "misc").toUpperCase();
      cmnd.push({ cmd, type });
      if (!category.includes(type)) category.push(type);
    }
  }

  for (const cat of category.sort()) {
    menuText += `\n┌──⟪ ${cat} ⟫──┐\n`;
    for (const { cmd, type } of cmnd.filter(c => c.type === cat)) {
      menuText += `│ ⚡ ${cmd}\n`;
    }
    menuText += `└───────────────┘\n`;
  }

  menuText += `
💀 *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐌𝐑-𝐑4𝐁𝐁𝐈𝐓*
`;

  try {
    if (mediaUrl && isUrls(mediaUrl)) {
      const opts = {
        image: { url: mediaUrl },
        caption: menuText,
        mimetype: 'image/jpeg',
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: channelJid,
            newsletterName: channelName,
            serverMessageId: serverMessageId
          }
        }
      };
      await message.client.sendMessage(message.jid, opts, { quoted: message });
    } else {
      await message.send(menuText);
    }
  } catch (err) {
    console.error('❌ Menu send error:', err);
    await message.send(menuText + `\n\n⚠️ *Media failed to load, sending text only.*`);
  }
});
