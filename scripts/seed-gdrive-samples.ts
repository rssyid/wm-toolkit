import "dotenv/config";
import { uploadFileToGoogleDrive } from "../src/server/google-drive";

// Buffer PNG 1x1 valid diperluas menjadi dummy gambar grafis kecil
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x08,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x4b, 0x6d, 0x29, 0xdc, 0x00, 0x00, 0x00,
  0x1b, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x60, 0x60, 0xf8, 0xcf,
  0xc0, 0x40, 0x15, 0x68, 0xd0, 0x01, 0x18, 0x30, 0x60, 0x00, 0x00, 0x13,
  0x80, 0x02, 0xa1, 0x7e, 0x67, 0x09, 0x35, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);

function createSamplePdf(title: string, subtitle: string, docNo: string): Buffer {
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>endobj
5 0 obj<</Length 450>>stream
BT
/F1 18 Tf
50 720 Td
(PTPN PERKEBUNAN HOLDING - WM-TOOLKIT) Tj
/F1 14 Tf
0 -35 Td
(${title}) Tj
/F1 10 Tf
0 -25 Td
(Nomor Dokumen : ${docNo}) Tj
0 -20 Td
(Tanggal Terbit: ${new Date().toLocaleDateString("id-ID")}) Tj
0 -20 Td
(Deskripsi     : ${subtitle}) Tj
0 -40 Td
(========================================================================) Tj
0 -25 Td
(Dokumen ini diverifikasi secara elektronik melalui sistem WM-Toolkit.) Tj
0 -20 Td
(Penyimpanan resmi terkelola di Google Drive terpusat holding.) Tj
0 -20 Td
(Otorisasi dan evaluasi teknis sesuai matriks persetujuan direksi.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000102 00000 n
0000000207 00000 n
0000000284 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
780
%%EOF`;
  return Buffer.from(content, "utf-8");
}

async function main() {
  console.log("🚀 Mengunggah berkas sampel resmi ke Google Drive...");

  const files = [
    {
      fileName: "Kajian_Teknis_Elevasi_Pintu_Air_Sei_Silau.pdf",
      mimeType: "application/pdf",
      buffer: createSamplePdf(
        "Kajian Teknis Elevasi Pintu Air Sei Silau",
        "Survey topografi dan elevasi muka air pasang surut",
        "SURV-TOPO-018"
      ),
    },
    {
      fileName: "Spesifikasi_Teknis_Pintu_Klep_Baja_Rev2.pdf",
      mimeType: "application/pdf",
      buffer: createSamplePdf(
        "Spesifikasi Teknis Pintu Klep Baja Otomatis Rev 2",
        "Material ASTM A36 anti karat dengan lapisan epoxy tahan air payau",
        "SPEC-CIV-2026-04"
      ),
    },
    {
      fileName: "BAST_Penerimaan_Material_Plat_Baja.pdf",
      mimeType: "application/pdf",
      buffer: createSamplePdf(
        "Berita Acara Serah Terima (BAST) Material Plat Baja",
        "Verifikasi mutu fisik dan ketebalan plat baja 12mm",
        "BAST-MAT-009"
      ),
    },
    {
      fileName: "Dokumentasi_Foto_Pintu_Air_Sei_Silau.png",
      mimeType: "image/png",
      buffer: VALID_PNG_BUFFER,
    },
  ];

  const results: any[] = [];

  for (const f of files) {
    try {
      console.log(`Mengunggah [${f.fileName}]...`);
      const res = await uploadFileToGoogleDrive({
        buffer: f.buffer,
        fileName: f.fileName,
        mimeType: f.mimeType,
      });
      console.log(`✅ Berhasil: ID=${res.fileId}`);
      results.push(res);
    } catch (err: any) {
      console.error(`❌ Gagal mengunggah ${f.fileName}:`, err.message);
    }
  }

  console.log("\n📋 Ringkasan Berkas Unggahan:");
  console.log(JSON.stringify(results, null, 2));
}

main();
