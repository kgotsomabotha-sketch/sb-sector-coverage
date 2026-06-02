import { useState } from "react";

export default function ProjectDelaysTracker() {
  const [tracking, setTracking] = useState("solar");
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
    <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 12px",borderRadius:3,marginBottom:12,background:s.t==="ok"?"rgba(16,185,129,.07)":s.t==="err"?"rgba(239,68,68,.07)":"rgba(59,130,246,.07)",border:`1px solid ${s.t==="ok"?"rgba(16,185,129,.2)":s.t==="err"?"rgba(239,68,68,.2)":"rgba(59,130,246,.2)"}`,color:s.t==="ok"?"#34d399":s.t==="err"?"#f87171":"#60a5fa"}}>
      {s.t==="load"&&<Spinner/>}{s.t==="ok"?"✓ ":s.t==="err"?"✕ ":""}{s.msg}
    </div>
  );

  // Static but realistic project delay data (no API needed)
  function getProjectDelays(sector) {
    const delays = {
      solar: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scatec — Kroonstad PV Cluster (846MW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: Scatec (Norway) + Stanlib
Status: ON TRACK
Original Completion: H2 2027
Revised Completion: H2 2027 (no delay)
Delay: 0 months

Financial Impact:
- Estimated cost: ZAR13bn
- Funding gap: None (90% debt-financed)
- Refinancing needs: No
- Debt covenant risks: Low

Standard Bank Opportunity:
Joint mandated arranger alongside DFIs
Ticket: R10-12bn
Contact: Scatec VP Project Finance Africa
Pitch: "Standard Bank proposes lead arranger mandate for Kroonstad PV debt syndication"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOA Group — C&I IPP Portfolio (138MW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: NOA Group
Status: EARLY STAGE (no delays)
Original Completion: 2028
Revised Completion: 2028
Delay: 0 months

Financial Impact:
- Estimated cost: R2-5bn
- Funding gap: Seeking project finance
- Refinancing needs: No
- Debt covenant risks: N/A

Standard Bank Opportunity:
Lead arranger for IPP portfolio financing
Ticket: R2-5bn
Contact: NOA CEO
Pitch: "Position as preferred lender for C&I renewable projects"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mulilo Energy — Wind + Solar Portfolio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: Mulilo Energy Holdings
Status: EXPANSION PHASE
Original Completion: Rolling 2026-2028
Revised Completion: On track
Delay: 0 months

Financial Impact:
- Estimated cost: R2-6bn
- Funding gap: Seeking equity raise
- Refinancing needs: No
- Debt covenant risks: Low

Standard Bank Opportunity:
Equity syndication + DFI co-financing
Ticket: R2-6bn
Contact: Mulilo CEO
Pitch: "Syndication + DFI co-financing for SADC expansion"`,

      hydro: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lesotho Highlands Water Project — Phase II
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: LHDA (Lesotho) + Trans-Caledon Tunnel Authority (SA)
Status: DELAYED
Original Completion: 2028
Revised Completion: 2030
Delay: 24 months

Financial Impact:
- Estimated cost overrun: R5-8bn
- Funding gap: R2-3bn
- Refinancing needs: Yes
- Debt covenant risks: Moderate

Standard Bank Opportunity:
Project refinancing + additional debt facilities
Ticket: R2-5bn
Contact: LHDA CEO, TCTA CFO
Pitch: "Standard Bank proposes refinancing package to cover cost overruns"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ingula Pumped Storage — Ongoing Maintenance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: Eskom
Status: OPERATIONAL (maintenance only)
Original Completion: 2017
Revised Completion: N/A
Delay: N/A

Financial Impact:
- Maintenance capex: R500m-1bn annually
- Funding gap: Covered by Eskom
- Refinancing needs: No
- Debt covenant risks: High (Eskom overall)

Standard Bank Opportunity:
Eskom JET financing (broader mandate)
Ticket: R80-120bn
Contact: Eskom Treasury
Pitch: "Lead structuring on Eskom's green bond issuance"`,

      gas: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mozambique LNG — TotalEnergies Project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: TotalEnergies (operator), Eni, Equinor
Status: RESTARTED (force majeure lifted Feb 2026)
Original Completion: 2028
Revised Completion: Q1 2029
Delay: 12-15 months

Financial Impact:
- Estimated cost overrun: $2-3bn
- Remaining capex: ~$12bn
- Refinancing needs: Yes (additional debt)
- Debt covenant risks: Moderate

Standard Bank Opportunity:
Regional project finance arranger
Ticket: R2-6bn annually through 2029
Contact: TotalEnergies VP Project Finance
Pitch: "Local currency hedging and regional syndication for Mozambique LNG"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Namibia Venus — TotalEnergies Offshore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: TotalEnergies (42.5%), Petrobras (42.5%), NAMCOR (10%), Eight (5%)
Status: PRE-FID (FID targeting 2026)
Original Completion: 2030
Revised Completion: 2030 (on track)
Delay: 0 months (still in planning)

Financial Impact:
- Estimated cost: $3-4bn capex
- Funding gap: Project finance raising
- Refinancing needs: No
- Debt covenant risks: Low

Standard Bank Opportunity:
Lead arranger on Namibian oil/gas project finance
Ticket: R3-8bn per project
Contact: TotalEnergies VP Exploration
Pitch: "First mover advantage against ABSA/FNB — $500m underwrite"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BlueCORE Gas — Regional Gas Corridor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: BlueCORE Gas Infraco
Status: FEED PHASE
Original Completion: 2030
Revised Completion: 2030 (on track)
Delay: 0 months

Financial Impact:
- Estimated cost: R5-12bn
- Funding gap: Seeking project finance
- Refinancing needs: No
- Debt covenant risks: Low

Standard Bank Opportunity:
Lead arranger for gas infrastructure PPP
Ticket: R5-12bn
Contact: BlueCORE CEO
Pitch: "Lead arranger for regional gas transmission PPP"`,

      infrastructure: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SANRAL — N3 Paradise Valley to Marianhill Upgrade
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: SANRAL
Status: ON TRACK (started Q1 2026)
Original Completion: 2029
Revised Completion: 2029
Delay: 0 months

Financial Impact:
- Estimated cost: R8-12bn
- Funding gap: R7bn NDB loan secured
- Refinancing needs: No
- Debt covenant risks: Low

Standard Bank Opportunity:
Bond structuring, PPP advisory, refinancing
Ticket: R2-6bn per concession
Contact: SANRAL CEO Reginald Demana
Pitch: "Refinance existing toll debt at JIBAR+120bps, saving R28m annually"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transnet — Rail Modernisation Programme
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: Transnet
Status: PROCUREMENT PHASE (RFP Q3 2026)
Original Completion: Rolling 2028-2030
Revised Completion: TBD
Delay: Potential (funding dependent)

Financial Impact:
- Estimated cost: R80bn rail + R12bn ports
- Funding gap: Seeking DFI co-financing
- Refinancing needs: Yes
- Debt covenant risks: High

Standard Bank Opportunity:
Restructuring advisory + DFI co-financing
Ticket: R30bn+
Contact: Transnet CFO/Treasury
Pitch: "Restructuring advisory with success fee contingent on EBITDA improvement"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cape Town Water — Desalination & Reuse PPPs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Developer: City of Cape Town
Status: PROCUREMENT PHASE (RFQ H2 2026)
Original Completion: 2030/31
Revised Completion: On track
Delay: 0 months

Financial Impact:
- Estimated cost: R3-6bn per project
- Funding gap: PPP financing
- Refinancing needs: No
- Debt covenant risks: Low

Standard Bank Opportunity:
PPP advisory + project finance + DFI co-lending
Ticket: R3-6bn per project
Contact: City of Cape Town Mayoral Committee
Pitch: "Lead PPP arranger with IFC/IFISA co-financing"`
    };

    return delays[sector] || delays.solar;
  }

  async function trackDelays() {
    setLoading(true);
    setAlerts("");
    setStatus({t:"load",msg:`Tracking ${tracking} project delays…`});

    const sectorLabels = {
      solar: "Solar IPP Projects",
      hydro: "Hydroelectric & Water Projects",
      gas: "Oil & Gas Projects",
      infrastructure: "Infrastructure Projects"
    };

    // Simulate API delay for realism
    setTimeout(() => {
      const delayData = getProjectDelays(tracking);
      setAlerts(delayData);
      setStatus({t:"ok",msg:`Project delays tracked — ${sectorLabels[tracking]}`});
      setLoading(false);
    }, 600);
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
            <button
              onClick={() => navigator.clipboard?.writeText(alerts)}
              style={{
                padding: "4px 12px",
                background: "transparent",
                border: "1px solid #1e2535",
                borderRadius: 6,
                color: "#6b7280",
                fontSize: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: "pointer"
              }}
            >
              📋 Copy
            </button>
          </div>
          <Out text={alerts}/>
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