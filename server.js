import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const PORT = process.env.PORT || 3000;
const TIKTOK_USERNAME = (process.env.TIKTOK_USERNAME || "").replace("@", "").trim();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let connectedToTikTok = false;

app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    connected: connectedToTikTok,
    username: TIKTOK_USERNAME || null
  });
});

app.get("/test", (_req, res) => {
  io.emit("alert", {
    type: "test",
    username: "Test User",
    message: "Victory Screech!"
  });
  res.send("Test alert sent. Check TikTok LIVE Studio.");
});

function pickEvent(exportName, fallbackName) {
  return WebcastEvent?.[exportName] || fallbackName;
}

function getUsername(data = {}) {
  return (
    data?.user?.uniqueId ||
    data?.user?.nickname ||
    data?.uniqueId ||
    data?.nickname ||
    "Someone"
  );
}

function sendAlert(type, data = {}) {
  const user = getUsername(data);
  console.log(`[ALERT] ${type}: ${user}`);

  io.emit("alert", {
    type,
    username: user,
    message: type === "follow" ? "New follower!" : "New subscriber!"
  });
}

async function startTikTok() {
  if (!TIKTOK_USERNAME) {
    console.log("No TIKTOK_USERNAME set. Add it in Render Environment Variables.");
    return;
  }

  const connection = new TikTokLiveConnection(TIKTOK_USERNAME, {});

  connection.on(pickEvent("CONNECTED", "connected"), () => {
    connectedToTikTok = true;
    console.log(`Connected to TikTok LIVE: @${TIKTOK_USERNAME}`);
  });

  connection.on(pickEvent("DISCONNECTED", "disconnected"), () => {
    connectedToTikTok = false;
    console.log("Disconnected from TikTok LIVE.");
  });

  connection.on(pickEvent("ERROR", "error"), (err) => {
    console.error("TikTok connection error:", err?.message || err);
  });

  connection.on(pickEvent("FOLLOW", "follow"), (data) => {
    sendAlert("follow", data);
  });

  const subscriberEvents = [
    pickEvent("SUBSCRIBE", "subscribe"),
    pickEvent("SUBSCRIPTION", "subscription"),
    pickEvent("SUPER_FAN", "superFan"),
    pickEvent("SUPER_FAN_JOIN", "superFanJoin")
  ];

  for (const eventName of subscriberEvents) {
    if (!eventName) continue;
    connection.on(eventName, (data) => {
      sendAlert("subscriber", data);
    });
  }

  try {
    await connection.connect();
  } catch (err) {
    connectedToTikTok = false;
    console.error("Failed to connect to TikTok LIVE:", err?.message || err);
    console.error("Make sure the TikTok account is LIVE before testing real follow/sub events.");
  }
}

io.on("connection", (socket) => {
  console.log("Overlay connected:", socket.id);
});

server.listen(PORT, () => {
  console.log(`Overlay server running on port ${PORT}`);
  startTikTok();
});
