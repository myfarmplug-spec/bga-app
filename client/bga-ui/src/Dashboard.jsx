import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #06060e; }
  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.96); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  .biz-card { transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s !important; cursor: default; }
  .biz-card:hover { border-color: rgba(139,92,246,0.35) !important; transform: translateY(-2px) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.45) !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 4px; }
`;

function SkeletonCard() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: "18px", padding: "24px",
      display: "flex", flexDirection: "column", gap: "14px",
    }}>
      {[["100%", "20px"], ["72%", "13px"], ["48%", "11px"]].map(([w, h], i) => (
        <div key={i} style={{
          width: w, height: h, borderRadius: "6px",
          background: "linear-gradient(90deg, #1a1a2e 25%, #252540 50%, #1a1a2e 75%)",
          backgroundSize: "400px 100%",
          animation: "shimmer 1.4s infinite linear",
        }} />
      ))}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: "34px", borderRadius: "10px",
            background: "linear-gradient(90deg, #1a1a2e 25%, #252540 50%, #1a1a2e 75%)",
            backgroundSize: "400px 100%",
            animation: "shimmer 1.4s infinite linear",
          }} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user,       setUser]       = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/"; return; }
      setUser(session.user);
      fetchBusinesses(session.user.id);
    });
  }, []);

  const fetchBusinesses = async (userId) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setBusinesses(data || []);
    setLoading(false);
  };

  const handleOpen = (biz) => {
    try {
      const payload = biz.data || biz;
      sessionStorage.setItem("bga_open_business", JSON.stringify(payload));
    } catch {}
    window.location.href = "/";
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this business? This cannot be undone.")) return;
    setDeletingId(id);
    const { error: err } = await supabase.from("businesses").delete().eq("id", id);
    if (err) setError(err.message);
    else setBusinesses(prev => prev.filter(b => b.id !== id));
    setDeletingId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const formatDate = (dateStr) => {
    try {
      return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
        .format(new Date(dateStr));
    } catch { return ""; }
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#06060e",
        color: "#e2e8f0",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}>

        {/* Top bar */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 40px", height: "60px",
          display: "flex", alignItems: "center", gap: "12px",
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(10,10,20,0.85)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: "800", color: "#fff",
              boxShadow: "0 2px 12px rgba(124,58,237,0.5)",
            }}>B</div>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#f1f5f9", letterSpacing: "0.02em" }}>BGA</span>
          </a>
          <div style={{ width: "1px", height: "20px", backgroundColor: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: "13px", color: "#6b7280" }}>Dashboard</span>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            {user && (
              <span style={{ fontSize: "12px", color: "#4b5563", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
            )}
            <a
              href="/"
              style={{
                fontSize: "12px", fontWeight: "600", color: "#a78bfa",
                background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                padding: "5px 14px", borderRadius: "20px",
                textDecoration: "none", transition: "background 0.15s",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(124,58,237,0.2)"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(124,58,237,0.1)"}
            >
              Generator
            </a>
            <button
              onClick={handleSignOut}
              style={{
                fontSize: "12px", fontWeight: "500", color: "#6b7280",
                background: "none", border: "1px solid rgba(255,255,255,0.08)",
                padding: "5px 14px", borderRadius: "20px", cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseOver={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; }}
              onMouseOut={e => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 32px" }}>

          {/* Page header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            flexWrap: "wrap", gap: "16px",
            marginBottom: "40px",
            animation: "fadeSlideUp 0.4s ease",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                Welcome back 👋
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                Your businesses{!loading && ` · ${businesses.length} total`}
              </div>
            </div>
            <a
              href="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "11px 22px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff", borderRadius: "12px",
                fontSize: "14px", fontWeight: "600",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                transition: "transform 0.15s, box-shadow 0.2s",
              }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.48)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.35)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Business
            </a>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "13px 18px", marginBottom: "24px",
              background: "rgba(248,113,113,0.07)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "12px", fontSize: "13px", color: "#fca5a5",
              animation: "fadeSlideUp 0.3s ease",
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}
              >✕</button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && businesses.length === 0 && !error && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "20px", padding: "100px 24px",
              animation: "fadeSlideUp 0.4s ease",
            }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "24px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.08))",
                border: "1px solid rgba(139,92,246,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "34px", boxShadow: "0 8px 32px rgba(124,58,237,0.1)",
              }}>🏢</div>
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "7px" }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#9ca3af" }}>
                  You haven't created a business yet
                </div>
                <div style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.6" }}>
                  Generate your first AI-powered African business in seconds.
                </div>
              </div>
              <a
                href="/"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "7px",
                  padding: "13px 28px",
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  color: "#fff", borderRadius: "12px",
                  fontSize: "14px", fontWeight: "600",
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Create your first business
              </a>
            </div>
          )}

          {/* Business grid */}
          {!loading && businesses.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "18px",
              animation: "fadeSlideUp 0.4s ease",
            }}>
              {businesses.map((biz) => {
                const name    = biz.name    || biz.data?.selected_name || "Untitled";
                const tagline = biz.tagline || biz.data?.tagline       || "";
                return (
                  <div
                    key={biz.id}
                    className="biz-card"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.025), rgba(124,58,237,0.025))",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "18px", padding: "24px",
                      display: "flex", flexDirection: "column", gap: "16px",
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                        <div style={{
                          fontSize: "16px", fontWeight: "800", color: "#f1f5f9",
                          lineHeight: "1.25", letterSpacing: "-0.01em",
                          flex: 1, minWidth: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {name}
                        </div>
                        {biz.deployed_url && (
                          <div style={{
                            flexShrink: 0,
                            fontSize: "10px", fontWeight: "700",
                            color: "#22c55e",
                            background: "rgba(34,197,94,0.1)",
                            border: "1px solid rgba(34,197,94,0.25)",
                            padding: "2px 8px", borderRadius: "20px",
                            letterSpacing: "0.06em",
                            animation: "pulse 3s ease-in-out infinite",
                          }}>LIVE</div>
                        )}
                      </div>
                      {tagline && (
                        <div style={{
                          fontSize: "12px", color: "#6b7280", fontStyle: "italic",
                          lineHeight: "1.55",
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          "{tagline}"
                        </div>
                      )}
                    </div>

                    {/* Meta row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "18px" }}>
                      {biz.created_at && (
                        <div style={{ fontSize: "11px", color: "#374151", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {formatDate(biz.created_at)}
                        </div>
                      )}
                      {biz.deployed_url && (
                        <a
                          href={biz.deployed_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "11px", color: "#86efac", fontFamily: "monospace",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            flex: 1, textDecoration: "none",
                          }}
                          onMouseOver={e => e.currentTarget.style.textDecoration = "underline"}
                          onMouseOut={e => e.currentTarget.style.textDecoration = "none"}
                        >
                          {biz.deployed_url.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

                    {/* Actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      {/* Open */}
                      <button
                        onClick={() => handleOpen(biz)}
                        style={{
                          padding: "9px 4px",
                          background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))",
                          border: "1px solid rgba(124,58,237,0.3)",
                          borderRadius: "10px", color: "#a78bfa",
                          fontSize: "12px", fontWeight: "600", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                          transition: "background 0.15s, border-color 0.15s",
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = "rgba(124,58,237,0.25)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
                        onMouseOut={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Open
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpen(biz)}
                        style={{
                          padding: "9px 4px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "10px", color: "#9ca3af",
                          fontSize: "12px", fontWeight: "600", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                          transition: "background 0.15s, color 0.15s, border-color 0.15s",
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                        onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(biz.id)}
                        disabled={deletingId === biz.id}
                        style={{
                          padding: "9px 4px",
                          background: "rgba(248,113,113,0.07)",
                          border: "1px solid rgba(248,113,113,0.18)",
                          borderRadius: "10px", color: "#f87171",
                          fontSize: "12px", fontWeight: "600",
                          cursor: deletingId === biz.id ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                          opacity: deletingId === biz.id ? 0.55 : 1,
                          transition: "background 0.15s, border-color 0.15s",
                        }}
                        onMouseOver={e => { if (deletingId !== biz.id) { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.38)"; } }}
                        onMouseOut={e => { e.currentTarget.style.background = "rgba(248,113,113,0.07)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.18)"; }}
                      >
                        {deletingId === biz.id ? (
                          <div style={{ width: "11px", height: "11px", border: "2px solid rgba(248,113,113,0.3)", borderTop: "2px solid #f87171", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
