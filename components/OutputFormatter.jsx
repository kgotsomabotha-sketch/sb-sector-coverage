import React from "react";

export default function OutputFormatter({ text }) {
  if (!text) return null;

  // Parse the output text and convert to formatted components
  const parseOutput = (content) => {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect section headers (━━ format)
      if (line.includes('━━')) {
        // Save previous section
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent.join('\n').trim(),
          });
        }

        // Extract new section title
        const titleMatch = line.match(/━━\s*(.*?)\s*━━/);
        if (titleMatch) {
          currentSection = titleMatch[1];
          currentContent = [];
        }
      } else if (line.trim()) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent.join('\n').trim(),
      });
    }

    return sections;
  };

  const sections = parseOutput(text);

  // Color mapping for different section types
  const getSectionColor = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('overview') || lower.includes('snapshot')) return { border: '#c9a84c', bg: 'rgba(201,168,76,0.05)' };
    if (lower.includes('financial') || lower.includes('debt') || lower.includes('leverage')) return { border: '#ef4444', bg: 'rgba(239,68,68,0.05)' };
    if (lower.includes('opportunity') || lower.includes('deal') || lower.includes('pitch')) return { border: '#10b981', bg: 'rgba(16,185,129,0.05)' };
    if (lower.includes('risk') || lower.includes('mitigant')) return { border: '#f59e0b', bg: 'rgba(245,158,11,0.05)' };
    if (lower.includes('strategic') || lower.includes('development')) return { border: '#3b82f6', bg: 'rgba(59,130,246,0.05)' };
    return { border: '#6b7280', bg: 'rgba(107,114,128,0.05)' };
  };

  // Format bullet points and lists
  const formatContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      line = line.trim();
      if (!line) return null;

      // Bold formatting for "Word:" patterns
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#c9a84c">$1</strong>');
      line = line.replace(/([A-Z][a-zA-Z\s]+):/g, '<strong style="color:#c9a84c">$1:</strong>');

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={idx} style={{display:'flex',gap:10,marginBottom:10,paddingLeft:12}}>
            <span style={{color:'#c9a84c',fontSize:14,flexShrink:0}}>•</span>
            <div style={{color:'#d1d5db',fontSize:13,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:line.slice(2)}}/>
          </div>
        );
      }

      // Regular paragraphs
      return (
        <p key={idx} style={{color:'#d1d5db',fontSize:13,lineHeight:1.75,marginBottom:12}} dangerouslySetInnerHTML={{__html:line}}/>
      );
    }).filter(Boolean);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      {sections.map((section, idx) => {
        const colors = getSectionColor(section.title);
        return (
          <div
            key={idx}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}33`,
              borderLeft: `4px solid ${colors.border}`,
              borderRadius: 6,
              padding: '20px 24px',
              animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both`,
            }}
          >
            <h3 style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: colors.border,
              marginBottom: 14,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{width:16,height:2,background:colors.border,borderRadius:1}}/>
              {section.title}
            </h3>
            <div style={{marginTop:12}}>
              {formatContent(section.content)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
