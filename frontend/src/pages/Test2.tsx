type Props = {
    /** Chiều rộng khung cảnh, ví dụ "950px" hoặc "92vw" */
    width?: string;
    /** Màu phát sáng chính của màn hình */
    glow?: string; // ví dụ "#00ff7b"
};

export default function RetroCRT({ width = "92vw", glow = "#00ff7b" }: Props) {
    const css = `
  :root{
    --bg:#0b1412;
    --crt:${glow};
    --crt-dim:#0bbf6a;
    --bezel:#1d332c;
    --bezel-2:#0f221b;
    --bezel-3:#0a1814;
    --btn:#163126;
    --btn-on:${glow};
    --glass:#163d2e;
  }
  .crt-wrap{
    display:grid;
    place-items:center;
    width: ${width};
    max-width: 950px;
    aspect-ratio: 16 / 9;
    filter: drop-shadow(0 40px 60px rgba(0,0,0,.6));
    position:relative;
    margin-inline:auto;
  }
  .crt-bg{
    position:absolute; inset:-20% -20%;
    background:
      radial-gradient(1200px 700px at 50% 80%, #0f1f1b 0%, #0b1412 40%, #07100c 65%, #050c09 100%),
      var(--bg);
    z-index:-2;
    border-radius:24px;
  }
  .crt-dust{
    content:"";
    position:absolute; inset:-20% -20%;
    background:
      radial-gradient(2px 2px at 20% 30%, #2cff9a88 40%, transparent 45%),
      radial-gradient(2px 2px at 60% 70%, #2cff9a66 40%, transparent 45%),
      radial-gradient(1.5px 1.5px at 80% 20%, #2cff9a55 40%, transparent 45%),
      radial-gradient(1.5px 1.5px at 35% 80%, #2cff9a55 40%, transparent 45%),
      radial-gradient(1px 1px at 10% 60%, #2cff9a44 40%, transparent 45%),
      radial-gradient(1px 1px at 90% 40%, #2cff9a33 40%, transparent 45%);
    animation: crt-drift 22s linear infinite;
    pointer-events:none;
    opacity:.4;
    z-index:-1;
  }
  @keyframes crt-drift {
    0%   { transform: translate3d(0,0,0); }
    100% { transform: translate3d(60px, -40px, 0); }
  }

  .crt-monitor{
    position:absolute; inset:7% 12% 22%;
    background: linear-gradient(180deg, #102620, #0a1b16 60%, #071410);
    border-radius:18px;
    box-shadow: inset 0 0 0 2px #0e221c, inset 0 0 0 6px #0a1b16, 0 20px 40px rgba(0,0,0,.65);
    display:grid;
    grid-template-rows: 1fr auto;
    padding:18px;
  }
  .crt-frame{
    border-radius:12px;
    background: linear-gradient(180deg, #163226, #0f241c 60%, #0d221a);
    box-shadow: inset 0 0 0 3px #0a1b16, inset 0 0 30px #07140f;
    padding:12px;
    position:relative;
  }
  .crt-glass{
    position:relative;
    height:100%;
    border-radius:10px;
    background: radial-gradient(120% 100% at 50% 50%, #0c311f 0 40%, #072217 70%, #051a12 100%);
    overflow:hidden;
    box-shadow: inset 0 0 50px #02110b, inset 0 0 120px #03160f;
  }
  .crt-screen{
    position:absolute; inset:6% 6%;
    border-radius:6px;
    background:
      radial-gradient(110% 90% at 50% 30%, var(--crt) 0 15%, #59ffa9 20%, var(--crt-dim) 35%, #0cdf6b 60%, #0db45b 72%, #0b8b4b 85%, #0a6b3e 100%);
    filter: blur(.3px) saturate(115%);
    box-shadow: 0 0 60px 20px color-mix(in oklab, var(--crt) 20%, transparent),
                inset 0 0 18px #ffffff66,
                inset 0 0 120px color-mix(in oklab, var(--crt) 18%, transparent);
  }
  .crt-scan{
    position:absolute; inset:6% 6%;
    border-radius:6px;
    background:
      repeating-linear-gradient( to bottom, rgba(0,0,0,.12) 0 2px, rgba(0,0,0,0) 2px 3px ),
      linear-gradient(180deg, transparent 0 75%, rgba(0,0,0,.25));
    mix-blend-mode:multiply;
    pointer-events:none;
  }
  .crt-glow{
    position:absolute; inset:0; border-radius:inherit;
    box-shadow: 0 0 120px 30px color-mix(in oklab, var(--crt) 18%, transparent);
    pointer-events:none;
  }
  .crt-screen, .crt-scan { animation: crt-flick 4.2s steps(60) infinite; }
  @keyframes crt-flick {
    0%,100% { opacity:1; }
    47% { opacity:.98; }
    50% { opacity:1; }
    53% { opacity:.97; }
  }
  .crt-ui1, .crt-ui2, .crt-ui3{
    position:absolute; left:10%; right:10%;
    background: linear-gradient(180deg, #d6ffe9aa, #b9ffdbaa);
    box-shadow: 0 8px 20px #0b6b3e55, inset 0 0 0 1px #ffffff55;
    border-radius:4px; filter: blur(.15px);
  }
  .crt-ui1{ top:22%; height:10%; }
  .crt-ui2{ top:38%; height:9%;  opacity:.85; }
  .crt-ui3{ top:56%; height:7.5%; opacity:.75; }

  .crt-controls{
    margin-top:12px;
    display:flex; gap:10px; align-items:center; justify-content:center;
    padding:10px;
    background: linear-gradient(180deg, #0d221a, #091812);
    border-radius:8px;
    box-shadow: inset 0 0 0 2px #0a1b16;
  }
  .crt-led{
    width:16px; height:10px; border-radius:2px; background:var(--btn);
    box-shadow: inset 0 -2px 0 #0b2018, inset 0 2px 0 #1b3b2f;
  }
  .crt-led.on{
    background: var(--btn-on);
    box-shadow: 0 0 12px 2px color-mix(in oklab, var(--crt) 70%, transparent), inset 0 0 0 1px #b9ffd9;
  }

  .crt-base{
    position:absolute; left:8%; right:8%; bottom:5%;
    height:12%;
    background: linear-gradient(#0d221a, #081710);
    border-radius:10px;
    box-shadow: inset 0 0 0 2px #0a1b16, 0 20px 40px rgba(0,0,0,.6);
  }
  .crt-keys{
    position:absolute; inset:12% 10%;
    display:grid; grid-template-columns: repeat(18, 1fr);
    gap:6px 6px;
  }
  .crt-key{
    height:18px; border-radius:3px;
    background: linear-gradient(#143322, #0e251b);
    box-shadow: inset 0 -2px 0 #07170f, inset 0 1px 0 #1e3d2f;
  }
  .crt-key:nth-child(odd){ filter:brightness(1.1) }
  .crt-space{ grid-column: span 6; }

  .crt-device{
    position:absolute; right:3%; bottom:7%;
    width:14%; height:15%;
    background: linear-gradient(#132b21, #0d221a);
    border-radius:8px;
    box-shadow: inset 0 0 0 2px #0a1b16;
  }
  .crt-slot{
    position:absolute; left:10%; right:10%; top:38%; height:16%;
    background:#06140e;
    box-shadow: inset 0 0 0 2px #0d221a;
    border-radius:2px;
  }
  `;

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                background: "#0b1412",
            }}
        >
            <style>{css}</style>

            <div className="crt-wrap">
                <div className="crt-bg" />
                <div className="crt-dust" />

                <div className="crt-monitor">
                    <div className="crt-frame">
                        <div className="crt-glass">
                            <div className="crt-screen"></div>
                            <div className="crt-scan"></div>
                            <div className="crt-glow"></div>

                            {/* các thanh UI giả trên màn hình */}
                            <div className="crt-ui1"></div>
                            <div className="crt-ui2"></div>
                            <div className="crt-ui3"></div>
                        </div>
                    </div>

                    <div className="crt-controls">
                        <div className="crt-led on"></div>
                        <div className="crt-led on"></div>
                        <div className="crt-led"></div>
                        <div className="crt-led"></div>
                        <div className="crt-led on"></div>
                    </div>
                </div>

                {/* khối base/keyboard */}
                <div className="crt-base">
                    <div className="crt-keys">
                        {Array.from({ length: 18 }).map((_, i) => (
                            <div key={`k1-${i}`} className="crt-key" />
                        ))}
                        {Array.from({ length: 18 }).map((_, i) => (
                            <div key={`k2-${i}`} className="crt-key" />
                        ))}
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={`k3a-${i}`} className="crt-key" />
                        ))}
                        <div className="crt-key crt-space" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={`k3b-${i}`} className="crt-key" />
                        ))}
                    </div>
                </div>

                {/* thiết bị băng/cassette bên phải */}
                <div className="crt-device">
                    <div className="crt-slot" />
                </div>
            </div>
        </div>
    );
}
