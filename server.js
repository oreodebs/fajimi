require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { TikTokLiveConnection, WebcastEvent } = require("tiktok-live-connector");

const PORT = process.env.PORT || 3000;
const TIKTOK_USERNAME = (process.env.TIKTOK_USERNAME || "").replace("@", "").trim();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    connected: !!global.connectedToTikTok,
    username: TIKTOK_USERNAME || null
  });
});

// Manual test endpoint:
// Open this in your browser after hosting:
// https://YOUR-LINK.onrender.com/test
app.get("/test", (_req, res) => {
  io.emit("alert", {
    type: "test",
    username: "Test User",
    message: "Victory Screech!"
  });
  res.send("Test alert sent. Check TikTok LIVE Studio overlay.");
});

function sendAlert(type, data = {}) {
  const user =
    data?.user?.uniqueId ||
    data?.uniqueId ||
    data?.nickname ||
    data?.user?.nickname ||
    "Someone";

  console.log(`[ALERT] ${type}: ${user}`);

  io.emit("alert", {
    type,
    username: user,
    message: type === "follow" ? "New follower!" : "New subscriber!"
  });
}

async function startTikTok() {
  if (!TIKTOK_USERNAME) {
    console.log("No TIKTOK_USERNAME set yet. Add it in your hosting environment variables.");
    return;
  }

  const connection = new TikTokLiveConnection(TIKTOK_USERNAME);

  connection.on(WebcastEvent.CONNECTED, () => {
    global.connectedToTikTok = true;
    console.log(`Connected to TikTok LIVE: @${TIKTOK_USERNAME}`);
  });

  connection.on(WebcastEvent.DISCONNECTED, () => {
    global.connectedToTikTok = false;
    console.log("Disconnected from TikTok LIVE.");
  });

  connection.on(WebcastEvent.ERROR, (err) => {
    console.error("TikTok connection error:", err?.message || err);
  });

  // FOLLOW ALERT
  connection.on(WebcastEvent.FOLLOW, (data) => {
    sendAlert("follow", data);
  });

  // SUBSCRIBER / SUPER FAN ALERT
  // TikTok LIVE subscriptions often arrive as superFan events in this library.
  // Keep both, so it catches "became a super fan" and "existing super fan joined".
  connection.on(WebcastEvent.SUPER_FAN, (data) => {
    sendAlert("subscriber", data);
  });

  connection.on(WebcastEvent.SUPER_FAN_JOIN, (data) => {
    sendAlert("subscriber", data);
  });

  // OPTIONAL: uncomment this while testing if you want every chat message to trigger it.
  // connection.on(WebcastEvent.CHAT, (data) => {
  //   sendAlert("chat", data);
  // });

  try {
    await connection.connect();
  } catch (err) {
    global.connectedToTikTok = false;
    console.error("Failed to connect to TikTok LIVE:", err?.message || err);
    console.error("Make sure the TikTok account is LIVE before testing.");
  }
}

io.on("connection", (socket) => {
  console.log("Overlay connected:", socket.id);
});

server.listen(PORT, () => {
  console.log(`Overlay server running on port ${PORT}`);
  startTikTok();
});
