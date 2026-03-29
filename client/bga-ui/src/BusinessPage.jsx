import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/* ── tiny inline icons — no extra deps ─────────────────────────────────── */
function WaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.46-1.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function toWaNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Nigerian: 080... → 234 80...
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}

/* ── shared style tokens ─────────────────────────────────────────────────── */
const S = {
  font: "'Inter', 'Segoe UI', system-ui, sans-serif",
  bg: "#f6f7f8",
  card: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  labelColor: "#9ca3af",
  green: "#16a34a",
  waGreen: "#25D366",
  waBg: "#f0fdf4",
  waBorder: "#86efac",
};

const label = {
  fontSize: 11,
  fontWeight: 700,
  color: S.labelColor,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 18,
};

const divider = {
  borderBottom: `1px solid ${S.border}`,
  paddingBottom: 40,
  marginBottom: 40,
};

/* ── main component ──────────────────────────────────────────────────────── */
export default function BusinessPage() {
  const [biz, setBiz] = useState(null);
  const [meta, setMeta] = useState({ name: "", tagline: "" });
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parts = window.location.pathname.replace(/^\//, "").split("/");
    const id = parts[0] === "site" ? parts[1] : parts[0];
    if (!id) { setNotFound(true); setLoading(false); return; }

    supabase
      .from("public_businesses")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          // public_businesses view coalesces name/tagline at the row level
          setMeta({ name: data.name || "", tagline: data.tagline || "" });
          setBiz(data.data || data);
        }
        setLoading(false);
      });
  }, []);

  /* ── loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: S.card, display: "flex", alignItems: "center", justifyContent: "center", color: S.muted, fontFamily: S.font, fontSize: 14 }}>
      Loading…
    </div>
  );

  /* ── not found ── */
  if (notFound) return (
    <div style={{ minHeight: "100vh", background: S.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: S.font, padding: "0 24px", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: S.text }}>This page doesn't exist</div>
      <div style={{ fontSize: 14, color: S.muted }}>The link may be wrong or the business was removed.</div>
      <a href="/" style={{ marginTop: 8, fontSize: 14, color: S.green, fontWeight: 600, textDecoration: "none" }}>← Go to BGA</a>
    </div>
  );

  if (!biz) return null;

  /* ── data extraction with safe fallbacks ── */
  const name     = meta.name     || biz.selected_name || biz.name     || "Our Business";
  const tagline  = meta.tagline  || biz.tagline        || "";
  const website  = biz.website   || {};
  const hero     = website.hero  || {};
  const about    = website.about || hero.subtext       || `${name} offers quality products and services. We're committed to making every customer happy.`;
  const products = (website.products || []).slice(0, 5);
  const contact  = website.contact || {};
  const phone    = contact.phone   || "";
  const location = contact.location || "";

  const waNum  = toWaNumber(phone);
  const waLink = waNum ? `https://wa.me/${waNum}` : null;

  /* ── render ── */
  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: S.font, color: S.text }}>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div style={{ background: S.card, borderBottom: `1px solid ${S.border}`, padding: "52px 24px 44px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(30px, 9vw, 46px)", fontWeight: 900, color: S.text, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.025em" }}>
            {name}
          </h1>
          {tagline && (
            <p style={{ fontSize: "clamp(15px, 4vw, 18px)", color: "#4b5563", lineHeight: 1.65, marginBottom: 30, maxWidth: 480 }}>
              {tagline}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 22px", background: S.waGreen, color: "#fff", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                <WaIcon />
                Chat on WhatsApp
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 20px", background: S.card, color: S.text, border: `1.5px solid ${S.border}`, borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                <PhoneIcon />
                Call Now
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px 64px" }}>

        {/* ABOUT */}
        <div style={{ paddingTop: 40, ...divider }}>
          <div style={label}>About Us</div>
          <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.8, margin: 0 }}>
            {about}
          </p>
          {location && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, color: S.muted, fontSize: 14 }}>
              <PinIcon />
              {location}
            </div>
          )}
        </div>

        {/* PRODUCTS / SERVICES */}
        {products.length > 0 && (
          <div style={divider}>
            <div style={label}>Products &amp; Services</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {products.map((p, i) => (
                <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: S.text, marginBottom: p.description ? 4 : 0 }}>
                      {p.name}
                    </div>
                    {p.description && (
                      <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.55 }}>{p.description}</div>
                    )}
                  </div>
                  {p.price && (
                    <div style={{ fontSize: 17, fontWeight: 800, color: S.green, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {p.price}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTACT */}
        {(waLink || phone || location) && (
          <div style={divider}>
            <div style={label}>Contact Us</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {waLink && (
                <a href={waLink} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 18px", background: S.waBg, border: `1.5px solid ${S.waBorder}`, borderRadius: 10, textDecoration: "none", color: "#15803d", fontSize: 15, fontWeight: 600 }}>
                  <WaIcon />
                  <span>Chat on WhatsApp</span>
                  {phone && (
                    <span style={{ marginLeft: "auto", fontSize: 13, color: S.green, fontWeight: 500 }}>{phone}</span>
                  )}
                </a>
              )}
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, "")}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 18px", background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, textDecoration: "none", color: S.text, fontSize: 15, fontWeight: 600 }}>
                  <PhoneIcon />
                  {phone}
                </a>
              )}
              {location && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 18px", background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, color: "#4b5563", fontSize: 14 }}>
                  <PinIcon />
                  {location}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: S.text, marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 12, color: S.labelColor, marginBottom: 14 }}>Built with BGA — Business Generator Africa</div>
          <a href="/" style={{ fontSize: 13, color: S.green, fontWeight: 600, textDecoration: "none" }}>
            Start your own business →
          </a>
        </div>

      </div>
    </div>
  );
}
