# Hosting TRICK

Two ways to put a game online. Both run the same server, and saves move between them with Download and Import on the host page.

## As a Windows program (the easiest)

`TRICK.exe` hosts a game with a double-click: no terminal, no Node, no cloudflared to install.

1. Build it once (and again after changing the game):
   ```bash
   npm run build:exe
   ```
   This writes `dist/TRICK.exe` (about 150 MB: it carries Node, the pages, the card art and cloudflared). Copy it anywhere, such as the desktop.
2. Double-click it. A window opens with the links, and your browser opens the host page, the table screen and the GM page for your most recent campaign. Players join with the public link or QR code on the host page.
3. Keep the window open while you play. Close it to stop the game.

- Campaigns are saved in a `TRICK Campaigns` folder in your Documents (wherever Windows keeps them, OneDrive included), the same folder `npm start` uses.
- Starting it again stops the copy already running, like `npm run restart`.
- The first start of each new build unpacks its files into `%LOCALAPPDATA%\TRICK\app`, which takes a few seconds.
- It isn't code-signed, so on another computer Windows may warn about it the first time ("More info", then "Run anyway").
- How it's made: `scripts/build_exe.mjs` bundles `game/launcher/trick.mjs` with the server into one script and packs it, with the served files and cloudflared, into a copy of `node.exe` (Node's single executable application). The icon is `game/launcher/trick.ico`, drawn by `scripts/make_icon.mjs`.

## From your computer (with Node)

1. Install cloudflared once. On Windows:
   ```bash
   winget install --id Cloudflare.cloudflared
   ```
2. Start the host:
   ```bash
   npm start
   ```
3. Open the private host page it prints. The public link (`https://….trycloudflare.com`) is new each time you start, and works only while your computer is on and the terminal is open.

Campaigns are saved in the `TRICK Campaigns` folder that `TRICK.exe` uses, so both see the same campaigns. `SAVES_DIR` or `--saves <folder>` picks another. Campaigns from before this were kept in `game/saves`; the host names any still there when it starts, so you can copy them over.

## Between your computers

If Documents is in OneDrive (Windows often sets this up) on both computers, with the same account, the `TRICK Campaigns` folder syncs by itself: start a game on either and it has the same campaigns, room codes and GM links. Without OneDrive, copy a campaign's `.json` file from one `TRICK Campaigns` folder to the other.

**Host a campaign on one computer at a time.** A running host keeps its campaigns in memory and saves after every action, so two hosts would overwrite each other, and OneDrive may keep a conflict copy that shows up as a second campaign. Close the game on one computer and let OneDrive finish syncing before starting it on the other.

## On a cloud server (a permanent link)

The repository includes a `Dockerfile`. Any host that runs containers works; these steps use [Fly.io](https://fly.io).

1. Install `flyctl` and sign in: `fly auth login`.
2. From the repository folder, create the app without deploying: `fly launch --no-deploy`. Accept the Dockerfile.
3. Give it a disk for saves: `fly volumes create trick_saves --size 1`, then add this to `fly.toml`:
   ```toml
   [mounts]
     source = "trick_saves"
     destination = "/data"
   ```
4. Set a fixed admin token, so the host page link survives restarts, and the public address:
   ```bash
   fly secrets set ADMIN_TOKEN=<a long random string> PUBLIC_URL=https://<your-app>.fly.dev
   ```
5. Deploy: `fly deploy`. The host page is `https://<your-app>.fly.dev/host?admin=<your token>`.

Settings the server reads:

| Variable | Meaning |
| --- | --- |
| `PORT` | Port to listen on (default 8787) |
| `ADMIN_TOKEN` | The host page's secret; random on each start if unset |
| `PUBLIC_URL` | The address players use, for join links and QR codes |
| `SAVES_DIR` | Where campaigns are saved (default `Documents/TRICK Campaigns`; the Docker image uses `/data`) |

## Moving a campaign

On the host page, **Download** saves a campaign as a JSON file (without its GM key, but with each seat's rejoin token, so keep it private). **Import** on another host makes it a new campaign there, with a new GM link; it keeps its room code when that code is free. Phones can't carry their seats to a new address, so players join again by name, and the GM gives each of them their character from **Room and seats** on the GM page ("Give them this character"). The same button helps anyone who switches phones. **Archive** closes a campaign's room and moves its save to `saves/archive/`.
