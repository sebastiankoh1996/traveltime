// Optional no-login cloud sync. Fill url and anonKey after creating Supabase.
window.TRAVEL_CLOUD_CONFIG = window.TRAVEL_CLOUD_CONFIG || { url: 'https://dpsczropwxhcizgmakap.supabase.co', anonKey: 'sb_publishable_v56py4yLJ0ee0iCd2xlD9A_jlTOEBjA', bucket: 'travel-time-shared' };
const cloudSync = (() => {
  const cfg = window.TRAVEL_CLOUD_CONFIG, enabled = Boolean(cfg.url && cfg.anonKey);
  const headers = () => ({ apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json' });
  async function save(kind, value) { if (!enabled) return; try { await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/travel_time_state`, { method:'POST', headers:{...headers(),Prefer:'resolution=merge-duplicates,return=minimal'}, body:JSON.stringify({bucket:cfg.bucket,kind,payload:value,updated_at:new Date().toISOString()}) }); window.dispatchEvent(new CustomEvent('travel-cloud-status',{detail:'saved'})); } catch { window.dispatchEvent(new CustomEvent('travel-cloud-status',{detail:'offline'})); } }
  async function load(kind) { if (!enabled) return null; try { const r=await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/travel_time_state?bucket=eq.${encodeURIComponent(cfg.bucket)}&kind=eq.${encodeURIComponent(kind)}&select=payload`,{headers:headers()}); if(!r.ok)return null; const rows=await r.json(); return rows[0]?.payload||null; } catch { return null; } }
  return { enabled, save, load };
})();

