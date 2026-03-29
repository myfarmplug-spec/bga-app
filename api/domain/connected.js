// POST /api/domain/connected
// Updates domain_status to 'connected' in Supabase when domain is live
import supabase from '../../supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });
  const { error } = await supabase.from('businesses').update({ domain_status: 'connected' }).eq('custom_domain', domain);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}
