
const {
plugin,	getJson
} = require('../lib');


plugin({
    pattern: "repo|script",
    fromMe: false,
    desc: "Fetch information about a GitHub repository.",
    type: "info",
}, async (message, match) => {
    const githubRepoURL = 'https://github.com/';

    try {
        // Extract username and repo name from the URL
        const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);

        // Fetch repository details using GitHub API
        const repoData = await getJson(`https://api.github.com/repos/${username}/${repoName}`);
        
        if (!repoData || repoData.message) {
            throw new Error('Failed to fetch repository data');
        }

        // Format the repository information
        const formattedInfo = `𓆩 𝐇𝐄𝐋𝐋𝐎 𝐓𝐇𝐄𝐑𝐄  𝐁𝐎𝐓 𝐔𝐒𝐄𝐑! 🥰𓆪

> ;

        // Send an image with the formatted info as a caption
        await message.client.sendMessage(message.jid, {
            image: { url: `https://files.catbox.moe/hwl3d4.jpg` },
            caption: formattedInfo,
            contextInfo: { 
                mentionedJid: [message.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '',
                    newsletterName: '',
                    serverMessageId: 143
                }
            }
        }, { quoted: message.data });

        // Send the audio file
        await message.client.sendMessage(message.jid, {
            audio: { url: 'https://files.catbox.moe/ulh93p.mp3' },
            mimetype: 'audio/mp4',
            ptt: true,
            contextInfo: { 
                mentionedJid: [message.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '',
                    newsletterName: '',
                    serverMessageId: 143
                }
            }
        }, { quoted: message.data });

    } catch (error) {
        console.error("Error in repo command:", error);
        await message.send("Sorry, something went wrong while fetching the repository information. Please try again later.");
    }
});
