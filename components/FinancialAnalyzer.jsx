import { useState } from "react";

export default function FinancialAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

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

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setAnalysis("");
    setStatus({t:"load",msg:`Analysing ${file.name}…`});

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result?.split(',')[1];
        if (!base64) throw new Error("Failed to read file");

        const res = await fetch("/api/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Data: base64,
            mediaType: "application/pdf",
            fileName: file.name,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");

        const text = data.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n");

        setAnalysis(text);
        setStatus({t:"ok",msg:`Analysis complete — ${file.name}`});
      };
      reader.onerror = () => {
        setStatus({t:"err",msg:"Failed to read file"});
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setStatus({t:"err",msg:error.message});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card style={{marginBottom:16,borderLeft:"4px solid #c9a84c"}}>
        <SL>Upload Financial Statements</SL>
        <div style={{fontSize:13,color:"#9ca3af",marginBottom:16,lineHeight:1.7}}>
          Upload annual reports, financial statements, or investment documents (PDF). Claude will extract key financial metrics, identify debt risks, and recommend deal opportunities.
        </div>
        <div style={{background:"#090c12",border:"2px dashed #1e2535",borderRadius:6,padding:"30px 20px",textAlign:"center",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#2a3147"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2535"}>
          <label style={{cursor:"pointer",display:"block"}}>
            <div style={{fontSize:32,marginBottom:10}}>📄</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:600,color:"#f3f4f6",marginBottom:4}}>Drop PDF here or click to upload</div>
            <div style={{fontSize:12,color:"#6b7280",fontFamily:"'IBM Plex Mono',monospace"}}>Maximum 20MB · Supports PDF files</div>
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{display:"none"}}/>
          </label>
        </div>
        {fileName && <div style={{marginTop:12,fontSize:12,color:"#c9a84c",fontFamily:"'IBM Plex Mono',monospace"}}>Selected: {fileName}</div>}
      </Card>

      <SBar s={status}/>

      {analysis && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <SL>Financial Analysis — {fileName}</SL>
            <Btn v="ghost" onClick={()=>navigator.clipboard?.writeText(analysis)} style={{padding:"4px 11px",fontSize:10}}>Copy</Btn>
          </div>
          <Out text={analysis}/>
        </Card>
      )}

      {!analysis && !loading && (
        <Card style={{textAlign:"center",padding:"40px 20px",color:"#4b5563"}}>
          <div style={{fontSize:32,marginBottom:12,opacity:.3}}>📊</div>
          <div style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace"}}>Upload a PDF to begin financial analysis</div>
        </Card>
      )}
    </div>
  );
}
