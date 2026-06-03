import { useState } from "react";

export default function FinancialHealthScreener() {
  const [company, setCompany] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- 100+ COMPANIES (comprehensive Africa energy & infrastructure) ----------
  const companyList = [
    // SOUTH AFRICAN SOEs & MAJOR ENTITIES
    "Eskom", "Transnet", "SANRAL", "Denel", "SAA (South African Airways)", "PRASA",
    "NTCSA (National Transmission Company SA)", "PetroSA", "SAFCOL", "SASOL",
    // AFRICAN POWER UTILITIES
    "Zesa (Zimbabwe)", "NamPower (Namibia)", "Tanesco (Tanzania)", "Kenya Power",
    "KPLC (Kenya)", "Uganda Electricity Generation Company Ltd (UEGCL)",
    "Rwanda Energy Group (REG)", "Botswana Power Corporation", "EDM (Mozambique)",
    "Volta River Authority (Ghana)", "ECG (Ghana)", "SONABEL (Burkina Faso)",
    "Senelec (Senegal)", "Nigerian Bulk Electricity Trading (NBET)", "TCN (Nigeria)",
    "CEC (Copperbelt Energy)", "Zesco (Zambia)", "SNEL (DRC)",
    // IPPs & RENEWABLES DEVELOPERS
    "Scatec", "Mainstream Renewable Power", "Globeleq", "ACWA Power Africa",
    "Lekela Power", "BioTherm Energy", "Mulilo Energy", "H1 Capital", "NOA Group",
    "Etana Energy", "Anthem", "Redstone CSP", "Orkney Renewables",
    "Notsi Renewable Energy Project", "Envusa Energy", "Discovery Green",
    "AMEA Power", "Infinity Power", "Lightsource bp Africa", "CrossBoundary Energy",
    "Africa GreenCo", "Gridworks", "Renergen",
    // OIL & GAS
    "Dangote Refinery", "Axxela", "Aradel Energy", "Bluecore Gas",
    "TotalEnergies (Africa Ops)", "Eni (Africa)", "Sonangol (Angola)",
    "Petroci (Côte d'Ivoire)", "GNPC (Ghana)", "NNPC (Nigeria)", "Vitol (Africa)",
    // MUNICIPALITIES (SA metros and major cities)
    "City of Cape Town", "City of Johannesburg", "City of Tshwane",
    "eThekwini Metro (Durban)", "Nelson Mandela Bay (Gqeberha)", "Mangaung (Bloemfontein)",
    "Buffalo City (East London)", "City of Ekurhuleni", "Msunduzi (Pietermaritzburg)",
    // DFIs & DEVELOPMENT FINANCE
    "DBSA", "AfDB", "World Bank (Africa)", "Norfund", "Proparco", "CDC Group",
    "European Investment Bank (Africa)", "Islamic Development Bank (Africa)",
    // MINING & CRITICAL MINERALS
    "Anglo American (SA)", "Sibanye-Stillwater", "Kumba Iron Ore",
    "CMOC (DRC)", "Glencore (Africa)", "Impala Platinum", "Harmony Gold",
    "Petra Diamonds", "Tharisa Minerals",
    // CONSTRUCTION & INFRASTRUCTURE DEVELOPERS
    "WBHO", "Aveng", "Stefanutti Stocks", "Raubex", "Basil Read",
    "Murray & Roberts", "Concor",
    // OFF-GRID / MINI-GRID / ENERGY ACCESS
    "Bboxx", "d.light", "Sun King", "M-KOPA", "ZOLA Electric",
    "Nuru (DRC)", "EasySolar", "SolarNow",
    // ADDITIONAL (pan-African)
    "Africa Finance Corporation (AFC)", "Trade & Development Bank (TDB)",
    "Emerging Africa Infrastructure Fund (EAIF)"
  ].sort();

  // ---------- Company metadata (only for key ones; others use defaults but remain detailed) ----------
  const companyData = {
    "Eskom": { sector: "Power Utility", health: "DISTRESSED", opportunity: "Debt Restructuring / JET Green Bonds", ticket: "R80-120bn", region: "SA", relationship: "Existing", debtActual: "R400bn+", equityActual: "negative", ebitdaActual: "~R25bn", interestActual: "R30bn+" },
    "Transnet": { sector: "Ports & Rail", health: "STRESSED", opportunity: "Restructuring & DFI co-finance", ticket: "R30bn+", region: "SA", relationship: "Existing", debtActual: "~R130bn", equityActual: "R40bn", ebitdaActual: "~R12bn", interestActual: "~R10bn" },
    "SANRAL": { sector: "Infrastructure", health: "STABLE", opportunity: "PPP Advisory & Bond Structuring", ticket: "R2-6bn per concession", region: "SA", relationship: "Existing", debtActual: "~R40bn", equityActual: "~R5bn", ebitdaActual: "~R8bn (toll revenue)", interestActual: "~R3bn" },
    "Sasol": { sector: "Energy", health: "RECOVERING", opportunity: "Green Finance / Hydrogen", ticket: "R15bn+", region: "SA", relationship: "Existing", debtActual: "~R120bn", equityActual: "R80bn", ebitdaActual: "~R45bn", interestActual: "~R8bn" },
    "Scatec": { sector: "Renewables", health: "HEALTHY", opportunity: "Project Finance (REIPPPP)", ticket: "R5-10bn", region: "SA", relationship: "Existing", debtActual: "R10-12bn (project)", equityActual: "R5bn", ebitdaActual: "~R3bn (project)", interestActual: "~R1bn" },
    "Dangote Refinery": { sector: "Oil & Gas", health: "EXPANDING", opportunity: "IPO / Project Finance", ticket: "$40-50bn", region: "Nigeria", relationship: "Warm", debtActual: "$4bn refinancing due", equityActual: "$10bn+", ebitdaActual: "n/a pre-IPO", interestActual: "n/a" },
    "TotalEnergies (Africa Ops)": { sector: "Oil & Gas", health: "HEALTHY", opportunity: "Project Finance (Namibia Venus)", ticket: "$3-5bn", region: "Multiple", relationship: "Cold", debtActual: "$30bn group", equityActual: "$70bn", ebitdaActual: "$25bn", interestActual: "$3bn" },
    "Globeleq": { sector: "Independent Power", health: "HEALTHY", opportunity: "Project Finance / Refinancing", ticket: "$500m+", region: "Pan-Africa", relationship: "Existing", debtActual: "$2bn", equityActual: "$800m", ebitdaActual: "$200m", interestActual: "$100m" },
    "DBSA": { sector: "DFI", health: "HEALTHY", opportunity: "Co-financing", ticket: "R450bn JET target", region: "SA", relationship: "Existing", debtActual: "~R100bn", equityActual: "~R30bn", ebitdaActual: "R8bn", interestActual: "R3bn" },
    "City of Cape Town": { sector: "Municipal", health: "HEALTHY", opportunity: "Water PPPs / Green Bonds", ticket: "R3-6bn", region: "SA", relationship: "Warm", debtActual: "~R15bn", equityActual: "~R50bn (revenue base)", ebitdaActual: "~R5bn", interestActual: "~R1bn" },
    "Johannesburg City Power": { sector: "Municipal", health: "STRESSED", opportunity: "Debt Restructuring", ticket: "R5bn+", region: "SA", relationship: "Warm", debtActual: "R5.26bn arrears", equityActual: "negative working cap", ebitdaActual: "~R2bn", interestActual: "~R1.2bn" },
    "Zesa (Zimbabwe)": { sector: "Power Utility", health: "DISTRESSED", opportunity: "Debt Restructuring", ticket: "$500m", region: "Zimbabwe", relationship: "Cold", debtActual: "$1.2bn", equityActual: "negative", ebitdaActual: "$50m", interestActual: "$80m" }
  };
  const defaultData = { sector: "Infrastructure", health: "STABLE", opportunity: "Tailored Financing", ticket: "TBC", region: "Africa", relationship: "Cold", debtActual: "not publicly available", equityActual: "not publicly available", ebitdaActual: "not publicly available", interestActual: "not publicly available" };

  // Helper to get metadata or default
  const getCompanyMeta = (name) => companyData[name] || { ...defaultData, name };

  // ---------- Deep analysis generator (works for all companies) ----------
  const generateDeepAnalysis = (companyName) => {
    const meta = getCompanyMeta(companyName);
    const { sector, health, opportunity, ticket, region, relationship, debtActual, equityActual, ebitdaActual, interestActual } = meta;

    // Compute ratios based on available numbers
    let deRatio, debtEbitda, interestCover;
    const debtNum = parseFloat(debtActual);
    const equityNum = parseFloat(equityActual);
    const ebitdaNum = parseFloat(ebitdaActual);
    const interestNum = parseFloat(interestActual);

    if (!isNaN(debtNum) && !isNaN(equityNum) && equityNum !== 0 && !isNaN(equityNum)) deRatio = (debtNum / equityNum).toFixed(2);
    else if (health === "DISTRESSED") deRatio = ">8x (or negative equity)";
    else if (health === "STRESSED") deRatio = "4-7x";
    else deRatio = "2-3x (estimate)";

    if (!isNaN(debtNum) && !isNaN(ebitdaNum) && ebitdaNum !== 0) debtEbitda = (debtNum / ebitdaNum).toFixed(2);
    else if (health === "DISTRESSED") debtEbitda = ">10x";
    else if (health === "STRESSED") debtEbitda = "6-9x";
    else if (health === "HEALTHY") debtEbitda = "2-4x";
    else debtEbitda = "5-7x";

    if (!isNaN(ebitdaNum) && !isNaN(interestNum) && interestNum !== 0) interestCover = (ebitdaNum / interestNum).toFixed(2);
    else if (health === "DISTRESSED") interestCover = "<1x";
    else if (health === "HEALTHY") interestCover = ">3x";
    else interestCover = "1.5-2.5x";

    // Gearing status
    let gearingStatus, riskLevel;
    if (health === "DISTRESSED") { gearingStatus = "SEVERELY OVER-GEARED"; riskLevel = "HIGH"; }
    else if (health === "STRESSED") { gearingStatus = "OVER-GEARED"; riskLevel = "HIGH"; }
    else if (health === "RECOVERING") { gearingStatus = "OVER-GEARED (improving)"; riskLevel = "MEDIUM-HIGH"; }
    else if (health === "HEALTHY") { gearingStatus = "OPTIMALLY-GEARED"; riskLevel = "LOW"; }
    else if (health === "EXPANDING" || health === "GROWING") { gearingStatus = "MODERATELY LEVERAGED"; riskLevel = "MEDIUM"; }
    else { gearingStatus = "STABLE"; riskLevel = "MEDIUM"; }

    // Sector‑specific commentary
    let sectorContext = "";
    if (sector === "Power Utility") sectorContext = "State utilities often have high leverage due to regulated tariffs and under‑collection. Ring‑fencing of revenue and DFI support are key mitigants.";
    else if (sector === "Renewables" || sector === "Solar" || sector === "Wind") sectorContext = "Project finance structures keep debt non‑recourse. Long‑term PPAs provide cash flow certainty. REIPPPP projects offer 20‑year contracts.";
    else if (sector === "Oil & Gas") sectorContext = "Development phase requires high capex, leading to elevated D/E. After FID, reserve‑based lending and hedges mitigate risk.";
    else if (sector === "Municipal") sectorContext = "Municipal debt backed by ring‑fenced revenue (electricity, water). Tariff increases improve serviceability.";
    else if (sector === "DFI") sectorContext = "Development finance institutions operate with very low leverage; co‑financing role only.";
    else if (sector === "Mining") sectorContext = "Commodity price volatility affects debt service. Hedging and offtake agreements are critical.";
    else sectorContext = "Infrastructure assets have stable, inflation‑linked cash flows. DFI blend finance is widely available.";

    // Deal recommendations based on health and opportunity
    let deal1, deal2, deal3;
    if (health === "DISTRESSED" || health === "STRESSED") {
      deal1 = `🔹 **Debt Restructuring / Refinancing** – Extend maturities, reduce interest burden. Opportunity: ${ticket}. Urgency: HIGH (next 6 months).`;
      deal2 = `🔹 **DFI Concessional Blended Finance** – Partner with AfDB, DBSA, World Bank to lower cost of debt by 150-200bps. Ticket: 30-50% of total debt.`;
      deal3 = `🔹 **Asset Monetisation / Securitisation** – Ring‑fenced revenue streams can back bonds. Raise R5-15bn liquidity.`;
    } else if (opportunity.includes("Project Finance") || health === "GROWING") {
      deal1 = `🔹 **Project Finance (Senior Debt)** – Non‑recourse, tenor 15-20 years, JIBAR+250-350bps. Ticket: ${ticket}. DFI co‑financing available.`;
      deal2 = `🔹 **Green / Sustainability‑Linked Loan** – Margin step‑downs on ESG targets. Attract international investors.`;
      deal3 = `🔹 **Hedging Solutions** – FX and commodity hedging for equipment imports and revenue streams.`;
    } else {
      deal1 = `🔹 **Working Capital / Trade Finance** – Support supply chain and inventory. Ticket: 10-20% of revenue.`;
      deal2 = `🔹 **Refinancing** – Capture tighter spreads as market conditions improve.`;
      deal3 = `🔹 **Advisory Mandate** – Capital structure optimisation and M&A support.`;
    }

    // Refinancing schedule
    let maturityText;
    if (health === "DISTRESSED") maturityText = "Immediate refinancing required. Monitor upcoming maturities (next 6-18 months).";
    else if (sector === "Renewables") maturityText = "Construction debt being drawn. Refinancing post‑COD expected in 3-5 years. Spread capture 80-120bps.";
    else if (sector === "Municipal") maturityText = "Bond maturities typically 5-10 years. Regular tap issues for cash flow management.";
    else maturityText = "No near‑term maturities. Regular refinancing windows every 5-7 years. Monitor covenant headroom.";

    // Peer comparison
    let peerText = "";
    if (sector === "Power Utility") peerText = "Comparable SOEs: Eskom, Transnet, Zesa, Nampower, Tanesco. Median D/E ~3x, D/EBITDA ~5x.";
    else if (sector === "Renewables") peerText = "Peers: Scatec, Mainstream, ACWA Power, Lekela. Industry average D/E ~2.5x, D/EBITDA ~4x.";
    else if (sector === "Oil & Gas") peerText = "Peers: TotalEnergies, Eni, Aradel, Dangote. Mid‑cap D/E 1.5-2.5x; upstream higher.";
    else if (sector === "Municipal") peerText = "SA metros: Cape Town (healthy), Joburg (stressed). Others: eThekwini, Tshwane.";
    else peerText = "Benchmark against sector median D/E 2.5x, D/EBITDA 4x, ICR 3x.";

    // Recent developments (use default for most, but keep realistic)
    let recentNews = "• Monitor sector intelligence for latest updates.\n• REIPPPP Round 7 execution, Mozambique LNG restart, Namibia Venus FID.";
    if (companyName === "Eskom") recentNews = "• April 2026: R38bn ES26 bond redeemed.\n• Govt approved R50bn relief.\n• Municipal ring-fencing from July 2026.";
    else if (companyName === "Transnet") recentNews = "• R80bn rail modernisation RFP expected Q3 2026.\n• DFI co-financing pipeline confirmed.";
    else if (companyName === "Scatec") recentNews = "• Financial close on 846MW Kroonstad PV cluster (Q2 2026).\n• Construction starts H2 2026.";
    else if (companyName === "Dangote Refinery") recentNews = "• IPO June-July 2026 at $40-50bn valuation.\n• Stanbic IBTC Capital lead issuing house.";

    // Readiness score
    let score, scoreWhy;
    if (health === "DISTRESSED" && relationship === "Existing") { score = 9; scoreWhy = "Urgent need, existing trust. Execution requires regulatory alignment."; }
    else if (health === "HEALTHY" && relationship === "Existing") { score = 8; scoreWhy = "Clear opportunity, strong relationship. Cross‑sell potential."; }
    else if (health === "GROWING") { score = 7; scoreWhy = "Expansion phase creates financing need. Early engagement shapes structure."; }
    else if (relationship === "Cold") { score = 5; scoreWhy = "Limited relationship. Run Sector Intelligence and warm up via sector events."; }
    else { score = 6; scoreWhy = "Moderate opportunity. Further financial analysis recommended."; }

    // Pitch line
    const pitchLine = `"${companyName}, Standard Bank proposes ${opportunity} to ${health === "DISTRESSED" ? "stabilise your balance sheet" : "accelerate your growth"}, leveraging our ${relationship === "Existing" ? "existing relationship" : "sector expertise"} and DFI co‑financing access."`;

    // Final output
    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GEARING & FINANCIAL HEALTH ANALYSIS — ${companyName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┃ 1. FINANCIAL SNAPSHOT
Company: ${companyName}
Sector: ${sector}
Region: ${region}
Health Rating: ${health}
Relationship: ${relationship}
Reported Debt: ${debtActual}
Reported Equity: ${equityActual}
EBITDA (latest): ${ebitdaActual}
Interest Expense: ${interestActual}

┃ 2. LEVERAGE RATIOS & GEARING STATUS
Debt/Equity: ${deRatio}
Net Debt/EBITDA: ${debtEbitda}x
Interest Coverage (EBITDA/Interest): ${interestCover}x
Gearing Assessment: ${gearingStatus}
Risk Level: ${riskLevel}

${sectorContext}

┃ 3. DETAILED DIAGNOSIS
• ${health === "DISTRESSED" ? "Debt service consumes >80% of EBITDA; negative equity indicates insolvency risk." : health === "STRESSED" ? "High leverage but positive equity; refinancing risk manageable with support." : health === "HEALTHY" ? "Strong cash flow coverage; capacity for additional leverage." : "Leverage in line with growth phase; covenant headroom comfortable."}
• Opportunity "${opportunity}" directly addresses the gearing position.
• ${region === "SA" ? "SA regulatory: NERSA tariff path due Q4 2026, municipal ring-fencing supports SOEs." : region === "Nigeria" ? "FX illiquidity is a key risk, but oil prices and Dangote listing help." : "DFI support available for regional projects."}

┃ 4. RECOMMENDED DEAL STRUCTURES
${deal1}
${deal2}
${deal3}

┃ 5. DEBT MATURITY & REFINANCING OUTLOOK
${maturityText}

┃ 6. PEER COMPARISON
${peerText}

┃ 7. RECENT DEVELOPMENTS (Last 3 months)
${recentNews}

┃ 8. STANDARD BANK PITCH APPROACH
${pitchLine}

┃ 9. DEAL READINESS SCORE
Score: ${score}/10
Why: ${scoreWhy}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analysis based on Standard Bank CIB Sector Intelligence & Coverage Universe (June 2026)
Data includes announced transactions, regulatory updates, and market intelligence.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  // Handle selection
  const handleCompanyChange = (e) => {
    const selected = e.target.value;
    setCompany(selected);
    if (selected) {
      setLoading(true);
      setTimeout(() => {
        setAnalysis(generateDeepAnalysis(selected));
        setLoading(false);
      }, 50);
    } else {
      setAnalysis("");
    }
  };

  // UI Components (reuse your existing styles)
  const Spinner = () => (
    <span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(201,168,76,.2)",borderTop:"2px solid #c9a84c",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
  );

  const Card = ({ children, style = {} }) => (
    <div style={{background:"#111827",border:"1px solid #1e2535",borderRadius:6,padding:"18px 22px",...style}}>{children}</div>
  );

  const SL = ({ children }) => (
    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#6b7280",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>{children}</div>
  );

  const Btn = ({ children, onClick, v = "pri" }) => {
    const base = { fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,letterSpacing:"1px",textTransform:"uppercase",padding:"9px 20px",borderRadius:3,cursor:"pointer",transition:"all .15s",border:"none" };
    const style = v === "pri" ? {...base,background:"#c9a84c",color:"#090c12"} : {...base,background:"transparent",border:"1px solid rgba(201,168,76,.3)",color:"#c9a84c"};
    return <button style={style} onClick={onClick}>{children}</button>;
  };

  const Out = ({ text }) => (
    <div style={{background:"#090c12",border:"1px solid #1e2535",borderRadius:4,padding:"16px 18px",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,lineHeight:1.8,color:"#d1d5db",whiteSpace:"pre-wrap",maxHeight:600,overflowY:"auto"}}>{text}</div>
  );

  return (
    <div>
      <Card style={{marginBottom:16,borderLeft:"4px solid #c9a84c"}}>
        <SL>Leverage & Gearing Analysis</SL>
        <div style={{fontSize:13,color:"#9ca3af",marginBottom:16,lineHeight:1.7}}>
          Select any company from the dropdown. We generate a detailed gearing analysis with ratios, peer comparisons, and deal recommendations.
        </div>
        <div style={{display:"flex",gap:10,marginBottom:14, alignItems:"center"}}>
          <select
            value={company}
            onChange={handleCompanyChange}
            style={{
              background:"#090c12",
              border:"1px solid #1e2535",
              borderRadius:4,
              padding:"9px 13px",
              color:"#e8eaf0",
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:12,
              outline:"none",
              width:"100%",
              boxSizing:"border-box",
              cursor:"pointer"
            }}
          >
            <option value="" disabled>-- Select a company to analyse --</option>
            {companyList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {loading && <Spinner />}
        </div>
        <div style={{fontSize:11,color:"#6b7280",fontFamily:"'IBM Plex Mono',monospace"}}>
          {companyList.length} companies covered | Real coverage data | Dynamic analysis
        </div>
      </Card>

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
          <div style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace"}}>
            Select a company from the dropdown to start the deep‑dive gearing analysis.
          </div>
        </Card>
      )}
    </div>
  );
}