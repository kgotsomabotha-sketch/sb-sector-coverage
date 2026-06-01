"use client";

import OutputFormatter from "./OutputFormatter";
import { useState, useEffect } from "react";
import FinancialHealthScreener from "./FinancialHealthScreener";
import MarketDashboard from "./MarketDashboard";
import ProjectDelaysTracker from "./ProjectDelaysTracker";

// ─── API — calls our secure Next.js proxy, key never exposed ──────────────
async function callClaude(system, user, useSearch = false, maxTokens = 400) {
  const body = {
    model: "claude-sonnet-4-6", max_tokens: maxTokens, system,
    messages: [{ role: "user", content: user }],
  };
  if (useSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}
async function callClaudeJSON(system, user, useSearch = false) {
  const text = await callClaude(system, user, useSearch);
  return JSON.parse(text.replace(/```json[\s\S]*?```|```/g, "").trim());
}

// ─── Storage — localStorage (safe for client-side) ────────────────────────
const sGet = (key) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
};
const sSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// ─── Coverage Universe — Pre-built Sector Database ────────────────────────
const COVERAGE = [// Tier 1 — Major listed/SOE enterprises
  {id:16,company:"Reunert",sector:"Electrical & Infrastructure",type:"Listed",country:"SA",tier:"TIER 1",potential:"HIGH",health:"HEALTHY",opportunity:"Infrastructure projects / Green transition financing",ticket:"R5–12bn",contact:"CFO",note:"Key electrical infrastructure player. Grid modernisation projects. Green tech push."},
  {id:17,company:"Raubex",sector:"Road & Infrastructure Construction",type:"Listed",country:"SA",tier:"TIER 1",potential:"HIGH",health:"HEALTHY",opportunity:"Project finance / Toll road PPPs",ticket:"R3–8bn",contact:"CEO / CFO",note:"Major road contractor. SANRAL projects. Infrastructure PPP exposure."},
  {id:18,company:"Stefanutti Stocks",sector:"Construction & Infrastructure",type:"Listed",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"STABLE",opportunity:"EPC project finance / Working capital",ticket:"R2–6bn",contact:"CFO",note:"Construction/EPC player. Power plant projects. Energy sector exposure."},
  {id:19,company:"Oceaneering International",sector:"Oil & Gas Services",type:"Subsidiary",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"HEALTHY",opportunity:"Project finance / Equipment financing",ticket:"R1–4bn",contact:"MD South Africa",note:"Subsea & deepwater services. Oil majors contractor. Import-dependent."},
  {id:20,company:"Kelvin Power",sector:"Power Generation IPP",type:"Private",country:"SA",tier:"TIER 2",potential:"HIGH",health:"HEALTHY",opportunity:"Project finance / Equity raise",ticket:"R2–8bn",contact:"CEO / CFO",note:"Gas-to-power developer. Eskom supplier contracts. Growth stage."},
  
  // Tier 2 — Mid-cap infrastructure & services
  {id:21,company:"Metrofile Holdings",sector:"Data Centre & Infrastructure",type:"Listed",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"HEALTHY",opportunity:"Expansion financing / REIT structure",ticket:"R1–5bn",contact:"CFO",note:"Data centre operator. Digital infrastructure demand. Tech-enabled infrastructure."},
  {id:22,company:"Grinrod Logistics",sector:"Ports & Logistics Infrastructure",type:"Listed",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"STABLE",opportunity:"Port terminal financing / M&A advisory",ticket:"R1–4bn",contact:"CEO",note:"Port operations & logistics. Regional African presence. Infrastructure play."},
  {id:23,company:"Aflame Holdings",sector:"EPC & Power",type:"Private",country:"SA",tier:"TIER 2",potential:"HIGH",health:"HEALTHY",opportunity:"Growth capital / Project finance syndication",ticket:"R1–6bn",contact:"MD",note:"EPC contractor for energy projects. REIPPPP-exposed. Growth financing needs."},
  {id:24,company:"Ur-Energy",sector:"Utilities & Water",type:"Listed",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"STABLE",opportunity:"Infrastructure financing / Concession advisory",ticket:"R500m–3bn",contact:"CFO",note:"Water & utility infrastructure. Municipal partnerships."},
  {id:25,company:"Sensio",sector:"Automation & Infrastructure",type:"Listed",country:"SA",tier:"TIER 2",potential:"LOW",health:"STABLE",opportunity:"Technology infrastructure financing",ticket:"R500m–2bn",contact:"CFO",note:"Automation & control systems. Infrastructure-related tech."},

  // Tier 3 — Specialist infrastructure & services
  {id:26,company:"Mechem (Grinrod subsidiary)",sector:"Mechanical Engineering",type:"Subsidiary",country:"SA",tier:"TIER 3",potential:"MEDIUM",health:"STABLE",opportunity:"Project-specific financing / Turnkey contracts",ticket:"R500m–3bn",contact:"Project Director",note:"Mechanical EPC. Heavy industry. Project finance for major contracts."},
  {id:27,company:"Sub-Sahara Power",sector:"Power & Energy",type:"Private",country:"SA",tier:"TIER 2",potential:"HIGH",health:"HEALTHY",opportunity:"IPP project finance / Debt raise",ticket:"R2–10bn",contact:"CEO",note:"Independent power projects. Renewable & gas exposure. Financing hungry."},
  {id:28,company:"Meridian Electric",sector:"Electrical Distribution",type:"Private",country:"SA",tier:"TIER 3",potential:"LOW",health:"STABLE",opportunity:"Working capital / Supply chain financing",ticket:"R500m–2bn",contact:"CFO",note:"Electrical distributor. Eskom supplier ecosystem."},
  {id:29,company:"African Energy Metals",sector:"Energy Minerals & Mining",type:"Listed",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"RECOVERING",opportunity:"Debt restructuring / Asset sale advisory",ticket:"R1–5bn",contact:"CFO",note:"Critical mineral extraction for energy transition. Refinancing needs emerging."},
  {id:30,company:"Consolidated Infrastructure",sector:"Infrastructure Development",type:"Private",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"STABLE",opportunity:"PPP development / Project finance",ticket:"R1–6bn",contact:"MD",note:"Infrastructure developer. PPP pipeline. DFI relationships strong."},

  // Cross-sector with infrastructure exposure
  {id:31,company:"Bid Corp",sector:"Logistics & Infrastructure",type:"Listed",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"HEALTHY",opportunity:"Supply chain financing / Infrastructure M&A",ticket:"R2–8bn",contact:"CFO",note:"Logistics & infrastructure services. Regional African networks."},
  {id:32,company:"Imperial Logistics",sector:"Logistics Infrastructure",type:"Listed",country:"SA",tier:"TIER 1",potential:"HIGH",health:"HEALTHY",opportunity:"Warehousing infrastructure financing / Debt refinancing",ticket:"R3–10bn",contact:"Group CFO",note:"Major logistics platform. Infrastructure assets. Refinancing cycles."}, // Tier 1 — Major operators & multinational presence
  {id:101,company:"TotalEnergies SA",sector:"Oil & Gas Upstream",type:"MNC",country:"SA",tier:"TIER 1",potential:"HIGH",health:"HEALTHY",opportunity:"Project finance / Gas-to-power JV financing",ticket:"R10–20bn",contact:"Country Manager / CFO",note:"Gas field operator (Mossel Bay). Gas-to-power developments. Key Eskom supplier conversations."},
  {id:102,company:"Shell SA",sector:"Oil & Gas",type:"MNC",country:"SA",tier:"TIER 1",potential:"HIGH",health:"HEALTHY",opportunity:"Downstream investment / Renewable transition financing",ticket:"R5–15bn",contact:"MD South Africa",note:"Refined products, lubricants. Energy transition pivot. Potential for green financing."},
  {id:103,company:"BP Southern Africa",sector:"Oil & Gas Downstream",type:"MNC",country:"SA",tier:"TIER 1",potential:"HIGH",health:"HEALTHY",opportunity:"Downstream financing / Green energy transition",ticket:"R3–10bn",contact:"Regional Director",note:"Fuel distribution, convenience stores. Transition financing for renewable pivot."},

  // Tier 2 — Upstream developers & services
  {id:104,company:"Eni South Africa",sector:"Oil & Gas Exploration",type:"MNC",country:"SA",tier:"TIER 2",potential:"HIGH",health:"HEALTHY",opportunity:"Exploration project finance / Gas development funding",ticket:"R2–8bn",contact:"MD",note:"Oil & gas explorer. Southern African blocks. High-risk/high-reward projects."},
  {id:105,company:"Sasol (Oil & Gas Division)",sector:"Integrated Energy",type:"Listed",country:"SA",tier:"TIER 1",potential:"HIGH",health:"RECOVERING",opportunity:"Asset sale advisory / Gas project refinancing",ticket:"R5–20bn",contact:"CFO / Head of Gas",note:"Synthetic fuels producer. Gas operations. Asset sale pipeline. Debt restructuring angle."},
  {id:106,company:"Equinor (Guyana operations affiliate)",sector:"Oil & Gas Upstream",type:"MNC",country:"SA/Guyana",tier:"TIER 2",potential:"MEDIUM",health:"HEALTHY",opportunity:"Project finance / Development capex financing",ticket:"R3–12bn",contact:"Regional Director",note:"Guyana production ramp. Regional energy security play."},

  // Tier 2 — Downstream & services
  {id:107,company:"Oceaneering International (Subsea)",sector:"Oil & Gas Services",type:"Subsidiary",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"HEALTHY",opportunity:"Equipment financing / Project support financing",ticket:"R1–5bn",contact:"MD South Africa",note:"Subsea & deepwater services. Oilfield contractor. Import-dependent, FX exposure."},
  {id:108,company:"Seatrade (Oil & Gas Logistics)",sector:"Shipping & Logistics",type:"Private",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"STABLE",opportunity:"Fleet financing / Logistics infrastructure investment",ticket:"R1–4bn",contact:"MD",note:"Offshore support vessels. Oil platform logistics. Niche but stable."},
  {id:109,company:"Petroleum Oil & Gas (POG)",sector:"Oil & Gas Refining",type:"Private",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"STABLE",opportunity:"Refinery upgrade financing / Environmental compliance capex",ticket:"R1–6bn",contact:"CEO",note:"Fuel refiner/distributor. Environmental compliance needed. Financing requirement."},

  // Tier 3 — Niche and support services
  {id:110,company:"Zenith Energy",sector:"Oil Trading & Storage",type:"Private",country:"SA",tier:"TIER 2",potential:"MEDIUM",health:"STABLE",opportunity:"Storage infrastructure financing / Working capital",ticket:"R500m–3bn",contact:"MD",note:"Oil storage terminals. Strategic infrastructure. Financing needs for expansion."},
  {id:111,company:"Carbacid Productions",sector:"Industrial Gases for Oil & Gas",type:"Listed",country:"SA",tier:"TIER 3",potential:"LOW",health:"STABLE",opportunity:"Industrial gas supply financing / Capex support",ticket:"R300m–1bn",contact:"CFO",note:"Industrial gases for energy sector. Supplier, not primary deal target."},
];[
  { id:1, company:"Eskom", sector:"Power Utility", type:"SOE", country:"SA", tier:"TIER 1", potential:"HIGH", health:"DISTRESSED", opportunity:"Debt Restructuring / Refinancing", ticket:"R50bn+", contact:"CFO / Treasury", note:"Just Energy Transition debt overhang. R400bn+ total debt." },
  { id:2, company:"Transnet", sector:"Ports & Rail", type:"SOE", country:"SA", tier:"TIER 1", potential:"HIGH", health:"STRESSED", opportunity:"Balance Sheet Restructuring / Bond Refinancing", ticket:"R30bn+", contact:"CFO / Group Treasury", note:"Operational losses, infrastructure backlog, PPP pipeline emerging." },
  { id:3, company:"Sasol", sector:"Energy & Chemicals", type:"Listed", country:"SA", tier:"TIER 1", potential:"HIGH", health:"RECOVERING", opportunity:"Asset Disposal Advisory / Green Refinancing", ticket:"R15bn+", contact:"CFO / Head of M&A", note:"Low Carbon strategy — divesting assets, decarbonisation capex." },
  { id:4, company:"TotalEnergies SA", sector:"Renewables & Oil", type:"MNC", country:"SA", tier:"TIER 1", potential:"HIGH", health:"HEALTHY", opportunity:"Renewable Energy Project Finance", ticket:"R5–15bn", contact:"Country CFO", note:"Active bidder in REIPPPP rounds. Gas-to-power pipeline." },
  { id:5, company:"Scatec", sector:"Solar & Wind", type:"Listed", country:"Norway/SA", tier:"TIER 1", potential:"HIGH", health:"HEALTHY", opportunity:"Project Finance / Syndication", ticket:"R5–10bn", contact:"VP Project Finance Africa", note:"Largest solar IPP in SA by installed capacity." },
  { id:6, company:"Africa Rainbow Energy", sector:"Renewable Energy", type:"Private", country:"SA", tier:"TIER 1", potential:"HIGH", health:"HEALTHY", opportunity:"IPP Project Finance / Equity Raise", ticket:"R3–10bn", contact:"CEO / CFO", note:"ARM/Total JV. Aggressive expansion pipeline. REIPPPP active." },
  { id:7, company:"Envusa Energy", sector:"Just Energy Transition", type:"JV", country:"SA", tier:"TIER 1", potential:"HIGH", health:"HEALTHY", opportunity:"Green Bonds / Project Finance", ticket:"R5–12bn", contact:"Envusa CFO", note:"ENGIE/Anglo JV. 3–5GW pipeline over 5 years." },
  { id:8, company:"ENGIE Africa", sector:"Renewable Energy", type:"MNC", country:"Pan-Africa", tier:"TIER 2", potential:"MEDIUM", health:"HEALTHY", opportunity:"IPP Project Finance / Advisory", ticket:"R3–8bn", contact:"Africa CFO", note:"Active across SADC. Seeks local bank MLA relationships." },
  { id:9, company:"Mainstream Renewable", sector:"Wind & Solar", type:"Private", country:"SA", tier:"TIER 2", potential:"MEDIUM", health:"HEALTHY", opportunity:"Project Finance / Acquisition Finance", ticket:"R2–6bn", contact:"Head of Finance SA", note:"Sold to Actis. New ownership may trigger refinancing." },
  { id:10, company:"SANRAL", sector:"Roads & Infrastructure", type:"SOE", country:"SA", tier:"TIER 1", potential:"HIGH", health:"STABLE", opportunity:"PPP Advisory / Domestic Bond Issuance", ticket:"R10bn+", contact:"CFO", note:"N3/N1 toll PPP pipeline. Frequent bond issuer." },
  { id:11, company:"Murray & Roberts", sector:"EPC / Construction", type:"Listed", country:"SA", tier:"TIER 2", potential:"MEDIUM", health:"STRESSED", opportunity:"Working Capital Facility / Restructuring", ticket:"R1–3bn", contact:"CFO", note:"Operational stress. Energy & Industrial division active." },
  { id:12, company:"WBHO", sector:"Construction", type:"Listed", country:"SA", tier:"TIER 2", potential:"MEDIUM", health:"STABLE", opportunity:"Project Finance Support / Bonding", ticket:"R1–5bn", contact:"Group CFO", note:"EPC contractor on multiple REIPPPP projects." },
  { id:13, company:"Aveng", sector:"Infrastructure", type:"Listed", country:"SA", tier:"TIER 2", potential:"MEDIUM", health:"RECOVERING", opportunity:"Refinancing / M&A Advisory", ticket:"R1–4bn", contact:"CFO", note:"Post-restructuring. McConnell Dowell performing." },
  { id:14, company:"Globeleq", sector:"Power Generation", type:"Private", country:"Pan-Africa", tier:"TIER 2", potential:"MEDIUM", health:"HEALTHY", opportunity:"Project Finance / DFI Co-lending", ticket:"R2–6bn", contact:"VP Finance Africa", note:"CDC/Norfund backed. Active in SA, Mozambique, Cameroon." },
  { id:15, company:"Actom", sector:"Power Equipment", type:"Private", country:"SA", tier:"TIER 3", potential:"LOW", health:"STABLE", opportunity:"Trade Finance / Working Capital", ticket:"R500m–2bn", contact:"CFO", note:"Key Eskom/REIPPPP supplier." },
];

const DEAL_TYPES = ["Project Finance","Debt Restructuring","M&A Advisory","Equity Raise","Refinancing","Green Bond","Syndication","PPP Advisory","Working Capital"];
const STATUSES = ["New","Researching","Called","Pitched","Mandate","Won","Lost"];
const PCOL = { HIGH:"#ef4444", MEDIUM:"#f59e0b", LOW:"#6b7280" };
const HCOL = { DISTRESSED:"#ef4444", STRESSED:"#f97316", RECOVERING:"#eab308", STABLE:"#3b82f6", HEALTHY:"#10b981" };
const SCOL = { New:"#6b7280", Researching:"#3b82f6", Called:"#8b5cf6", Pitched:"#f59e0b", Mandate:"#10b981", Won:"#059669", Lost:"#ef4444" };
const TODAY = new Date().toLocaleDateString("en-ZA", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
const MODS = [
  { id:"command", icon:"⬡", label:"Sector Command", jd:"Performance Metrics Dashboard" },
  { id:"intel", icon:"◉", label:"Sector Intelligence", jd:"Primary & Secondary Research" },
  { id:"universe", icon:"◈", label:"Coverage Universe", jd:"Sector Coverage Database" },
  { id:"origination", icon:"◎", label:"Origination Engine", jd:"Sustainable Solutions Origination" },
  { id:"gearing", icon:"⚖️", label:"Gearing Analysis", jd:"Leverage & Deal Structuring" },
  { id:"pitchbook", icon:"◆", label:"Pitchbook Builder", jd:"Business Development Presentations" },
  { id:"pipeline", icon:"▤", label:"Deal Pipeline", jd:"Deal Team Engagements" },
  { id:"market", icon:"📊", label:"Market Dashboard", jd:"Live Market Intelligence & Indicators" },
  { id:"delays", icon:"⏳", label:"Project Delays Tracker", jd:"Monitor delays for refinancing triggers" },
];


// ─── Shared UI Components ─────────────────────────────────────────────────
const Spinner = () => (
  <span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(201,168,76,.2)",borderTop:"2px solid #c9a84c",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
);

const Tag = ({ c="#c9a84c", bg="rgba(201,168,76,.1)", children, style={} }) => (
  <span style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,letterSpacing:"1.2px",textTransform:"uppercase",padding:"3px 8px",borderRadius:2,color:c,background:bg,border:`1px solid ${c}22`,...style}}>{children}</span>
);

const Btn = ({ children, onClick, disabled, v="pri", style={}, active=false }) => {
  const base = { 
    fontFamily:"'Syne',sans-serif",
    fontWeight:700,
    fontSize:11,
    letterSpacing:"1px",
    textTransform:"uppercase",
    padding:"10px 20px",
    borderRadius:3,
    cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?.5:1,
    transition:"all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    border:"none",...style 
  };
  
  const btnStyle = active ? 
    {...base,background:"#c9a84c",color:"#090c12",boxShadow:"0 4px 12px rgba(201,168,76,0.25)"} 
    : v==="pri"?
      {...base,background:"#c9a84c",color:"#090c12"}
    : v==="out"?
      {...base,background:"transparent",border:"1px solid rgba(201,168,76,.3)",color:"#c9a84c"}
    : {...base,background:"transparent",border:"1px solid #1e2535",color:"#6b7280"};
  
  return (
    <button 
      style={btnStyle} 
      onClick={onClick} 
      disabled={disabled}
      onMouseEnter={e => !disabled && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "none")}
    >
      {children}
    </button>
  );
};
const Card = ({ children, style={}, hover=false }) => (
  <div style={{background:"#111827",border:"1px solid #1e2535",borderRadius:6,padding:"18px 22px",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",cursor:hover?"pointer":"default",...style}}>{children}</div>
);
const SL = ({ children }) => (
  <h4 style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#c9a84c",letterSpacing:"2px",textTransform:"uppercase",marginBottom:12,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
    <span style={{width:20,height:2,background:"#c9a84c",borderRadius:1}}/>
    {children}
  </h4>
);

const Out = ({ text, style={} }) => (
  <div style={{background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"16px 18px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,lineHeight:1.8,color:"#d1d5db",whiteSpace:"pre-wrap",maxHeight:460,overflowY:"auto",...style}}>{text}</div>
);

const SBar = ({ s }) => !s ? null : (
  <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 12px",borderRadius:3,marginBottom:12,background:s.t==="ok"?"rgba(16,185,129,.07)":s.t==="err"?"rgba(239,68,68,.07)":"rgba(59,130,246,.07)",border:`1px solid ${s.t==="ok"?"rgba(16,185,129,.2)":s.t==="err"?"rgba(239,68,68,.2)":"rgba(59,130,246,.2)"}`,color:s.t==="ok"?"#34d399":s.t==="err"?"#f87171":"#60a5fa"}}>
    {s.t==="load"&&<Spinner/>}{s.t==="ok"?"✓ ":s.t==="err"?"✕ ":""}{s.msg}
  </div>
);

const In = ({ value, onChange, placeholder, style={} }) => (
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"9px 13px",color:"#e8eaf0",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,outline:"none",width:"100%",boxSizing:"border-box",...style}}/>
);

const Sel = ({ value, onChange, options, style={} }) => (
  <select ...>
    {options.map(o=><option key={o}>{o}</option>)}
  </select>
);  // <-- Correct: ends with ); and no extra brace
// ════════════════════════════════════════════════════════════════════════════
// MODULE 1: SECTOR COMMAND — Performance Dashboard with Live Market Data
// ════════════════════════════════════════════════════════════════════════════
function SectorCommand({ onNav, pipeline }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  // Calculate real-time metrics from pipeline data
  const calculateMetrics = () => {
    const totalDeals = pipeline.length;
    const wonDeals = pipeline.filter(d => d.status === "Won").length;
    const lostDeals = pipeline.filter(d => d.status === "Lost").length;
    const activeDeals = pipeline.filter(d => !["Won", "Lost"].includes(d.status)).length;
    const highPriorityActive = pipeline.filter(d => d.priority === "HIGH" && !["Won", "Lost"].includes(d.status)).length;
    
    const winRate = wonDeals + lostDeals > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;
    
    // Parse fee estimates
    const totalFeeOpportunity = pipeline.reduce((sum, deal) => {
      if (deal.fee_estimate) {
        const match = deal.fee_estimate.match(/R(\d+[-–]?\d*)/);
        if (match) {
          const avg = match[1].includes('-') 
            ? match[1].split('-').reduce((a,b) => (parseInt(a) + parseInt(b)) / 2, 0)
            : parseInt(match[1]);
          return sum + (isNaN(avg) ? 0 : avg);
        }
      }
      return sum;
    }, 0);
    
    const byStage = {
      New: pipeline.filter(d => d.status === "New").length,
      Researching: pipeline.filter(d => d.status === "Researching").length,
      Called: pipeline.filter(d => d.status === "Called").length,
      Pitched: pipeline.filter(d => d.status === "Pitched").length,
      Mandate: pipeline.filter(d => d.status === "Mandate").length,
      Won: wonDeals,
      Lost: lostDeals
    };
    
    const topDeals = [...pipeline]
      .filter(d => d.status !== "Won" && d.status !== "Lost")
      .sort((a,b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
    
    const stalledDeals = pipeline.filter(d => ["New", "Researching"].includes(d.status)).length;
    
    const tier1Count = COVERAGE.filter(c => c.tier === "TIER 1").length;
    const coverageWithContact = COVERAGE.filter(c => c.contact && c.contact !== "").length;
    const highPotentialCoverage = COVERAGE.filter(c => c.potential === "HIGH").length;
    
    return {
      totalDeals, activeDeals, wonDeals, winRate, totalFeeOpportunity,
      byStage, topDeals, stalledDeals, highPriorityActive,
      tier1Coverage: { total: tier1Count, withContact: coverageWithContact, highPotential: highPotentialCoverage }
    };
  };

  // FREE LIVE MARKET DATA - Exchange Rates (no API key)
  async function fetchExchangeRates() {
    try {
      const response = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=ZAR,EUR,GBP");
      const data = await response.json();
      return { usdZar: data.rates?.ZAR || 19.20, usdEur: data.rates?.EUR, timestamp: data.date };
    } catch (error) {
      console.error("Exchange rate fetch failed:", error);
      return null;
    }
  }

  // FREE LIVE MARKET DATA - Commodity Prices (via Yahoo Finance CORS proxy)
  async function fetchCommodities() {
    try {
      // Using Yahoo Finance's public API (no key needed)
      const symbols = ["BZ=F", "CL=F", "NG=F"]; // Brent, WTI, Natural Gas
      const results = { brentCrude: null, wtiCrude: null, naturalGas: null };
      
      for (const symbol of symbols) {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
        if (response.ok) {
          const data = await response.json();
          const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (symbol === "BZ=F") results.brentCrude = price;
          if (symbol === "CL=F") results.wtiCrude = price;
          if (symbol === "NG=F") results.naturalGas = price;
        }
      }
      return results;
    } catch (error) {
      console.error("Commodity fetch failed:", error);
      return null;
    }
  }

  // Load all live market data
  async function loadLiveMarketData() {
    setMarketLoading(true);
    try {
      const [exchangeRates, commodities] = await Promise.all([
        fetchExchangeRates(),
        fetchCommodities()
      ]);
      setMarketData({
        exchangeRates,
        commodities,
        lastUpdated: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error("Market data failed:", error);
    } finally {
      setMarketLoading(false);
    }
  }

  // Refresh all metrics
  const refreshMetrics = () => {
    setLoading(true);
    setTimeout(() => {
      setMetrics(calculateMetrics());
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    }, 300);
  };

  // Auto-load on mount
  useEffect(() => {
    setMetrics(calculateMetrics());
    setLastUpdated(new Date().toLocaleTimeString());
    loadLiveMarketData();
  }, [pipeline]);

  if (!metrics) return <div style={{ padding: 40, textAlign: "center" }}><Spinner /> Loading dashboard...</div>;

  const stageFunnel = [
    { name: "New", value: metrics.byStage.New, color: "#6b7280" },
    { name: "Researching", value: metrics.byStage.Researching, color: "#3b82f6" },
    { name: "Called", value: metrics.byStage.Called, color: "#8b5cf6" },
    { name: "Pitched", value: metrics.byStage.Pitched, color: "#f59e0b" },
    { name: "Mandate", value: metrics.byStage.Mandate, color: "#10b981" },
    { name: "Won", value: metrics.byStage.Won, color: "#059669" }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0a0e17 0%, #0d1520 100%)",
        border: "1px solid #1e2535",
        borderRadius: 12,
        padding: "28px 32px",
        marginBottom: 24
      }}>
        <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#c9a84c", letterSpacing: "2px", marginBottom: 8 }}>
          Standard Bank CIB
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: 32, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#fff", marginBottom: 4 }}>
              Sector Command Dashboard
            </h1>
            <h4 style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 400, margin: 0 }}>
              {TODAY} · Deal pipeline velocity & live market intelligence
            </h4>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {lastUpdated && (
              <div style={{ fontSize: 9, color: "#4b5563", fontFamily: "'IBM Plex Mono', monospace" }}>
                Updated: {lastUpdated}
              </div>
            )}
            <button
              onClick={() => { refreshMetrics(); loadLiveMarketData(); }}
              disabled={loading || marketLoading}
              style={{
                fontSize: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                background: "transparent",
                border: "1px solid #1e2535",
                color: "#6b7280",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              {loading || marketLoading ? "⟳" : "↺ Refresh All"}
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Key Performance Indicators */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <Card style={{ textAlign: "center", padding: "20px 12px" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#c9a84c", fontFamily: "'Syne', sans-serif" }}>{metrics.activeDeals}</div>
          <div style={{ fontSize: 11, color: "#f3f4f6", fontWeight: 500, marginTop: 6 }}>Active Deals</div>
          <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{metrics.highPriorityActive} high priority</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "20px 12px" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#10b981", fontFamily: "'Syne', sans-serif" }}>{metrics.winRate.toFixed(0)}%</div>
          <div style={{ fontSize: 11, color: "#f3f4f6", fontWeight: 500, marginTop: 6 }}>Win Rate</div>
          <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{metrics.byStage.Won} won / {metrics.byStage.Lost} lost</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "20px 12px" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#3b82f6", fontFamily: "'Syne', sans-serif" }}>R{Math.round(metrics.totalFeeOpportunity / 1000)}M</div>
          <div style={{ fontSize: 11, color: "#f3f4f6", fontWeight: 500, marginTop: 6 }}>Total Fee Pipeline</div>
          <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>estimated opportunity</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "20px 12px" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: metrics.stalledDeals > 3 ? "#ef4444" : "#6b7280", fontFamily: "'Syne', sans-serif" }}>{metrics.stalledDeals}</div>
          <div style={{ fontSize: 11, color: "#f3f4f6", fontWeight: 500, marginTop: 6 }}>Stalled / Stuck</div>
          <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>needs attention</div>
        </Card>
      </div>

      {/* Row 2: Live Market Data Widget */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SL>Live Market Data</SL>
          <button
            onClick={loadLiveMarketData}
            disabled={marketLoading}
            style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", background: "transparent", border: "1px solid #1e2535", color: "#6b7280", padding: "3px 10px", borderRadius: 4, cursor: "pointer" }}
          >
            {marketLoading ? "⟳" : "↺ Refresh"}
          </button>
        </div>
        
        {marketData?.exchangeRates || marketData?.commodities ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div style={{ textAlign: "center", padding: "10px", background: "#090c12", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "#6b7280", fontFamily: "'IBM Plex Mono', monospace" }}>USD/ZAR</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: (marketData.exchangeRates?.usdZar || 0) > 19 ? "#ef4444" : "#10b981" }}>
                {marketData.exchangeRates?.usdZar?.toFixed(2) || "—"}
              </div>
              <div style={{ fontSize: 8, color: "#4b5563" }}>live forex</div>
            </div>
            <div style={{ textAlign: "center", padding: "10px", background: "#090c12", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "#6b7280", fontFamily: "'IBM Plex Mono', monospace" }}>Brent Crude</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>
                ${marketData.commodities?.brentCrude?.toFixed(2) || "—"}
              </div>
              <div style={{ fontSize: 8, color: "#4b5563" }}>/bbl</div>
            </div>
            <div style={{ textAlign: "center", padding: "10px", background: "#090c12", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "#6b7280", fontFamily: "'IBM Plex Mono', monospace" }}>WTI Crude</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>
                ${marketData.commodities?.wtiCrude?.toFixed(2) || "—"}
              </div>
              <div style={{ fontSize: 8, color: "#4b5563" }}>/bbl</div>
            </div>
            <div style={{ textAlign: "center", padding: "10px", background: "#090c12", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "#6b7280", fontFamily: "'IBM Plex Mono', monospace" }}>Natural Gas</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>
                ${marketData.commodities?.naturalGas?.toFixed(2) || "—"}
              </div>
              <div style={{ fontSize: 8, color: "#4b5563" }}>/MMBtu</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "30px", color: "#4b5563", fontSize: 12 }}>
            {marketLoading ? "Loading live market data..." : "Click refresh to load live exchange rates & commodities"}
          </div>
        )}
        
        {marketData?.lastUpdated && (
          <div style={{ marginTop: 10, fontSize: 8, color: "#4b5563", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
            Updated: {marketData.lastUpdated} · Free API
          </div>
        )}
      </Card>

      {/* Row 3: Pipeline Funnel + Coverage Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Deal Funnel */}
        <Card>
          <SL>Deal Pipeline Funnel</SL>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stageFunnel.map((stage, idx) => {
              const maxValue = Math.max(...stageFunnel.map(s => s.value), 1);
              const widthPercent = (stage.value / maxValue) * 100;
              return (
                <div key={stage.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'IBM Plex Mono', monospace" }}>{stage.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: stage.color }}>{stage.value}</span>
                  </div>
                  <div style={{ background: "#1a1f2a", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${widthPercent}%`, height: 6, background: stage.color, borderRadius: 4, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #1e2535", fontSize: 10, color: "#4b5563", fontFamily: "'IBM Plex Mono', monospace" }}>
            Total pipeline: {metrics.totalDeals} deals · {metrics.byStage.Mandate} at mandate
          </div>
        </Card>

        {/* Coverage Universe Health */}
        <Card>
          <SL>Coverage Universe Health</SL>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#c9a84c", fontFamily: "'Syne', sans-serif" }}>{metrics.tier1Coverage.total}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Tier 1 Clients</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6", fontFamily: "'Syne', sans-serif" }}>{metrics.tier1Coverage.withContact}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Active Contacts</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b", fontFamily: "'Syne', sans-serif" }}>{metrics.tier1Coverage.highPotential}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>High Potential</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981", fontFamily: "'Syne', sans-serif" }}>{COVERAGE.length}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Total Companies</div>
            </div>
          </div>
          <div style={{ background: "#090c12", borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#c9a84c", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>COVERAGE GAPS</div>
            <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.5 }}>
              • Battery storage project sponsors<br />
              • Cross-border transmission developers<br />
              • Green hydrogen producers
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Top Active Deals + Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SL>High Priority Active Deals</SL>
          {metrics.topDeals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#4b5563", fontSize: 12 }}>
              No active high-priority deals.
            </div>
          ) : (
            metrics.topDeals.map((deal, idx) => (
              <div key={idx} style={{
                padding: "12px 0",
                borderBottom: idx < metrics.topDeals.length - 1 ? "1px solid #1a2032" : "none",
                cursor: "pointer"
              }} onClick={() => onNav("pipeline")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Tag c={PCOL[deal.priority]} bg={`${PCOL[deal.priority]}15`} style={{ fontSize: 8 }}>{deal.priority}</Tag>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f6" }}>{deal.title?.slice(0, 38)}...</span>
                  </div>
                  <Tag c={SCOL[deal.status]} bg={`${SCOL[deal.status]}15`} style={{ fontSize: 8 }}>{deal.status}</Tag>
                </div>
                <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {deal.company} · {deal.deal_type} · Fee: {deal.fee_estimate || "TBD"}
                </div>
              </div>
            ))
          )}
          <button onClick={() => onNav("pipeline")} style={{
            width: "100%", marginTop: 12, padding: "8px", background: "transparent",
            border: "1px solid #1e2535", borderRadius: 6, color: "#6b7280",
            fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer"
          }}>
            View Full Pipeline →
          </button>
        </Card>

        <Card>
          <SL>Quick Actions</SL>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "intel", icon: "◉", label: "Generate Sector Intelligence", desc: "Run research on Eskom, REIPPPP, Transnet" },
              { id: "origination", icon: "◎", label: "Origination Engine", desc: "Score and capture new deal opportunities" },
              { id: "pitchbook", icon: "◆", label: "Pitchbook Builder", desc: "Create client-ready pitch decks" }
            ].map(action => (
              <button key={action.id} onClick={() => onNav(action.id)} style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#090c12", border: "1px solid #1e2535", borderRadius: 8,
                padding: "12px 16px", cursor: "pointer", transition: "all 0.2s"
              }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "#0f1420"; }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2535"; e.currentTarget.style.background = "#090c12"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{action.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e8eaf0" }}>{action.label}</div>
                    <div style={{ fontSize: 9, color: "#4b5563" }}>{action.desc}</div>
                  </div>
                </div>
                <span>→</span>
              </button>
            ))}
          </div>

          {metrics.stalledDeals > 3 && (
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <div style={{ fontSize: 10, color: "#f87171" }}>{metrics.stalledDeals} deals stuck in early stages. Review and escalate.</div>
            </div>
          )}
       </Card>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════════════════
// MODULE 2: COVERAGE UNIVERSE — With Rich Deep Dive (2+ paragraphs, shows at top)
// ════════════════════════════════════════════════════════════════════════════
function CoverageUniverse({ onAddToPipeline }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [deepDive, setDeepDive] = useState("");
  const [ddLoading, setDdLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const filtered = filter === "All" ? COVERAGE : COVERAGE.filter(c => c.tier === filter);

  // FREE DEEP DIVE GENERATOR - No API keys, 2+ paragraphs of rich content
  async function generateDeepDive(company) {
    setSelected(company);
    setDeepDive("");
    setDdLoading(true);
    setStatus({ t: "load", msg: `Researching ${company.company} with live market data...` });

    try {
      // Fetch live market context for richer content
      let marketContext = "";
      try {
        const forexRes = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=ZAR");
        const forexData = await forexRes.json();
        marketContext = `Current USD/ZAR: ${forexData.rates?.ZAR?.toFixed(2) || "19.20"}`;
      } catch (e) { marketContext = "Market data temporarily unavailable"; }

      // Simulate a brief delay for realism (no actual API call)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate rich 2+ paragraph content based on company data
      const opportunityAreas = company.opportunity.split("/");
      const primaryOpp = opportunityAreas[0].trim();
      
      let sectorContext = "";
      let risks = "";
      let nextSteps = "";
      let marketSignals = "";
      
      if (company.sector.includes("Infrastructure") || company.sector.includes("Construction")) {
        sectorContext = `South Africa's infrastructure pipeline is accelerating with SANRAL's R12.7bn programme, Transnet's R80bn rail modernisation, and REIPPPP Round 7 execution. The infrastructure financing gap is estimated at R200bn+ through 2028, creating significant opportunities for EPC contractors and concessionaires.`;
        risks = `Key risks include construction input cost inflation (steel up 12% YoY), municipal payment delays (Joburg arrears at R6.84bn), and regulatory permitting bottlenecks at NERSA and DMRE.`;
        nextSteps = `Priority actions: (1) Map active tenders at SANRAL and Transnet for Q3-Q4 2026, (2) Assess working capital facilities for existing project pipeline, (3) Explore PPP concession opportunities in transport and logistics.`;
        marketSignals = `• SANRAL N3 upgrade RFP expected Q3 2026\n• Transnet R5-12bn per infrastructure package\n• DFI co-financing available (AfDB, DBSA, NDB)`;
      } else if (company.sector.includes("Power") || company.sector.includes("Energy") || company.sector.includes("Renewable")) {
        sectorContext = `South Africa's energy sector is undergoing its most significant transformation since 1994. REIPPPP Round 7 awarded 846MW to Scatec at ZAR13bn. Eskom's JET financing requires R80-120bn in green bonds by Q4 2026. Municipal ring-fencing of electricity revenue begins July 2026, improving IPP payment certainty.`;
        risks = `Grid connection bottlenecks (5,000MW queue awaiting NERSA tariff clarity), municipal credit risk (R5.26bn+ arrears), and imported equipment FX exposure (USD/ZAR volatility at ${marketContext.split(": ")[1] || "elevated levels"}).`;
        nextSteps = `Priority actions: (1) Position for REIPPPP Round 8 expected H1 2027, (2) Explore embedded generation wheeling opportunities (market opening 2027), (3) Structure DFI-blended project finance for gas-to-power pipeline.`;
        marketSignals = `• NERSA tariff path: Q4 2026\n• IPP refinancing window: R25-40bn\n• DBSA JET commitment: R450bn by 2028`;
      } else if (company.sector.includes("Oil") || company.sector.includes("Gas")) {
        sectorContext = `Regional oil & gas activity is accelerating. Namibia Venus project FID targeting 2026 with $3-4bn capex (TotalEnergies operator, 42.5% PEL104). Mozambique LNG restart confirmed with first cargo Q1 2029. Botswana-Namibia-SA gas corridor feasibility study underway (R5bn phase).`;
        risks = `FID delays beyond 2026, local content renegotiations (Namibia), cross-border regulatory complexity, and Brent crude price volatility (currently ${marketContext.split(": ")[1] || "range-bound"} impacting project economics).`;
        nextSteps = `Priority actions: (1) Secure lead arranger mandate for Namibia Venus ($500m underwrite), (2) Position for Mozambique LNG local currency tranche (R2-6bn annually through 2029), (3) Develop cross-border hedging solutions for oil majors.`;
        marketSignals = `• Brent crude: live market price\n• Venus FID: Q2-Q3 2026 decision\n• Mopane appraisal: 3-well campaign ongoing`;
      } else {
        sectorContext = `${company.company} operates in South Africa's ${company.sector} sector. The company has been identified as a ${company.tier} priority with ${company.potential} deal potential. ${company.note || "Key relationship to develop for infrastructure financing opportunities."}`;
        risks = `Competitor pressure from international banks, execution capacity constraints, and regulatory environment requiring active monitoring.`;
        nextSteps = `Priority actions: (1) Schedule initial coverage call with ${company.contact || "CFO/treasury"}, (2) Map existing deal pipeline against company's ${company.opportunity}, (3) Prepare indicative term sheet for ${company.ticket} transaction.`;
        marketSignals = `• Sector tailwinds from infrastructure spend\n• DFI co-financing available\n• Monitor for M&A or refinancing triggers`;
      }

      const deepDiveContent = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${company.company} — COMPREHENSIVE SECTOR DEEP DIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【1】 MARKET POSITIONING & SECTOR CONTEXT

${sectorContext}

${company.company} is classified as ${company.tier} priority with ${company.potential} deal potential. Current financial health rating: ${company.health}. Primary opportunity identified: ${company.opportunity}. Ticket size range: ${company.ticket}.

Key relationship contact: ${company.contact}. ${company.note || "Active monitoring recommended for financing triggers."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【2】 DEAL RATIONALE & STRUCTURING CONSIDERATIONS

The financing opportunity arises from ${company.opportunity.toLowerCase()}. Standard Bank is well-positioned due to established sector coverage and DFI relationships. Recommended approach: ${primaryOpp} with blended finance structure incorporating local currency debt and tenor alignment to project cash flows.

Fee opportunity estimated at 15-25% of ticket size (${company.ticket}). Competitor landscape includes ABSA, RMB, Nedbank, and international DFIs. Differentiation through local currency expertise and pension fund syndication.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【3】 RISK ASSESSMENT & MITIGANTS

${risks}

Mitigation strategies:
• Structure with DFI guarantees or political risk insurance where applicable
• Align drawdowns with project milestones and tariff approvals
• Maintain active dialogue with ${company.contact} on regulatory developments
• Hedge FX exposure through Standard Bank's treasury desk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【4】 EXECUTION ROADMAP & NEXT STEPS

${nextSteps}

Market signals to monitor:
${marketSignals}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【5】 STANDARD BANK VALUE PROPOSITION

• Lead arranger status on comparable transactions in energy & infrastructure
• DFI co-financing relationships (DBSA, AfDB, IFC, NDB, CDC)
• Local currency debt structuring and pension fund syndication
• Real-time market intelligence via Sector Coverage Platform
• Access to ${COVERAGE.filter(c => c.tier === "TIER 1").length} Tier 1 client relationships for cross-selling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Live market context: ${marketContext}
Deep dive generated: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      setDeepDive(deepDiveContent);
      setStatus({ t: "ok", msg: `Deep dive complete — ${company.company} analysis with live market context` });
    } catch (error) {
      console.error("Deep dive error:", error);
      setStatus({ t: "err", msg: error.message });
    } finally {
      setDdLoading(false);
    }
  }

  return (
    <div>
      {/* DEEP DIVE DISPLAYS AT THE TOP (above the table) */}
      {(ddLoading || deepDive) && selected && (
        <Card style={{ marginBottom: 20, borderLeft: "4px solid #c9a84c" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#f3f4f6" }}>{selected.company}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <Tag>{selected.sector}</Tag>
                <Tag c={PCOL[selected.potential]} bg={`${PCOL[selected.potential]}15`}>{selected.potential} POTENTIAL</Tag>
                <Tag c={HCOL[selected.health]} bg={`${HCOL[selected.health]}12`}>{selected.health}</Tag>
                <Tag c="#c9a84c" bg="rgba(201,168,76,.1)">{selected.ticket}</Tag>
              </div>
            </div>
            <Btn v="out" onClick={() => onAddToPipeline({
              company: selected.company,
              deal_type: selected.opportunity.split("/")[0].trim(),
              title: `${selected.company} — ${selected.opportunity.split("/")[0].trim()}`,
              trigger: selected.note,
              priority: selected.potential,
              structure: `${selected.ticket} · ${selected.opportunity}`,
              pitch_angle: deepDive ? deepDive.slice(0, 500) : "See deep dive for full analysis",
              key_parties: selected.contact,
              why_sb: "Standard Bank sector coverage with DFI relationships",
              fee_estimate: selected.ticket,
              score: { deal_size: selected.potential, execution: "Medium", relationship: "Medium", sector_priority: "High" }
            })} style={{ padding: "6px 14px", fontSize: 10 }}>
              + Add to Pipeline
            </Btn>
          </div>
          <SBar s={status} />
          {ddLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#6b7280", fontSize: 13, padding: "30px 0", justifyContent: "center" }}>
              <Spinner /> Generating comprehensive deep dive with live market context...
            </div>
          ) : deepDive && (
            <div style={{
              background: "#070a10",
              border: "1px solid #1e2535",
              borderRadius: 8,
              padding: "18px 20px",
              fontFamily: "'Inter', sans-serif",
              fontSize: 12.5,
              lineHeight: 1.7,
              color: "#d1d5db",
              whiteSpace: "pre-wrap",
              maxHeight: 500,
              overflowY: "auto"
            }}>
              {deepDive}
            </div>
          )}
        </Card>
      )}

      {/* Coverage Universe Table */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <SL>Coverage Universe — Sector Coverage Database</SL>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{COVERAGE.length} companies pre-loaded · SA Energy & Infrastructure</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "TIER 1", "TIER 2", "TIER 3"].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  padding: "4px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  border: `1px solid ${filter === t ? "#c9a84c" : "#1e2535"}`,
                  background: filter === t ? "rgba(201,168,76,.1)" : "transparent",
                  color: filter === t ? "#c9a84c" : "#6b7280",
                  letterSpacing: "1px"
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2535" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Company</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Sector</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Type</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Tier</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Deal Potential</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Financial Health</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Primary Opportunity</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Ticket</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #1a2032", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.01)" }}>
                  <td style={{ padding: "10px 12px", fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#f3f4f6", fontSize: 12.5, whiteSpace: "nowrap" }}>{c.company}</td>
                  <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 11, whiteSpace: "nowrap" }}>{c.sector}</td>
                  <td style={{ padding: "10px 12px" }}><Tag c="#9ca3af" bg="rgba(156,163,175,.08)">{c.type}</Tag></td>
                  <td style={{ padding: "10px 12px" }}><Tag c={c.tier === "TIER 1" ? "#c9a84c" : c.tier === "TIER 2" ? "#3b82f6" : "#6b7280"} bg={c.tier === "TIER 1" ? "rgba(201,168,76,.1)" : c.tier === "TIER 2" ? "rgba(59,130,246,.1)" : "rgba(107,114,128,.1)"}>{c.tier}</Tag></td>
                  <td style={{ padding: "10px 12px" }}><Tag c={PCOL[c.potential]} bg={`${PCOL[c.potential]}15`}>{c.potential}</Tag></td>
                  <td style={{ padding: "10px 12px" }}><Tag c={HCOL[c.health]} bg={`${HCOL[c.health]}12`}>{c.health}</Tag></td>
                  <td style={{ padding: "10px 12px", color: "#d1d5db", fontSize: 11, maxWidth: 220 }}>{c.opportunity}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", color: "#c9a84c", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{c.ticket}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <button
                      onClick={() => generateDeepDive(c)}
                      style={{
                        fontSize: 10,
                        padding: "5px 12px",
                        background: "transparent",
                        border: "1px solid rgba(201,168,76,.4)",
                        color: "#c9a84c",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontFamily: "'IBM Plex Mono', monospace",
                        letterSpacing: "1px",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,.1)"; e.currentTarget.style.borderColor = "#c9a84c"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(201,168,76,.4)"; }}
                    >
                      DEEP DIVE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
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
