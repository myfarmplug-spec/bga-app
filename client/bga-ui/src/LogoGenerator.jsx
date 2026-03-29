import React, { useState } from "react";
import { toPng } from "html-to-image";
import { supabase } from "./supabase";

const LOGO_PRESETS = [
  { label: "MODERN", style: { fontWeight: "bold", fontSize: 32, color: "#0A7F5A", fontFamily: "Inter, sans-serif" } },
  { label: "PREMIUM", style: { fontFamily: "serif", fontSize: 34, color: "#111", fontWeight: 700 } },
  { label: "TECH", style: { fontFamily: "monospace", fontSize: 30, color: "#2563eb", fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 } },
];

export default function LogoGenerator({ business }) {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch("/api/logo/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business }),
    });
    const data = await res.json();
    setLogos(data.length ? data : [
      { font_style: "bold", color: "#0A7F5A", icon_idea: "🌿" },
      { font_style: "serif", color: "#111", icon_idea: "" },
      { font_style: "monospace", color: "#2563eb", icon_idea: "" },
    ]);
    setLoading(false);
  };

  const downloadLogo = async (id) => {
    const node = document.getElementById(id);
    const dataUrl = await toPng(node);
    const link = document.createElement("a");
    link.download = "logo.png";
    link.href = dataUrl;
    link.click();
  };

  const useLogo = async (idx) => {
    const node = document.getElementById(`logo-${idx}`);
    const dataUrl = await toPng(node);
    await supabase.from("businesses").update({ logo: dataUrl }).eq("name", business.name);
    // Update memory: log improvement
    if (business.id) {
      const { data, error } = await supabase.from("businesses").select("memory").eq("id", business.id).single();
      let mem = {
        improvements: [],
        performance: { clicks: 0, visits: 0, conversion: 0 },
        preferences: { style: "premium", tone: "friendly" },
        history: []
      };
      if (!error && data && data.memory) mem = { ...mem, ...data.memory };
      mem.improvements = [
        ...(mem.improvements || []),
        { type: "logo", change: `used logo style ${idx}`, timestamp: Date.now() }
      ];
      await supabase.from("businesses").update({ memory: mem }).eq("id", business.id);
    }
    setUsed(idx);
    setTimeout(() => setUsed(null), 2000);
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
      <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>🎯 Logo Generator</h2>
      <button onClick={handleGenerate} disabled={loading} style={{ padding: 12, borderRadius: 10, background: "#0A7F5A", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", marginBottom: 18, width: "100%" }}>
        {loading ? "Generating..." : "Generate Logos"}
      </button>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {logos.map((logo, idx) => (
          <div key={idx} style={{ flex: 1, minWidth: 120, textAlign: "center" }}>
            <div id={`logo-${idx}`} className="logo-card" style={{
              ...LOGO_PRESETS[idx],
              color: logo.color || LOGO_PRESETS[idx].style.color,
              fontFamily: logo.font_style || LOGO_PRESETS[idx].style.fontFamily,
              fontWeight: LOGO_PRESETS[idx].style.fontWeight,
              fontSize: LOGO_PRESETS[idx].style.fontSize,
              background: idx === 1 ? "#fff" : "none",
              padding: 18,
              borderRadius: 12,
              marginBottom: 10,
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}>
              {logo.icon_idea && <span style={{ fontSize: 28 }}>{logo.icon_idea}</span>}
              <span>{business.name}</span>
            </div>
            <button onClick={() => downloadLogo(`logo-${idx}`)} style={{ marginRight: 8, padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>Download</button>
            <button onClick={() => useLogo(idx)} style={{ padding: "6px 14px", borderRadius: 6, background: "#22c55e", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
              {used === idx ? "✓ Used!" : "Use this logo"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
