import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function BusinessPage() {
  const [business, setBusiness] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supports both /site/{id} and legacy /{id}
    const parts = window.location.pathname.replace(/^\//, "").split("/");
    const id = parts[0] === "site" ? parts[1] : parts[0];
    if (!id) { setNotFound(true); setLoading(false); return; }

    // Query the public view — no user_id, no memory, no internal fields exposed
    supabase
      .from("public_businesses")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setBusiness(data.data || data);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#06060e", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontFamily: "Inter, sans-serif", fontSize: 14 }}>
      Loading business…
    </div>
  );
  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#06060e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Inter, sans-serif" }}>
      <div style={{ fontSize: 40 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#f87171" }}>Business not found</div>
      <a href="/" style={{ fontSize: 13, color: "#a78bfa", textDecoration: "none" }}>← Go to BGA</a>
    </div>
  );
  if (!business) return null;

  const { selected_name, tagline, website = {} } = business;
  const hero = website.hero || {};
  const products = website.products || [];
  const contact = website.contact || {};

  return (
    <div style={{ minHeight: "100vh", background: "#06060e", color: "#e2e8f0", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,20,0.85)", backdropFilter: "blur(20px)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>B</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>BGA</span>
        </a>
        <a href="/" style={{ fontSize: 12, color: "#a78bfa", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", padding: "5px 14px", borderRadius: 20, textDecoration: "none", fontWeight: 600 }}>
          Build your own →
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
        {/* Name + tagline */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.025em", background: "linear-gradient(135deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8, lineHeight: 1.15 }}>
            {selected_name}
          </h1>
          {tagline && <p style={{ fontSize: 16, color: "#9ca3af", fontStyle: "italic", lineHeight: 1.6 }}>"{tagline}"</p>}
        </div>

        {/* Hero */}
        {(hero.headline || hero.subtext) && (
          <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 18, padding: 28, marginBottom: 20 }}>
            {hero.headline && <div style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>{hero.headline}</div>}
            {hero.subtext && <div style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.75, marginBottom: 16 }}>{hero.subtext}</div>}
            {hero.cta && contact.phone && (
              <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-block", padding: "10px 22px", background: "#25D366", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                {hero.cta}
              </a>
            )}
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Products & Services</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
              {products.map((p, i) => (
                <div key={i} style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#a78bfa", marginBottom: 6 }}>{p.price}</div>
                  {p.description && <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{p.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {(contact.phone || contact.location) && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {contact.phone && (
                <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 12, textDecoration: "none", color: "#4ade80", fontSize: 14, fontWeight: 600 }}>
                  💬 Order on WhatsApp — {contact.phone}
                </a>
              )}
              {contact.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, fontSize: 13, color: "#9ca3af" }}>
                  📍 {contact.location}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BGA footer */}
        <div style={{ textAlign: "center", padding: "24px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>Built with BGA — Business Generator Africa</div>
          <a href="/" style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa", textDecoration: "none" }}>Build your own business →</a>
        </div>
      </div>
    </div>
  );
}
