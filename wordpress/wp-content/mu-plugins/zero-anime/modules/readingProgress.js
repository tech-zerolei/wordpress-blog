/** 文章进度：只在文章页创建，一帧合并滚动；卸载移除监听和节点。 */
export function mount() {
 const controller=new AbortController();const bar=document.createElement('div');bar.id='za-reading-progress';bar.setAttribute('aria-hidden','true');document.body.append(bar);
 let frame=0;
 const draw=()=>{frame=0;const article=document.getElementById('post_content');if(!article){bar.hidden=true;return;}bar.hidden=false;const rect=article.getBoundingClientRect();const start=rect.top+scrollY-88;const span=Math.max(1,rect.height-innerHeight+88);const progress=Math.max(0,Math.min(1,(scrollY-start)/span));bar.style.transform='scaleX('+progress+')';};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
 addEventListener('scroll',schedule,{passive:true,signal:controller.signal});addEventListener('resize',schedule,{passive:true,signal:controller.signal});
 document.addEventListener('load',schedule,{capture:true,signal:controller.signal});
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;const article=document.getElementById('post_content');if(article)observer?.observe(article);draw();
 return ()=>{controller.abort();observer?.disconnect();cancelAnimationFrame(frame);bar.remove();};
}
