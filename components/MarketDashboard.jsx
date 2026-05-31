import { useState } from "react";

export default function MarketDashboard() {
  const [pulse, setPulse] = useState("");
  const [indicators, setIndicators] = useState("");
  const [dealFlow, setDealFlow] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("pulse");

  const Spinner = () => (
    <span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(201,168,76,.2)",borderTop:"2px solid #c9a84c",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
  );

  const Tag = ({ c="#c9a84c", bg="rgba(201,168,76,.1)", children }) => (
    <span style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,letterSpacing:"1.2px",textTransform:"uppercase",padding:"3px 8px",borderRadius:2,color:c,background:bg,border:`1px solid ${c}22`}}>{children}</span>
  );

  const Btn = ({ children, onClick, disabled, v="pri", active=false }) => {
    const base = { fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,letterSpacing:"1px",textTransform:"uppercase",padding:"8px 16px",borderRadius:3,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all .15s",border:"none" };
    const style = active ? {...base,background:"#c9a84c",color:"#090c12"} : v==="pri"?{...base,background:"#c9a84c",color:"#090c12"}:v==="out"?{...base,background:"transparent",border:"1px solid rgba(201,168,76,.3)",color:"#c9a84c"}:{...base,background:"transparent",border:"1px solid #1e2535",color:"#6b7280"};
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
    <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 12px",borderRadius:3,marginBottom:12,background:s.t==="ok"?"rgba(16,185,129,.07)":s.t==="err"?"rgba(239,68,68,.07)":"rgba(59,130,246,.07)",border:`1px solid ${s.t==="ok"?"rgba(16,185,129,.2)":s.t==="err"?"rgba(239,68,68,.2)":"rgba(59,130,246,.2)"}`,color:s.t==="ok"?"#34d399":s.t==="err"?"#f87171":"#60a5fa"}}>
      {s.t==="load"&&<Spinner/>}{s.t==="ok"?"✓ ":s.t==="err"?"✕ ":""}{s.msg}
    </div>
  );

  async function fetchMarketData() {
    setLoading(true);
    setStatus({t:"load",msg:"Fetching live market data…"});

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You are a market analyst at Standard Bank CIB Energy & Infrastructure. Provide three separate market intelligence reports. Today's date: ${new Date().toLocaleDateString("en-ZA", {weekday:"long", year:"numeric", month:"long", day:"numeric"})}.

REPORT 1: LIVE MARKET PULSE
5 bullet points on breaking energy/infrastructure news in SA right now.
• [NEWS SOURCE]: [1 sentence on the most critical item for deal origination]

REPORT 2: MARKET INDICATORS
Current state of key metrics:
━━ OIL & ENERGY PRICES ━━
Brent Crude: [current price and trend]
Oil Impact on SA Energy Sector: [how this affects pricing, competitiveness]

━━ CURRENCY & RATES ━━
USD/ZAR: [current rate]
SA Interest Rates: [repo rate, what recent SARB decisions mean]

━━ LOAD-SHEDDING & GRID STATUS ━━
Current Load-Shedding Stage: [current stage]
Eskom Grid Status: [capacity, maintenance, forecast]

━━ ENERGY TARIFFS ━━
Latest NERSA Decisions: [any recent tariff announcements]
Impact on CIB Clients: [how tariff changes affect energy companies' debt capacity]

━━ INFRASTRUCTURE INDICATORS ━━
Construction Activity: [SA PMI, building activity, infrastructure spending]
Currency Impact on Imports: [how ZAR weakness affects EPC costs]

REPORT 3: DEAL FLOW & ANNOUNCEMENTS
Recent M&A, IPP Awards, Tender Announcements in SA Energy & Infrastructure (last 7-14 days):
• [COMPANY/ANNOUNCEMENT]: [Deal type] | [Ticket size estimate] | [Opportunity for SB]

Format each with company name, deal type, size, and what SB should pitch based on this announcement.`,
          messages: [
            {
              role: "user",
              content: `Search for today's live market data: 
1) Breaking energy & infrastructure news in South Africa
2) Current oil prices, Rand/USD, interest rates, load-shedding status, NERSA tariff news
3) Recent M&A deals, IPP awards, and tender announcements in SA energy sector (last 7-14 days)

Provide three separate reports as per the system prompt.`,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to fetch market data");

      const fullText = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      // Parse into three sections (simple split by "REPORT")
      const sections = fullText.split(/REPORT \d+:/);
      
      setPulse(sections[1] ? sections[1].trim() : fullText);
      setIndicators(sections[2] ? sections[2].trim() : "");
      setDealFlow(sections[3] ? sections[3].trim() : "");
      
      setStatus({t:"ok",msg:"Market data loaded — all three reports ready"});
    } catch (error) {
      setStatus({t:"err",msg:error.message});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card style={{marginBottom:16,borderLeft:"4px solid #c9a84c"}}>
        <SL>Market Dashboard — Live Intelligence</SL>
        <div style={{fontSize:13,color:"#9ca3af",marginBottom:16,lineHeight:1.7}}>
          Real-time energy & infrastructure market data. Oil prices, rates, load-shedding, tariffs, and live deal announcements.
        </div>
        <Btn onClick={fetchMarketData} disabled={loading} style={{padding:"10px 24px"}}>{loading?"Fetching live data…":"📊 Load Live Market Data"}</Btn>
      </Card>

      <SBar s={status}/>

      {(pulse || indicators || dealFlow) && (
        <>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <Btn active={activeTab==="pulse"} onClick={()=>setActiveTab("pulse")} v="outline" style={{padding:"8px 16px"}}>📰 Market Pulse</Btn>
            <Btn active={activeTab==="indicators"} onClick={()=>setActiveTab("indicators")} v="outline" style={{padding:"8px 16px"}}>📈 Indicators</Btn>
            <Btn active={activeTab==="deals"} onClick={()=>setActiveTab("deals")} v="outline" style={{padding:"8px 16px"}}>🤝 Deal Flow</Btn>
          </div>

          {activeTab==="pulse" && pulse && (
            <Card>
              <SL>Live Market Pulse — Breaking News</SL>
              <Out text={pulse}/>
            </Card>
          )}

          {activeTab==="indicators" && indicators && (
            <Card>
              <SL>Market Indicators — Oil, Rates, Grid, Tariffs</SL>
              <Out text={indicators}/>
            </Card>
          )}

          {activeTab==="deals" && dealFlow && (
            <Card>
              <SL>Deal Flow — Recent M&A & IPP Awards</SL>
              <Out text={dealFlow}/>
            </Card>
          )}
        </>
      )}

      {!pulse && !loading && (
        <Card style={{textAlign:"center",padding:"40px 20px",color:"#4b5563"}}>
          <div style={{fontSize:32,marginBottom:12,opacity:.3}}>📊</div>
          <div style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace"}}>Click "Load Live Market Data" to see market pulse, indicators, and deal flow</div>
        </Card>
      )}
    </div>
  );
}
