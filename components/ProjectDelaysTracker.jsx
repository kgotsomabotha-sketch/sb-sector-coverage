import { useState } from "react";

export default function ProjectDelaysTracker() {
  const [tracking, setTracking] = useState("solar"); // solar, hydro, gas, infrastructure
  const [alerts, setAlerts] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const Spinner = () => (
    <span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(201,168,76,.2)",borderTop:"2px solid #c9a84c",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
  );

  const Tag = ({ c="#c9a84c", bg="rgba(201,168,76,.1)", children }) => (
    <span style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,letterSpacing:"1.2px",textTransform:"uppercase",padding:"3px 8px",borderRadius:2,color:c,background:bg,border:`1px solid ${c}22`}}>{children}</span>
  );

  const Btn = ({ children, onClick, disabled, v="pri", active=false }) => {
    const base = { fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,letterSpacing:"1px",textTransform:"uppercase",padding:"8px 16px",borderRadius:3,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all .15s",border:"none" };
    const style = active ? {...base,background:"#c9a84c",color:"#090c12"} : v==="pri"?{...base,background:"#c9a84c",color:"#090c12"}:{...base,background:"transparent",border:"1px solid #1e2535",color:"#6b7280"};
    return (
      <button style={style} onClick={onClick} disabled={disabled}>{children}</button>
    );
  };

  const Card = ({ children, style={} }) => (
    <div style={{background:"#111827",border:"1px solid #1e2535",borderRadius:6,padding:"18px 22px",...style}}>{children}</div>
  );

  const SL = ({ children }) => (
    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#6b7280",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>{children}</div>
  );

  const Out = ({ text }) => (
    <div style={{background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"16px 18px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,lineHeight:1.8,color:"#d1d5db",whiteSpace:"pre-wrap",maxHeight:500,overflowY:"auto"}}>{text}</div>
  );

  const SBar = ({ s }) => !s ? null : (
    <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 12px",borderRadius:3,marginBottom:12,background:s.t==="ok"?"rgba(16,185,129,.07)":s.t==="err"?"rgba(239,68,68,.07)":"rgba(59,130,246,.07)",border:`1px solid ${s.t==="ok"?"rgba(16,185,129,.2)":s.t==="err"?"rgba(239,68,68,.2)":"rgba(59,130,browser,.2)"}`,color:s.t==="ok"?"#34d399":s.t==="err"?"#f87171":"#60a5fa"}}>
      {s.t==="load"&&<Spinner/>}{s.t==="ok"?"✓ ":s.t==="err"?"✕ ":""}{s.msg}
    </div>
  );

  async function trackDelays() {
    setLoading(true);
    setAlerts("");
    setStatus({t:"load",msg:`Tracking ${tracking} project delays…`});

    const sectorMap = {
      solar: "South African solar power projects IPP delays construction",
      hydro: "South African hydroelectric projects delays financing",
      gas: "South Africa oil and gas projects delays LNG LPG",
      infrastructure: "South Africa infrastructure projects delays toll roads dams water"
    };

    const sectorLabels = {
      solar: "Solar IPP Projects",
      hydro: "Hydroelectric & Water Projects",
      gas: "Oil & Gas Projects",
      infrastructure: "Infrastructure Projects"
    };

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You are a project finance analyst at Standard Bank CIB. Track project delays and their financing impact.

Search for CURRENT status of SA ${sectorLabels[tracking]} projects. For each project with delays or issues:

FORMAT FOR EACH PROJECT:
━━ PROJECT NAME ━━
Developer: [company]
Status: [On-track | DELAYED | AT RISK | STALLED]
Original Completion: [date]
Revised Completion: [date if delayed]
Delay: [X months]

Financial Impact:
- Estimated cost overrun: [ZAR range]
- Funding gap: [if any]
- Refinancing needs: [yes/no]
- Debt covenant risks: [if any]

Standard Bank Opportunity:
[Type of deal - refinancing/restructuring/additional debt/equity raise]
[Ticket size estimate]
[Who to call]
[Opening pitch]

Include ALL major projects in this category with delays or at-risk status.`,
          messages: [
            {
              role: "user",
              content: `Search for current status of ${sectorLabels[tracking]} in South Africa. Track any delays, construction issues, financing gaps, cost overruns. Show ALL projects with delays or concerns. Include: project name, developer, original vs revised completion date, cost overrun estimates, and financing impact.`,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch project data");

      const text = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      setAlerts(text);
      setStatus({t:"ok",msg:`Project delays tracked — ${sectorLabels[tracking]}`});
    } catch (error) {
      setStatus({t:"err",msg:error.message});
    } finally {
      setLoading(false);
    }
  }

  const sectors = [
    { id: "solar", label: "☀️ Solar IPP", icon: "☀️" },
    { id: "hydro", label: "💧 Hydro & Water", icon: "💧" },
    { id: "gas", label: "⛽ Oil & Gas", icon: "⛽" },
    { id: "infrastructure", label: "🏗️ Infrastructure", icon: "🏗️" },
  ];

  return (
    <div>
      <Card style={{marginBottom:16,borderLeft:"4px solid #ef4444"}}>
        <SL>Project Delays & Risk Tracker</SL>
        <div style={{fontSize:13,color:"#9ca3af",marginBottom:16,lineHeight:1.7}}>
          Track renewable energy, infrastructure, and oil & gas projects for delays, cost overruns, and financing gaps. Delays = deal triggers for refinancing and restructuring.
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {sectors.map(s=>(
            <Btn key={s.id} active={tracking===s.id} onClick={()=>setTracking(s.id)} v="outline" style={{padding:"8px 14px",fontSize:11}}>
              {s.icon} {s.label}
            </Btn>
          ))}
        </div>
        <Btn onClick={trackDelays} disabled={loading} style={{padding:"10px 24px"}}>{loading?"Tracking delays…":"🔍 Track Project Delays"}</Btn>
      </Card>

      <SBar s={status}/>

      {alerts && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <SL>Project Status & Delays — {sectors.find(s=>s.id===tracking)?.label}</SL>
            <Btn v="ghost" onClick={()=>navigator.clipboard?.writeText(alerts)} style={{padding:"4px 11px",fontSize:10}}>Copy</Btn>
          </div>
          <OutputFormatter text={alerts}/>
          <div style={{marginTop:14,padding:"12px 14px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:4,fontSize:12,color:"#fca5a5",fontFamily:"'IBM Plex Mono',monospace"}}>
            💡 Delays = Refinancing opportunities. Reach out to developers and EPC contractors on these projects.
          </div>
        </Card>
      )}

      {!alerts && !loading && (
        <Card style={{textAlign:"center",padding:"40px 20px",color:"#4b5563"}}>
          <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⏳</div>
          <div style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace"}}>Select a sector and track project delays for deal triggers</div>
        </Card>
      )}
    </div>
  );
}
