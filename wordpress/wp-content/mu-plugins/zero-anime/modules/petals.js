/** 飘花严格限制在横幅背景内。最多 14/5 个、DPR≤1.5、30fps。 */
export function mount({config}) {
 const banner=document.getElementById('banner');if(!banner)return ()=>{};
 const canvas=document.createElement('canvas');canvas.id='za-petals';canvas.setAttribute('aria-hidden','true');banner.prepend(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return ()=>{};}
 const controller=new AbortController();let frame=0,previous=0,lastDraw=0,width=0,height=0,petals=[];
 const resize=()=>{
  const rect=banner.getBoundingClientRect();width=rect.width;height=rect.height;
  const ratio=Math.max(1,Math.min(devicePixelRatio||1,config.pixelRatioMax||1.5));canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  const count=Math.min(width<=600?5:20,Math.max(0,Math.round(width<=600?config.petalsMobile:config.petalsDesktop)));
  petals=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,size:2+Math.random()*3,speed:9+Math.random()*9,phase:Math.random()*6}));
 };
 const draw=time=>{
  frame=requestAnimationFrame(draw);if(time-lastDraw<1000/Math.min(30,config.maxFps||30))return;lastDraw=time;
  const delta=previous?Math.min((time-previous)/1000,.08):0;previous=time;ctx.clearRect(0,0,width,height);ctx.fillStyle='#d58dad';ctx.globalAlpha=.4;
  petals.forEach(p=>{p.y+=p.speed*delta;p.x+=Math.sin(p.phase+=delta*.7)*7*delta;if(p.y>height+8){p.y=-8;p.x=Math.random()*width;}ctx.beginPath();ctx.ellipse(p.x,p.y,p.size,p.size*.6,p.phase,0,Math.PI*2);ctx.fill();});
 };
 let visible=true;
 const start=()=>{if(!frame&&visible){previous=0;frame=requestAnimationFrame(draw);}};
 const stop=()=>{cancelAnimationFrame(frame);frame=0;previous=0;};
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();}):null;
 resize();observer?.observe(banner);start();
 addEventListener('resize',resize,{passive:true,signal:controller.signal});
 return ()=>{stop();observer?.disconnect();controller.abort();canvas.remove();};
}
