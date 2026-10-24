/** 纯 CSS 轻悬浮；stop() 完全移除效果类。 */
export function mount({root}) {root.classList.add('za-cardLift');return ()=>root.classList.remove('za-cardLift');}
