import React from "react";
import { supabase } from "./supabase";

export default function UpgradeModal({ user, onClose, onUpgraded }) {
  const confirmPayment = async () => {
    await supabase.from("profiles").update({ plan: "pro" }).eq("id", user.id);
    alert("Upgrade successful 🚀");
    onUpgraded && onUpgraded();
    onClose();
  };
  return (
    <div className="modal" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, minWidth: 340, maxWidth: 400, boxShadow: "0 8px 40px #0008", color: "#18182b", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#a78bfa", fontSize: 18, cursor: "pointer" }}>✕</button>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: "#7c3aed" }}>🚀 Unlock Full Power</h2>
        <ul style={{ marginBottom: 18, color: "#059669", fontWeight: 600 }}>
          <li>✔ Connect your domain</li>
          <li>✔ Download premium designs</li>
          <li>✔ Unlimited launches</li>
        </ul>
        <h3 style={{ color: "#18182b", marginBottom: 6 }}>Bank Transfer</h3>
        <p style={{ marginBottom: 18 }}>
          Bank: Opay / Moniepoint<br/>
          Account Name: BGA<br/>
          Account Number: XXXXXXXX
        </p>
        <button onClick={() => window.open("https://wa.me/234XXXXXXXXXX?text=I want to upgrade to BGA Pro")}
          style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, marginBottom: 12, width: "100%", fontSize: 15, cursor: "pointer" }}>
          Upgrade via WhatsApp
        </button>
        <button onClick={confirmPayment}
          style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, marginBottom: 12, width: "100%", fontSize: 15, cursor: "pointer" }}>
          I’ve Paid ✅
        </button>
      </div>
    </div>
  );
}
