import { useState } from "react";

export default function FinancialHealthScreener() {
  const [company, setCompany] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const Spinner = () => (
    <span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(201,168,76,.2)",borderTop:"2px solid #c9a84c",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
  );

  const Tag = ({ c="#c9a84c", bg="rgba(201,168,76,.1)", children }) => (
    <span style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,letterSpacing:"1.2px",textTransform:"uppercase",padding:"3px 8px",borderRadius:2,color:c,background:bg,border:`1px solid ${c}22`}}>{children}</span>
  );

  const Btn = ({ children, onClick, disabled, v="pri" }) => {
    const base = { fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,letterSpacing:"1px",textTransform:"uppercase",padding:"9px 20px",borderRadius:3,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all .15s",border:"none" };
    return (
      <button style={v==="pri"?{...base,background:"#c9a84c",color:"#090c12"}:v==="out"?{...base,background:"transparent",border:"1px solid rgba(201,168,76,.3)",color:"#c9a84c"}:{...base,background:"transparent",border:"1px solid #1e2535",color:"#6b7280"}} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  };

  const Card = ({ children, style={} }) => (
    <div style={{background:"#111827",border:"1px solid #1e2535",borderRadius:6,padding:"18px 22px",...style}}>{children}</div>
  );

  const SL = ({ children }) => (
    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#6b7280",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>{children}</div>
  );

  const Out = ({ text }) => (
    <div style={{background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"16px 18px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,lineHeight:1.8,color:"#d1d5db",whiteSpace:"pre-wrap",maxHeight:600,overflowY:"auto"}}>{text}</div>
  );

  const SBar = ({ s }) => !s ? null : (
    <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 12px",borderRadius:3,marginBottom:12,background:s.t==="ok"?"rgba(16,185,129,.07)":s.t==="err"?"rgba(239,68,68,.07)":"rgba(59,130,246,.07)",border:`1px solid ${s.t==="ok"?"rgba(16,185,129,.2)":s.t==="err"?"rgba(239,68,68,.2)":"rgba(59,130,246,.2)"}`,color:s.t==="ok"?"#34d399":s.t==="err"?"#f87171":"#60a5fa"}}>
      {s.t==="load"&&<Spinner/>}{s.t==="ok"?"✓ ":s.t==="err"?"✕ ":""}{s.msg}
    </div>
  );

  const In = ({ value, onChange, placeholder, onKeyDown }) => (
    <input value={value} onChange={e=>onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} style={{background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"9px 13px",color:"#e8eaf0",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"}}/>
  );

  async function analyseGearing() {
    if (!company.trim()) return;
    setLoading(true);
    setAnalysis("");
    setStatus({t:"load",msg:`Fetching financials for ${company}…`});

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You are a senior investment banker at Standard Bank CIB Energy & Infrastructure, South Africa. Analyse a company's financial leverage and recommend deal structures.

Search for the company's LATEST financial statements. Then produce a structured analysis with EXACTLY these sections:

━━━ 1. COMPANY FINANCIAL SNAPSHOT ━━━
Company: [name]
Latest Period: [date of latest financials]
Key Financials: Total Debt, Total Equity, Market Cap (if public)

━━━ 2. LEVERAGE ANALYSIS ━━━
Debt-to-Equity Ratio: [calculate from latest financials]
Net Debt / EBITDA: [if available]
Interest Coverage Ratio: [if available]
Leverage Assessment: [Is this company OVER-GEARED or UNDER-GEARED?]

━━━ 3. GEARING DIAGNOSIS ━━━
Current Status: [OVER-GEARED / OPTIMALLY-GEARED / UNDER-GEARED]
Risk Level: [HIGH / MEDIUM / LOW]
Key Signals: [3 specific financial metrics that support the diagnosis]

OVER-GEARED means: High debt, weak cash flow, refinancing risk, restructuring opportunity
UNDER-GEARED means: Low debt, strong cash position, capacity to leverage for growth

━━━ 4. RECOMMENDED DEAL STRUCTURES ━━━
Based on their gearing position, recommend the TOP 3 deals Standard Bank should pitch:

Deal 1:
[Type]: [Project Finance / Debt Restructuring / Refinancing / Equity Raise / M&A / etc.]
[Rationale]: Why this deal fits their financial position
[Ticket Size]: Estimated range in ZAR or USD
[Urgency]: HIGH / MEDIUM / LOW

[Same for Deal 2 and Deal 3]

━━━ 5. DEBT MATURITY & REFINANCING SCHEDULE ━━━
When does their debt mature? What refinancing needs exist in the next 12-24 months?

━━━ 6. STANDARD BANK PITCH APPROACH ━━━
Exact opening line for the first call to their CFO based on their gearing position.

━━━ 7. DEAL READINESS SCORE ━━━
On a scale of 1-10, how ready is this company for a deal with Standard Bank?
[Score]: [8/10]
[Why]: [2-3 sentences explaining the score]`,
          messages: [
            {
              role: "user",
              content: `Analyse ${company}'s financial leverage and gearing position. Search for their latest financial statements (annual reports, investor presentations, news). Then diagnose whether they're over-geared or under-geared and recommend the top 3 deals Standard Bank should pitch based on their leverage profile.`,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Analysis failed");

      const text = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      setAnalysis(text);
      setStatus({t:"ok",msg:`Analysis complete — ${company}`});
    } catch (error) {
      setStatus({t:"err",msg:error.message});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card style={{marginBottom:16,borderLeft:"4px solid #c9a84c"}}>
        <SL>Leverage & Gearing Analysis</SL>
        <div style={{fontSize:13,color:"#9ca3af",marginBottom:16,lineHeight:1.7}}>
          Search any company. We fetch their latest financials, calculate leverage ratios, diagnose over/under-gearing, and recommend deal structures.
        </div>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
  <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Eskom, Transnet, Sasol, Scatec, Envusa…" style={{background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"9px 13px",color:"#e8eaf0",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box"}}/>
  <Btn onClick={analyseGearing} disabled={loading||!company.trim()}>{loading?"Analysing…":"🔍 Analyse Gearing"}</Btn>
</div>
        <div style={{fontSize:11,color:"#6b7280",fontFamily:"'IBM Plex Mono',monospace"}}>Searches live financials | Calculates D/E Ratio | Identifies refinancing needs | Recommends deal structures</div>
      </Card>

      <SBar s={status}/>

      {analysis && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <SL>Gearing Analysis — {company}</SL>
            <Btn v="ghost" onClick={()=>navigator.clipboard?.writeText(analysis)} style={{padding:"4px 11px",fontSize:10}}>Copy</Btn>
          </div>
          <Out text={analysis}/>
        </Card>
      )}

      {!analysis && !loading && (
        <Card style={{textAlign:"center",padding:"40px 20px",color:"#4b5563"}}>
          <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⚖️</div>
          <div style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace"}}>Search a company to analyse leverage and gearing position</div>
        </Card>
      )}
    </div>
  );
}
