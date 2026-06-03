export default function DashboardLoading() {
  return (
    <main
      aria-label="Loading dashboard"
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f7f8fc",
      }}
    >
      <div
        style={{
          height: "38px",
          width: "220px",
          borderRadius: "10px",
          background: "#e7eaf2",
          marginBottom: "28px",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            style={{
              height: "112px",
              borderRadius: "18px",
              background: "#e7eaf2",
            }}
          />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
        }}
      >
        <div
          style={{
            height: "340px",
            borderRadius: "20px",
            background: "#e7eaf2",
          }}
        />
        <div
          style={{
            height: "340px",
            borderRadius: "20px",
            background: "#e7eaf2",
          }}
        />
      </div>
    </main>
  );
}