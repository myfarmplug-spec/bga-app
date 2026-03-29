import React, { useEffect, useState } from "react";

export default function BusinessPage() {
  const [business, setBusiness] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = window.location.pathname.replace(/^\//, "");
    if (!slug) return;
    fetch(`/data/${slug}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        setBusiness(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{padding:40, textAlign:'center'}}>Loading...</div>;
  if (notFound) return <div style={{padding:40, textAlign:'center', color:'#f87171', fontWeight:700}}>Business not found</div>;
  if (!business) return null;

  const { selected_name, tagline, website = {} } = business;
  const hero = website.hero || {};
  const products = website.products || [];
  const contact = website.contact || {};

  return (
    <div style={{maxWidth:700, margin:'40px auto', padding:24, background:'#18181b', borderRadius:16, color:'#e2e8f0'}}>
      <h1 style={{fontSize:32, fontWeight:900, marginBottom:8}}>{selected_name}</h1>
      <div style={{fontSize:18, color:'#a78bfa', marginBottom:24}}>{tagline}</div>
      {hero.headline && <div style={{fontSize:22, fontWeight:700, marginBottom:12}}>{hero.headline}</div>}
      {hero.subtext && <div style={{fontSize:15, color:'#9ca3af', marginBottom:18}}>{hero.subtext}</div>}
      {products.length > 0 && (
        <div style={{marginBottom:24}}>
          <div style={{fontWeight:700, marginBottom:8}}>Products & Services</div>
          <ul style={{paddingLeft:20}}>
            {products.map((p,i) => (
              <li key={i} style={{marginBottom:6}}>
                <span style={{fontWeight:600}}>{p.name}</span> {p.price && <span style={{color:'#a78bfa'}}>- {p.price}</span>}
                {p.description && <div style={{fontSize:13, color:'#9ca3af'}}>{p.description}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(contact.phone || contact.location || contact.email) && (
        <div style={{marginBottom:12}}>
          <div style={{fontWeight:700, marginBottom:6}}>Contact</div>
          <ul style={{paddingLeft:20}}>
            {contact.phone && <li>📞 {contact.phone}</li>}
            {contact.location && <li>📍 {contact.location}</li>}
            {contact.email && <li>✉️ {contact.email}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
