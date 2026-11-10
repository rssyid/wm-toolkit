export default function Custom404() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <h2>404 - Halaman Tidak Ditemukan</h2>
      <a href="/dashboard" style={{ marginTop: "1rem", color: "#059669" }}>
        Kembali ke Dashboard
      </a>
    </div>
  );
}
