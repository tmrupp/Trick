# Hosting TRICK

Two ways to put a game online. Both run the same server, and saves move between them with Download and Import on the host page.

## From your computer (the default)

1. Install cloudflared once. On Windows:
   ```bash
   winget install --id Cloudflare.cloudflared
   ```
2. Start the host:
   ```bash
   npm start
   ```
3. Open the private host page it prints. The public link (`https://….trycloudflare.com`) is new each time you start, and works only while your computer is on and the terminal is open.

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
| `SAVES_DIR` | Where campaigns are saved (the Docker image uses `/data`) |

## Moving a campaign

On the host page, **Download** saves a campaign as a JSON file (without its GM key, but with each seat's rejoin token, so keep it private). **Import** on another host makes it a new campaign there, with a new GM link; it keeps its room code when that code is free. Phones can't carry their seats to a new address, so players join again by name, and the GM gives each of them their character from **Room and seats** on the GM page ("Give them this character"). The same button helps anyone who switches phones. **Archive** closes a campaign's room and moves its save to `saves/archive/`.
