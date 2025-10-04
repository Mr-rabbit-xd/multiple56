const { plugin } = require('../lib');
const axios = require('axios');

plugin({
  pattern: 'pair ?(.*)',
  desc: 'Generate WhatsApp pairing code using API',
  type: 'system',
  fromMe: true
}, async (message, match) => {
  const number = match?.trim();

  if (!number)
    return await message.send('⚠️ Example: *.pair 917439382677*');

  try {
    await message.send('⏳ Generating your pair code...');

    const apiUrl = `http://tramway.proxy.rlwy.net:38072/pair?number=${number}`;
    const { data } = await axios.get(apiUrl);

    if (!data?.code)
      return await message.send('❌ Failed to get pair code!');

    const msg = `✅ *PAIR CODE READY!*

📞 Number: ${data.number}
🔑 Code: \`\`\`${data.code}\`\`\`

🪄 Go to *Linked Devices → Pair with phone number* and enter this code.`;

    await message.send(msg);

  } catch (err) {
    console.error('Pair Error:', err);
    await message.send('❌ Error: Could not fetch pair code!');
  }
});
