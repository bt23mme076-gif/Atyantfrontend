export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        marginTop: "48px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "18px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <nav
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <a
            href="https://atyant.in/privacy"
            style={{
              fontSize: "13px",
              color: "#6260a0",
              textDecoration: "none",
            }}
          >
            Privacy Policy
          </a>

          <a
            href="https://atyant.in/terms"
            style={{
              fontSize: "13px",
              color: "#6260a0",
              textDecoration: "none",
            }}
          >
            Terms & Conditions
          </a>

          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=support@atyant.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13px",
              color: "#6260a0",
              textDecoration: "none",
            }}
          >
            support@atyant.in
          </a>
        </nav>

        <span
          style={{
            fontSize: "13px",
            color: "#6260a0",
            textAlign: "center",
          }}
        >
          © 2026 Atyant. All rights reserved.
        </span>
      </div>
    </footer>
  );
}