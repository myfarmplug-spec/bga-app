import { useState, useEffect, useRef } from "react";

function cleanInput(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function makeSuggestions(base) {
  if (!base) return [];
  return [
    `${base}.com`,
    `${base}ng.com`,
    `${base}shop.com`,
    `${base}online.com`,
    `get${base}.com`,
    `${base}hub.com`,
  ];
}

export default function DomainSmartSelect({ onSelect }) {
  const [raw,            setRaw]            = useState("");
  const [cleanDomain,    setCleanDomain]    = useState("");
  const [main,           setMain]           = useState("");
  const [suggestions,    setSuggestions]    = useState([]);
  const [status,         setStatus]         = useState({});   // domain → "checking"|"available"|"taken"
  const [best,           setBest]           = useState("");
  const [connecting,     setConnecting]     = useState(false);
  const [connectSuccess, setConnectSuccess] = useState(false);
  const [connectError,   setConnectError]   = useState("");
  const [domainStatus,   setDomainStatus]   = useState("idle"); // idle|buying|connecting|finalizing|live|fallback
  const [dnsInstructions, setDnsInstructions] = useState(null);
  const pollRef = useRef(null);

  // Derive suggestions from raw input
  useEffect(() => {
    const base = cleanInput(raw);
    setCleanDomain(base);
    if (!base) {
      setMain(""); setSuggestions([]); setStatus({}); setBest("");
      return;
    }
    setMain(`${base}.com`);
    setSuggestions(makeSuggestions(base));
  }, [raw]);

  // Auto-check the .com suggestion
  useEffect(() => {
    if (!main || main.length < 5) return;
    checkDomain(main);
  }, [main]);

  const checkDomain = async (domain) => {
    setStatus(s => ({ ...s, [domain]: "checking" }));
    try {
      const res = await fetch("/api/domain/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      const result = data.available ? "available" : "taken";
      setStatus(s => ({ ...s, [domain]: result }));
      if (result === "available") setBest(prev => prev || domain);
    } catch {
      setStatus(s => ({ ...s, [domain]: "error" }));
    }
  };

  const pollStatus = (domain) => {
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 5;
      try {
        const res = await fetch(`/api/domain/status?domain=${domain}`);
        const data = await res.json();
        if (data.configured) {
          clearInterval(pollRef.current);
          setDomainStatus("live");
          setConnectSuccess(true);
          fetch("/api/domain/mark-live", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          });
        } else if (elapsed >= 30) {
          clearInterval(pollRef.current);
          setDomainStatus("fallback");
          setDnsInstructions([{ type: "A", domain, value: "76.76.21.21" }]);
        } else if (elapsed >= 15) {
          setDomainStatus("finalizing");
        }
      } catch {
        // keep polling silently
      }
    }, 5000);
  };

  const buyAndConnect = async (domain) => {
    setConnecting(true);
    setConnectError("");
    setDnsInstructions(null);
    setDomainStatus("buying");
    try {
      await fetch("/api/domain/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      setDomainStatus("connecting");
      await fetch("/api/domain/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      pollStatus(domain);
      onSelect && onSelect(domain);
    } catch {
      setConnectError("Network error. Please try again.");
      setDomainStatus("idle");
    }
    setConnecting(false);
  };

  const allDomains = main ? [main, ...suggestions.filter(s => s !== main)] : [];

  const STATUS_LABELS = {
    checking:  { text: "Checking…",  color: "#a78bfa" },
    available: { text: "Available",  color: "#22c55e" },
    taken:     { text: "Taken",      color: "#f87171" },
    error:     { text: "Try again",  color: "#6b7280" },
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: 20,
    }}>
      {/* Input */}
      <input
        type="text"
        value={raw}
        onChange={e => setRaw(e.target.value)}
        placeholder="Type your brand name…"
        disabled={connecting || connectSuccess}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10, boxSizing: "border-box",
          border: "1px solid rgba(124,58,237,0.3)", background: "rgba(255,255,255,0.04)",
          color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit",
          marginBottom: 14,
        }}
      />

      {/* Domain list */}
      {allDomains.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {allDomains.map(domain => {
            const st = status[domain];
            const isAvailable = st === "available";
            const isBest = best === domain && isAvailable;
            const label = STATUS_LABELS[st];
            return (
              <div key={domain} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 10,
                background: isBest ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isBest ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 14, fontWeight: isBest ? 700 : 400, color: isBest ? "#4ade80" : "#e2e8f0" }}>
                  {isBest && "⭐ "}{domain}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {label && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: label.color }}>
                      {label.text}
                    </span>
                  )}
                  {!st && (
                    <button
                      onClick={() => checkDomain(domain)}
                      style={{
                        fontSize: 12, color: "#a78bfa", background: "none", border: "none",
                        cursor: "pointer", fontFamily: "inherit", padding: 0,
                      }}
                    >
                      Check
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy & Go Live button */}
      {best && !connectSuccess && (
        <button
          onClick={() => buyAndConnect(best)}
          disabled={connecting}
          style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: connecting
              ? "rgba(34,197,94,0.2)"
              : "linear-gradient(135deg, #059669, #22c55e)",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: connecting ? "wait" : "pointer",
            fontFamily: "inherit", transition: "all 0.2s",
            boxShadow: connecting ? "none" : "0 4px 20px rgba(34,197,94,0.35)",
          }}
        >
          {connecting ? "Processing…" : `Buy & Go Live — ${best} 🚀`}
        </button>
      )}

      {/* Status messages */}
      {domainStatus === "buying"      && <StatusMsg color="#a78bfa" text="Securing your domain…" />}
      {domainStatus === "connecting"  && <StatusMsg color="#38bdf8" text="Connecting your website…" />}
      {domainStatus === "finalizing"  && <StatusMsg color="#facc15" text="Final checks — almost there…" />}
      {domainStatus === "live"        && <StatusMsg color="#22c55e" text={`${best} is live 🚀`} />}

      {/* Fallback DNS instructions */}
      {domainStatus === "fallback" && dnsInstructions && (
        <div style={{ marginTop: 14, padding: "14px 16px", background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fde68a", marginBottom: 8 }}>
            Add this DNS record to finish setup:
          </div>
          {dnsInstructions.map((rec, i) => (
            <div key={i} style={{ fontSize: 13, color: "#e2e8f0", fontFamily: "monospace" }}>
              {rec.type} &nbsp;{rec.domain} &nbsp;→ &nbsp;{rec.value}
            </div>
          ))}
        </div>
      )}

      {connectError && (
        <div style={{ marginTop: 12, fontSize: 13, color: "#f87171", textAlign: "center" }}>
          {connectError}
        </div>
      )}

      {connectSuccess && (
        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: "#4ade80", textAlign: "center" }}>
          ✓ Domain connected — it may take a few minutes to propagate.
        </div>
      )}
    </div>
  );
}

function StatusMsg({ color, text }) {
  return (
    <div style={{
      marginTop: 12, padding: "10px 14px", borderRadius: 10,
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      fontSize: 13, fontWeight: 500, color, textAlign: "center",
    }}>
      {text}
    </div>
  );
}
