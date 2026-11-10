export default function CustomError({ statusCode }: { statusCode?: number }) {
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
      <h2>{statusCode ? `Terjadi Kesalahan (${statusCode})` : "Terjadi Kesalahan Aplikasi"}</h2>
      <a href="/dashboard" style={{ marginTop: "1rem", color: "#059669" }}>
        Kembali ke Dashboard
      </a>
    </div>
  );
}

CustomError.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
