const { plugin, mode } = require("../lib");

plugin(
  {
    pattern: "tagme",
    fromMe: mode,
    type: "group",
    desc: "Tag only yourself",
  },
  async (m) => {
    try {
      // ✅ Only these numbers can use
      const allowedUsers = ["917439382677@s.whatsapp.net", m.owner];

      if (!allowedUsers.includes(m.sender)) {
        return await m.reply("*❌ You are not allowed to use this command!*");
      }

      // 🏷️ Just tag yourself
      await m.send(`@${m.sender.split("@")[0]}`, {
        mentions: [m.sender],
      });
    } catch (err) {
      console.error("tagme error:", err);
      m.reply("❌ Error while tagging yourself.");
    }
  }
);
