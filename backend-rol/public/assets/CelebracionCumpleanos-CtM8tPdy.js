import{a as f,j as e}from"./vendor-ui-Crx5Z0k1.js";const r=[{bg:"#ef4444",borde:"#b91c1c"},{bg:"#f59e0b",borde:"#d97706"},{bg:"#10b981",borde:"#059669"},{bg:"#3b82f6",borde:"#2563eb"},{bg:"#8b5cf6",borde:"#7c3aed"},{bg:"#ec4899",borde:"#db2777"},{bg:"#06b6d4",borde:"#0891b2"}];function u({usuario:o,onCerrar:s}){const m=Array.from({length:22}).map((t,a)=>{const n=r[a%r.length],l=Math.floor(Math.random()*92)+2,d=6+a%5*1.5,i=a*.35%4,c=.75+a%4*.15;return{id:a,color:n,left:l,animDuration:d,animDelay:i,scale:c}}),b=Array.from({length:30}).map((t,a)=>{const n=r[a%r.length].bg,l=Math.floor(Math.random()*96)+2,d=4+a%4,i=a*.2%3,c=a%2===0?"rounded-full":"rounded-sm rotate-45";return{id:a,color:n,left:l,animDuration:d,animDelay:i,shape:c}});f.useEffect(()=>{const t=a=>{a.key==="Escape"&&s()};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[s]);const x=o.nombre_completo||o.nombre||"Aventurero";return e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-500",children:[e.jsx("style",{children:`
        @keyframes subirGlobo {
          0% {
            transform: translateY(115vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          50% {
            transform: translateY(50vh) rotate(6deg);
          }
          80% {
            transform: translateY(15vh) rotate(-6deg);
          }
          100% {
            transform: translateY(-25vh) rotate(4deg);
            opacity: 0;
          }
        }
        @keyframes caerConfeti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}),e.jsxs("div",{className:"absolute inset-0 pointer-events-none overflow-hidden z-10",children:[m.map(t=>e.jsxs("div",{style:{position:"absolute",left:`${t.left}%`,bottom:"-120px",animation:`subirGlobo ${t.animDuration}s ease-in infinite`,animationDelay:`${t.animDelay}s`,transform:`scale(${t.scale})`,zIndex:10},className:"flex flex-col items-center select-none",children:[e.jsx("div",{className:"w-14 h-18 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] relative shadow-2xl",style:{backgroundColor:t.color.bg,border:`2px solid ${t.color.borde}`},children:e.jsx("div",{className:"absolute top-2 left-2.5 w-3 h-5 bg-white/40 rounded-full rotate-[-25deg]"})}),e.jsx("div",{className:"w-2.5 h-2 -mt-0.5 rounded-b-md",style:{backgroundColor:t.color.borde}}),e.jsx("div",{className:"w-0.5 h-16 bg-white/40"})]},t.id)),b.map(t=>e.jsx("div",{style:{position:"absolute",left:`${t.left}%`,top:"-20px",width:"10px",height:"10px",backgroundColor:t.color,animation:`caerConfeti ${t.animDuration}s linear infinite`,animationDelay:`${t.animDelay}s`,zIndex:11},className:`${t.shape} shadow-md`},t.id))]}),e.jsxs("div",{className:"relative z-20 max-w-lg w-full bg-stone-950/95 border-2 border-amber-500/50 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] text-center text-stone-200 animate-in zoom-in-95 duration-300",children:[e.jsx("div",{className:"w-20 h-20 mx-auto mb-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce",children:"🎂"}),e.jsx("span",{className:"text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30 inline-block mb-3",children:"🎉 ¡El Gremio está de Fiesta! 🎉"}),e.jsxs("h3",{className:"text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tight mb-2",children:["¡Feliz Cumpleaños, ",x,"!"]}),o.edad&&e.jsxs("p",{className:"text-amber-300 font-bold text-sm mb-3",children:["✨ Celebrando hoy tus ",e.jsxs("strong",{children:[o.edad," años"]})," de vida y aventuras ✨"]}),e.jsxs("p",{className:"text-stone-300 text-xs sm:text-sm leading-relaxed mb-6 font-medium",children:["Que tus tiradas siempre saquen ",e.jsx("strong",{children:"20s naturales"}),", que la inspiración nunca abandone tu hoja de personaje y que tus travesías por el reino estén colmadas de risas, botín legendario y buena compañía."]}),e.jsxs("div",{className:"bg-stone-900/80 border border-stone-800 rounded-2xl p-3 mb-6 text-xs text-stone-400 italic",children:["⚔️ Con el cariño y honor de toda la comunidad de la ",e.jsx("strong",{children:"Asociación de Rol La Pampa"}),"."]}),e.jsxs("button",{onClick:s,className:"w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black uppercase tracking-wider text-xs rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2",children:[e.jsx("span",{children:"🎲"}),e.jsx("span",{children:"¡A Rodar los Dados y Festejar!"}),e.jsx("span",{children:"🎈"})]})]})]})}export{u as default};
