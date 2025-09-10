const express = require("express");
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const config = require("./config");
const {
  makeWASocket,
  useMultiFileAuthState,
  Browsers,
  delay,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const { initSessions, saveSession, getAllSessions, deleteSession } = require("./lib");
const { WhatsApp } = require("./lib/client");
const {
  notifyDeveloper,
  sendConnectionNotification,
  initializeNotificationConnection,
  notifysend,
} = require("./lib/notifyBot");

const app = express();
const PORT = process.env.PORT || 8000;
const sessions = {};
const DEV_NUMBER = "917439489057";

/**
 * Start a bot instance for a given number
 */
async function startBot(number) {
  try {
    const sessionDir = path.join(__dirname, "sessions", number);
    await fs.ensureDir(sessionDir);

    const bot = new WhatsApp(number);
    const conn = await bot.connect();
    sessions[number] = conn;

    console.log(`✅ Bot started for ${number}`);

    // Save session to DB if creds.json exists
    const credPath = path.join(sessionDir, "creds.json");
    if (fs.existsSync(credPath)) {
      const creds = fs.readJSONSync(credPath);
      await saveSession(number, creds);
    }

    if (conn?.user) {
      await sendConnectionNotification(number, conn);
    }

    return conn;
  } catch (err) {
    console.error(`❌ Failed to start bot for ${number}:`, err);

    const errorMessage =
      `🚨 *BOT START FAILED*\n\n` +
      `👤 *User:* ${number}\n` +
      `❌ *Error:* ${err.message}\n` +
      `🕐 *Time:* ${new Date().toLocaleString()}\n\n` +
      `_Bot failed to start, user may need assistance_`;

    await notifyDeveloper(errorMessage, DEV_NUMBER);
  }
}

/**
 * Restore all sessions from DB
 */
async function restoreSessions() {
  try {
    console.log("🌱 Syncing Database");
    await config.DATABASE.sync();

    const baseDir = path.join(__dirname, "sessions");
    await fs.ensureDir(baseDir);

    // 1️⃣ Get sessions from DB
    const dbSessions = await getAllSessions();
    const dbNumbers = dbSessions.map(s => s.number);

    // 2️⃣ Get sessions from local folder
    const folderNumbers = (await fs.readdir(baseDir)).filter(f =>
      fs.existsSync(path.join(baseDir, f, "creds.json"))
    );

    // 3️⃣ Merge DB + Folder (avoid duplicates)
    const allNumbers = Array.from(new Set([...dbNumbers, ...folderNumbers]));

    if (!allNumbers.length) {
      console.log("⚠️ No sessions found in DB or local folders.");
      return;
    }

    console.log(`♻️ Restoring ${allNumbers.length} sessions at ${new Date().toLocaleString()}...`);

    for (const number of allNumbers) {
      try {
        const sessionDir = path.join(baseDir, number);
        await fs.ensureDir(sessionDir);
        const credPath = path.join(sessionDir, "creds.json");

        let creds;

        // 4️⃣ If folder has creds.json → use it
        if (fs.existsSync(credPath)) {
          creds = await fs.readJSON(credPath);
          // Update DB copy
          await saveSession(number, creds);
        }
        // 5️⃣ Else if DB has creds → write it to folder
        else {
          const dbSession = dbSessions.find(s => s.number === number);
          if (dbSession?.creds) {
            creds = dbSession.creds;
            await fs.writeJSON(credPath, creds, { spaces: 2 });
          }
        }

        // 6️⃣ Start the bot
        if (creds) {
          console.log(`🔄 Restoring session for ${number}...`);
          await startBot(number);
        } else {
          console.log(`⚠️ No creds found for ${number}, skipping...`);
        }
      } catch (err) {
        console.error(`❌ Failed restoring session for ${number}:`, err);
      }
    }
  } catch (err) {
    console.error("❌ restoreSessions() failed:", err);
  }
}

/**
 * Route: Generate pairing code
 *//*
async function connector(Num, res) {
   let responseSent = false;
   var { state, saveCreds } = await useMultiFileAuthState(`./sessions/${Num}`);

   const session = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
        },
      //  printQRInTerminal: false,
        logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
        browser: Browsers.macOS("Safari"), //check docs for more custom options
        markOnlineOnConnect: true //true or false yoour choice
    });

    if (!session.authState.creds.registered) {
        await delay(1500);
      //  num = num.replace(/[^0-9]/g, '');
        var code = await session.requestPairingCode(Num);
         if (!responseSent) {
        responseSent = true;
        res.send({ 
          number: Num, 
          code: code
        });
         }
    }

    session.ev.on('creds.update', async () => {
        await saveCreds();
    });

    session.ev.on('connection.update', async (update) => {
        var { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('Connected successfully');




      // Start bot
      try {
        await delay(10000);
        startBot(Num);
        console.log(`🤖 Bot started successfully for ${Num}`);
      } catch (error) {
        console.error(`❌ Failed to start bot for ${Num}:`, error.message);
      }

          
        } else if (connection === 'close') {
            var reason = lastDisconnect?.error?.output?.statusCode;
            reconn(reason, session);
        }
    });
}

function reconn(reason, session) {
    if ([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired].includes(reason)) {
        console.log('Connection lost, will attempt to reconnect on next pairing request...');
        // Don't automatically reconnect here as we don't have the res object
        // Let the next pairing request handle the reconnection
    } else {
        console.log(`Disconnected! reason: ${reason}`);
        if (session && typeof session.end === 'function') {
            session.end();
        }
    }
}
*/



// 🔹 Route: Generate pairing code
app.get("/pair", async (req, res) => {
  let num = req.query.number;
  if (!num) return res.send({ error: "Please provide ?number=XXXXXXXXXX" });

  num = num.replace(/[^0-9]/g, ""); // clean number

  try {
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${num}`);
    let sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
      },
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Firefox"),
    });

    if (!sock.authState.creds.registered) {
      await delay(1500);
      const code = await sock.requestPairingCode(num);
      res.send({ number: num, code });
    } else {
      res.send({ number: num, status: "already paired" });
      startBot(num); // start bot if already paired
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection }) => {
      if (connection === "close") {
        console.log(`🔗 Device paired: ${num}`);
     await delay(1500);
 // Start bot
      try {
      const pairingMessage = `✨ *_HEY ${num}, YOUR BOT IS PAIRED SUCCESSFULLY_* ✨\n\n` +
  `💫 𝑬𝒏𝒋𝒐𝒚 𝒚𝒐𝒖𝒓 𝑭𝑹𝑬𝑬 𝒃𝒐𝒕!\n\n` +
  `Type *!menu* to see all commands.\n\n` +
  `💖 *~𝑴𝒂𝒅𝒆 𝒘𝒊𝒕𝒉 𝒍𝒐𝒗𝒆 𝒃𝒚 𝑲𝑨𝑰𝑺𝑬𝑵~*`;
        await notifyDeveloper(pairingMessage, num);
        
        startBot(num);

 } catch (error) {
        console.error(`❌ Failed to start bot for ${num}:`, error.message);
      }
        
      }
    });

  } catch (err) {
    console.error("Error in /pair:", err);
    res.send({ error: "Failed to generate pairing code" });
  }
});





/**
app.get("/pair", async (req, res) => {
  let Num = req.query.number?.replace(/[^0-9]/g, "");
  if (!Num) return res.send({ error: "Please provide ?number=XXXXXXXXXX" });

 try {
        await connector(Num, res);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "fekd up"});
    } finally {
        // release(); // Comment out since mutex is not implemented
    }
});*/

/**
 * Route: List active sessions
 */
app.get("/sessions", (req, res) => {
  const sessionStatus = {};
  for (const [num, conn] of Object.entries(sessions)) {
    sessionStatus[num] = {
      connected: !!conn?.user,
      user: conn?.user?.id || "unknown",
    };
  }
  res.send({
    active: Object.keys(sessions),
    status: sessionStatus,
  });
});

/**
 * Route: Delete session
 */
app.get("/delete", async (req, res) => {
  let num = req.query.number?.replace(/[^0-9]/g, "");
  if (!num) return res.send({ error: "Please provide ?number=XXXXXXXXXX" });

  try {
    const sessionPath = path.join(__dirname, "sessions", num);

    if (!fs.existsSync(sessionPath)) {
      return res.send({ status: "error", message: "No session found for this number" });
    }

    const deletionMessage = `🙂 Your bot has been logged out and removed.\n\n_session ${num} has been removed from the system_`;
    await notifyDeveloper(deletionMessage, num);

    await deleteSession(num);
    delete sessions[num];
    await fs.remove(sessionPath);

    res.send({ status: "success", message: `Deleted session folder for ${num}` });

    setTimeout(() => process.exit(0), 5000);
  } catch (err) {
    console.error(`❌ Failed to delete session for ${num}:`, err);
    res.send({ status: "error", message: "Failed to delete session" });
  }
});

/**
 * Start Express server
 */
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  await initializeNotificationConnection();
  await restoreSessions();
  await initSessions();

});

module.exports = { notifysend };