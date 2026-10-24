/** 只响应精细指针的空白处点击，绝不覆盖文章或交互元素。 */
export function mount() {
 const controller=new AbortController();const nodes=new Map();let last=0;
 document.addEventListener('click',event=>{
  if(!event.detail || event.target.closest('article,a,button,input,select,textarea,dialog,#za-controls,#leftbar'))return;
  const now=performance.now();if(now-last<160)return;last=now;
  const star=document.createElement('span');star.className='za-click-star';star.textContent='✧';star.setAttribute('aria-hidden','true');
  star.style.left=event.clientX+'px';star.style.top=event.clientY+'px';document.body.append(star);
  const timer=setTimeout(()=>{star.remove();nodes.delete(star);},700);nodes.set(star,timer);
 },{signal:controller.signal});
 return ()=>{controller.abort();for(const [node,timer] of nodes){clearTimeout(timer);node.remove();}nodes.clear();};
}
