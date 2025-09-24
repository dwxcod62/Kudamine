export function DesignTokens() {
    return (
        <style>{`
/* —— Base tokens (Light) —— */
:root{
  --brand:        #0f6b5f;

  --bg-page:      #f5f6f7;   /* page bg */
  --surface:      #ffffff;   /* card bg */
  --surface-2:    #f1f5f9;   /* muted surface */
  --border:       #e5eaee;

  --text:         #0b1620;   /* primary text */
  --muted:        #8b98a5;   /* secondary text */

  --chip-bg:      #eef4f3;
  --chip-fg:      var(--brand);

  --btn-fg:       #ffffff;
  --btn-bg:       var(--brand);
  --btn-ghost-fg: #0b1620;
  --btn-ghost-bd: #e8ecef;

  --elev:         0 2px 10px rgba(2,8,23,.06);
  --elev-thin:    0 1px 0 rgba(2,8,23,.04);

  --radius:       16px;
}

/* —— Dark tokens (opt-in via .dark on <html>) —— */
.dark{
  --bg-page:      #0b1220;   /* near slate-950 */
  --surface:      #101826;   /* card bg dark */
  --surface-2:    #0f172a;   /* deeper surface */
  --border:       #1f2a3a;

  --text:         #e5e7eb;   /* primary text */
  --muted:        #94a3b8;   /* secondary text */

  --chip-bg:      rgba(15,107,95,.15);
  --chip-fg:      #7bd8c8;

  --btn-fg:       #0b1220;
  --btn-bg:       #7adacc;   /* brighter brand for contrast */
  --btn-ghost-fg: #dbe2ea;
  --btn-ghost-bd: #253248;

  --elev:         0 6px 20px rgba(0,0,0,.35);
  --elev-thin:    0 1px 0 rgba(255,255,255,.04);
}

/* —— Optional: respect system theme on first load —— */
@media (prefers-color-scheme: dark){
  :root:not(.force-light){
    /* only apply if bạn không gán .dark thủ công */
  }
}

/* —— Primitives / utilities (use tokens) —— */
.elev{box-shadow:var(--elev)}
.box{background:var(--surface); border-radius:var(--radius); box-shadow:var(--elev-thin); border:1px solid var(--border)}
.chip{background:var(--chip-bg); color:var(--chip-fg); padding:.25rem .5rem; border-radius:999px; font-weight:600; font-size:.75rem}

.btn{
  background:var(--btn-bg);
  color:var(--btn-fg);
  border-radius:12px;
  padding:.625rem .9rem;
  font-weight:600;
}
.btn-ghost{
  background:transparent;
  border:1px solid var(--btn-ghost-bd);
  border-radius:12px;
  padding:.55rem .85rem;
  color:var(--btn-ghost-fg);
}

.leftnav a{
  display:flex; gap:.5rem; align-items:center;
  padding:.6rem .75rem; border-radius:12px;
  color:var(--text);
}
.leftnav a.active{ background:var(--brand); color:#fff }

.tag{ font-size:.75rem; color:var(--muted) }

.kpi{ display:flex; flex-direction:column; gap:.35rem; color:var(--text) }
.kpi h3{ font-weight:700; font-size:.95rem }
.kpi .val{ font-size:1.7rem; font-weight:800 }

.table{
  width:100%;
  border-collapse:separate;
  border-spacing:0;
}
.table th,.table td{ padding:.9rem .85rem; text-align:left }
.table thead th{ color:var(--muted); font-weight:700; font-size:.8rem; background:var(--surface-2) }
.table tbody tr{ border-top:1px solid var(--border) }

/* —— Page-level bg & text —— */
html, body, #root{ height:100% }
body{
  background:var(--bg-page);
  color:var(--text);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  transition: background .25s ease, color .25s ease;
}
`}</style>
    );
}
