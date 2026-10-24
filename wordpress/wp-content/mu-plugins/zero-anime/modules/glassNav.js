/** 渐进增强：不支持磨砂则保持实色。 */
export function mount({root}) {
 if(!CSS.supports('backdrop-filter','blur(10px)')&&!CSS.supports('-webkit-backdrop-filter','blur(10px)'))return ()=>{};
 root.classList.add('za-glassNav');return ()=>root.classList.remove('za-glassNav');
}
