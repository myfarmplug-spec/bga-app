// ── Email Kit Modal ─────────────────────────────────────────────────────────
import React, { useState } from "react";
function EmailKitModal({ business, onClose }) {
  const [emails, setEmails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editKey, setEditKey] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [sendKey, setSendKey] = useState(null);
  const [sendTo, setSendTo] = useState("");
  const [sendStatus, setSendStatus] = useState(null);

  const keys = [
    { key: "welcome", label: "Welcome Email" },
    { key: "promo", label: "Promo Email" },
    { key: "confirmation", label: "Order/Service Confirmation" },
    { key: "reengagement", label: "Re-engagement Email" },
  ];

  const handleGenerate = async () => {
    setLoading(true); setError(null); setEmails(null);
    try {
      const res = await fetch("/api/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business })
      });
      const data = await res.json();
      setEmails(data);
    } catch {
      setError("Failed to generate emails");
    }
    setLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleEdit = (key) => {
    setEditKey(key);
    setEditValue(emails[key]);
  };

  const handleEditSave = () => {
    setEmails(e => ({ ...e, [editKey]: editValue }));
    setEditKey(null);
  };

  const handleSend = async (key) => {
    setSendKey(key); setSendStatus(null);
    try {
      const subject = keys.find(k => k.key === key).label;
      const html = emails[key];
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sendTo, subject, html })
      });
      const data = await res.json();
      if (data.success) setSendStatus("sent");
      else setSendStatus("fail");
    } catch {
      setSendStatus("fail");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#18182b", borderRadius: 18, padding: 32, minWidth: 340, maxWidth: 420, boxShadow: "0 8px 40px #0008", color: "#f1f5f9", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#a78bfa", fontSize: 18, cursor: "pointer" }}>✕</button>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 18, color: "#a78bfa" }}>📧 Email Kit</div>
        <button onClick={handleGenerate} disabled={loading} style={{ width: "100%", padding: 12, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", marginBottom: 18, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Generating..." : "Generate Email Templates"}</button>
        {error && <div style={{ color: "#f87171", marginBottom: 10 }}>{error}</div>}
        {emails && keys.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 18, background: "rgba(124,58,237,0.07)", border: "1px solid #a78bfa33", borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>{label}</div>
            {editKey === key ? (
              <>
                <textarea value={editValue} onChange={e => setEditValue(e.target.value)} style={{ width: "100%", minHeight: 80, borderRadius: 8, border: "1px solid #a78bfa", padding: 8, marginBottom: 8 }} />
                <button onClick={handleEditSave} style={{ marginRight: 8, background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditKey(null)} style={{ background: "#f87171", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              </>
            ) : (
              <>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#e2e8f0", marginBottom: 8 }}>{emails[key]}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleCopy(emails[key])} style={{ background: "#818cf8", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>Copy</button>
                  <button onClick={() => handleEdit(key)} style={{ background: "#a78bfa", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => setSendKey(key)} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>Send</button>
                </div>
                {sendKey === key && (
                  <div style={{ marginTop: 10 }}>
                    <input type="email" placeholder="Recipient email" value={sendTo} onChange={e => setSendTo(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #a78bfa", marginBottom: 8 }} />
                    <button onClick={() => handleSend(key)} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 600, cursor: "pointer", width: "100%" }}>Send Email</button>
                    {sendStatus === "sent" && <div style={{ color: "#22c55e", marginTop: 6 }}>Email sent successfully 🚀</div>}
                    {sendStatus === "fail" && <div style={{ color: "#f87171", marginTop: 6 }}>Failed to send email</div>}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import UpgradeModal from "./UpgradeModal";
import axios from "axios";
import { supabase } from "./supabase";

// ── Sound synthesis (Web Audio API — no external files) ──────────────────────
let _audioCtx = null;
function _ctx() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch { return null; }
}
function _tone({ freq = 440, dur = 0.18, vol = 0.12, type = "sine", delay = 0 } = {}) {
  try {
    const ctx = _ctx(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.05);
  } catch { /* silent fail */ }
}
const sound = {
  init:    () => _tone({ freq: 294, dur: 0.22, vol: 0.10 }),
  tick:    () => _tone({ freq: 740, dur: 0.06, vol: 0.07 }),
  success: () => {
    _tone({ freq: 523.25, dur: 0.35, vol: 0.11, delay: 0.00 });
    _tone({ freq: 659.25, dur: 0.35, vol: 0.09, delay: 0.13 });
    _tone({ freq: 783.99, dur: 0.40, vol: 0.09, delay: 0.26 });
  },
};

// ── Haptics ──────────────────────────────────────────────────────────────────
const haptic = {
  start:   () => { try { navigator.vibrate?.(20); }           catch {} },
  step:    () => { try { navigator.vibrate?.(10); }           catch {} },
  success: () => { try { navigator.vibrate?.([20, 40, 20]); } catch {} },
};

// ── Daily counter ────────────────────────────────────────────────────────────
function _getDailyCount() {
  try {
    const d = JSON.parse(localStorage.getItem("bga_daily") || "{}");
    return d.date === new Date().toDateString() ? (d.count || 0) : 0;
  } catch { return 0; }
}
function _incDailyCount() {
  try {
    const count = _getDailyCount() + 1;
    localStorage.setItem("bga_daily", JSON.stringify({ date: new Date().toDateString(), count }));
    return count;
  } catch { return 0; }
}

// ── Style config ─────────────────────────────────────────────────────────────
const DEFAULT_STYLE_CONFIG = {
  primary_color: "#7c3aed",
  accent_color:  "#a78bfa",
  font_style:    "normal",
  theme:         "dark",
  layout:        "default",
  tone:          "modern",
};

function _hexToRgb(hex) {
  try {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(",");
  } catch { return "124,58,237"; }
}

function _deriveStyles(config = {}) {
  const c = { ...DEFAULT_STYLE_CONFIG, ...config };
  const pRgb = _hexToRgb(c.primary_color);
  const aRgb = _hexToRgb(c.accent_color);
  const isCentered = c.layout === "centered";
  const isPremium  = c.tone === "premium" || c.tone === "luxury";
  const fw = c.font_style === "bold" ? "900" : c.font_style === "light" ? "300" : "700";
  return {
    primaryColor:  c.primary_color,
    accentColor:   c.accent_color,
    fontWeight:    fw,
    textAlign:     isCentered ? "center" : "left",
    headingGrad:   `linear-gradient(135deg, #f1f5f9 30%, ${c.accent_color} 100%)`,
    priceGrad:     `linear-gradient(135deg, ${c.accent_color}, ${c.primary_color})`,
    deployBg:      `linear-gradient(135deg, ${c.primary_color} 0%, ${c.accent_color} 100%)`,
    deployShad:    `0 4px 24px rgba(${pRgb}, 0.4)`,
    deployBorder:  `rgba(${pRgb}, 0.35)`,
    heroBorder:    `rgba(${pRgb}, 0.2)`,
    heroBg:        `linear-gradient(135deg, rgba(${pRgb},0.1) 0%, rgba(${aRgb},0.06) 100%)`,
    taglineColor:  c.accent_color,
    sectionPad:    isPremium ? "36px" : "28px",
  };
}

const LOADING_STEPS = [
  { icon: "🧠", text: "Analysing your business idea..." },
  { icon: "🌍", text: "Researching the African market..." },
  { icon: "💡", text: "Naming your business..." },
  { icon: "🏗️", text: "Architecting your product lineup..." },
  { icon: "✨", text: "Polishing your brand identity..." },
];

const TRUST_SIGNALS = [
  { icon: "⚡", label: "Instant results" },
  { icon: "🔒", label: "Private & secure" },
  { icon: "🌍", label: "Africa-focused AI" },
];

const BUILD_STEPS = [
  {
    icon: "🧠", title: "Understanding your business",
    messages: ["Reading your idea...", "Identifying your market...", "Finding your edge..."],
    badge: "🟢 AI Working", badgeColor: "#22c55e", badgeBg: "rgba(34,197,94,0.1)", badgeBorder: "rgba(34,197,94,0.25)",
  },
  {
    icon: "🎨", title: "Designing your brand identity",
    messages: ["Shaping your brand voice...", "Designing trust signals...", "Defining what sets you apart..."],
    badge: "⚡ Processing", badgeColor: "#f59e0b", badgeBg: "rgba(245,158,11,0.1)", badgeBorder: "rgba(245,158,11,0.25)",
  },
  {
    icon: "🛍", title: "Structuring products & pricing",
    messages: ["Structuring your offers...", "Pricing for your market...", "Building to convert..."],
    badge: "⚡ Processing", badgeColor: "#f59e0b", badgeBg: "rgba(245,158,11,0.1)", badgeBorder: "rgba(245,158,11,0.25)",
  },
  {
    icon: "🌐", title: "Building your website",
    messages: ["Assembling your pages...", "Making it mobile-ready...", "Laying your foundation..."],
    badge: "⚡ Processing", badgeColor: "#60a5fa", badgeBg: "rgba(96,165,250,0.1)", badgeBorder: "rgba(96,165,250,0.25)",
  },
  {
    icon: "⚡", title: "Optimising for mobile & speed",
    messages: ["Final polish...", "Ensuring fast load times...", "Preparing for your first visitor..."],
    badge: "⚡ Processing", badgeColor: "#60a5fa", badgeBg: "rgba(96,165,250,0.1)", badgeBorder: "rgba(96,165,250,0.25)",
  },
  {
    icon: "🚀", title: "Deploying to the internet",
    messages: ["Final checks before launch...", "Getting ready to go live...", "Almost there..."],
    badge: "🌍 Going Live", badgeColor: "#a78bfa", badgeBg: "rgba(167,139,250,0.1)", badgeBorder: "rgba(167,139,250,0.3)",
  },
];

const QUICK_START_CATEGORIES = [
  { emoji: "🍔", label: "Food Business",     prompt: "I want to start a food business in my area — restaurant, catering, fast food, or meal delivery" },
  { emoji: "👗", label: "Fashion Brand",     prompt: "I want to launch a fashion brand — clothing, accessories, or streetwear for Africans" },
  { emoji: "🌱", label: "Farming",           prompt: "I want to start a farming or agribusiness — crop farming, poultry, fish farming, or produce supply" },
  { emoji: "🛒", label: "Online Store",      prompt: "I want to build an online store selling products to customers across Africa" },
  { emoji: "💆", label: "Beauty & Wellness", prompt: "I want to start a beauty, salon, or wellness business serving my local community" },
  { emoji: "📱", label: "Tech / App",        prompt: "I want to build a tech product or mobile app solving a real problem for Africans" },
  { emoji: "🏗️", label: "Construction",     prompt: "I want to start a construction, real estate, or building materials business" },
  { emoji: "🎓", label: "Education",         prompt: "I want to launch an education, tutoring, or skills training business" },
];

const LAUNCH_STEPS = [
  { icon: "🧠", title: "Generating your business",  desc: "AI crafting your concept, name & brand..." },
  { icon: "🌐", title: "Building your website",      desc: "Creating hero, products & contact pages..." },
  { icon: "🎨", title: "Designing flyer",            desc: "Composing 800×800 marketing visual..." },
  { icon: "🧩", title: "Creating logo",              desc: "Generating Minimal, Badge & Icon styles..." },
  { icon: "📱", title: "Preparing social content",   desc: "Writing Instagram, WhatsApp & Reels copy..." },
  { icon: "🚀", title: "Deploying online",           desc: "Publishing your live website to the world..." },
];

const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.96); }
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  @keyframes orb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(30px, -20px) scale(1.05); }
    66%       { transform: translate(-20px, 15px) scale(0.97); }
  }

  @keyframes stepIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes borderGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
    50%       { box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15); }
  }

  @keyframes buildFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes buildFadeOut {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-8px); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes messageFade {
    0%        { opacity: 0; transform: translateY(4px); }
    12%, 80%  { opacity: 1; transform: translateY(0); }
    100%      { opacity: 0; transform: translateY(-3px); }
  }

  @keyframes stepPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.52; }
  }

  @keyframes successGlow {
    0%, 100% { box-shadow: 0 0 40px rgba(34,197,94,0.07), 0 8px 32px rgba(0,0,0,0.4); }
    50%       { box-shadow: 0 0 70px rgba(34,197,94,0.22), 0 12px 40px rgba(0,0,0,0.5); }
  }

  body { background: #06060e; }

  textarea {
    transition: border-color 0.25s, box-shadow 0.25s !important;
  }
  textarea:focus {
    border-color: #8b5cf6 !important;
    box-shadow: 0 0 0 3px rgba(139,92,246,0.18), inset 0 1px 3px rgba(0,0,0,0.4) !important;
  }
  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .gen-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.15s, box-shadow 0.2s !important;
  }
  .gen-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s;
  }
  .gen-btn:hover:not(:disabled)::before { transform: translateX(100%); }
  .gen-btn:hover:not(:disabled) {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 32px rgba(124,58,237,0.45) !important;
  }
  .gen-btn:active:not(:disabled) { transform: translateY(0px) !important; }

  .product-card:hover {
    border-color: rgba(139,92,246,0.4) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important;
  }

  .contact-item:hover {
    border-color: rgba(139,92,246,0.3) !important;
    background: rgba(139,92,246,0.06) !important;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #2d2d3d; }
`;

function Orb({ style }) {
  return (
    <div style={{
      position: "absolute",
      borderRadius: "50%",
      filter: "blur(80px)",
      animation: "orb 8s ease-in-out infinite",
      pointerEvents: "none",
      ...style,
    }} />
  );
}


function SkeletonBlock({ width = "100%", height = "16px", style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: "6px",
      background: "linear-gradient(90deg, #1a1a2e 25%, #252540 50%, #1a1a2e 75%)",
      backgroundSize: "400px 100%",
      animation: "shimmer 1.4s infinite linear",
      ...style,
    }} />
  );
}

function BuildExperience({ deploying }) {
  const [stepIndex,    setStepIndex]    = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress,     setProgress]     = useState(0);
  const [leaving,      setLeaving]      = useState(false);
  const prevDeployingRef = useRef(true);
  const firstStepRef     = useRef(true);

  // Advance through steps, stop at last — fire init sound/haptic on start
  useEffect(() => {
    if (!deploying) return;
    setStepIndex(0); setMessageIndex(0); setProgress(0); setLeaving(false);
    firstStepRef.current = true;
    sound.init();
    haptic.start();
    const tid = setInterval(() => {
      setStepIndex(prev => (prev < BUILD_STEPS.length - 1 ? prev + 1 : prev));
    }, 1700);
    return () => clearInterval(tid);
  }, [deploying]);

  // Tick sound + micro-haptic on each step change
  useEffect(() => {
    if (firstStepRef.current) { firstStepRef.current = false; return; }
    sound.tick();
    haptic.step();
  }, [stepIndex]);

  // Cycle sub-messages within each step
  useEffect(() => {
    setMessageIndex(0);
    const msgs = BUILD_STEPS[stepIndex].messages;
    if (msgs.length <= 1) return;
    const tid = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % msgs.length);
    }, 1100);
    return () => clearInterval(tid);
  }, [stepIndex]);

  // Smooth progress targets per step
  const PROGRESS_TARGETS = [12, 26, 42, 57, 72, 87];
  useEffect(() => { setProgress(PROGRESS_TARGETS[stepIndex]); }, [stepIndex]);

  // Slow creep while waiting at last step
  useEffect(() => {
    if (stepIndex < BUILD_STEPS.length - 1) return;
    const tid = setInterval(() => {
      setProgress(prev => (prev < 93 ? +(prev + 0.3).toFixed(1) : prev));
    }, 400);
    return () => clearInterval(tid);
  }, [stepIndex]);

  // Fade out when deploy finishes
  useEffect(() => {
    if (!deploying && prevDeployingRef.current) {
      setProgress(100);
      setTimeout(() => setLeaving(true), 350);
    }
    prevDeployingRef.current = deploying;
  }, [deploying]);

  if (!deploying && !leaving) return null;

  const step = BUILD_STEPS[stepIndex];

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "14px",
      animation: leaving ? "buildFadeOut 0.4s ease forwards" : "buildFadeIn 0.4s ease",
    }}>
      {/* Status badge */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div key={`badge-${stepIndex}`} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 14px", borderRadius: "20px",
          fontSize: "12px", fontWeight: "600",
          color: step.badgeColor,
          backgroundColor: step.badgeBg,
          border: `1px solid ${step.badgeBorder}`,
          animation: "buildFadeIn 0.35s ease",
        }}>
          {step.badge}
        </div>
      </div>

      {/* Main card */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(79,70,229,0.04) 100%)",
        border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: "20px", padding: "32px 28px",
        display: "flex", flexDirection: "column", gap: "22px",
        backdropFilter: "blur(12px)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: -60, right: -60, width: 180, height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Step dots / progress pills */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
          {BUILD_STEPS.map((_, i) => (
            <div key={i} style={{
              height: "5px",
              width: i === stepIndex ? "20px" : "6px",
              borderRadius: "3px",
              backgroundColor: i < stepIndex ? "#22c55e" : i === stepIndex ? "#a78bfa" : "rgba(255,255,255,0.1)",
              transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: i === stepIndex ? "0 0 7px rgba(167,139,250,0.7)" : "none",
              animation: i === stepIndex ? "pulse 1.8s ease-in-out infinite" : "none",
            }} />
          ))}
        </div>

        {/* Icon + title + message */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div key={`icon-${stepIndex}`} style={{ fontSize: "42px", lineHeight: 1, animation: "buildFadeIn 0.4s ease, stepPulse 1.4s ease-in-out 0.4s infinite" }}>
            {step.icon}
          </div>
          <div key={`title-${stepIndex}`} style={{
            fontSize: "17px", fontWeight: "700", color: "#f1f5f9", lineHeight: "1.35",
            animation: "buildFadeIn 0.4s ease",
          }}>
            {step.title}
          </div>
          <div key={`msg-${stepIndex}-${messageIndex}`} style={{
            fontSize: "13px", color: "#6b7280", minHeight: "18px",
            animation: "messageFade 1.1s ease",
          }}>
            {step.messages[messageIndex]}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#4b5563", fontWeight: "500" }}>
              Step {stepIndex + 1} of {BUILD_STEPS.length}
            </span>
            <span style={{ fontSize: "11px", color: "#6b7280", fontFamily: "monospace" }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: "3px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "2px",
              background: "linear-gradient(90deg, #6d28d9, #a78bfa, #818cf8)",
              width: `${progress}%`,
              transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 6px rgba(167,139,250,0.6)",
            }} />
          </div>
        </div>
      </div>

      {/* Completed steps list */}
      {stepIndex > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {BUILD_STEPS.slice(0, stepIndex).map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 14px", borderRadius: "10px",
              backgroundColor: "rgba(34,197,94,0.04)",
              border: "1px solid rgba(34,197,94,0.1)",
              animation: "buildFadeIn 0.3s ease",
            }}>
              <span style={{ fontSize: "13px" }}>{s.icon}</span>
              <span style={{ fontSize: "12px", color: "#4b5563", flex: 1 }}>{s.title}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── One-click Launch overlay ─────────────────────────────────────────────────
function LaunchExperience({ step, progress, error, onRetry, onDismiss }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(6,6,14,0.97)",
      backdropFilter: "blur(24px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px",
      animation: "fadeSlideUp 0.4s ease",
    }}>
      <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "30px" }}>

        {/* Title */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
            Launching your business...
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.6" }}>
            AI is building every layer automatically — sit tight.
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500", flex: 1, marginRight: "12px" }}>
              {step > 0 && step <= LAUNCH_STEPS.length ? LAUNCH_STEPS[step - 1].desc : "Preparing..."}
            </span>
            <span style={{ fontSize: "12px", color: "#a78bfa", fontFamily: "monospace", fontWeight: "600", flexShrink: 0 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: "4px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "3px",
              background: "linear-gradient(90deg, #6d28d9, #a78bfa, #818cf8)",
              width: `${progress}%`,
              transition: "width 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 8px rgba(167,139,250,0.6)",
            }} />
          </div>
        </div>

        {/* Steps list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {LAUNCH_STEPS.map((s, i) => {
            const stepNum = i + 1;
            const isDone   = stepNum < step;
            const isActive = stepNum === step;
            const isFuture = stepNum > step;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "13px 18px",
                borderRadius: "14px",
                background: isActive
                  ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.08))"
                  : isDone ? "rgba(34,197,94,0.04)"
                  : "rgba(255,255,255,0.02)",
                border: isActive
                  ? "1px solid rgba(124,58,237,0.35)"
                  : isDone ? "1px solid rgba(34,197,94,0.15)"
                  : "1px solid rgba(255,255,255,0.04)",
                opacity: isFuture ? 0.3 : 1,
                transition: "all 0.45s ease",
                animation: isActive ? "buildFadeIn 0.4s ease" : "none",
              }}>
                <div style={{
                  fontSize: "19px", lineHeight: 1, flexShrink: 0,
                  animation: isActive ? "stepPulse 1.4s ease-in-out infinite" : "none",
                }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: isActive ? "700" : "400",
                    color: isActive ? "#e2e8f0" : isDone ? "#4b5563" : "#374151",
                    transition: "color 0.3s",
                  }}>
                    {s.title}
                  </div>
                </div>
                <div style={{ flexShrink: 0, width: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isDone && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {isActive && (
                    <div style={{
                      width: "13px", height: "13px", borderRadius: "50%",
                      border: "2px solid rgba(167,139,250,0.3)", borderTop: "2px solid #a78bfa",
                      animation: "spin 0.8s linear infinite",
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            display: "flex", flexDirection: "column", gap: "12px",
            padding: "16px 18px",
            background: "rgba(248,113,113,0.07)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: "14px",
            animation: "buildFadeIn 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
              <div style={{ fontSize: "13px", color: "#fca5a5", lineHeight: "1.6" }}>{error}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                onClick={onRetry}
                style={{
                  padding: "10px",
                  background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: "10px", color: "#fca5a5",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(248,113,113,0.18)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
              >
                ↺ Retry
              </button>
              <button
                onClick={onDismiss}
                style={{
                  padding: "10px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", color: "#9ca3af",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Launch success screen ──────────────────────────────────────────────────────
function LaunchSuccessScreen({ data, deployedUrl, onClose, onLaunchAnother }) {
  const flyerRef = useRef(null);
  const logoRef1 = useRef(null);
  const logoRef2 = useRef(null);
  const logoRef3 = useRef(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const kit = _genSocialKit(data);

  useEffect(() => {
    const logoRefs = [logoRef1, logoRef2, logoRef3];
    const draws = [_drawLogoMinimal, _drawLogoBadge, _drawLogoIconText];
    document.fonts.ready.then(() => {
      if (flyerRef.current) _drawFlyer(flyerRef.current, data);
      logoRefs.forEach((ref, i) => { if (ref.current) draws[i](ref.current, data); });
    });
  }, [data]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const downloadFlyer = () => {
    if (!flyerRef.current) return;
    const a = document.createElement("a");
    a.download = `${(data.selected_name || "flyer").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_flyer.png`;
    a.href = flyerRef.current.toDataURL("image/png");
    a.click();
  };

  const downloadLogo = (ref, label) => {
    if (!ref.current) return;
    const a = document.createElement("a");
    a.download = `${(data.selected_name || "logo").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${label}.png`;
    a.href = ref.current.toDataURL("image/png");
    a.click();
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const LOGO_DEFS = [
    { ref: logoRef1, label: "minimal",   name: "Minimal" },
    { ref: logoRef2, label: "badge",     name: "Badge" },
    { ref: logoRef3, label: "icon-name", name: "Icon + Name" },
  ];

  const KIT_BLOCKS = [
    { key: "ig",   label: "Instagram Caption", color: "#e879f9", text: kit.instagram,
      actions: [{ label: "Open Instagram", href: "https://instagram.com", emoji: "📸" }] },
    { key: "wa",   label: "WhatsApp Message",  color: "#4ade80", text: kit.whatsapp,
      actions: kit.rawPhone ? [{ label: "Open WhatsApp", href: `https://wa.me/${kit.rawPhone}?text=${encodeURIComponent(kit.whatsapp)}`, emoji: "💬" }] : [] },
    { key: "hook", label: "Promo Hook",         color: "#f59e0b", text: kit.hook, actions: [] },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(4,4,12,0.96)",
      backdropFilter: "blur(24px)",
      overflowY: "auto",
      padding: "40px 24px 60px",
      animation: "fadeSlideUp 0.45s ease",
    }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "22px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              🎉 Your business is fully launched
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              Every asset is generated — your website is live and ready to share.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
              color: "#9ca3af", padding: "8px 16px",
              fontSize: "12px", fontWeight: "500", cursor: "pointer",
            }}
          >✕ Close</button>
        </div>

        {/* Business identity */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.05))",
          border: "1px solid rgba(139,92,246,0.2)", borderRadius: "18px",
          display: "flex", flexDirection: "column", gap: "6px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{
              fontSize: "26px", fontWeight: "900", letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #f1f5f9 30%, #a78bfa 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{data.selected_name}</div>
            <div style={{
              fontSize: "10px", fontWeight: "700", color: "#22c55e",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              padding: "3px 10px", borderRadius: "20px", letterSpacing: "0.06em",
              animation: "pulse 2.5s ease-in-out infinite",
            }}>LIVE</div>
          </div>
          <div style={{ fontSize: "14px", color: "#a78bfa", fontStyle: "italic" }}>"{data.tagline}"</div>
        </div>

        {/* Live URL */}
        <div style={{
          borderRadius: "18px", overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.25)",
          animation: "successGlow 4s ease-in-out infinite",
        }}>
          <div style={{
            padding: "15px 20px",
            background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.06))",
            borderBottom: "1px solid rgba(34,197,94,0.15)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
              background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.8)",
              animation: "pulse 2s infinite",
            }} />
            <span style={{ fontSize: "12px", color: "#86efac", flex: 1, fontFamily: "monospace", wordBreak: "break-all" }}>
              {deployedUrl}
            </span>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            padding: "12px 14px", gap: "10px",
            background: "rgba(0,0,0,0.3)",
          }}>
            <a
              href={deployedUrl} target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "11px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "#fff", borderRadius: "10px",
                fontSize: "13px", fontWeight: "600", textDecoration: "none",
                boxShadow: "0 4px 16px rgba(79,70,229,0.35)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open Website
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(deployedUrl).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "11px",
                background: linkCopied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                color: linkCopied ? "#4ade80" : "#9ca3af",
                border: linkCopied ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {linkCopied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Flyer */}
        <div style={{
          padding: "18px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px",
          display: "flex", flexDirection: "column", gap: "14px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0" }}>Marketing Flyer</div>
              <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>800 × 800 · PNG</div>
            </div>
            <button
              onClick={downloadFlyer}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px",
                background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                borderRadius: "10px", color: "#a78bfa",
                fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(124,58,237,0.18)"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(124,58,237,0.1)"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Flyer
            </button>
          </div>
          <canvas ref={flyerRef} style={{
            width: "100%", maxWidth: "360px", margin: "0 auto", display: "block",
            borderRadius: "12px", border: "1px solid rgba(139,92,246,0.15)",
          }} />
        </div>

        {/* Logos */}
        <div style={{
          padding: "18px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px",
          display: "flex", flexDirection: "column", gap: "14px",
        }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0" }}>Logo Variations</div>
            <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>3 styles · 600 × 600 · PNG</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {LOGO_DEFS.map(({ ref, label, name }) => (
              <div key={label} style={{
                display: "flex", flexDirection: "column", gap: "8px",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", padding: "10px",
              }}>
                <canvas ref={ref} style={{ width: "100%", borderRadius: "6px", display: "block" }} />
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textAlign: "center" }}>{name}</div>
                <button
                  onClick={() => downloadLogo(ref, label)}
                  style={{
                    padding: "7px",
                    background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "8px", color: "#a78bfa",
                    fontSize: "11px", fontWeight: "600", cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "rgba(124,58,237,0.16)"}
                  onMouseOut={e => e.currentTarget.style.background = "rgba(124,58,237,0.08)"}
                >⬇ Download</button>
              </div>
            ))}
          </div>
        </div>

        {/* Social Kit */}
        <div style={{
          padding: "18px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px",
          display: "flex", flexDirection: "column", gap: "12px",
        }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0" }}>Social Post Kit</div>
            <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>Instagram · WhatsApp · Reels</div>
          </div>
          {KIT_BLOCKS.map(({ key, label, color, text, actions }) => (
            <div key={key} style={{
              display: "flex", flexDirection: "column", gap: "8px",
              background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "12px", padding: "14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color }}>{label}</div>
                <button
                  onClick={() => copy(text, key)}
                  style={{
                    padding: "4px 12px",
                    background: copiedKey === key ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
                    border: copiedKey === key ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "7px",
                    color: copiedKey === key ? "#4ade80" : "#9ca3af",
                    fontSize: "11px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                  }}
                >{copiedKey === key ? "✓ Copied!" : "Copy"}</button>
              </div>
              <pre style={{
                margin: 0, fontFamily: "inherit", fontSize: "12px", color: "#d1d5db",
                lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word",
                background: "rgba(0,0,0,0.2)", padding: "12px 14px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.04)",
                maxHeight: "120px", overflowY: "auto",
              }}>{text}</pre>
              {actions.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {actions.map(({ label: al, href, emoji }) => (
                    <a key={al} href={href} target="_blank" rel="noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "6px 12px", background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
                      color: "#9ca3af", fontSize: "11px", fontWeight: "500", textDecoration: "none",
                    }}>{emoji} {al}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {onLaunchAnother && (
            <button
              onClick={onLaunchAnother}
              className="gen-btn"
              style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: "12px", color: "#fff",
                fontSize: "14px", fontWeight: "600", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
                letterSpacing: "0.02em",
              }}
            >
              🚀 Launch Another Business
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "11px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px", color: "#4b5563",
              fontSize: "13px", fontWeight: "500", cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseOver={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            onMouseOut={e => { e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          >
            View Business Details
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Flyer canvas helpers ─────────────────────────────────────────────────────
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

function _wrapText(ctx, text, x, y, maxW, lineH, maxLines = 2) {
  const words = text.split(" ");
  let line = "";
  let drawn = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxW && line) {
      if (drawn + 1 >= maxLines) {
        let l = line.trimEnd();
        while (ctx.measureText(l + "…").width > maxW && l.length > 1) l = l.slice(0, -1);
        ctx.fillText(l + "…", x, y);
        return;
      }
      ctx.fillText(line.trimEnd(), x, y);
      y += lineH; line = words[i] + " "; drawn++;
    } else { line = test; }
  }
  ctx.fillText(line.trimEnd(), x, y);
}

function _drawFlyer(canvas, data) {
  const ctx = canvas.getContext("2d");
  const S = 800;
  canvas.width = S; canvas.height = S;

  // Background
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, "#09091a"); bg.addColorStop(1, "#160829");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);

  // Ambient glows
  [
    [S * 0.78, S * 0.12, 260, "rgba(109,40,217,0.22)"],
    [S * 0.20, S * 0.90, 200, "rgba(79,70,229,0.18)"],
  ].forEach(([gx, gy, gr, gc]) => {
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, gc); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  });

  // Top accent line
  const topBar = ctx.createLinearGradient(0, 0, S, 0);
  topBar.addColorStop(0, "#7c3aed"); topBar.addColorStop(1, "#4f46e5");
  ctx.fillStyle = topBar; ctx.fillRect(0, 0, S, 6);

  // Business name (auto-size to fit)
  ctx.textAlign = "center";
  let nfs = 84;
  ctx.font = `900 ${nfs}px Inter, system-ui, sans-serif`;
  while (ctx.measureText(data.selected_name || "").width > S - 100 && nfs > 36) {
    nfs -= 4; ctx.font = `900 ${nfs}px Inter, system-ui, sans-serif`;
  }
  const nameGrad = ctx.createLinearGradient(S * 0.15, 0, S * 0.85, 0);
  nameGrad.addColorStop(0, "#f1f5f9"); nameGrad.addColorStop(1, "#c4b5fd");
  ctx.fillStyle = nameGrad;
  ctx.fillText(data.selected_name || "", S / 2, 175);

  // Tagline
  ctx.font = `500 italic 26px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#a78bfa";
  _wrapText(ctx, `"${data.tagline || ""}"`, S / 2, 232, S - 130, 36, 2);

  // Gradient divider
  const dv = ctx.createLinearGradient(80, 0, S - 80, 0);
  dv.addColorStop(0, "rgba(139,92,246,0)");
  dv.addColorStop(0.5, "rgba(139,92,246,0.4)");
  dv.addColorStop(1, "rgba(139,92,246,0)");
  ctx.strokeStyle = dv; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 290); ctx.lineTo(S - 80, 290); ctx.stroke();

  // Product card
  const products = data.website?.products || [];
  const p = products[0];
  if (p) {
    _roundRect(ctx, 72, 316, S - 144, 200, 24);
    const cardBg = ctx.createLinearGradient(72, 316, S - 72, 516);
    cardBg.addColorStop(0, "rgba(124,58,237,0.16)");
    cardBg.addColorStop(1, "rgba(79,70,229,0.07)");
    ctx.fillStyle = cardBg; ctx.fill();
    ctx.strokeStyle = "rgba(139,92,246,0.28)"; ctx.lineWidth = 1; ctx.stroke();

    ctx.font = `600 18px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "#6b7280";
    ctx.fillText("FEATURED PRODUCT", S / 2, 358);

    ctx.font = `700 36px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    _wrapText(ctx, p.name || "", S / 2, 406, S - 180, 42, 1);

    const pg = ctx.createLinearGradient(S / 2 - 90, 0, S / 2 + 90, 0);
    pg.addColorStop(0, "#a78bfa"); pg.addColorStop(1, "#818cf8");
    ctx.fillStyle = pg;
    ctx.font = `800 50px Inter, system-ui, sans-serif`;
    ctx.fillText(p.price || "", S / 2, 472);
  }

  // WhatsApp CTA
  const ctaY = p ? 556 : 390;
  _roundRect(ctx, 88, ctaY, S - 176, 78, 20);
  const ctaBg = ctx.createLinearGradient(88, ctaY, S - 88, ctaY);
  ctaBg.addColorStop(0, "#25d366"); ctaBg.addColorStop(1, "#128c7e");
  ctx.fillStyle = ctaBg; ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = `700 27px Inter, system-ui, sans-serif`;
  ctx.fillText("Order now on WhatsApp", S / 2, ctaY + 51);

  // Contact
  const phone = data.website?.contact?.phone;
  const loc   = data.website?.contact?.location;
  if (phone) {
    ctx.fillStyle = "rgba(167,139,250,0.75)";
    ctx.font = `400 22px Inter, system-ui, sans-serif`;
    ctx.fillText(phone, S / 2, ctaY + 110);
  } else if (loc) {
    ctx.fillStyle = "rgba(156,163,175,0.7)";
    ctx.font = `400 22px Inter, system-ui, sans-serif`;
    ctx.fillText(loc, S / 2, ctaY + 110);
  }

  // Watermark
  ctx.fillStyle = "rgba(107,114,128,0.4)";
  ctx.font = `400 17px Inter, system-ui, sans-serif`;
  ctx.fillText("Powered by BGA — Business Generator Africa", S / 2, S - 26);
}

function FlyerModal({ data, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    document.fonts.ready.then(() => _drawFlyer(canvas, data));
  }, [data]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${(data.selected_name || "flyer").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_flyer.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        animation: "fadeSlideUp 0.3s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: "flex", flexDirection: "column", gap: "14px",
          alignItems: "center", width: "100%", maxWidth: "480px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9" }}>Flyer Preview</span>
            <span style={{ fontSize: "11px", color: "#4b5563" }}>800 × 800 · PNG</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", color: "#9ca3af",
              padding: "6px 14px", fontSize: "12px", fontWeight: "500", cursor: "pointer",
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Canvas preview */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%", maxWidth: "480px",
            borderRadius: "16px",
            border: "1px solid rgba(139,92,246,0.2)",
            display: "block",
            boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
          }}
        />

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="gen-btn"
          style={{
            width: "100%", padding: "14px",
            background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: "12px", color: "#fff",
            fontSize: "14px", fontWeight: "600", cursor: "pointer",
            letterSpacing: "0.02em",
            boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PNG
        </button>
      </div>
    </div>
  );
}

// ── Logo canvas helpers ───────────────────────────────────────────────────────
function _getInitials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length > 2 ? 2 : 1][0]).toUpperCase();
}

function _drawLogoMinimal(canvas, data) {
  const ctx = canvas.getContext("2d");
  const S = 600; canvas.width = S; canvas.height = S;

  ctx.fillStyle = "#060610"; ctx.fillRect(0, 0, S, S);

  const glow = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
  glow.addColorStop(0, "rgba(109,40,217,0.1)"); glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, S, S);

  const initials = _getInitials(data.selected_name);
  const r = 208;

  const ringGrad = ctx.createLinearGradient(S/2 - r, S/2 - r, S/2 + r, S/2 + r);
  ringGrad.addColorStop(0, "#7c3aed"); ringGrad.addColorStop(1, "#4f46e5");
  ctx.strokeStyle = ringGrad; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(S/2, S/2, r, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = "rgba(139,92,246,0.18)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(S/2, S/2, r - 14, 0, Math.PI * 2); ctx.stroke();

  ctx.textAlign = "center";
  const ifs = initials.length > 2 ? 130 : 190;
  ctx.font = `900 ${ifs}px Inter, system-ui, sans-serif`;
  const ig = ctx.createLinearGradient(S * 0.25, 0, S * 0.75, 0);
  ig.addColorStop(0, "#f8fafc"); ig.addColorStop(1, "#c4b5fd");
  ctx.fillStyle = ig;
  ctx.fillText(initials, S/2, S/2 + ifs * 0.36);

  const name = data.selected_name || "";
  let nfs = 30;
  ctx.font = `500 ${nfs}px Inter, system-ui, sans-serif`;
  while (ctx.measureText(name).width > S - 100 && nfs > 16) {
    nfs -= 2; ctx.font = `500 ${nfs}px Inter, system-ui, sans-serif`;
  }
  ctx.fillStyle = "rgba(156,163,175,0.65)";
  ctx.fillText(name, S/2, S/2 + r + 52);
}

function _drawLogoBadge(canvas, data) {
  const ctx = canvas.getContext("2d");
  const S = 600; canvas.width = S; canvas.height = S;

  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, "#06060e"); bg.addColorStop(1, "#140626");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);

  const bx = 48, by = 138, bw = S - 96, bh = S - 276;
  _roundRect(ctx, bx, by, bw, bh, 32);
  const badgeGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  badgeGrad.addColorStop(0, "#6d28d9");
  badgeGrad.addColorStop(0.55, "#7c3aed");
  badgeGrad.addColorStop(1, "#4338ca");
  ctx.fillStyle = badgeGrad; ctx.fill();

  _roundRect(ctx, bx + 2, by + 2, bw - 4, bh * 0.42, 30);
  ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(S/2 - 24 + i * 24, by + 38, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.15 + i * 0.15})`; ctx.fill();
  }

  ctx.textAlign = "center";
  const name = data.selected_name || "";
  let nfs = 62;
  ctx.font = `800 ${nfs}px Inter, system-ui, sans-serif`;
  while (ctx.measureText(name).width > bw - 56 && nfs > 26) {
    nfs -= 3; ctx.font = `800 ${nfs}px Inter, system-ui, sans-serif`;
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name, S/2, by + bh / 2 + nfs * 0.16);

  ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx + 56, by + bh / 2 + nfs * 0.38);
  ctx.lineTo(bx + bw - 56, by + bh / 2 + nfs * 0.38);
  ctx.stroke();

  ctx.font = `400 italic 20px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  _wrapText(ctx, data.tagline || "", S/2, by + bh / 2 + nfs * 0.62, bw - 80, 24, 1);
}

function _drawLogoIconText(canvas, data) {
  const ctx = canvas.getContext("2d");
  const S = 600; canvas.width = S; canvas.height = S;

  ctx.fillStyle = "#08081a"; ctx.fillRect(0, 0, S, S);

  for (const [cx2, cy2, col] of [
    [S * 0.84, S * 0.12, "rgba(109,40,217,0.16)"],
    [S * 0.16, S * 0.88, "rgba(79,70,229,0.13)"],
  ]) {
    const g = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 170);
    g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  }

  const icx = S / 2, icy = S / 2 - 66, icSz = 156;

  ctx.shadowColor = "rgba(124,58,237,0.55)"; ctx.shadowBlur = 32;
  _roundRect(ctx, icx - icSz / 2, icy - icSz / 2, icSz, icSz, 30);
  const ibg = ctx.createLinearGradient(icx - icSz / 2, icy - icSz / 2, icx + icSz / 2, icy + icSz / 2);
  ibg.addColorStop(0, "#7c3aed"); ibg.addColorStop(1, "#4f46e5");
  ctx.fillStyle = ibg; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;

  const dm = 40;
  ctx.save(); ctx.translate(icx, icy); ctx.rotate(Math.PI / 4);
  _roundRect(ctx, -dm, -dm, dm * 2, dm * 2, 7);
  ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.font = `900 82px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText((data.selected_name || "B")[0].toUpperCase(), icx, icy + 30);

  const name = data.selected_name || "";
  let nfs = 50;
  ctx.font = `700 ${nfs}px Inter, system-ui, sans-serif`;
  while (ctx.measureText(name).width > S - 80 && nfs > 22) {
    nfs -= 2; ctx.font = `700 ${nfs}px Inter, system-ui, sans-serif`;
  }
  const ng = ctx.createLinearGradient(S * 0.2, 0, S * 0.8, 0);
  ng.addColorStop(0, "#f1f5f9"); ng.addColorStop(1, "#c4b5fd");
  ctx.fillStyle = ng;
  ctx.fillText(name, S / 2, icy + icSz / 2 + 72);

  if (data.tagline) {
    ctx.font = `400 19px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "#4b5563";
    _wrapText(ctx, data.tagline, S / 2, icy + icSz / 2 + 106, S - 100, 24, 1);
  }
}

function LogoModal({ data, onClose }) {
  const c1 = useRef(null), c2 = useRef(null), c3 = useRef(null);
  const LOGOS = [
    { ref: c1, draw: _drawLogoMinimal,  label: "Minimal",     desc: "Clean initials mark" },
    { ref: c2, draw: _drawLogoBadge,    label: "Badge",       desc: "Bold brand badge" },
    { ref: c3, draw: _drawLogoIconText, label: "Icon + Name", desc: "Icon with wordmark" },
  ];

  useEffect(() => {
    document.fonts.ready.then(() => {
      LOGOS.forEach(({ ref, draw }) => { if (ref.current) draw(ref.current, data); });
    });
  }, [data]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const download = (ref, label) => {
    if (!ref.current) return;
    const a = document.createElement("a");
    a.download = `${(data.selected_name || "logo").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${label.replace(/[\s+]/g, "_").toLowerCase()}.png`;
    a.href = ref.current.toDataURL("image/png");
    a.click();
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px", overflowY: "auto",
      animation: "fadeSlideUp 0.3s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        display: "flex", flexDirection: "column", gap: "16px",
        width: "100%", maxWidth: "560px", paddingBottom: "24px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9" }}>Logo Variations</div>
            <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>3 styles · 600 × 600 · PNG</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", color: "#9ca3af",
            padding: "6px 14px", fontSize: "12px", fontWeight: "500", cursor: "pointer",
          }}>✕ Close</button>
        </div>

        {/* Logo grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {LOGOS.map(({ ref, label, desc }) => (
            <div key={label} style={{
              display: "flex", flexDirection: "column", gap: "10px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px", padding: "12px",
            }}>
              <canvas ref={ref} style={{ width: "100%", borderRadius: "8px", display: "block" }} />
              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#e2e8f0" }}>{label}</div>
                <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>{desc}</div>
              </div>
              <button
                onClick={() => download(ref, label)}
                style={{
                  width: "100%", padding: "8px",
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  borderRadius: "8px", color: "#a78bfa",
                  fontSize: "11px", fontWeight: "600", cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(124,58,237,0.18)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"; }}
                onMouseOut={e =>  { e.currentTarget.style.background = "rgba(124,58,237,0.1)";  e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)";  }}
              >
                ⬇ Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Social Kit content generator ─────────────────────────────────────────────
function _genSocialKit(data) {
  const name     = data.selected_name || "Our Business";
  const tagline  = data.tagline       || "";
  const products = data.website?.products || [];
  const contact  = data.website?.contact  || {};
  const hero     = data.website?.hero     || {};
  const p        = products[0];
  const rawPhone = (contact.phone || "").replace(/\D/g, "");
  const nameTag  = "#" + name.replace(/[^a-zA-Z0-9]/g, "");
  const shortTag = tagline.split(/[.!?]/)[0].trim();

  const instagram = [
    (hero.headline || `${name} is here`) + " 🔥",
    "",
    tagline,
    "",
    p ? `✨ ${p.name} — only ${p.price}` : "",
    "",
    rawPhone ? `📲 Order now on WhatsApp ↓\nwa.me/${rawPhone}` : "📲 DM us to order now!",
    "",
    `${nameTag} #NaijaBusiness #SupportLocal #NaijaEntrepreneur #MadeInAfrica`,
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();

  const whatsapp = [
    "Hello 👋",
    "",
    `We are *${name}*.`,
    tagline ? `_${tagline}_` : "",
    "",
    p ? `🛍 *${p.name}* — ${p.price}` : "",
    p?.description ? p.description : "",
    "",
    contact.location ? `📍 ${contact.location}` : "",
    "",
    "Reply to place your order now! 🙌",
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();

  const hook = p
    ? `${p.name}. ${p.price} only. No middleman. Just quality. 🔥`
    : `${name}. ${shortTag}. Order now. 🔥`;

  return { instagram, whatsapp, hook, rawPhone };
}

function SocialKitModal({ data, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const kit = _genSocialKit(data);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const BLOCKS = [
    {
      key: "ig",
      label: "Instagram Caption",
      desc: "Hook · Product · CTA · Hashtags",
      color: "#e879f9",
      colorBg: "rgba(232,121,249,0.08)",
      colorBorder: "rgba(232,121,249,0.2)",
      text: kit.instagram,
      actions: [{ label: "Open Instagram", href: "https://instagram.com", emoji: "📸" }],
    },
    {
      key: "wa",
      label: "WhatsApp Message",
      desc: "Short · Direct · Sales-focused",
      color: "#4ade80",
      colorBg: "rgba(34,197,94,0.08)",
      colorBorder: "rgba(34,197,94,0.2)",
      text: kit.whatsapp,
      actions: kit.rawPhone
        ? [{ label: "Open WhatsApp", href: `https://wa.me/${kit.rawPhone}?text=${encodeURIComponent(kit.whatsapp)}`, emoji: "💬" }]
        : [],
    },
    {
      key: "hook",
      label: "Promo Hook",
      desc: "Reels · TikTok · Stories",
      color: "#f59e0b",
      colorBg: "rgba(245,158,11,0.08)",
      colorBorder: "rgba(245,158,11,0.2)",
      text: kit.hook,
      actions: [],
    },
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px", overflowY: "auto",
      animation: "fadeSlideUp 0.3s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        display: "flex", flexDirection: "column", gap: "14px",
        width: "100%", maxWidth: "520px", paddingBottom: "24px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9" }}>Social Post Kit</div>
            <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>Instagram · WhatsApp · Reels</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", color: "#9ca3af",
            padding: "6px 14px", fontSize: "12px", fontWeight: "500", cursor: "pointer",
          }}>✕ Close</button>
        </div>

        {/* Content blocks */}
        {BLOCKS.map(({ key, label, desc, color, colorBg, colorBorder, text, actions }) => (
          <div key={key} style={{
            display: "flex", flexDirection: "column", gap: "10px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px", padding: "18px",
          }}>
            {/* Block header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em",
                  textTransform: "uppercase", color,
                }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                  {label}
                </div>
                <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "3px" }}>{desc}</div>
              </div>
              <button
                onClick={() => copy(text, key)}
                style={{
                  flexShrink: 0, padding: "5px 12px",
                  background: copiedKey === key ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
                  border: copiedKey === key ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: copiedKey === key ? "#4ade80" : "#9ca3af",
                  fontSize: "11px", fontWeight: "600", cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {copiedKey === key ? "✓ Copied!" : "Copy"}
              </button>
            </div>

            {/* Text area */}
            <pre style={{
              margin: 0, fontFamily: "inherit",
              fontSize: "13px", color: "#d1d5db",
              lineHeight: "1.75",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              background: "rgba(0,0,0,0.25)",
              padding: "14px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.04)",
            }}>{text}</pre>

            {/* Action links */}
            {actions.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {actions.map(({ label: al, href, emoji }) => (
                  <a
                    key={al}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "7px 14px",
                      background: colorBg,
                      border: `1px solid ${colorBorder}`,
                      borderRadius: "8px", color,
                      fontSize: "12px", fontWeight: "500",
                      textDecoration: "none",
                      transition: "opacity 0.15s",
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = "0.8"}
                    onMouseOut={e =>  e.currentTarget.style.opacity = "1"}
                  >
                    {emoji} {al}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Prompt-to-Edit ───────────────────────────────────────────────────────────
function PromptEditor({ styleConfig, onUpdate, locked, onSignIn }) {
  const [prompt,  setPrompt]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("/api/style", { prompt, current: styleConfig });
      if (res.data && typeof res.data === "object" && res.data.primary_color) {
        onUpdate(prev => ({ ...prev, ...res.data }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
        setPrompt("");
      } else {
        throw new Error("bad response");
      }
    } catch {
      setError("Couldn't apply style. Your previous design was kept.");
    }
    setLoading(false);
  };

  if (locked) {
    return (
      <div style={{
        position: "relative", borderRadius: "14px", overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ padding: "14px 16px", filter: "blur(3px)", pointerEvents: "none", opacity: 0.4 }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>✦ Style Customization</div>
          <div style={{ height: "72px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px" }} />
        </div>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "10px", padding: "16px",
          background: "rgba(6,6,14,0.78)", backdropFilter: "blur(6px)",
          borderRadius: "14px",
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#9ca3af", textAlign: "center" }}>
            🔒 Sign in to unlock style customization
          </div>
          <button
            onClick={onSignIn}
            style={{
              padding: "8px 20px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: "10px", color: "#fff",
              fontSize: "12px", fontWeight: "600", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
            }}
          >Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        ✦ Style Customization
      </div>
      <textarea
        style={{
          width: "100%", height: "78px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "12px", color: "#e2e8f0",
          fontSize: "13px", lineHeight: "1.6",
          padding: "12px 14px", resize: "none",
          outline: "none", fontFamily: "inherit",
          transition: "border-color 0.25s, box-shadow 0.25s",
        }}
        placeholder="Describe how you want your website to look..."
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
        disabled={loading}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !prompt.trim()}
        style={{
          width: "100%", padding: "11px",
          background: loading
            ? "rgba(124,58,237,0.3)"
            : prompt.trim()
            ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
            : "rgba(124,58,237,0.1)",
          border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: "10px",
          color: prompt.trim() || loading ? "#fff" : "#6b7280",
          fontSize: "13px", fontWeight: "600",
          cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
          opacity: !prompt.trim() && !loading ? 0.5 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
          transition: "all 0.2s",
        }}
      >
        {loading ? (
          <>
            <div style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.25)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
            Applying style...
          </>
        ) : success ? "✓ Style applied!" : "✦ Apply Style"}
      </button>
      {error && (
        <div style={{ fontSize: "12px", color: "#fca5a5", padding: "8px 12px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", lineHeight: "1.5" }}>
          ⚠️ {error}
        </div>
      )}
      {!error && (
        <div style={{ fontSize: "11px", color: "#374151" }}>⌘ + Enter to apply</div>
      )}
    </div>
  );
}

function PreviewHint({ name, tagline }) {
  return (
    <div style={{
      animation: "buildFadeIn 0.4s ease",
      display: "flex", flexDirection: "column", gap: "10px",
      padding: "24px 26px",
      background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(79,70,229,0.05) 100%)",
      border: "1px solid rgba(139,92,246,0.25)",
      borderRadius: "18px",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ fontSize: "10px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.14em", textTransform: "uppercase" }}>
        Business Preview
      </div>
      <div style={{ fontSize: "22px", fontWeight: "800", color: "#f1f5f9", letterSpacing: "-0.01em" }}>{name}</div>
      <div style={{ fontSize: "13px", color: "#a78bfa", fontStyle: "italic", lineHeight: "1.5" }}>"{tagline}"</div>
    </div>
  );
}

function WebsitePreview({ data, onGenerateAnother, user, styleConfig, onSignIn }) {
  const [copied,      setCopied]      = useState(false);
  const [deploying,   setDeploying]   = useState(false);
  const [deployedUrl, setDeployedUrl] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [linkCopied,  setLinkCopied]  = useState(false);
  const [deployPhase, setDeployPhase] = useState("idle"); // "idle"|"building"|"preview"|"success"
  const [btnPressed,  setBtnPressed]  = useState(false);
  const [dailyCount,  setDailyCount]  = useState(_getDailyCount);
  const [showFlyer,   setShowFlyer]   = useState(false);
  const [showLogo,    setShowLogo]    = useState(false);
  const [showSocial,  setShowSocial]  = useState(false);
  if (!data) return null;

  const s = _deriveStyles(styleConfig);
  const { selected_name, tagline, website = {} } = data;
  const hero     = website.hero     || {};
  const products = website.products || [];
  const contact  = website.contact  || {};

  const handleCopy = () => {
    const lines = [];
    lines.push(`Business Name: ${selected_name}`);
    lines.push(`Tagline: ${tagline}`);

    if (products.length > 0) {
      lines.push("");
      lines.push("Products:");
      products.forEach((p) => {
        lines.push(`- ${p.name} - ${p.price}`);
        if (p.description) lines.push(`  ${p.description}`);
      });
    }

    if (contact.phone || contact.location) {
      lines.push("");
      lines.push("Contact:");
      if (contact.phone)    lines.push(`Phone: ${contact.phone}`);
      if (contact.location) lines.push(`Location: ${contact.location}`);
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployPhase("building");
    setDeployedUrl(null);
    setDeployError(null);
    setLinkCopied(false);
    try {
      const res = await axios.post("/api/deploy", { businessId: data.businessId });
      setDeployedUrl(res.data.url);
    } catch (err) {
      console.error("Deploy error:", err.response?.data || err.message);
      setDeployError(err.response?.data?.error || "Deployment failed. Check the console.");
      setDeployPhase("idle");
    }
    setDeploying(false);
  };

  // Success sequence: sound → haptic → count → preview hint → full card
  useEffect(() => {
    if (!deployedUrl) return;
    sound.success();
    haptic.success();
    setDailyCount(_incDailyCount());
    const t1 = setTimeout(() => setDeployPhase("preview"), 650);
    const t2 = setTimeout(() => setDeployPhase("success"), 1250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [deployedUrl]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", animation: "fadeSlideUp 0.5s ease" }}>

      {/* Business name + tagline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{
            fontSize: "38px", fontWeight: s.fontWeight, lineHeight: "1.15",
            letterSpacing: "-0.025em",
            background: s.headingGrad,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: s.textAlign,
            transition: "all 0.4s ease",
          }}>{selected_name}</div>
          <div style={{
            fontSize: "11px", fontWeight: "600", color: "#22c55e",
            backgroundColor: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
            padding: "3px 10px", borderRadius: "20px",
            letterSpacing: "0.06em",
          }}>GENERATED</div>
        </div>
        <div style={{ fontSize: "16px", color: s.taglineColor, fontWeight: "500", lineHeight: "1.5", fontStyle: "italic", transition: "color 0.4s ease" }}>
          "{tagline}"
        </div>
      </div>

      {/* Hero */}
      {(hero.headline || hero.subtext) && (
        <div style={{
          background: s.heroBg,
          border: `1px solid ${s.heroBorder}`,
          borderRadius: "18px", padding: s.sectionPad,
          display: "flex", flexDirection: "column", gap: "14px",
          backdropFilter: "blur(10px)",
          animation: "fadeSlideUp 0.5s ease 0.1s both",
          transition: "background 0.4s ease, border-color 0.4s ease",
        }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "rgba(139,92,246,0.6)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Hero Section</div>
          {hero.headline && <div style={{ fontSize: "24px", fontWeight: "700", color: "#f1f5f9", lineHeight: "1.3" }}>{hero.headline}</div>}
          {hero.subtext  && <div style={{ fontSize: "14px", color: "#9ca3af", lineHeight: "1.75" }}>{hero.subtext}</div>}
          {hero.cta      && (
            <button style={{
              alignSelf: "flex-start", padding: "10px 22px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "#fff", border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: "600", cursor: "default",
              boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
            }}>{hero.cta}</button>
          )}
        </div>
      )}

      {/* About */}
      {website.about && (
        <div style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "28px",
          display: "flex", flexDirection: "column", gap: "12px",
          backdropFilter: "blur(10px)",
          animation: "fadeSlideUp 0.5s ease 0.15s both",
        }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#4b5563", letterSpacing: "0.14em", textTransform: "uppercase" }}>About</div>
          <div style={{ fontSize: "14px", color: "#9ca3af", lineHeight: "1.75" }}>{website.about}</div>
        </div>
      )}

      {/* Products */}
      {products.length > 0 && (
        <div style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "28px",
          display: "flex", flexDirection: "column", gap: "18px",
          backdropFilter: "blur(10px)",
          animation: "fadeSlideUp 0.5s ease 0.2s both",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#4b5563", letterSpacing: "0.14em", textTransform: "uppercase" }}>Products & Services</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>{products.length} item{products.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
            {products.map((p, i) => (
              <div key={i} className="product-card" style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px", padding: "18px",
                display: "flex", flexDirection: "column", gap: "8px",
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                cursor: "default",
                animation: `fadeSlideUp 0.4s ease ${0.05 * i}s both`,
              }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>{p.name}</div>
                <div style={{
                  fontSize: "19px", fontWeight: "800",
                  background: s.priceGrad,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  transition: "background 0.4s ease",
                }}>{p.price}</div>
                {p.description && <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.6" }}>{p.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      {(contact.phone || contact.location || contact.email) && (
        <div style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "28px",
          display: "flex", flexDirection: "column", gap: "16px",
          backdropFilter: "blur(10px)",
          animation: "fadeSlideUp 0.5s ease 0.3s both",
        }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#4b5563", letterSpacing: "0.14em", textTransform: "uppercase" }}>Contact</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
            {[
              contact.phone    && { icon: "📞", label: "Phone",    value: contact.phone },
              contact.location && { icon: "📍", label: "Location", value: contact.location },
              contact.email    && { icon: "✉️",  label: "Email",    value: contact.email },
            ].filter(Boolean).map(({ icon, label, value }) => (
              <div key={label} className="contact-item" style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px", padding: "14px 16px",
                display: "flex", alignItems: "center", gap: "12px",
                transition: "border-color 0.2s, background 0.2s",
              }}>
                <span style={{ fontSize: "18px" }}>{icon}</span>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: "500", marginTop: "2px" }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy Business button */}
      <button
        onClick={handleCopy}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "8px", width: "100%", padding: "13px 20px",
          background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
          border: copied ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.09)",
          borderRadius: "12px",
          color: copied ? "#4ade80" : "#9ca3af",
          fontSize: "13px", fontWeight: "600", cursor: "pointer",
          letterSpacing: "0.02em",
          transition: "background 0.2s, border-color 0.2s, color 0.2s",
        }}
        onMouseOver={e => { if (!copied) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#e2e8f0"; } }}
        onMouseOut={e =>  { if (!copied) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#9ca3af"; } }}
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Business
          </>
        )}
      </button>

      {/* Flyer + Logo buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {[
          {
            label: "Generate Flyer", action: () => setShowFlyer(true),
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" />
              </svg>
            ),
          },
          {
            label: "Generate Logo", action: () => setShowLogo(true),
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v4l2 2" />
              </svg>
            ),
          },
        ].map(({ label, action, icon }) => (
          <button
            key={label}
            onClick={action}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "7px", width: "100%", padding: "12px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "12px", color: "#9ca3af",
              fontSize: "12px", fontWeight: "600", cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.2s, border-color 0.2s, color 0.2s",
            }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(167,139,250,0.08)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)"; e.currentTarget.style.color = "#c4b5fd"; }}
            onMouseOut={e =>  { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#9ca3af"; }}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Social Kit button */}
      <button
        onClick={() => setShowSocial(true)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "7px", width: "100%", padding: "12px 14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "12px", color: "#9ca3af",
          fontSize: "12px", fontWeight: "600", cursor: "pointer",
          letterSpacing: "0.02em",
          transition: "background 0.2s, border-color 0.2s, color 0.2s",
        }}
        onMouseOver={e => { e.currentTarget.style.background = "rgba(167,139,250,0.08)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)"; e.currentTarget.style.color = "#c4b5fd"; }}
        onMouseOut={e =>  { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#9ca3af"; }}
      >
        ✦ Generate Social Kit
      </button>

      {/* Build experience — stays mounted for fade-out */}
      {(deployPhase === "building" || deploying) && (
        <BuildExperience deploying={deploying} />
      )}

      {/* Preview hint — brief reveal between build end and success card */}
      {deployPhase === "preview" && (
        <PreviewHint name={data.selected_name} tagline={data.tagline} />
      )}

      {/* Deploy button — idle state */}
      {deployPhase === "idle" && (
        user ? (
          <button
            onClick={handleDeploy}
            onMouseDown={() => setBtnPressed(true)}
            onMouseUp={() => setBtnPressed(false)}
            onMouseLeave={() => setBtnPressed(false)}
            className="gen-btn"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "8px", width: "100%", padding: "14px 20px",
              background: s.deployBg,
              border: `1px solid ${s.deployBorder}`,
              borderRadius: "12px", color: "#fff",
              fontSize: "14px", fontWeight: "600", cursor: "pointer",
              letterSpacing: "0.02em",
              boxShadow: s.deployShad,
              transform: btnPressed ? "scale(0.98)" : "scale(1)",
              transition: "transform 0.12s ease, box-shadow 0.2s, background 0.4s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Deploy Website
          </button>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
            padding: "18px 20px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            animation: "buildFadeIn 0.3s ease",
          }}>
            <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
              🔒 Sign in to deploy your website
            </div>
            <button
              onClick={onSignIn}
              style={{
                padding: "9px 22px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: "10px", color: "#fff",
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
              }}
            >
              Sign In to Deploy
            </button>
          </div>
        )
      )}

      {/* Deploy error */}
      {deployError && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          padding: "14px 16px",
          background: "rgba(248,113,113,0.07)",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "12px",
          fontSize: "13px", color: "#fca5a5", lineHeight: "1.6",
          animation: "fadeSlideUp 0.3s ease",
        }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
          <span>{deployError}</span>
        </div>
      )}

      {/* Success card */}
      {deployPhase === "success" && (
        <div style={{
          display: "flex", flexDirection: "column", gap: "0",
          borderRadius: "20px", overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.25)",
          animation: "scaleIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), successGlow 3s ease-in-out 1s infinite",
          boxShadow: "0 0 40px rgba(34,197,94,0.07), 0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {/* Header */}
          <div style={{
            padding: "22px 22px 18px",
            background: "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.07) 100%)",
            borderBottom: "1px solid rgba(34,197,94,0.15)",
            display: "flex", alignItems: "center", gap: "14px",
          }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "14px", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))",
              border: "1px solid rgba(34,197,94,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px",
            }}>🎉</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#4ade80", letterSpacing: "-0.01em" }}>
                Your business is live
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px", lineHeight: "1.5" }}>
                Your website is ready. Share it and start getting customers.
              </div>
            </div>
            <div style={{
              flexShrink: 0, fontSize: "10px", fontWeight: "700",
              color: "#22c55e", letterSpacing: "0.1em",
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
              padding: "3px 9px", borderRadius: "20px",
              animation: "pulse 2.5s ease-in-out infinite",
            }}>LIVE</div>
          </div>

          {/* URL row */}
          <div style={{
            padding: "14px 22px",
            background: "rgba(0,0,0,0.35)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
              background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.7)",
              animation: "pulse 2s infinite",
            }} />
            <span style={{
              fontSize: "12px", color: "#86efac", flex: 1,
              fontFamily: "monospace", letterSpacing: "0.01em", lineHeight: "1.5",
              wordBreak: "break-all",
            }}>{deployedUrl}</span>
          </div>

          {/* Action buttons */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            padding: "14px 16px", gap: "10px",
            background: "rgba(255,255,255,0.015)",
          }}>
            <a
              href={deployedUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "11px 14px",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "#fff", borderRadius: "10px",
                fontSize: "13px", fontWeight: "600", textDecoration: "none",
                boxShadow: "0 4px 16px rgba(79,70,229,0.35)",
                transition: "transform 0.15s, box-shadow 0.2s",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open Website
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(deployedUrl).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "11px 14px",
                background: linkCopied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                color: linkCopied ? "#4ade80" : "#9ca3af",
                border: linkCopied ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {linkCopied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>

          {/* Re-engagement + gamification */}
          <div style={{
            padding: "12px 16px 16px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", flexDirection: "column", gap: "8px",
            background: "rgba(255,255,255,0.01)",
          }}>
            {user && (
              <button
                onClick={handleDeploy}
                style={{
                  width: "100%", padding: "9px",
                  background: "none", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px", color: "#4b5563",
                  fontSize: "12px", fontWeight: "500", cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseOver={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                onMouseOut={e => { e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                ↺ Redeploy
              </button>
            )}
            {onGenerateAnother && (
              <button
                onClick={onGenerateAnother}
                style={{
                  width: "100%", padding: "10px",
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.18)",
                  borderRadius: "8px", color: "#a78bfa",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(124,58,237,0.14)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.18)"; }}
              >
                ✦ Generate another business
              </button>
            )}
            {dailyCount > 0 && (
              <div style={{ textAlign: "center", fontSize: "11px", color: "#374151", paddingTop: "2px" }}>
                {dailyCount} business{dailyCount !== 1 ? "es" : ""} generated today
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer trust strip */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "20px", padding: "16px", borderRadius: "12px",
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        {[["🔒","Confidential"], ["⚡","AI Generated"], ["🌍","Africa Ready"]].map(([icon, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4b5563" }}>
            <span>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Flyer modal */}
      {showFlyer && <FlyerModal data={data} onClose={() => setShowFlyer(false)} />}

      {/* Logo modal */}
      {showLogo && <LogoModal data={data} onClose={() => setShowLogo(false)} />}

      {/* Social Kit modal */}
      {showSocial && <SocialKitModal data={data} onClose={() => setShowSocial(false)} />}
    </div>
  );
}

// ── Authentication Modal ──────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode]           = useState("signin"); // "signin"|"signup"|"forgot"
  const [step, setStep]           = useState(1);
  const [animKey, setAnimKey]     = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "", email: "", phone: "",
    dob: "", gender: "",
    country: "", state: "", city: "",
    password: "", showPassword: false, rememberMe: false,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Age auto-calc from DOB
  const age = form.dob
    ? Math.floor((Date.now() - new Date(form.dob).getTime()) / (365.25 * 864e5))
    : null;

  // Password strength 0–3
  const pwStrength = (() => {
    const p = form.password;
    if (!p || p.length < 4) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p) || /[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  })();
  const PW_META = [
    { label: "",       color: "#374151" },
    { label: "Weak",   color: "#ef4444" },
    { label: "Medium", color: "#f59e0b" },
    { label: "Strong", color: "#22c55e" },
  ];
  const pwMeta = PW_META[Math.min(pwStrength, 3)];

  // Browser geolocation → reverse-geocode via Nominatim
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
            { headers: { "Accept-Language": "en" } }
          );
          const d = await r.json();
          const a = d.address || {};
          set("country", a.country || "");
          set("state",   a.state   || a.county || "");
          set("city",    a.city    || a.town   || a.village || "");
        } catch { /* silent */ }
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 8000 }
    );
  };

  // Step validation
  const canStep1 = form.firstName.trim().length >= 1 && /\S+@\S+\.\S+/.test(form.email);
  const canStep3 = form.password.length >= 6;
  const canProceed = () => step === 1 ? canStep1 : step === 2 ? true : canStep3;

  const goTo = (n) => { setAnimKey(k => k + 1); setStep(n); setError(""); };

  // ── Auth actions ──────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!form.email || !form.password) { setError("Email and password are required."); return; }
    setLoading(true); setError("");
    const { data, error: e } = await supabase.auth.signInWithPassword({
      email: form.email.trim(), password: form.password,
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    onSuccess(data.user);
  };

  const handleSignUp = async () => {
    setLoading(true); setError("");
    const { data, error: e } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.firstName.trim(),
          phone:   form.phone,
          dob:     form.dob,
          gender:  form.gender,
          country: form.country,
          state:   form.state,
          city:    form.city,
        },
      },
    });
    if (e) { setLoading(false); setError(e.message); return; }

    // Insert profile row (graceful — ignore errors so auth still succeeds)
    if (data.user) {
      const calcAge = form.dob
        ? Math.floor((Date.now() - new Date(form.dob).getTime()) / (365.25 * 864e5))
        : null;
      await supabase.from("profiles").insert([{
        id:      data.user.id,
        name:    form.firstName.trim(),
        age:     calcAge,
        gender:  form.gender  || null,
        country: form.country || null,
        state:   form.state   || null,
        city:    form.city    || null,
        phone:   form.phone   || null,
      }]).select().single(); // errors silently ignored — profile may already exist
    }

    setLoading(false);
    onSuccess(data.user);
  };

  const handleForgot = async () => {
    if (!form.email.trim()) { setError("Enter your email above."); return; }
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.resetPasswordForEmail(form.email.trim());
    setLoading(false);
    if (e) { setError(e.message); return; }
    setForgotSent(true);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inp = {
    width: "100%", padding: "13px 16px", borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s, background 0.2s",
  };
  const lbl = (txt) => (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "#6b7280",
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6,
    }}>{txt}</div>
  );

  // ── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    if (step === 1) return (
      <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "authStepIn 0.35s ease" }}>
        <div>
          {lbl("First Name *")}
          <input style={inp} placeholder="Your first name" value={form.firstName}
            onChange={e => set("firstName", e.target.value)} autoFocus />
        </div>
        <div>
          {lbl("Email Address *")}
          <input style={inp} type="email" placeholder="you@email.com" value={form.email}
            onChange={e => set("email", e.target.value)}
            onKeyDown={e => e.key === "Enter" && canStep1 && goTo(2)} />
        </div>
        <div>
          {lbl("Phone Number")}
          <input style={inp} type="tel" placeholder="+234 xxx xxx xxxx" value={form.phone}
            onChange={e => set("phone", e.target.value)} />
        </div>
      </div>
    );

    if (step === 2) return (
      <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "authStepIn 0.35s ease" }}>
        {/* DOB + age */}
        <div>
          {lbl("Date of Birth")}
          <div style={{ position: "relative" }}>
            <input style={inp} type="date" value={form.dob}
              onChange={e => set("dob", e.target.value)}
              max={new Date().toISOString().split("T")[0]} />
            {age !== null && age >= 0 && age < 120 && (
              <div style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 12, color: "#a78bfa", fontWeight: 700, pointerEvents: "none",
              }}>{age} yrs</div>
            )}
          </div>
        </div>

        {/* Gender chips */}
        <div>
          {lbl("Gender (optional)")}
          <div style={{ display: "flex", gap: 6 }}>
            {["Male", "Female", "Non-binary", "Other"].map(g => (
              <button key={g} type="button"
                onClick={() => set("gender", form.gender === g ? "" : g)}
                style={{
                  flex: 1, padding: "9px 4px", borderRadius: 10, fontFamily: "inherit",
                  border: form.gender === g ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,0.08)",
                  background: form.gender === g ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                  color: form.gender === g ? "#c4b5fd" : "#6b7280",
                  fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}>{g}</button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          {lbl("Location (optional)")}
          <button type="button" onClick={detectLocation} disabled={locLoading}
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 10, fontFamily: "inherit",
              border: "1px dashed rgba(124,58,237,0.35)",
              background: "rgba(124,58,237,0.05)", color: locLoading ? "#6b7280" : "#a78bfa",
              fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "all 0.15s",
            }}>
            {locLoading
              ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(167,139,250,0.3)", borderTop: "2px solid #a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Detecting…</>
              : <>📍 Auto-detect my location</>}
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <input style={inp} placeholder="Country" value={form.country}
              onChange={e => set("country", e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              <input style={inp} placeholder="State / Province" value={form.state}
                onChange={e => set("state", e.target.value)} />
              <input style={inp} placeholder="City" value={form.city}
                onChange={e => set("city", e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    );

    if (step === 3) return (
      <div key={animKey} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "authStepIn 0.35s ease" }}>
        {/* Password */}
        <div>
          {lbl("Password *")}
          <div style={{ position: "relative" }}>
            <input style={inp} type={form.showPassword ? "text" : "password"}
              placeholder="Create a strong password" value={form.password}
              onChange={e => set("password", e.target.value)} autoFocus
              onKeyDown={e => e.key === "Enter" && canStep3 && handleSignUp()} />
            <button type="button" onClick={() => set("showPassword", !form.showPassword)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#6b7280",
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", padding: 4,
              }}>{form.showPassword ? "Hide" : "Show"}</button>
          </div>

          {/* Strength bar */}
          {form.password.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: pwStrength >= i ? pwMeta.color : "rgba(255,255,255,0.07)",
                    transition: "background 0.35s",
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: pwMeta.color, fontWeight: 600 }}>
                {pwMeta.label}{pwStrength < 2 ? " — add uppercase & numbers" : ""}
              </div>
            </div>
          )}
        </div>

        {/* Remember me */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => set("rememberMe", !form.rememberMe)}>
          <div style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            border: form.rememberMe ? "none" : "1px solid rgba(255,255,255,0.15)",
            background: form.rememberMe ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}>
            {form.rememberMe && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13, color: "#9ca3af", userSelect: "none" }}>Remember me on this device</span>
        </div>
      </div>
    );
  };

  // Sign-in form
  const renderSignIn = () => (
    <div key="signin" style={{ display: "flex", flexDirection: "column", gap: 16, animation: "authStepIn 0.35s ease" }}>
      <div>
        {lbl("Email Address")}
        <input style={inp} type="email" placeholder="you@email.com" value={form.email}
          onChange={e => set("email", e.target.value)} autoFocus
          onKeyDown={e => e.key === "Enter" && handleSignIn()} />
      </div>
      <div>
        {lbl("Password")}
        <div style={{ position: "relative" }}>
          <input style={inp} type={form.showPassword ? "text" : "password"}
            placeholder="Your password" value={form.password}
            onChange={e => set("password", e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSignIn()} />
          <button type="button" onClick={() => set("showPassword", !form.showPassword)}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#6b7280",
              cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", padding: 4,
            }}>{form.showPassword ? "Hide" : "Show"}</button>
        </div>
        <button type="button"
          onClick={() => { setMode("forgot"); setError(""); }}
          style={{
            background: "none", border: "none", color: "#7c3aed",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", padding: "6px 0 0",
            display: "block", marginLeft: "auto",
          }}>Forgot password?</button>
      </div>
    </div>
  );

  // Forgot-password form
  const renderForgot = () => (
    <div key="forgot" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "authStepIn 0.35s ease" }}>
      {forgotSent ? (
        <div style={{
          padding: "22px 18px", borderRadius: 14, textAlign: "center",
          background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: 30 }}>📧</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#4ade80" }}>Reset link sent!</div>
          <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
            Check your inbox at <span style={{ color: "#9ca3af", fontWeight: 600 }}>{form.email}</span>
          </div>
        </div>
      ) : (
        <div>
          {lbl("Your Email Address")}
          <input style={inp} type="email" placeholder="you@email.com" value={form.email}
            onChange={e => set("email", e.target.value)} autoFocus />
          <div style={{ marginTop: 8, fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>
            We'll send a secure link to reset your password.
          </div>
        </div>
      )}
    </div>
  );

  // Titles per mode/step
  const TITLES = {
    signin:  { main: "Welcome back 👋",        sub: "Sign in to your BGA account" },
    forgot:  { main: "Reset Password",          sub: "We'll get you back in quickly" },
    signup1: { main: "Let's get started",       sub: "Create your free BGA account" },
    signup2: { main: "Tell us about you",       sub: "Personalise your experience (all optional)" },
    signup3: { main: "Secure your account",     sub: "Create a strong password to protect your businesses" },
  };
  const titleKey = mode === "signup" ? `signup${step}` : mode;
  const { main: titleText, sub: subText } = TITLES[titleKey] || TITLES.signin;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.78)", backdropFilter: "blur(22px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeSlideUp 0.3s ease",
      }}
    >
      <style>{`
        @keyframes authStepIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        background: "linear-gradient(155deg, #0d0d1a 0%, #111120 100%)",
        border: "1px solid rgba(124,58,237,0.2)",
        borderRadius: 24, width: "100%", maxWidth: 440,
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.08)",
        overflow: "hidden", position: "relative",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: -80, right: -60, width: 220, height: 220,
          borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        }} />

        {/* ── Header ── */}
        <div style={{ padding: "26px 26px 20px", position: "relative" }}>
          {/* Close */}
          <button type="button" onClick={onClose} style={{
            position: "absolute", top: 18, right: 18,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, width: 30, height: 30, cursor: "pointer",
            color: "#6b7280", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1,
          }}>×</button>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#fff",
            }}>B</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.04em" }}>BGA</span>
          </div>

          {/* Step progress — signup only */}
          {mode === "signup" && (
            <div style={{ marginBottom: 20 }}>
              {/* Progress bar */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Step {step} of 3</span>
                <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>{Math.round((step / 3) * 100)}%</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                  width: `${(step / 3) * 100}%`,
                  transition: "width 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 0 8px rgba(167,139,250,0.5)",
                }} />
              </div>
              {/* Step bubbles */}
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { n: 1, label: "You" },
                  { n: 2, label: "Details" },
                  { n: 3, label: "Password" },
                ].map(({ n, label: lbl2 }) => (
                  <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: step > n
                        ? "linear-gradient(135deg, #22c55e, #16a34a)"
                        : step === n
                        ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                        : "rgba(255,255,255,0.05)",
                      border: step > n || step === n ? "none" : "1px solid rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "#fff",
                      transition: "all 0.35s",
                    }}>
                      {step > n
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        : n}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: step === n ? "#a78bfa" : "#374151" }}>{lbl2}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 4 }}>{titleText}</div>
          <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55 }}>{subText}</div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "0 26px 22px" }}>
          {/* Error banner */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 14,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5", fontSize: 13, animation: "authStepIn 0.25s ease",
            }}>{error}</div>
          )}

          {/* Content */}
          {mode === "signup"  && renderStep()}
          {mode === "signin"  && renderSignIn()}
          {mode === "forgot"  && renderForgot()}

          {/* ── Actions ── */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 9 }}>

            {/* Signup: Continue (steps 1-2) */}
            {mode === "signup" && step < 3 && (
              <button type="button"
                onClick={() => canProceed() && goTo(step + 1)}
                style={{
                  width: "100%", padding: "14px", borderRadius: 13, border: "none", fontFamily: "inherit",
                  background: (step === 1 && !canStep1)
                    ? "rgba(91,33,182,0.25)"
                    : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: (step === 1 && !canStep1) ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
                  transition: "all 0.2s",
                }}>
                Continue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            )}

            {/* Signup: Create account (step 3) */}
            {mode === "signup" && step === 3 && (
              <button type="button" onClick={handleSignUp}
                disabled={!canStep3 || loading}
                style={{
                  width: "100%", padding: "14px", borderRadius: 13, border: "none", fontFamily: "inherit",
                  background: (!canStep3 || loading)
                    ? "rgba(5,150,105,0.2)"
                    : "linear-gradient(135deg, #059669, #10b981)",
                  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: (!canStep3 || loading) ? "none" : "0 4px 20px rgba(5,150,105,0.4)",
                  transition: "all 0.2s",
                }}>
                {loading
                  ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Creating account…</>
                  : "🚀 Create My Account"}
              </button>
            )}

            {/* Signup: Back */}
            {mode === "signup" && step > 1 && (
              <button type="button" onClick={() => goTo(step - 1)}
                style={{
                  width: "100%", padding: "11px", borderRadius: 11, fontFamily: "inherit",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
                  color: "#6b7280", fontWeight: 500, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                }}>← Back</button>
            )}

            {/* Sign in */}
            {mode === "signin" && (
              <button type="button" onClick={handleSignIn} disabled={loading}
                style={{
                  width: "100%", padding: "14px", borderRadius: 13, border: "none", fontFamily: "inherit",
                  background: loading ? "rgba(91,33,182,0.25)" : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
                  transition: "all 0.2s",
                }}>
                {loading
                  ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Signing in…</>
                  : "Sign In →"}
              </button>
            )}

            {/* Forgot: send reset */}
            {mode === "forgot" && !forgotSent && (
              <button type="button" onClick={handleForgot} disabled={loading}
                style={{
                  width: "100%", padding: "14px", borderRadius: 13, border: "none", fontFamily: "inherit",
                  background: loading ? "rgba(91,33,182,0.25)" : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
                  transition: "all 0.2s",
                }}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 26px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {mode === "signin" && (
            <>
              <span style={{ fontSize: 13, color: "#4b5563" }}>No account?</span>
              <button type="button" onClick={() => { setMode("signup"); setStep(1); setError(""); }}
                style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Create one →</button>
            </>
          )}
          {mode === "signup" && (
            <>
              <span style={{ fontSize: 13, color: "#4b5563" }}>Already have an account?</span>
              <button type="button" onClick={() => { setMode("signin"); setError(""); }}
                style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Sign in →</button>
            </>
          )}
          {mode === "forgot" && (
            <button type="button" onClick={() => { setMode("signin"); setForgotSent(false); setError(""); }}
              style={{ background: "none", border: "none", color: "#6b7280", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              ← Back to Sign In</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Full-screen onboarding ────────────────────────────────────────────────────
function OnboardingScreen({ profile, user, onLaunch, onPreview, onSignIn }) {
  const [selected, setSelected]   = useState(null);   // category label
  const [idea, setIdea]           = useState("");
  const [custom, setCustom]       = useState(false);
  const [launching, setLaunching] = useState(false);

  const pickCategory = (cat) => {
    setSelected(cat.label);
    setIdea(cat.prompt);
    setCustom(false);
  };

  const handleLaunch = () => {
    if (!idea.trim()) return;
    setLaunching(true);
    onLaunch(idea);
  };

  const handlePreview = () => {
    if (!idea.trim()) return;
    onPreview(idea);
  };

  const greeting = profile?.name
    ? `Welcome back, ${profile.name} 👋`
    : "What business do you want to build?";

  const subtext = selected
    ? `Great choice. Tap Launch — we'll build everything in seconds.`
    : profile?.city
    ? `Tap a category below — we'll tailor it for ${profile.city}.`
    : "One tap. AI builds your brand, website & marketing instantly.";

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#06060e", color: "#e2e8f0",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
    }}>
      {/* Ambient orbs */}
      <div style={{ position: "absolute", top: -120, left: -80, width: 500, height: 500, borderRadius: "50%", filter: "blur(90px)", background: "radial-gradient(circle, rgba(109,40,217,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, right: -60, width: 420, height: 420, borderRadius: "50%", filter: "blur(80px)", background: "radial-gradient(circle, rgba(79,70,229,0.16) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div style={{
        height: 56, padding: "0 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backgroundColor: "rgba(6,6,14,0.8)", backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", boxShadow: "0 2px 12px rgba(124,58,237,0.5)" }}>B</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.02em" }}>BGA</span>
          <span style={{ fontSize: 12, color: "#374151", marginLeft: 4 }}>Business Generator Africa</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user ? (
            <>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
                {(profile?.name || user.email || "?")[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>{profile?.name || user.email?.split("@")[0]}</span>
              <a href="/dashboard" style={{ fontSize: 11, color: "#6b7280", textDecoration: "none", padding: "3px 10px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20 }}>Dashboard</a>
            </>
          ) : (
            <button onClick={onSignIn} style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px 40px", gap: 0, position: "relative", zIndex: 1 }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 8, animation: "fadeSlideUp 0.4s ease" }}>
          <div style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 10 }}>
            {greeting}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, maxWidth: 440 }}>
            {subtext}
          </div>
        </div>

        {/* Category grid */}
        {!selected && !custom && (
          <div style={{ width: "100%", maxWidth: 520, marginTop: 28, animation: "fadeSlideUp 0.45s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {QUICK_START_CATEGORIES.map(cat => (
                <button key={cat.label} type="button" onClick={() => pickCategory(cat)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "15px 16px", borderRadius: 14, fontFamily: "inherit",
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.03)",
                    color: "#d1d5db", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = "rgba(124,58,237,0.12)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"; e.currentTarget.style.color = "#c4b5fd"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#d1d5db"; }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { setCustom(true); setSelected("custom"); setIdea(""); }}
              style={{
                width: "100%", marginTop: 10, padding: "13px 16px", borderRadius: 12, fontFamily: "inherit",
                border: "1px dashed rgba(255,255,255,0.1)", background: "transparent",
                color: "#4b5563", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)"; e.currentTarget.style.color = "#9ca3af"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#4b5563"; }}
            >
              ✏️ Something else — describe your own idea
            </button>
          </div>
        )}

        {/* Selected category + editable prompt */}
        {(selected || custom) && (
          <div style={{ width: "100%", maxWidth: 520, marginTop: 24, display: "flex", flexDirection: "column", gap: 12, animation: "fadeSlideUp 0.3s ease" }}>
            {/* Back pill */}
            <button type="button" onClick={() => { setSelected(null); setCustom(false); setIdea(""); }}
              style={{
                alignSelf: "flex-start", background: "none", border: "none",
                color: "#6b7280", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 5, padding: 0,
              }}>
              ← Back
            </button>

            {/* Selected badge */}
            {selected && selected !== "custom" && (() => {
              const cat = QUICK_START_CATEGORIES.find(c => c.label === selected);
              return cat ? (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
                  borderRadius: 20, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
                  fontSize: 13, fontWeight: 600, color: "#c4b5fd", alignSelf: "flex-start",
                }}>
                  <span>{cat.emoji}</span><span>{cat.label}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              ) : null;
            })()}

            {/* Editable textarea */}
            <textarea
              autoFocus
              rows={4}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 14, boxSizing: "border-box",
                border: "1px solid rgba(124,58,237,0.3)", background: "rgba(255,255,255,0.03)",
                color: "#e2e8f0", fontSize: 14, lineHeight: 1.65, resize: "none",
                outline: "none", fontFamily: "inherit",
                boxShadow: "0 0 0 4px rgba(124,58,237,0.07)",
              }}
              placeholder={custom ? "Describe your business idea, product, or target market…" : "Edit your idea or just launch it as-is…"}
              value={idea}
              onChange={e => setIdea(e.target.value)}
            />
            <div style={{ fontSize: 11, color: "#374151" }}>
              {custom ? "Describe clearly for best results" : "Looks good? Just hit Launch →"}
            </div>
          </div>
        )}

        {/* ── BIG LAUNCH BUTTON ── */}
        {(selected || custom || idea.trim()) && (
          <div style={{ width: "100%", maxWidth: 520, marginTop: 16, display: "flex", flexDirection: "column", gap: 10, animation: "fadeSlideUp 0.35s ease" }}>
            <button
              type="button"
              onClick={user ? handleLaunch : onSignIn}
              disabled={launching || !idea.trim()}
              style={{
                width: "100%", padding: "18px 24px", borderRadius: 16, border: "none", fontFamily: "inherit",
                background: launching
                  ? "rgba(5,150,105,0.2)"
                  : !idea.trim()
                  ? "rgba(124,58,237,0.12)"
                  : user
                  ? "linear-gradient(135deg, #059669 0%, #7c3aed 100%)"
                  : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: !idea.trim() ? "#4b5563" : "#fff",
                fontSize: 17, fontWeight: 900, letterSpacing: "0.01em",
                cursor: launching || !idea.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: !idea.trim() || launching ? "none" : "0 8px 32px rgba(5,150,105,0.4), 0 2px 16px rgba(124,58,237,0.3)",
                transition: "all 0.2s",
                opacity: !idea.trim() ? 0.4 : 1,
              }}
            >
              {launching
                ? <><div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.25)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Launching everything…</>
                : !user
                ? <>🔒 Sign In &amp; Launch My Business</>
                : <>🚀 Launch My Business</>}
            </button>

            {/* Quiet secondary */}
            {user && !launching && idea.trim() && (
              <button type="button" onClick={handlePreview}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12, fontFamily: "inherit",
                  border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                  color: "#6b7280", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)"; e.currentTarget.style.color = "#a78bfa"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#6b7280"; }}
              >
                ⚡ Preview only (no deploy)
              </button>
            )}
          </div>
        )}

        {/* Trust strip */}
        <div style={{ display: "flex", gap: 20, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
          {[["⚡","Instant results"], ["🌍","Africa-focused AI"], ["🔒","Private & secure"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
              <span style={{ fontSize: 14 }}>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {

  // Auth + UI state
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [authModal, setAuthModal] = useState(false);

  const [idea, setIdea] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // History + deploy state
  const [history, setHistory]       = useState([]);
  const [activeId, setActiveId]     = useState(null);
  const [deploying, setDeploying]   = useState(false);
  const [deployedUrl, setDeployedUrl] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Loading steps + style
  const [loadStep, setLoadStep]         = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const stepTimerRef                    = useRef(null);
  const [styleConfig, setStyleConfig]   = useState({});

  // Launch experience state
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchStep, setLaunchStep]       = useState(0);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [launchResult, setLaunchResult]   = useState(null);
  const [launchError, setLaunchError]     = useState(null);

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ── Profile helpers ───────────────────────────────────────────────────────
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("id", userId).single();
      if (!error && data) setProfile(data);
    } catch { /* table may not exist yet — fail silently */ }
  };

  // Update business memory helper
  const updateBusinessMemory = async (businessId, update) => {
    if (!businessId) return;
    const { data, error } = await supabase.from("businesses").select("memory").eq("id", businessId).single();
    let mem = {
      improvements: [],
      performance: { clicks: 0, visits: 0, conversion: 0 },
      preferences: { style: "premium", tone: "friendly" },
      history: []
    };
    if (!error && data && data.memory) mem = { ...mem, ...data.memory };
    // Merge update
    if (update.improvements) mem.improvements = [...(mem.improvements || []), ...update.improvements];
    if (update.performance) mem.performance = { ...mem.performance, ...update.performance };
    if (update.preferences) mem.preferences = { ...mem.preferences, ...update.preferences };
    if (update.history) mem.history = [...(update.history || []), ...(mem.history || [])];
    await supabase.from("businesses").update({ memory: mem }).eq("id", businessId);
  };

  const fetchBusinesses = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("businesses").select("*").eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) setHistory(data);
    } catch { /* silently ignore */ }
  };

  // Premium feature gating helper
  const requirePro = () => {
    if (profile && profile.plan !== "pro") {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  // Auth: restore session on mount, listen for changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user || null;
      setUser(u);
      if (u) { fetchProfile(u.id); fetchBusinesses(u.id); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) { fetchProfile(u.id); fetchBusinesses(u.id); }
      else   { setProfile(null); setHistory([]); }
    });
    return () => { listener?.subscription?.unsubscribe?.(); };
  }, []);
  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("bga_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  // Save to localStorage after new result and update memory
  useEffect(() => {
    if (result && result.selected_name) {
      const newItem = {
        id: result.businessId || Date.now(),
        name: result.selected_name,
        tagline: result.tagline || "",
        data: result,
      };
      setHistory(prev => {
        const updated = [newItem, ...prev];
        localStorage.setItem("bga_history", JSON.stringify(updated));
        return updated;
      });
      setActiveId(newItem.id);
      // Add to memory history
      updateBusinessMemory(result.businessId, {
        history: [{ action: "generate", result, timestamp: Date.now() }]
      });
    }
    // eslint-disable-next-line
  }, [result]);
  const handleHistoryClick = (item) => {
    setResult(item.data);
    setActiveId(item.id);
    // Optionally track click in memory
    if (item.data && item.data.businessId) {
      updateBusinessMemory(item.data.businessId, {
        performance: { clicks: 1 }
      });
    }
  };

  const handleDelete = (id) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem("bga_history", JSON.stringify(updated));
      if (activeId === id) setActiveId(null);
      return updated;
    });
    if (activeId === id) setResult(null);
    // Optionally track delete in memory
    // updateBusinessMemory(id, { history: [{ action: "delete", timestamp: Date.now() }] });
  };

  const handleClearAll = () => {
    setHistory([]);
    localStorage.removeItem("bga_history");
    setActiveId(null);
    setResult(null);
  };

  useEffect(() => {
    if (loading) {
      setLoadStep(0);
      setShowSkeleton(false);
      let step = 0;
      stepTimerRef.current = setInterval(() => {
        step += 1;
        if (step < LOADING_STEPS.length) {
          setLoadStep(step);
        } else {
          clearInterval(stepTimerRef.current);
          setShowSkeleton(true);
        }
      }, 900);
    } else {
      clearInterval(stepTimerRef.current);
      setShowSkeleton(false);
    }
    return () => clearInterval(stepTimerRef.current);
  }, [loading]);

  const generateBusiness = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const locationParts = [profile?.city, profile?.state, profile?.country].filter(Boolean);
      const enrichedIdea = locationParts.length
        ? `${idea.trim()} [Target market: ${locationParts.join(", ")}]`
        : idea.trim();
      const res = await axios.post("/api/generate", { idea: enrichedIdea, user_id: user?.id, businessId: result?.businessId });
      setResult(res.data);
    } catch (err) {
      console.error("ERROR:", err);
      alert("Generation failed. Please try again.");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generateBusiness();
  };

  // ── Idea-parameterised launch (avoids setState race from onboarding) ─────────
  const handleOneLaunchWithIdea = async (chosenIdea) => {
    if (!chosenIdea?.trim()) return;
    setIdea(chosenIdea);
    setLaunchLoading(true);
    setLaunchStep(1);
    setLaunchProgress(2);
    setLaunchResult(null);
    setLaunchError(null);
    sound.init(); haptic.start();
    try {
      const locationParts = [profile?.city, profile?.state, profile?.country].filter(Boolean);
      const enriched = locationParts.length ? `${chosenIdea.trim()} [Target market: ${locationParts.join(', ')}]` : chosenIdea.trim();
      const genRes = await axios.post('/api/generate', { idea: enriched, user_id: user?.id });
      const data = genRes.data;
      setResult(data);
      setLaunchProgress(18);
      setLaunchStep(2); sound.tick(); haptic.step();
      await new Promise(r => setTimeout(r, 1400));
      setLaunchProgress(36);
      setLaunchStep(3); sound.tick(); haptic.step();
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 1100));
      setLaunchProgress(54);
      setLaunchStep(4); sound.tick(); haptic.step();
      await new Promise(r => setTimeout(r, 1100));
      setLaunchProgress(70);
      setLaunchStep(5); sound.tick(); haptic.step();
      await new Promise(r => setTimeout(r, 900));
      setLaunchProgress(84);
      setLaunchStep(6); sound.tick(); haptic.step();
      const deployRes = await axios.post('/api/deploy', { businessId: data.businessId });
      const deployedUrl = deployRes.data.url;
      setLaunchProgress(100);
      sound.success(); haptic.success();
      _incDailyCount();
      await new Promise(r => setTimeout(r, 700));
      setLaunchResult({ data, deployedUrl });
    } catch (err) {
      setLaunchError(err.response?.data?.error || err.message || 'Something went wrong.');
    }
    setLaunchLoading(false);
  };

  const generateBusinessWithIdea = async (chosenIdea) => {
    if (!chosenIdea?.trim()) return;
    setIdea(chosenIdea);
    setLoading(true);
    setResult(null);
    try {
      const locationParts = [profile?.city, profile?.state, profile?.country].filter(Boolean);
      const enriched = locationParts.length ? `${chosenIdea.trim()} [Target market: ${locationParts.join(', ')}]` : chosenIdea.trim();
      const res = await axios.post('/api/generate', { idea: enriched, user_id: user?.id });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Generation failed. Please try again.');
    }
    setLoading(false);
  };


  // Auth handlers
  const handleSignIn = () => setAuthModal(true);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setHistory([]);
    setActiveId(null);
    setResult(null);
  };

  // ── Full-screen onboarding OR split-panel app ─────────────────────────────
  // Show onboarding when there is no result yet (before first generation)
  if (!result && !loading && !launchLoading) {
    return (
      <>
        <style>{keyframes}</style>
        {authModal && (
          <AuthModal
            onClose={() => setAuthModal(false)}
            onSuccess={async (u) => {
              setUser(u);
              setAuthModal(false);
              if (u) await fetchProfile(u.id);
            }}
          />
        )}
        {showUpgradeModal && (
          <UpgradeModal user={user} onClose={() => setShowUpgradeModal(false)} onUpgraded={() => fetchProfile(user.id)} />
        )}
        <OnboardingScreen
          profile={profile}
          user={user}
          onLaunch={(chosenIdea) => {
            setIdea(chosenIdea);
            // Kick off the full launch sequence
            setTimeout(() => {
              handleOneLaunchWithIdea(chosenIdea);
            }, 0);
          }}
          onPreview={(chosenIdea) => {
            setIdea(chosenIdea);
            setTimeout(() => {
              generateBusinessWithIdea(chosenIdea);
            }, 0);
          }}
          onSignIn={handleSignIn}
        />
        {/* Launch experience overlay on top of onboarding */}
        {(launchLoading || launchError) && !launchResult && (
          <LaunchExperience
            step={launchStep}
            progress={launchProgress}
            error={launchError}
            onRetry={() => idea && handleOneLaunchWithIdea(idea)}
            onDismiss={() => { setLaunchError(null); setLaunchLoading(false); }}
          />
        )}
        {launchResult && (
          <LaunchSuccessScreen
            data={launchResult.data}
            deployedUrl={launchResult.deployedUrl}
            onClose={() => setLaunchResult(null)}
            onLaunchAnother={() => { setLaunchResult(null); setResult(null); setActiveId(null); setIdea(""); setSelectedCategory(null); }}
          />
        )}
      </>
    );
  }

  // ── Main split-panel app (shown after generation) ─────────────────────────
  return (
    <>
      <style>{keyframes}</style>
      {authModal && (
        <AuthModal
          onClose={() => setAuthModal(false)}
          onSuccess={async (u) => {
            setUser(u);
            setAuthModal(false);
            if (u) await fetchProfile(u.id);
          }}
        />
      )}
      {showUpgradeModal && (
        <UpgradeModal user={user} onClose={() => setShowUpgradeModal(false)} onUpgraded={() => fetchProfile(user.id)} />
      )}
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#06060e",
        color: "#e2e8f0",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background orbs */}
        <Orb style={{ width: 500, height: 500, top: -200, left: -150, background: "radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%)", animationDelay: "0s" }} />
        <Orb style={{ width: 400, height: 400, bottom: -100, right: -100, background: "radial-gradient(circle, rgba(79,70,229,0.14) 0%, transparent 70%)", animationDelay: "-4s" }} />

        {/* Top Bar */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 32px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(10,10,20,0.7)",
          position: "relative",
          zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: "800", color: "#fff",
              boxShadow: "0 2px 12px rgba(124,58,237,0.5)",
            }}>B</div>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#f1f5f9", letterSpacing: "0.02em" }}>BGA</span>
          </div>
          <div style={{ width: "1px", height: "20px", backgroundColor: "rgba(255,255,255,0.08)", margin: "0 8px" }} />
          <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "400" }}>Business Generator Africa</span>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "11px", color: "#6b7280" }}>AI Online</span>
            </div>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#fff",
                    boxShadow: "0 0 0 2px rgba(124,58,237,0.3)",
                  }}>
                    {(profile?.name || user.email || "?")[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#c4b5fd", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profile?.name ? `Hey, ${profile.name}` : user.email?.split("@")[0]}
                  </span>
                </div>
                <a href="/dashboard" style={{
                  fontSize: "11px", fontWeight: "600", color: "#a78bfa",
                  background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                  padding: "3px 12px", borderRadius: "20px", textDecoration: "none",
                }}>Dashboard</a>
                <button onClick={handleSignOut} style={{
                  fontSize: "11px", fontWeight: "500", color: "#6b7280",
                  background: "none", border: "1px solid rgba(255,255,255,0.08)",
                  padding: "3px 10px", borderRadius: "20px", cursor: "pointer",
                }}
                  onMouseOver={e => { e.currentTarget.style.color = "#9ca3af"; }}
                  onMouseOut={e => { e.currentTarget.style.color = "#6b7280"; }}
                >Sign Out</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: "20px" }}>Guest Mode</div>
                <button onClick={handleSignIn} style={{
                  fontSize: "11px", fontWeight: "600", color: "#a78bfa",
                  background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                  padding: "3px 12px", borderRadius: "20px", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                  onMouseOver={e => e.currentTarget.style.background = "rgba(124,58,237,0.2)"}
                  onMouseOut={e => e.currentTarget.style.background = "rgba(124,58,237,0.1)"}
                >Sign In</button>
              </div>
            )}
          </div>
        </div>

        {/* Body — split panel */}
        <div style={{
          flex: 1, display: "grid", gridTemplateColumns: "380px 1fr",
          overflow: "hidden", height: "calc(100vh - 60px)", position: "relative", zIndex: 1,
        }}>
          {/* LEFT PANEL */}
          <div style={{
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column",
            padding: "28px 24px", gap: "18px", overflowY: "auto",
            backdropFilter: "blur(20px)", backgroundColor: "rgba(10,10,20,0.5)",
          }}>
            {/* Greeting */}
            <div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#f1f5f9", lineHeight: "1.3", letterSpacing: "-0.01em", marginBottom: 4 }}>
                {profile?.name
                  ? <>{profile.name}'s business <span style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>is live</span> 🎉</>
                  : <>Your business <span style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>is ready</span></>
                }
              </div>
              <div style={{ fontSize: "12px", color: "#4b5563" }}>
                👉 Next step: Share your business to get your first customers
              </div>
            </div>

            <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />

            {/* Launch another */}
            <button type="button"
              onClick={() => { setResult(null); setActiveId(null); setIdea(""); setSelectedCategory(null); }}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12, fontFamily: "inherit",
                background: "linear-gradient(135deg, #059669 0%, #7c3aed 100%)",
                color: "#fff", border: "none",
                fontSize: "14px", fontWeight: "700", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(5,150,105,0.3)",
              }}
            >
              🚀 Launch Another Business
            </button>

            {/* Style editor */}
            {result && (
              <PromptEditor
                styleConfig={styleConfig}
                onUpdate={setStyleConfig}
                locked={!user}
                onSignIn={handleSignIn}
              />
            )}

            {/* History */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase" }}>Saved Businesses</span>
                  {history.length > 0 && (
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#a78bfa", backgroundColor: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", padding: "1px 7px", borderRadius: "20px" }}>{history.length}</span>
                  )}
                </div>
                {history.length > 0 && (
                  <button onClick={handleClearAll} style={{ fontSize: "11px", fontWeight: "500", color: "#4b5563", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
                    onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseOut={e => (e.currentTarget.style.color = "#4b5563")}
                  >Clear all</button>
                )}
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.01)" }}>
                {history.length === 0 ? (
                  <div style={{ padding: "20px 16px", textAlign: "center", fontSize: "12px", color: "#374151", lineHeight: "1.6", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px", opacity: 0.4 }}>🗂️</span>
                    <span>No saved businesses yet.</span>
                  </div>
                ) : (
                  <div style={{ overflowY: "auto", maxHeight: "280px" }}>
                    {history.map((item, index) => {
                      const isActive = activeId === item.id;
                      return (
                        <div key={item.id} onClick={() => handleHistoryClick(item)}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer",
                            borderBottom: index < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            borderLeft: isActive ? "2px solid #7c3aed" : "2px solid transparent",
                            backgroundColor: isActive ? "rgba(124,58,237,0.1)" : "transparent",
                            transition: "background-color 0.2s",
                          }}
                          onMouseOver={e => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                          onMouseOut={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? "#a78bfa" : "rgba(255,255,255,0.1)", boxShadow: isActive ? "0 0 6px rgba(167,139,250,0.7)" : "none" }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: isActive ? "#c4b5fd" : "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{item.name}</span>
                            <span style={{ fontSize: "11px", color: "#4b5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{item.tagline}</span>
                          </div>
                          <div style={{ flexShrink: 0, display: "flex", gap: 6, alignItems: "center" }}>
                            {isActive && <span style={{ fontSize: "10px", color: "#a78bfa", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)", padding: "1px 7px", borderRadius: "12px" }}>Active</span>}
                            <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                              style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: "14px", padding: "0 2px", lineHeight: 1 }}
                              onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
                              onMouseOut={e => (e.currentTarget.style.color = "#374151")}
                            >×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — result */}
          <div style={{ overflowY: "auto", backgroundColor: "rgba(6,6,14,0.3)" }}>
            {/* Loading state */}
            {loading && (
              <div style={{
                height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "28px",
                animation: "fadeSlideUp 0.4s ease",
              }}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#9ca3af" }}>Building your business</div>
                  <div style={{ fontSize: "13px", color: "#4b5563" }}>This takes about 10–15 seconds</div>
                </div>
                {!showSkeleton ? (
                  <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {LOADING_STEPS.slice(0, loadStep + 1).map((step, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px",
                        borderRadius: "12px",
                        background: i === loadStep ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)",
                        border: i === loadStep ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(255,255,255,0.05)",
                        animation: "stepIn 0.35s ease",
                      }}>
                        <span style={{ fontSize: "18px", lineHeight: 1 }}>{step.icon}</span>
                        <span style={{ fontSize: "13px", fontWeight: "500", color: i === loadStep ? "#e2e8f0" : "#4b5563", flex: 1 }}>{step.text}</span>
                        {i < loadStep
                          ? <span style={{ fontSize: "13px", color: "#22c55e" }}>✓</span>
                          : <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid rgba(139,92,246,0.4)", borderTop: "2px solid #a78bfa", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ width: "100%", maxWidth: "560px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <SkeletonBlock height="42px" style={{ borderRadius: "10px" }} />
                    <SkeletonBlock width="60%" height="20px" />
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
                    <SkeletonBlock height="120px" style={{ borderRadius: "14px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      <SkeletonBlock height="90px" style={{ borderRadius: "12px" }} />
                      <SkeletonBlock height="90px" style={{ borderRadius: "12px" }} />
                      <SkeletonBlock height="90px" style={{ borderRadius: "12px" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <WebsitePreview
                data={result}
                onGenerateAnother={() => { setResult(null); setActiveId(null); setIdea(""); setSelectedCategory(null); }}
                user={user}
                styleConfig={styleConfig}
                onSignIn={handleSignIn}
              />
            )}
          </div>
        </div>
      </div>

      {/* Launch experience overlay */}
      {(launchLoading || launchError) && !launchResult && (
        <LaunchExperience
          step={launchStep}
          progress={launchProgress}
          error={launchError}
          onRetry={() => idea && handleOneLaunchWithIdea(idea)}
          onDismiss={() => { setLaunchError(null); setLaunchLoading(false); }}
        />
      )}

      {/* Launch success screen */}
      {launchResult && (
        <LaunchSuccessScreen
          data={launchResult.data}
          deployedUrl={launchResult.deployedUrl}
          onClose={() => setLaunchResult(null)}
          onLaunchAnother={() => { setLaunchResult(null); setResult(null); setActiveId(null); setIdea(""); setSelectedCategory(null); }}
        />
      )}
    </>
  );
}
