import { google } from "googleapis";
import * as http from "http";
import * as url from "url";

/**
 * Script pembantu untuk mendapatkan GOOGLE_REFRESH_TOKEN untuk akun personal (@gmail.com)
 * Jalankan: pnpm tsx scripts/get-google-refresh-token.ts [CLIENT_ID] [CLIENT_SECRET]
 */
async function main() {
  const clientId = process.argv[2] || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.argv[3] || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log("=================================================================");
    console.log("Cara Penggunaan Generator OAuth 2.0 Refresh Token (Akun Personal)");
    console.log("=================================================================");
    console.log("1. Buat OAuth 2.0 Client ID bertipe 'Web application' di Google Cloud Console:");
    console.log("   - Authorized redirect URIs: http://localhost:3099/oauth2callback");
    console.log("2. Jalankan perintah:");
    console.log("   pnpm tsx scripts/get-google-refresh-token.ts <CLIENT_ID> <CLIENT_SECRET>");
    console.log("=================================================================\n");
    return;
  }

  if (clientId === clientSecret || clientSecret.includes(".apps.googleusercontent.com")) {
    console.error("⚠️ PERINGATAN: Client Secret yang dimasukkan sama dengan Client ID!");
    console.error("👉 Parameter 1: Client ID (berakhiran .apps.googleusercontent.com)");
    console.error("👉 Parameter 2: Client Secret (biasanya berawalan GOCSPX-...)");
    console.error("\nSilakan salin Client Secret dari Google Cloud Console dan coba kembali.\n");
    return;
  }

  const redirectUri = "http://localhost:3099/oauth2callback";
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  console.log("👉 Buka URL berikut di browser Anda untuk memberikan izin akses Google Drive:\n");
  console.log(authUrl + "\n");
  console.log("Menunggu otorisasi di browser (localhost:3099)...");

  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url || req.url === "/favicon.ico") {
        res.writeHead(404);
        res.end();
        return;
      }

      if (req.url.startsWith("/oauth2callback")) {
        const queryParams = new url.URL(req.url, "http://localhost:3099").searchParams;
        const code = queryParams.get("code");
        const error = queryParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<h1>Otorisasi Ditolak</h1><p>Pesan error: ${error}</p>`);
          console.error("❌ Otorisasi ditolak oleh pengguna atau Google:", error);
          server.close();
          process.exit(1);
          return;
        }

        if (code) {
          try {
            const { tokens } = await oauth2Client.getToken(code);

            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end("<h1>Otorisasi Berhasil!</h1><p>Anda dapat menutup tab ini dan kembali ke terminal Anda.</p>");

            console.log("\n========================================================");
            console.log("✅ BERHASIL MENDAPATKAN REFRESH TOKEN!");
            console.log("========================================================");
            console.log(`GOOGLE_CLIENT_ID="${clientId}"`);
            console.log(`GOOGLE_CLIENT_SECRET="${clientSecret}"`);
            console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
            console.log("========================================================");
            console.log("Salin ketiga baris di atas ke file .env Anda!\n");

            server.close();
            process.exit(0);
          } catch (tokenErr: any) {
            res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
            res.end(`<h1>Gagal Mendapatkan Token</h1><p>${tokenErr.message}</p>`);
            console.error("❌ Gagal menukar kode otorisasi:", tokenErr.message);
            console.error("💡 Pastikan Client Secret yang Anda masukkan benar!");
            server.close();
            process.exit(1);
          }
        }
      }
    } catch (err: any) {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal error: " + err.message);
      }
      console.error("Error processing callback:", err);
    }
  });

  server.listen(3099);
}

main();
