const axios = require("axios");
const { plugin, mode } = require("../lib");

plugin(
  {
    pattern: "pair ?(.*)",
    desc: "Generate WhatsApp Pair Code using API",
    react: "🔐",
    fromMe: mode, // change to false if you want everyone to use it
    type: "system",
  },
  async (message, match) => {
    try {
      const number = match?.trim();
      if (!number) {
        return await message.reply("⚠️ Example: *.pair 919876543210*");
      }

      await message.reply("⏳ Generating your pair code...");

      const apiUrl = `http://tramway.proxy.rlwy.net:38072/pair?number=${number}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data?.code) {
        await message.client.sendMessage(
          message.jid,
          {
            text: `✅ *PAIR CODE READY!*\n\n📞 Number: ${data.number}\n🔑 Code: \`\`\`${data.code}\`\`\`\n\n🪄 Go to *Linked Devices → Pair with phone number* and enter this code.`,
          },
          { quoted: message }
        );
      } else {
        await message.reply("❌ Failed to fetch pair code from API.");
      }
    } catch (e) {
      console.error("Pair Error:", e);

      if (e.response) {
        await message.reply(
          `API Error: ${e.response.status} - ${
            e.response.data?.message || "No message provided"
          }`
        );
      } else if (e.request) {
        await message.reply("🌐 Network Error: Server not responding.");
      } else {
        await message.reply("⚠️ Unexpected Error: Try again later.");
      }
    }
  }
);
