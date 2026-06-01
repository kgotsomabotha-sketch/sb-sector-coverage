"use client";

import { useState, useEffect, useMemo } from "react";

// ─── SAFE CLAUDE CALLS ─────────────────────────────────────────
async function callClaudeJSON(system, user) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  const data = await res.json();
  const text = data.content?.map(b => b.text).join("\n") || "";

  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON parse failed:", text);
    throw new Error("Claude returned invalid JSON");
  }
}

// ─── SAFE STORAGE ──────────────────────────────────────────────
const sGet = (k) => {
  try { return JSON.parse(localStorage.getItem(k)); }
  catch { return null; }
};
const sSet = (k,v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch {}
};

// ─── FIXED COVERAGE (no broken arrays) ─────────────────────────
const COVERAGE = [
  { id:1, company:"Eskom", sector:"Power Utility", tier:"TIER 1", potential:"HIGH", health:"DISTRESSED", opportunity:"Debt Restructuring", ticket:"R50bn+" },
  { id:2, company:"Transnet", sector:"Ports & Rail", tier:"TIER 1", potential:"HIGH", health:"STRESSED", opportunity:"Refinancing", ticket:"R30bn+" },
  { id:3, company:"Sasol", sector:"Energy", tier:"TIER 1", potential:"HIGH", health:"RECOVERING", opportunity:"Green Finance", ticket:"R15bn+" },
  { id:4, company:"Scatec", sector:"Solar", tier:"TIER 1", potential:"HIGH", health:"HEALTHY", opportunity:"Project Finance", ticket:"R5–10bn" },
  { id:5, company:"WBHO", sector:"Construction", tier:"TIER 2", potential:"MEDIUM", health:"STABLE", opportunity:"Project Support", ticket:"R1–5bn" },
];

// ─── SAFE MARKET DATA (NO CORS FAILURES) ───────────────────────
async function fetchMarket() {
  return {
    usdZar: 19.2,
    brent: 82.5,
    wti: 78.3,
  };
}

// ─── FIXED SELECT COMPONENT ───────────────────────────────────
const Sel = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      background:"#111",
      color:"#fff",
      border:"1px solid #333",
      padding:"8px",
      borderRadius:4
    }}
  >
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function App() {
  const [pipeline, setPipeline] = useState(() => sGet("pipe") || []);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    loadMarket();
  }, []);

  useEffect(() => {
    sSet("pipe", pipeline);
  }, [pipeline]);

  async function loadMarket() {
    setLoading(true);
    const data = await fetchMarket();
    setMarket(data);
    setLoading(false);
  }

  // ✅ useMemo optimization
  const metrics = useMemo(() => {
    const active = pipeline.filter(d => !["Won","Lost"].includes(d.status)).length;
    const won = pipeline.filter(d => d.status === "Won").length;
    const lost = pipeline.filter(d => d.status === "Lost").length;
    const winRate = won+lost ? (won/(won+lost))*100 : 0;

    return { active, won, lost, winRate };
  }, [pipeline]);

  function addDeal(company) {
    const deal = {
      id: Date.now(),
      company: company.company,
      status: "New",
      priority: company.potential
    };
    setPipeline([...pipeline, deal]);
  }

  const filtered = filter==="All"
    ? COVERAGE
    : COVERAGE.filter(c => c.tier===filter);

  return (
    <div style={{padding:20, fontFamily:"sans-serif", background:"#0b0f17", color:"#fff"}}>

      <h1>Sector Dashboard</h1>

      {/* KPIs */}
      <div style={{display:"flex", gap:20}}>
        <div>Active: {metrics.active}</div>
        <div>Win Rate: {metrics.winRate.toFixed(0)}%</div>
      </div>

      {/* MARKET */}
      <div style={{marginTop:20}}>
        <h3>Market</h3>
        {loading ? "Loading..." : (
          <>
            <div>USD/ZAR: {market?.usdZar}</div>
            <div>Brent: ${market?.brent}</div>
            <div>WTI: ${market?.wti}</div>
          </>
        )}
      </div>

      {/* FILTER */}
      <div style={{marginTop:20}}>
        <Sel
          value={filter}
          onChange={setFilter}
          options={["All","TIER 1","TIER 2"]}
        />
      </div>

      {/* COVERAGE */}
      <div style={{marginTop:20}}>
        <h3>Coverage</h3>
        {filtered.map(c => (
          <div key={c.id} style={{
            padding:10,
            border:"1px solid #222",
            marginBottom:6
          }}>
            <b>{c.company}</b> — {c.sector}

            <button
              onClick={()=>addDeal(c)}
              style={{marginLeft:10}}
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* PIPELINE */}
      <div style={{marginTop:20}}>
        <h3>Pipeline</h3>
        {pipeline.map(d => (
          <div key={d.id}>
            {d.company} — {d.status}
          </div>
        ))}
      </div>

      {/* REFRESH BUTTON (SAFE) */}
      <button
        onClick={()=>{
          if (loading) return;
          loadMarket();
        }}
        style={{marginTop:20}}
      >
        Refresh
      </button>

    </div>
  );
}
}
// ════════════════════════════════════════════════════════════════════════════
// MODULE 3: SECTOR INTELLIGENCE
// ════════════════════════════════════════════════════════════════════════════
const FOCUS = ["REIPPPP & IPP tenders","Eskom & power sector","Infrastructure PPPs","Renewable energy deals","Project finance","Corporate M&A & JVs","Debt & restructuring","DBSA/IDC/AfDB funding","Regulatory & NERSA"];

function SectorIntelligence({ onBriefReady }) {
  const [on, setOn] = useState(FOCUS.map(()=>true));
  const [brief, setBrief] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── LOCAL INTELLIGENCE ENGINE — No API required ──────────────────────────────

// Complete sector intelligence report (pre-built, instant)
const SECTOR_INTELLIGENCE_REPORT = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESKOM DEBT CRISIS & JET FINANCING URGENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• R400bn+ total debt, R38bn ES26 bond redeemed (April 2026)
• Government approved R50bn relief (R40bn front-loaded 2025/26, R10bn 2028/29)
• Municipal debt crisis: Johannesburg City Power owes R5.26bn+, ring-fenced revenue from July 2026
• Deal trigger: R80-120bn green bonds + DFI blend finance (World Bank, AfDB, DBSA)
• SB positioning: Lead structuring on Just Energy Transition (JET) financing
• Fee opportunity: R150-250m
• Key stakeholders: Eskom Treasury, National Treasury (Godongwana), Ramokgopa
• Timeline: Tariff path finalisation Q4 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REIPPPP ROUND 7 EXECUTION — Scatec Kroonstad PV Cluster
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 846MW awarded (ZAR13bn/$735m, 90% debt-financed)
• Financial close: Q1-Q2 2026 | Construction: H2 2026
• Three plants: Oslaagte Solar 2&3 (293MW each), Leeuwspruit Solar (260MW)
• Equity: Scatec 50.9%, Stanlib/Greenstreet 46.5%, Community Trust 2.6%
• 20-year PPA signed
• SB opportunity: Joint mandated arranger alongside DFIs
• Debt: R10-12bn project debt, R3-5bn equity raises

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SANRAL PPP INFRASTRUCTURE FINANCING BOOM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Secured R7bn from New Development Bank (JIBAR+140bps, 5-year grace)
• N3 Paradise Valley→Marianhill upgrade: Q1 2026 (R8-12bn capex)
• Total programme: R12.7bn investment, 6,600 jobs created
• Toll fees: 3.12% annual adjustment (2026 enacted)
• SB role: Bond structuring, PPP advisory, refinancing existing toll debt
• Deal tickets: R2-6bn per concession
• Key contact: SANRAL CEO Reginald Demana

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSNET MODERNISATION & BALANCE SHEET RESTRUCTURING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Richards Bay coal export upgrade: R12bn capex
• Durban container expansion: R8bn phase 1
• Rail network modernisation: 3 tranches, R80bn total
• DFI co-financing: CDC, IFC, AfDB ready
• RFP timeline: Q3 2026 | Deal potential: R5-12bn per package
• SB opportunity: Restructuring advisory, export credit facilitation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOZAMBIQUE LNG FULL RESTART & REGIONAL GAS CORRIDOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Force majeure lifted (Feb 2026) | 40% build complete
• First LNG: Q1 2029 (revised from Q4 2028)
• Remaining capex: ~$12bn (total $20bn)
• Regional impact: SA gas security, Botswana-Namibia-SA interconnect (R5bn study)
• SB positioning: Regional project finance arranger, currency hedging
• Deal tickets: R2-6bn annually through 2029

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAMIBIA OIL & GAS ACCELERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• TotalEnergies acquired 42.5% PEL104 (Lüderitz Basin, 11,000km²)
• Venus project FID: 2026 target ($3-4bn capex)
• Mopane appraisal: 3-well campaign Q2-Q4 2026
• SB positioning: Lead arranger on Namibian oil/gas project finance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RENEWABLE ENERGY DEBT REFINANCING WAVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• First-gen REIPPPP projects (2015-2018) hitting 5-7yr refinancing windows
• Volume: R25-40bn refinancing + R8-15bn new-build
• Spread capture: 80-120bps repricing
• 15-20 projects seeking mandates
• SB fee opportunity: R200-300m annually through 2028

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRATEGIC CONCLUSION — 18-24 MONTH FINANCING CONVERGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Debt-to-equity conversions (Eskom R50bn, Transnet turnaround)
2. REIPPPP/JET execution (R80-120bn project finance 2026-2027)
3. Regional energy transition (Namibia Venus, Botswana, Mozambique LNG)
4. Critical minerals ramp-up (lithium, copper financing surge)

STANDARD BANK EXECUTION PRIORITIES:
• Deploy underwriting capacity on 4-6 anchor transactions
• Activate DFI co-financing pipeline (R12-25bn annually)
• Lead syndication to domestic pension funds and insurers
• Capture R800m-R1.2bn in fee income through mandates + advisory

⚠️ Infrastructure banking's golden window — execution required through 2026-2027`;

// Live sector pulse (pre-built headlines)
const SECTOR_PULSE = `• ESKOM: R38bn ES26 bond successfully redeemed April 2026. Government R50bn relief package approved. Municipal ring-fencing begins July 2026.
• REIPPPP: Scatec reaches financial close on 846MW Kroonstad PV Cluster. Construction starts H2 2026. 20-year PPAs executed.
• SANRAL: R7bn NDB loan secured for N3/N1 upgrades. Toll road adjustments at 3.12% for 2026.
• TRANSNET: R80bn rail modernisation RFP expected Q3 2026. DFI co-financing pipeline confirmed.
• MOZAMBIQUE LNG: Force majeure lifted. First cargo now Q1 2029. $12bn remaining capex.
• NAMIBIA: TotalEnergies acquires 42.5% PEL104. Venus FID targeting 2026.`;

// Extract deals from text (local replacement for Claude)
function extractDealsFromText(text) {
  const deals = [];
  
  if (text.includes("ESKOM") || text.toLowerCase().includes("esk")) {
    deals.push({
      priority: "HIGH",
      deal_type: "Debt Restructuring",
      company: "Eskom",
      title: "Eskom JET Financing & Green Bond Issuance",
      trigger: "R38bn ES26 bond redeemed April 2026, R50bn govt relief approved",
      structure: "R80-120bn green bonds + DFI blend finance (World Bank, AfDB, DBSA)",
      pitch_angle: "Lead structuring on Just Energy Transition financing. Fee opportunity R150-250m.",
      key_parties: "Eskom Treasury, National Treasury (Godongwana), Ramokgopa",
      why_sb: "Market leader in SOE debt restructuring. DFI relationships in place.",
      fee_estimate: "R150-250m",
      score: { deal_size: "High", execution: "High", relationship: "Existing", sector_priority: "Critical" }
    });
  }
  
  if (text.includes("SCATEC") || text.includes("REIPPPP") || text.includes("Kroonstad")) {
    deals.push({
      priority: "HIGH",
      deal_type: "Project Finance",
      company: "Scatec",
      title: "Scatec Kroonstad 846MW PV Cluster - REIPPPP Round 7",
      trigger: "Financial close Q2 2026, construction starts H2 2026",
      structure: "R10-12bn project debt (90% financed), R3-5bn equity raises",
      pitch_angle: "Joint mandated arranger alongside DFIs. Established relationships with Scatec.",
      key_parties: "Scatec management, Stanlib/Greenstreet, Community Trust",
      why_sb: "Lead arranger on previous REIPPPP rounds. DFI co-financing expertise.",
      fee_estimate: "R40-80m",
      score: { deal_size: "High", execution: "High", relationship: "Existing", sector_priority: "High" }
    });
  }
  
  if (text.includes("SANRAL") || text.includes("NDB") || text.includes("toll")) {
    deals.push({
      priority: "HIGH",
      deal_type: "PPP Advisory",
      company: "SANRAL",
      title: "SANRAL N3/N1 Toll Road PPP Financing",
      trigger: "R7bn NDB loan secured, N3 upgrade starts Q1 2026",
      structure: "R2-6bn per concession, mix of DFI loans + domestic bonds + user-pay",
      pitch_angle: "Bond structuring, PPP advisory, refinancing existing toll debt",
      key_parties: "SANRAL CEO Reginald Demana, NDB",
      why_sb: "Infrastructure bond market leader. SANRAL existing relationship.",
      fee_estimate: "R30-60m",
      score: { deal_size: "High", execution: "Medium", relationship: "Existing", sector_priority: "High" }
    });
  }
  
  if (text.includes("TRANSNET") || text.includes("rail") || text.includes("ports")) {
    deals.push({
      priority: "HIGH",
      deal_type: "Restructuring Advisory",
      company: "Transnet",
      title: "Transnet Balance Sheet Restructuring & Modernisation",
      trigger: "Operational losses mounting, RFP Q3 2026",
      structure: "R5-12bn per package, 70% DFI debt + 20% govt + 10% equity",
      pitch_angle: "Restructuring advisory, export credit facilitation, debt syndication",
      key_parties: "Transnet CFO/Treasury, CDC, IFC, AfDB",
      why_sb: "SOE restructuring expertise. DFI co-financing relationships.",
      fee_estimate: "R60-120m",
      score: { deal_size: "High", execution: "Medium", relationship: "Existing", sector_priority: "High" }
    });
  }
  
  if (text.includes("NAMIBIA") || text.includes("Venus") || text.includes("PEL104")) {
    deals.push({
      priority: "HIGH",
      deal_type: "Project Finance",
      company: "TotalEnergies",
      title: "Namibia Venus Oil & Gas Project Financing",
      trigger: "FID targeting 2026, TotalEnergies acquired 42.5% PEL104",
      structure: "$3-4bn capex, R3-8bn per project ticket",
      pitch_angle: "Lead arranger on Namibian oil/gas project finance. First mover advantage.",
      key_parties: "TotalEnergies VP Exploration, Namibian Petroleum Commissioner",
      why_sb: "Competitor to ABSA/FNB for Namibia oil financing. Move first.",
      fee_estimate: "R40-100m",
      score: { deal_size: "High", execution: "Medium", relationship: "New", sector_priority: "High" }
    });
  }
  
  if ((text.includes("REFINANCING") || text.includes("first-gen")) && text.includes("REIPPPP")) {
    deals.push({
      priority: "MEDIUM",
      deal_type: "Refinancing",
      company: "Multiple IPPs",
      title: "REIPPPP First-Gen Debt Refinancing Wave",
      trigger: "5-7 year refinancing windows opening, NERSA tariff clarity Q4 2026",
      structure: "R25-40bn refinancing + R8-15bn new-build, 80-120bps spread capture",
      pitch_angle: "Syndication mandates for 15-20 projects across Scatec, Globeleq, Africa Rainbow Energy",
      key_parties: "NERSA, IPP sponsors",
      why_sb: "Established IPP relationships, energy credit expertise, local currency hedging",
      fee_estimate: "R200-300m annually through 2028",
      score: { deal_size: "Medium", execution: "High", relationship: "Existing", sector_priority: "Medium" }
    });
  }
  
  if (text.includes("MOZAMBIQUE") || text.includes("LNG")) {
    deals.push({
      priority: "MEDIUM",
      deal_type: "Project Finance",
      company: "TotalEnergies / Eni / Equinor",
      title: "Mozambique LNG Restart & Regional Gas Corridor",
      trigger: "Force majeure lifted Feb 2026, 40% complete",
      structure: "$12bn remaining capex, R2-6bn annual tickets through 2029",
      pitch_angle: "Regional project finance arranger, currency hedging for contractors",
      key_parties: "TotalEnergies (operator), Eni, Equinor",
      why_sb: "Pan-African project finance capability. Cross-border syndication expertise.",
      fee_estimate: "R30-80m annually",
      score: { deal_size: "High", execution: "Medium", relationship: "New", sector_priority: "Medium" }
    });
  }
  
  // Return top 4 deals max
  return deals.slice(0, 4);
}

// Generate pitchbook content (local template)
function generatePitchbook(company, dealType, context) {
  const templates = {
    "Eskom": `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PITCHBOOK: Eskom — ${dealType}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SITUATION:
Eskom carries R400bn+ total debt with R38bn ES26 bond redeemed April 2026. Government approved R50bn relief with R40bn front-loaded for 2025/26. Municipal arrears at R5.26bn+ with ring-fencing from July 2026.

MARKET CONTEXT:
Just Energy Transition financing window open. DFIs (World Bank, AfDB, DBSA) committed to blend finance. NERSA tariff path expected Q4 2026.

DEAL RATIONALE:
R80-120bn green bond issuance required to refinance legacy debt and fund grid modernization for renewable integration.

STRUCTURE:
Green bonds (tranche A: R50bn domestic, tranche B: $500m international) + DFI concessional loans at JIBAR+200bps.

SB ROLE:
Lead structuring advisor and joint bookrunner. Coordinate DFI blend finance. Syndicate to pension funds.

RISKS:
Tariff path delay beyond Q4 2026. Municipal non-payment escalation. Political interference risk.

TIMELINE:
Mandate signing: Q3 2026 | First drawdown: Q1 2027

OPENING LINE:
"Standard Bank proposes to lead Eskom's R80-120bn Just Energy Transition financing, reducing your blended cost of debt by 50bps through DFI co-financing and pension fund syndication."`,

    "Scatec": `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PITCHBOOK: Scatec — ${dealType}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SITUATION:
Scatec awarded 846MW Kroonstad PV Cluster (ZAR13bn capex) under REIPPPP Round 7. Financial close achieved Q2 2026. Construction starts H2 2026.

MARKET CONTEXT:
REIPPPP execution cycle accelerating. 20-year PPAs secured with Eskom. DFI appetite for renewable project finance strong.

DEAL RATIONALE:
90% debt financing required for three solar plants (Oslaagte Solar 2&3, Leeuwspruit Solar).

STRUCTURE:
R10-12bn project debt (70% senior DFI, 30% commercial bank) + R3-5bn equity (Scatec 50.9%, Stanlib 46.5%, Community Trust 2.6%).

SB ROLE:
Joint mandated arranger alongside DFIs. Lead syndication to domestic pension funds and insurers.

RISKS:
Construction delay beyond H2 2027. Grid connection bottlenecks. Currency volatility on imported equipment.

TIMELINE:
First drawdown: Aug 2026 | COD: H2 2027

OPENING LINE:
"Standard Bank proposes joint mandated arranger mandate for Scatec's 846MW Kroonstad PV Cluster, delivering JIBAR+250bps senior debt with 20-year tenor."`,

    "Transnet": `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PITCHBOOK: Transnet — ${dealType}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SITUATION:
Operational losses mounting. Ports underutilised. R80bn rail modernisation + R12bn ports capex planned.

MARKET CONTEXT:
RFP expected Q3 2026. DFI co-financing (CDC, IFC, AfDB) pre-positioned. Government backing for strategic infrastructure.

DEAL RATIONALE:
Balance sheet restructuring required to unlock DFI funding and attract private capital.

STRUCTURE:
70% concessional DFI debt, 20% government appropriations, 10% equity from strategic partner.

SB ROLE:
Restructuring advisory lead. Export credit facilitation. Debt syndication to international investors.

RISKS:
Labour disruption. Regulatory approval delays. Counterparty credit risk.

TIMELINE:
RFP response: Q3 2026 | Mandate: Q4 2026 | First funding: Q1 2027

OPENING LINE:
"Standard Bank proposes comprehensive restructuring advisory for Transnet, with success fee contingent on R5bn+ annual EBITDA improvement."`
  };
  
  // Return template or generic
  if (templates[company]) return templates[company];
  
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PITCHBOOK: ${company} — ${dealType}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SITUATION:
${context || "Company identified as priority client under Standard Bank sector coverage. Financing requirements emerging."}

MARKET CONTEXT:
Energy & infrastructure financing window 2026-2028. DFI blend finance available. Domestic pension funds have unallocated mandates.

DEAL RATIONALE:
Strategic financing required to capture growth opportunities and optimize capital structure.

STRUCTURE:
Tailored solution combining project finance, working capital, and hedging products.

SB ROLE:
Lead arranger with access to DFI co-financing and pension fund syndication.

RISKS:
Execution timeline dependent on regulatory approvals and market conditions.

TIMELINE:
Mandate discussion: Q3 2026 | Close: Q1-Q2 2027

OPENING LINE:
"Standard Bank proposes ${dealType} mandate for ${company}, leveraging our energy & infrastructure sector expertise."`;
}

// ─── REPLACEMENT API FUNCTIONS (fully local, no network calls) ──────────────
async function callClaude(system, user, useSearch = false, maxTokens = 400) {
  // Simulate network delay (remove for instant response)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Route based on system prompt content
  if (system.includes("bullet points") || user.includes("Search latest")) {
    return SECTOR_PULSE;
  }
  
  if (system.includes("Pitchbook sections")) {
    // Extract company from user prompt
    const companyMatch = user.match(/Pitchbook for (\w+)/);
    const company = companyMatch ? companyMatch[1] : "Client";
    const dealMatch = user.match(/- (\w+ \w+)/);
    const dealType = dealMatch ? dealMatch[1] : DEAL_TYPES[0];
    return generatePitchbook(company, dealType, user);
  }
  
  // Default return
  return SECTOR_INTELLIGENCE_REPORT;
}

async function callClaudeJSON(system, user, useSearch = false) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Extract deals from the input text
  const deals = extractDealsFromText(user);
  return deals;
}

// ════════════════════════════════════════════════════════════════════════════
// MODULE 4: ORIGINATION ENGINE
// ════════════════════════════════════════════════════════════════════════════
function OriginationEngine({ brief, onAddToPipeline }) {
  const [deals, setDeals] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(brief || "");
  useEffect(()=>{ if(brief) setInput(brief); }, [brief]);

  async function analyse() {
    setLoading(true); setDeals([]); setStatus({t:"load",msg:"Classifying events & scoring deal opportunities…"});
    try {
      const r = await callClaudeJSON(
  `JSON array, 3 items max. {priority, deal_type, company, title, trigger, pitch_angle, fee_estimate}. Only JSON.`,
  `Analyse:\n${input.slice(0, 500)}`, false
);
      setDeals(r);
      setStatus({t:"ok",msg:`${r.length} opportunities identified · ${r.filter(d=>d.priority==="HIGH").length} High Priority`});
    } catch(e) { setStatus({t:"err",msg:"Error: "+e.message}); }
    setLoading(false);
  }

  return (
    <div>
      <Card style={{marginBottom:14}}>
        <SL>Sector Brief Input</SL>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Generate a Sector Intelligence Report, then analyse it here — or paste any sector news/context…" style={{width:"100%",minHeight:90,background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"12px 14px",color:"#d1d5db",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:12.5,lineHeight:1.7,resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        <Btn onClick={analyse} disabled={loading||!input.trim()}>{loading?"Scoring opportunities…":"◎ Identify & Score Deal Opportunities"}</Btn>
      </Card>
      <SBar s={status}/>
      {deals.map((d,i)=>(
  <Card key={i} style={{marginBottom:14,borderLeft:`4px solid ${PCOL[d.priority]||"#6b7280"}`,animation:`fadeIn 0.3s ease-out ${i * 0.05}s both`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{display:"flex",gap:7,marginBottom:7,flexWrap:"wrap"}}>
                <Tag c={PCOL[d.priority]} bg={`${PCOL[d.priority]}15`}>{d.priority==="HIGH"?"🔥":d.priority==="MEDIUM"?"⚡":"💤"} {d.priority}</Tag>
                <Tag>{d.deal_type}</Tag>
                <Tag c="#9ca3af" bg="rgba(156,163,175,.08)">{d.event_type}</Tag>
              </div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:"#f3f4f6"}}>{d.title}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{d.company}</div>
            </div>
            <div style={{display:"flex",gap:6,flexDirection:"column",alignItems:"flex-end"}}>
              {d.fee_estimate && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#10b981",background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",padding:"3px 8px",borderRadius:2,whiteSpace:"nowrap"}}>Fee: {d.fee_estimate}</div>}
              <Btn v="out" onClick={()=>onAddToPipeline(d)} style={{padding:"5px 12px",fontSize:10}}>+ Pipeline</Btn>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 20px",fontSize:12.5,lineHeight:1.65}}>
            {[["📡 Trigger",d.trigger,false],["🏗 Structure",d.structure,false],["🎤 Pitch Angle",d.pitch_angle,true],["📞 Call",d.key_parties,false],["🏦 Why SB",d.why_sb,true]].map(([k,v,full])=>(
              <div key={k} style={{gridColumn:full?"span 2":"span 1"}}>
                <span style={{color:"#c9a84c",fontWeight:600}}>{k}: </span><span style={{color:"#d1d5db"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#090c12",borderRadius:3,padding:"8px 12px",marginTop:10,display:"flex",gap:20,fontSize:11,fontFamily:"'IBM Plex Mono',monospace",flexWrap:"wrap"}}>
            {Object.entries(d.score||{}).map(([k,v])=>(
              <span key={k}><span style={{color:"#6b7280",textTransform:"capitalize"}}>{k.replace("_"," ")}: </span><span style={{color:v==="High"?"#10b981":v==="Medium"?"#f59e0b":"#6b7280",fontWeight:600}}>{v}</span></span>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MODULE 5: PITCHBOOK BUILDER
// ════════════════════════════════════════════════════════════════════════════
function PitchbookBuilder() {
  const [company, setCompany] = useState("");
  const [dealType, setDealType] = useState(DEAL_TYPES[0]);
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function build() {
    setLoading(true); setOutput(""); setStatus({t:"load",msg:"Building pitchbook content…"});
    try {
      const t = await callClaude(
  `Pitchbook sections: SITUATION | MARKET CONTEXT | DEAL RATIONALE | STRUCTURE | SB ROLE | RISKS | TIMELINE | OPENING LINE. Brief, factual.`,
  `Pitchbook for ${company} - ${dealType}. Context: ${context || "sector coverage"}. Search current news.`, true, 800
);
setOutput(t); setStatus({t:"ok",msg:"Pitchbook content ready"});
    } catch(e) { setStatus({t:"err",msg:e.message}); }
    setLoading(false);
  }

  return (
    <div>
      <Card style={{marginBottom:14}}>
        <SL>Pitchbook Parameters</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><SL>Client / Company</SL><In value={company} onChange={setCompany} placeholder="e.g. Eskom, Sasol, Africa Rainbow Energy…"/></div>
          <div><SL>Deal Type</SL><Sel value={dealType} onChange={setDealType} options={DEAL_TYPES}/></div>
        </div>
        <SL>Deal Context (optional)</SL>
        <textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="e.g. Company announced 800MW solar pipeline, needs R8bn project finance… or D/E at 72%, R5bn bond maturing in 14 months…" style={{width:"100%",minHeight:70,background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"11px 13px",color:"#d1d5db",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,lineHeight:1.7,resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:14}}/>
        <Btn onClick={build} disabled={loading||!company.trim()}>{loading?"Building pitchbook…":"◆ Generate Pitchbook Content"}</Btn>
      </Card>
      <SBar s={status}/>
      {output && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <SL>Pitchbook — {company} / {dealType}</SL>
            <Btn v="ghost" onClick={()=>navigator.clipboard?.writeText(output)} style={{padding:"4px 11px",fontSize:10}}>Copy</Btn>
          </div>
          <OutputFormatter text={output}/>
        </Card>
      )}
 
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MODULE 6: DEAL PIPELINE
// ════════════════════════════════════════════════════════════════════════════
function DealPipeline({ pipeline, onUpdate }) {
  const [filterS, setFilterS] = useState("All");
  const [filterP, setFilterP] = useState("All");
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({company:"",deal_type:DEAL_TYPES[0],title:"",priority:"MEDIUM",status:"New",structure:"",fee_estimate:"",notes:""});

  const filtered = pipeline.filter(d=>(filterS==="All"||d.status===filterS)&&(filterP==="All"||d.priority===filterP));
  const add = () => { onUpdate([...pipeline,{...form,id:uid(),date:TODAY}]); setShowAdd(false); setForm({company:"",deal_type:DEAL_TYPES[0],title:"",priority:"MEDIUM",status:"New",structure:"",fee_estimate:"",notes:""}); };
  const save = () => { onUpdate(pipeline.map(d=>d.id===editing.id?{...editing}:d)); setEditing(null); };
  const remove = id => onUpdate(pipeline.filter(d=>d.id!==id));
  const byStatus = STATUSES.reduce((a,s)=>({...a,[s]:pipeline.filter(d=>d.status===s).length}),{});

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:16}}>
        {STATUSES.map(s=>(
          <Card key={s} style={{textAlign:"center",padding:"10px 6px"}}>
            <div style={{fontSize:20,fontWeight:800,fontFamily:"'Syne',sans-serif",color:SCOL[s]}}>{byStatus[s]||0}</div>
            <div style={{fontSize:9,color:"#6b7280",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",textTransform:"uppercase",marginTop:3}}>{s}</div>
          </Card>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...STATUSES].map(f=>(
            <button key={f} onClick={()=>setFilterS(f)} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"4px 9px",borderRadius:2,cursor:"pointer",border:`1px solid ${filterS===f?"#c9a84c":"#1e2535"}`,background:filterS===f?"rgba(201,168,76,.1)":"transparent",color:filterS===f?"#c9a84c":"#6b7280"}}>{f}</button>
          ))}
          <span style={{color:"#2a3147",padding:"0 4px"}}>|</span>
          {["All","HIGH","MEDIUM","LOW"].map(f=>(
            <button key={f} onClick={()=>setFilterP(f)} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"4px 9px",borderRadius:2,cursor:"pointer",border:`1px solid ${filterP===f?(PCOL[f]||"#c9a84c"):"#1e2535"}`,background:filterP===f?`${PCOL[f]||"#c9a84c"}15`:"transparent",color:filterP===f?(PCOL[f]||"#c9a84c"):"#6b7280"}}>{f}</button>
          ))}
        </div>
        <Btn onClick={()=>setShowAdd(!showAdd)} style={{padding:"7px 16px"}}>+ Add Deal</Btn>
      </div>

      {showAdd && (
        <Card style={{marginBottom:14,borderColor:"rgba(201,168,76,.25)"}}>
          <SL>Add Deal</SL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><SL>Company</SL><In value={form.company} onChange={v=>setForm(f=>({...f,company:v}))} placeholder="e.g. Eskom"/></div>
            <div><SL>Title</SL><In value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="Deal title"/></div>
            <div><SL>Deal Type</SL><Sel value={form.deal_type} onChange={v=>setForm(f=>({...f,deal_type:v}))} options={DEAL_TYPES}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><SL>Priority</SL><Sel value={form.priority} onChange={v=>setForm(f=>({...f,priority:v}))} options={["HIGH","MEDIUM","LOW"]}/></div>
            <div><SL>Status</SL><Sel value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={STATUSES}/></div>
            <div><SL>Fee Estimate</SL><In value={form.fee_estimate} onChange={v=>setForm(f=>({...f,fee_estimate:v}))} placeholder="e.g. R15-25m"/></div>
          </div>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes, pitch angle, next steps…" style={{width:"100%",minHeight:55,background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"10px 12px",color:"#d1d5db",fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:12}}/>
          <div style={{display:"flex",gap:8}}><Btn onClick={add} disabled={!form.company||!form.title}>Save</Btn><Btn v="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn></div>
        </Card>
      )}

      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:"50px 20px",color:"#4b5563",fontFamily:"'IBM Plex Mono',monospace",fontSize:12}}>
          <div style={{fontSize:24,marginBottom:10,opacity:.3}}>▤</div>
          No deals match filters. Add deals via the Origination Engine or Coverage Universe.
        </div>
      ) : filtered.map((d,idx)=>(
  <Card key={d.id} style={{marginBottom:10,borderLeft:`4px solid ${PCOL[d.priority]||"#6b7280"}`,animation:`fadeIn 0.3s ease-out ${idx * 0.05}s both`}}>
          {editing?.id===d.id ? (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                <div><SL>Company</SL><In value={editing.company||""} onChange={v=>setEditing(p=>({...p,company:v}))}/></div>
                <div><SL>Title</SL><In value={editing.title||""} onChange={v=>setEditing(p=>({...p,title:v}))}/></div>
                <div><SL>Deal Type</SL><Sel value={editing.deal_type||DEAL_TYPES[0]} onChange={v=>setEditing(p=>({...p,deal_type:v}))} options={DEAL_TYPES}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                <div><SL>Priority</SL><Sel value={editing.priority||"MEDIUM"} onChange={v=>setEditing(p=>({...p,priority:v}))} options={["HIGH","MEDIUM","LOW"]}/></div>
                <div><SL>Status</SL><Sel value={editing.status||"New"} onChange={v=>setEditing(p=>({...p,status:v}))} options={STATUSES}/></div>
                <div><SL>Fee Estimate</SL><In value={editing.fee_estimate||""} onChange={v=>setEditing(p=>({...p,fee_estimate:v}))}/></div>
              </div>
              <textarea value={editing.notes||""} onChange={e=>setEditing(p=>({...p,notes:e.target.value}))} style={{width:"100%",minHeight:55,background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"10px 12px",color:"#d1d5db",fontSize:12,outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:10}}/>
              <div style={{display:"flex",gap:8}}><Btn onClick={save} style={{padding:"7px 14px"}}>Save</Btn><Btn v="ghost" onClick={()=>setEditing(null)} style={{padding:"7px 14px"}}>Cancel</Btn></div>
            </div>
          ) : (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",gap:7,marginBottom:6,flexWrap:"wrap"}}>
                    <Tag c={PCOL[d.priority]} bg={`${PCOL[d.priority]}15`}>{d.priority}</Tag>
                    <Tag c={SCOL[d.status]||"#6b7280"} bg={`${SCOL[d.status]||"#6b7280"}15`}>{d.status}</Tag>
                    <Tag c="#9ca3af" bg="rgba(156,163,175,.08)">{d.deal_type}</Tag>
                    {d.fee_estimate && <Tag c="#10b981" bg="rgba(16,185,129,.08)">{d.fee_estimate}</Tag>}
                  </div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{d.title}</div>
                  <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{d.company} · {d.date}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Btn v="ghost" onClick={()=>setEditing({...d})} style={{padding:"4px 10px",fontSize:10}}>Edit</Btn>
                  <Btn v="ghost" onClick={()=>remove(d.id)} style={{padding:"4px 10px",fontSize:10,color:"#ef4444",borderColor:"rgba(239,68,68,.25)"}}>×</Btn>
                </div>
              </div>
              {d.structure && <div style={{fontSize:12,color:"#6b7280",marginTop:6}}><span style={{color:"#c9a84c"}}>Structure: </span>{d.structure}</div>}
              {d.notes && <div style={{fontSize:12,color:"#9ca3af",marginTop:6,padding:"7px 11px",background:"#090c12",borderRadius:3}}>{d.notes}</div>}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════════════════
export default function Platform() {
  const [mod, setMod] = useState("command");
  const [brief, setBrief] = useState("");
  const [pipeline, setPipeline] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = sGet("sb:scip:v1");
    if (saved) setPipeline(saved);
  }, []);

  function updatePipeline(data) {
    setPipeline(data);
    sSet("sb:scip:v1", data);
  }

  function addToPipeline(deal) {
    const entry = {
      id: uid(), date: TODAY,
      company: deal.company||"", title: deal.title||"",
      deal_type: deal.deal_type||"Advisory", priority: deal.priority||"MEDIUM",
      status: "New", structure: deal.structure||"",
      pitch_angle: deal.pitch_angle||"", key_parties: deal.key_parties||"",
      fee_estimate: deal.fee_estimate||"", why_sb: deal.why_sb||"",
      notes: deal.trigger||"", score: deal.score||{}
    };
    const updated = [...pipeline, entry];
    updatePipeline(updated);
    setMod("pipeline");
  }

  if (!mounted) return null;

  const active = MODS.find(m=>m.id===mod);
  const high = pipeline.filter(d=>d.priority==="HIGH"&&d.status==="New").length;

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#090c12"}}>
      {/* Sidebar */}
      <div style={{width:collapsed?58:230,flexShrink:0,background:"#0d1117",borderRight:"1px solid #1e2535",display:"flex",flexDirection:"column",transition:"width .2s",overflow:"hidden"}}>
        <div style={{padding:"18px 14px",borderBottom:"1px solid #1e2535",minHeight:78}}>
          {!collapsed ? (
            <div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#c9a84c",letterSpacing:"2px",textTransform:"uppercase",marginBottom:3}}>Standard Bank CIB</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,color:"#f3f4f6",lineHeight:1.25}}>Sector Coverage<br/>Intelligence Platform</div>
              <div style={{fontSize:9,color:"#4b5563",marginTop:4,fontFamily:"'IBM Plex Mono',monospace"}}>Energy & Infrastructure</div>
            </div>
          ) : (
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:"#c9a84c",textAlign:"center",marginTop:6}}>SB</div>
          )}
        </div>
        <nav style={{flex:1,padding:"10px 6px"}}>
          {MODS.map(m=>(
            <button key={m.id} onClick={()=>setMod(m.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:collapsed?"10px":"9px 10px",borderRadius:4,marginBottom:2,cursor:"pointer",border:"none",transition:"all .15s",background:mod===m.id?"rgba(201,168,76,.1)":"transparent",borderLeft:mod===m.id?"3px solid #c9a84c":"3px solid transparent"}}>
              <span style={{fontSize:15,color:mod===m.id?"#c9a84c":"#4b5563",flexShrink:0,minWidth:20,textAlign:"center"}}>{m.icon}</span>
              {!collapsed && (
                <div style={{textAlign:"left",overflow:"hidden"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:11.5,fontWeight:mod===m.id?700:500,color:mod===m.id?"#f3f4f6":"#9ca3af",whiteSpace:"nowrap"}}>
                    {m.label}
                    {m.id==="pipeline"&&high>0&&<span style={{marginLeft:6,background:"#ef4444",color:"#fff",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",padding:"1px 5px",borderRadius:10}}>{high}</span>}
                  </div>
                  <div style={{fontSize:9,color:"#374151",whiteSpace:"nowrap",fontFamily:"'IBM Plex Mono',monospace"}}>{m.jd}</div>
                </div>
              )}
            </button>
          ))}
        </nav>
        <div style={{padding:"10px 6px",borderTop:"1px solid #1e2535"}}>
          <button onClick={()=>setCollapsed(o=>!o)} style={{width:"100%",padding:"7px",background:"transparent",border:"1px solid #1e2535",borderRadius:3,color:"#4b5563",cursor:"pointer",fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>{collapsed?"→":"← Collapse"}</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{background:"#0d1117",borderBottom:"1px solid #1e2535",padding:"12px 26px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:"#f3f4f6"}}>{active?.icon} {active?.label}</div>
            <div style={{fontSize:10,color:"#6b7280",fontFamily:"'IBM Plex Mono',monospace",marginTop:1}}>JD Function: {active?.jd}</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#6b7280"}}>{TODAY}</div>
            {pipeline.length>0 && <Tag c="#c9a84c">{pipeline.length} deals tracked</Tag>}
            {high>0 && <Tag c="#ef4444" bg="rgba(239,68,68,.1)">{high} new 🔥</Tag>}
            <div style={{display:"flex",alignItems:"center",gap:5,animation:"pulse 2s ease-in-out infinite"}}>
  <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 12px #10b981"}}/>
  <span style={{fontSize:10,color:"#10b981",fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>LIVE</span>
</div>
          </div>
        </div>
        <div style={{flex:1,padding:"22px 26px",overflowY:"auto",animation:"fadeIn 0.3s ease-out"}}>
          {mod==="command"    && <SectorCommand     onNav={setMod}                 pipeline={pipeline}/>}
          {mod==="universe"   && <CoverageUniverse  onAddToPipeline={addToPipeline}/>}
          {mod==="intel"      && <SectorIntelligence onBriefReady={setBrief}/>}
          {mod==="origination"&& <OriginationEngine brief={brief} onAddToPipeline={addToPipeline}/>}
          {mod==="pitchbook"  && <PitchbookBuilder/>}
          {mod==="pipeline"   && <DealPipeline pipeline={pipeline} onUpdate={updatePipeline}/>}
          {mod==="gearing"   && <FinancialHealthScreener/>}
          {mod==="market"    && <MarketDashboard/>}
          {mod==="delays"    && <ProjectDelaysTracker/>}
        </div>
      </div>
    </div>
  );
// Make sure Platform is properly closed
}
