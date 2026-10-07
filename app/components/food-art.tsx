// Local illustrations require no external image services.
export default function FoodArt({ name, className = "" }: { name: string; className?: string }) {
  const kind = name.toLowerCase();
  return <svg viewBox="0 0 400 300" className={className} aria-hidden="true" focusable="false">
    <ellipse cx="200" cy="249" rx="128" ry="17" fill="#432c2014" />
    <ellipse cx="200" cy="162" rx="143" ry="98" fill="#fdfbf5" stroke="#e3dac8" strokeWidth="2" />
    <ellipse cx="200" cy="162" rx="118" ry="79" fill="#f5f0e5" stroke="#e8dfcd" strokeWidth="2" />
    {kind.includes("pizza") ? <>
      <path d="M108 91 Q200 50 292 91 L200 237 Z" fill="#edb65a" stroke="#cb9145" strokeWidth="5" />
      <path d="M116 104 Q200 68 284 104 L200 218 Z" fill="#f7d078" />
      <path d="M108 91 Q200 50 292 91" fill="none" stroke="#c68a40" strokeWidth="18" strokeLinecap="round" />
      {[[160,113],[228,110],[199,163],[229,146],[184,196]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="12" fill="#b94f32" />)}
      <path d="M176 124q-14-20-23-1 6 15 23 1M239 176q15-20 23-1-6 15-23 1" fill="#758c50" />
    </> : kind.includes("coffee") ? <>
      <ellipse cx="195" cy="212" rx="84" ry="22" fill="#ded5c1" />
      <path d="M250 126h21q34 0 24 36t-40 25" fill="none" stroke="#b94724" strokeWidth="14" />
      <path d="M132 117h125l-10 75q-6 28-53 28t-53-28Z" fill="#b94724" />
      <ellipse cx="194" cy="117" rx="63" ry="23" fill="#fff7e8" /><ellipse cx="194" cy="118" rx="52" ry="16" fill="#79503b" />
      <path d="M164 77q-15-15 0-32M194 72q-15-15 0-32M224 77q-15-15 0-32" stroke="#c6b79e" strokeWidth="4" fill="none" strokeLinecap="round" />
    </> : kind.includes("bagel") ? <>
      <ellipse cx="200" cy="171" rx="92" ry="62" fill="#bb7b39" /><ellipse cx="200" cy="159" rx="92" ry="62" fill="#e1a655" />
      <ellipse cx="200" cy="157" rx="29" ry="20" fill="#f5f0e5" stroke="#bc803c" strokeWidth="8" />
      {[[142,139],[155,185],[218,111],[255,155],[238,188],[173,115],[125,158]].map(([x,y],i)=><path key={i} d={`M${x} ${y}l5 3`} stroke="#fff1cf" strokeWidth="4" strokeLinecap="round" />)}
    </> : kind.includes("ramen") ? <>
      <path d="M91 143q8 95 109 101 101-6 109-101Z" fill="#b94724" /><ellipse cx="200" cy="143" rx="109" ry="52" fill="#e9bb76" stroke="#954329" strokeWidth="7" />
      {[0,1,2,3].map(i=><path key={i} d={`M${130+i*12} 140q25-38 66-10t45 21-73 17`} fill="none" stroke="#fff0bd" strokeWidth="6" strokeLinecap="round" />)}
      <ellipse cx="249" cy="125" rx="24" ry="17" fill="#fff8df" transform="rotate(22 249 125)" /><ellipse cx="249" cy="125" rx="11" ry="10" fill="#eaaa37" />
      <path d="M113 137q4-30 21-18 18-20 21 5-12 28-42 13" fill="#69834d" /><path d="M285 83 164 189M297 89 176 195" stroke="#875c3c" strokeWidth="5" strokeLinecap="round" />
    </> : kind.includes("tacos") ? <>
      {[0,1].map(i=><g key={i} transform={`translate(${i*68} ${i*36})`}><path d="M106 158q52-116 124 0Z" fill="#eab760" stroke="#cd9845" strokeWidth="5" /><path d="M112 150q25-57 49-38t61 35" stroke="#708647" strokeWidth="17" fill="none" /><path d="M117 163q40-101 106 0Z" fill="#f4cd78" />{[0,1,2,3].map(j=><circle key={j} cx={137+j*21} cy={130+(j%2)*8} r="6" fill="#c45f3c" />)}</g>)}
    </> : kind.includes("sushi") ? <>
      {[{x:119,y:122,r:-16},{x:201,y:111,r:9},{x:160,y:181,r:-12},{x:241,y:173,r:13}].map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}>
        <rect x="-34" y="-4" width="71" height="40" rx="16" fill="#e6ddca" /><rect x="-35" y="-14" width="72" height="39" rx="17" fill="#fffefa" />
        <path d="M-42-12 Q-37-30-19-30 H22 Q41-28 44-8 L35 5 Q-2-1-35 8Z" fill="#ed8961" />
        <path d="M-21-28 0 2M-1-30 22 0M18-29 37-7" stroke="#ffc8a1" strokeWidth="5" fill="none" />
        {i===2&&<path d="M-5-27H11V27H-5Z" fill="#344e3c" />}
      </g>)}
      <path d="m279 123 18-21 17 25-16 13Z" fill="#88a05b" /><path d="M267 211q14-28 32-4-13 22-32 4" fill="#ecb2a5" />
      <path d="M321 65 350 238M335 62 364 235" stroke="#875c3c" strokeWidth="6" strokeLinecap="round" />
    </> : kind.includes("hot") ? <>
      <path d="M87 148q0 94 113 103 113-9 113-103" fill="#9d5940" /><path d="M91 161q8 74 109 83 98-9 109-83" fill="#bb7050" />
      <path d="M91 164H66q-17 0-17-19t27-17M309 164h25q17 0 17-19t-27-17" fill="none" stroke="#83503e" strokeWidth="12" />
      <ellipse cx="200" cy="148" rx="113" ry="68" fill="#f1bf73" stroke="#83503e" strokeWidth="9" />
      <path d="M199 85q-52 37 0 63t0 63q105-2 107-63-6-59-107-63" fill="#d26638" />
      <path d="M199 83q-53 38 0 64t0 65" fill="none" stroke="#83503e" strokeWidth="6" />
      {[[136,127],[160,167],[250,126],[239,176]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${i*30})`}><rect x="-17" y="-8" width="35" height="19" rx="4" fill={i<2?"#fff3c9":"#eda18a"}/><path d="M-10-5 10 7M0-7 16 4" stroke={i<2?"#e0c186":"#ffd0b6"} strokeWidth="3" /></g>)}
      <path d="M110 170q-10-33 18-23 16-27 22 2-7 25-40 21M262 157q-4-24 18-17 20-20 22 8-16 20-40 9" fill="#69834d" />
      <path d="M155 65q-19-16 0-33M201 55q-19-16 0-33M245 64q-19-16 0-33" fill="none" stroke="#c6b79e" strokeWidth="4" strokeLinecap="round" />
    </> : kind.includes("pasta") ? <>
      <ellipse cx="200" cy="163" rx="85" ry="57" fill="#d9873b" />
      {[0,1,2,3,4,5,6].map(i=><path key={i} d={`M${135+i*9} ${153+i*3}q${20+i*3} -63 ${80-i*4} -16t-30 49q-50 18-35-18t62-8`} fill="none" stroke={i%2?"#f5c267":"#efb04b"} strokeWidth="7" strokeLinecap="round" />)}
      <path d="M174 113q-35-31-36 5 18 15 36-5M177 111q7-40 31-16-2 22-31 16M231 194q36-31 37 5-18 15-37-5" fill="#648849" />
      <circle cx="248" cy="137" r="12" fill="#c85235" /><circle cx="155" cy="191" r="10" fill="#c85235" />
      <path d="m312 93-20 100M303 91l-5 23M312 93l-5 23M321 95l-5 23" stroke="#a8997e" strokeWidth="5" strokeLinecap="round" />
    </> : <><circle cx="200" cy="163" r="53" fill="#eed9b3" /><path d="M175 152q25-35 50 0M175 179q25 25 50 0" fill="none" stroke="#b94724" strokeWidth="6" strokeLinecap="round" /></>}
    <g fill="#789254"><ellipse cx="87" cy="221" rx="12" ry="5" transform="rotate(30 87 221)" /><ellipse cx="80" cy="204" rx="12" ry="5" transform="rotate(-35 80 204)" /></g>
  </svg>;
}
