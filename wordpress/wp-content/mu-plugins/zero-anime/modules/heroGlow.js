/** 呼吸光晕，仅启用时运行 CSS 动画，后台/减少动态时管理器卸载。 */
export function mount({root}) {root.classList.add('za-heroGlow');return ()=>root.classList.remove('za-heroGlow');}
