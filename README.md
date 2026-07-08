# TikTok LIVE Studio SpongeBob Subscriber Alert

This is a real coded Link Source overlay.

How it works:
1. Node server connects to your TikTok LIVE using your TikTok username.
2. It listens for follow and subscriber/super-fan events.
3. It sends the event to the overlay webpage using Socket.IO.
4. TikTok LIVE Studio shows the overlay through Add Source > Link.

Important:
- Your TikTok account must be LIVE before the backend can connect.
- This uses an unofficial TikTok LIVE connector library, so TikTok changes can break it.
- Use the /test URL after hosting to trigger SpongeBob manually.

Local test:
1. Install Node.js.
2. Open the folder in terminal.
3. Run: npm install
4. Create a .env file from .env.example and set your TikTok username.
5. Run: npm start
6. Open: http://localhost:3000/?demo=1
7. Test trigger: http://localhost:3000/test

Render hosting steps:
1. Create a free account on Render.com.
2. Click New + > Web Service.
3. Choose "Build and deploy from a Git repository" or upload this folder to GitHub first.
4. Build Command: npm install
5. Start Command: npm start
6. Environment Variable:
   TIKTOK_USERNAME = your TikTok username without @
7. Deploy.
8. Your overlay link will be:
   https://YOUR-APP-NAME.onrender.com/

TikTok LIVE Studio:
1. Add Source.
2. Choose Link.
3. Paste the Render link:
   https://YOUR-APP-NAME.onrender.com/
4. Turn on Custom Resolution.
5. Use 800 x 800 or 1000 x 1000.
6. Resize it where you want.
7. Use this link for demo positioning:
   https://YOUR-APP-NAME.onrender.com/?demo=1
8. Use this link to trigger a manual test:
   https://YOUR-APP-NAME.onrender.com/test
