/* Zero Anime 2.0.0. 原生 JS；模块按需 import；默认无 Canvas/定时器。 */
(() => {
  'use strict';
  if (window.ZeroAnime || !window.ZeroAnimeConfig) return;
  const config = window.ZeroAnimeConfig;
  const root = document.documentElement;
  const labels = {petals:'横幅樱花飘落',clickStars:'空白处点击星光',cardLift:'文章卡片轻悬浮',heroGlow:'横幅柔光呼吸',glassNav:'导航磨砂玻璃',readingProgress:'文章阅读进度条'};
  const keys = Object.keys(labels);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const pointer = matchMedia('(pointer: fine)');
  const connection = navigator.connection;
  const running = new Map();
  const pending = new Map();
  const storageKey = 'zero-anime-effects-v2';
  const modeKey = 'zero-anime-mode-v2';
  const store = {
    get(key) {try {return localStorage.getItem(key);} catch (_) {return null;}},
    set(key,value) {try {localStorage.setItem(key,value);return true;} catch (_) {return false;}},
    remove(key) {try {localStorage.removeItem(key);} catch (_) {}}
  };
  function readEffects() {
    let saved = {};
    try {const value=JSON.parse(store.get(storageKey)||'{}');if(value && typeof value==='object' && !Array.isArray(value)) saved=value;} catch (_) {}
    return Object.fromEntries(keys.map(key=>[key,typeof saved[key]==='boolean'?saved[key]:!!config.effects[key]]));
  }
  let effects=readEffects();
  let mode=store.get(modeKey)||store.get('zero-sakura-mode')||'system';
  if (!['system','light','dark'].includes(mode)) mode='system';
  let dialog, openButton, decorateQueued=false;
  function element(tag,attrs={},text='') {
    const e=document.createElement(tag);
    Object.entries(attrs).forEach(([key,value])=>e.setAttribute(key,String(value)));
    if(text)e.textContent=text;
    return e;
  }
  function announce(text) {const live=document.getElementById('za-live');if(live)live.textContent=text;}
  function applyMode() {
    const dark=mode==='dark'||(mode==='system'&&darkQuery.matches);
    if (typeof window.setDarkmode==='function') window.setDarkmode(dark);
    root.classList.toggle('darkmode',dark);
    root.classList.remove('amoled-dark');
    try {if(mode==='system')sessionStorage.removeItem('Argon_Enable_Dark_Mode');else sessionStorage.setItem('Argon_Enable_Dark_Mode',String(dark));} catch (_) {}
    const select=document.getElementById('za-theme');if(select)select.value=mode;
  }
  function desired(key) {
    if(!effects[key] || document.hidden)return false;
    if(key!=='readingProgress' && (motion.matches || connection?.saveData))return false;
    if((key==='clickStars'||key==='cardLift') && !pointer.matches)return false;
    if(key==='readingProgress' && !document.getElementById('post_content'))return false;
    return true;
  }
  function statusText() {
    const status=document.getElementById('za-status');
    if(!status)return;
    const restrictions=[];
    if(motion.matches)restrictions.push('系统已减少动态效果，装饰暂停');
    if(connection?.saveData)restrictions.push('省流量模式已暂停装饰');
    if(!document.getElementById('post_content') && effects.readingProgress)restrictions.push('阅读进度仅在文章页显示');
    status.textContent=restrictions.join('；')||'特效只保存在此浏览器，关闭后会释放相关资源。';
    dialog.dataset.active=Array.from(running.keys()).join(',');
    keys.forEach(key=>{
      const input=document.getElementById('za-effect-'+key);
      if(input){input.checked=effects[key];input.disabled=key!=='readingProgress'&&(motion.matches||!!connection?.saveData);}
    });
  }
  async function reconcile() {
    for(const key of keys) {
      if(!desired(key)) {
        if(running.has(key)){running.get(key)();running.delete(key);}
        continue;
      }
      if(running.has(key)||pending.has(key))continue;
      const task=import(config.modulesUrl+key+'.js?ver='+encodeURIComponent(config.version))
        .then(module=>{
          if(desired(key)&&!running.has(key)) {
            const cleanup=module.mount({root,config});
            running.set(key,typeof cleanup==='function'?cleanup:()=>{});
          }
        })
        .catch(()=>{effects[key]=false;announce(labels[key]+'加载失败，已安全关闭。');})
        .finally(()=>{pending.delete(key);statusText();});
      pending.set(key,task);
    }
    statusText();
    await Promise.all(Array.from(pending.values()));
  }
  function save() {if(!store.set(storageKey,JSON.stringify(effects)))announce('浏览器不允许保存，设置仅本次访问生效。');}
  function setEffect(key,value) {
    if(!keys.includes(key))return Promise.resolve();
    effects[key]=!!value;save();return reconcile();
  }
  function closeDialog(){if(dialog.open)dialog.close();else dialog.removeAttribute('open');openButton.setAttribute('aria-expanded','false');openButton.focus();}
  function controls() {
    const holder=element('div',{id:'za-controls'});
    openButton=element('button',{id:'za-preferences-open',type:'button','aria-haspopup':'dialog','aria-controls':'za-preferences','aria-expanded':'false'},'阅读偏好');
    const star=element('span',{'aria-hidden':'true'},'✧');openButton.prepend(star);
    holder.append(openButton);document.body.append(holder);
    dialog=element('dialog',{id:'za-preferences','aria-labelledby':'za-preferences-title'});
    const head=element('div',{class:'za-dialog-head'});
    head.append(element('h2',{id:'za-preferences-title'},'你的阅读小世界'));
    const close=element('button',{class:'za-close',type:'button','aria-label':'关闭阅读偏好'},'×');head.append(close);dialog.append(head);
    dialog.append(element('p',{class:'za-help'},'阅读优先，装饰随心。没有看板娘，也没有自动播放的声音。'));
    const themeLabel=element('label',{class:'za-theme-label',for:'za-theme'},'页面配色');
    const select=element('select',{id:'za-theme'});
    Object.entries({system:'跟随系统',light:'浅色 · 樱花',dark:'暗色 · 月夜'}).forEach(([value,text])=>select.append(element('option',{value},text)));
    themeLabel.append(select);dialog.append(themeLabel);
    select.value=mode;
    select.addEventListener('change',()=>{mode=select.value;store.set(modeKey,mode);applyMode();});
    keys.forEach(key=>{
      const label=element('label',{class:'za-switch-row',for:'za-effect-'+key});
      label.append(element('span',{},labels[key]));
      const input=element('input',{id:'za-effect-'+key,type:'checkbox',role:'switch','data-effect':key});
      input.checked=effects[key];input.addEventListener('change',()=>setEffect(key,input.checked));label.append(input);dialog.append(label);
    });
    const actions=element('div',{class:'za-dialog-actions'});
    const off=element('button',{type:'button'},'关闭全部特效');
    off.addEventListener('click',()=>{keys.forEach(key=>effects[key]=false);save();reconcile();announce('全部特效已关闭。');});
    const reset=element('button',{type:'button'},'恢复站点默认');
    reset.addEventListener('click',()=>{store.remove(storageKey);effects=readEffects();reconcile();announce('已恢复站点默认。');});
    actions.append(off,reset);dialog.append(actions,element('p',{id:'za-status','aria-live':'polite'}));
    document.body.append(dialog,element('div',{id:'za-live',role:'status','aria-live':'polite'}));
    openButton.addEventListener('click',()=>{
      if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
      openButton.setAttribute('aria-expanded','true');close.focus();statusText();
    });
    close.addEventListener('click',closeDialog);
    dialog.addEventListener('cancel',()=>openButton.setAttribute('aria-expanded','false'));
    dialog.addEventListener('close',()=>{openButton.setAttribute('aria-expanded','false');openButton.focus();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
    document.body.prepend(element('a',{id:'za-skip',href:'#main'},'跳到主要内容'));
  }
  function decorate() {
    const banner=document.getElementById('banner_container');
    if(banner && !banner.querySelector('.za-hero-art')) {
      const art=element('figure',{class:'za-hero-art','aria-hidden':'true'});
      art.append(element('img',{src:config.artUrl,width:760,height:480,alt:'',decoding:'async'}),element('figcaption',{},'SOMEWHERE IN A DAYDREAM'));
      banner.append(art);
    }
    const title=document.querySelector('.banner-title');
    if(title && !title.querySelector('.za-hero-tags')) {
      const tags=element('div',{class:'za-hero-tags','aria-hidden':'true'});
      ['CODE / 代码','LIFE / 日常','ANIME / 热爱'].forEach(text=>tags.append(element('span',{},text)));title.append(tags);
    }
    // 用原生按钮替换原主题的白色装饰 span，保持原搜索事件与 PJAX。
    const search=document.querySelector('#navbar_search_input_container .input-group-text');
    if(search && search.tagName!=='BUTTON') {
      const button=element('button',{id:'za-search-button',type:'button',class:'input-group-text','aria-label':'展开站内搜索','aria-controls':'navbar_search_input'});
      while(search.firstChild)button.append(search.firstChild);
      search.replaceWith(button);
    }
    const sidebarButton=document.getElementById('open_sidebar');
    if(sidebarButton)sidebarButton.setAttribute('aria-label','打开导航侧栏');
    const mobileButton=document.querySelector('#navbar-main > .container > button[data-target="#navbar_global"]');
    if(mobileButton)mobileButton.setAttribute('aria-label','打开导航与搜索');
    const desktopSearch=document.getElementById('navbar_search_input');
    if(desktopSearch)desktopSearch.setAttribute('aria-label','站内搜索关键词');
    const mobileSearch=document.getElementById('navbar_search_input_mobile');
    if(mobileSearch)mobileSearch.setAttribute('aria-label','站内搜索关键词（移动端）');
    const main=document.getElementById('main');
    if(main?.classList.contains('article-list')&&!main.querySelector('.za-section-heading')) {
      const heading=element('div',{class:'za-section-heading'});
      const text=main.classList.contains('article-list-home')?'故事，缓慢更新':'继续发现';
      heading.append(element('h2',{},text),element('span',{},'STORIES & SMALL WONDERS'));main.prepend(heading);
    }
    if(main && !main.hasAttribute('tabindex'))main.setAttribute('tabindex','-1');
    // 保留旧增强层的首页导航修正；仅修正明确的首页标签。
    document.querySelectorAll('#navbar-main a,#leftbar_part1_menu a').forEach(link=>{
      if(link.textContent.trim().replace(/^\uf015\s*/,'')==='首页')link.href=config.homeUrl;
      if(link.href===location.href)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    });
    // 为已有封面提供真实 alt 文案；不改变文章图片内容。
    document.querySelectorAll('article.post .post-thumbnail').forEach(img=>{
      if(!img.alt||img.alt==='thumbnail')img.alt=img.closest('article').querySelector('.post-title')?.textContent.trim()||'文章封面';
    });
    document.querySelectorAll('#post_content pre').forEach(pre=>{
      if(pre.querySelector('.za-copy,.hljs-control .copy,.hljs-copy-button'))return;
      const code=pre.querySelector('code');if(!code)return;
      const copy=element('button',{class:'za-copy',type:'button','aria-label':'复制代码'},'复制');
      copy.addEventListener('click',async()=>{
        const lines=pre.querySelectorAll('.hljs-ln-code');
        const text=lines.length?Array.from(lines,e=>e.textContent).join('\n'):code.textContent;
        let ok=false;
        if(window.isSecureContext&&navigator.clipboard){try{await navigator.clipboard.writeText(text);ok=true;}catch(_){}}
        if(!ok){const old=document.activeElement;const area=element('textarea',{'aria-label':'临时复制区'});area.value=text;area.style.cssText='position:fixed;left:-10000px;top:0';document.body.append(area);area.select();try{ok=document.execCommand('copy');}catch(_){}area.remove();old?.focus();}
        announce(ok?'代码已复制。':'复制失败，请手动选择代码。');
      });
      pre.append(copy);
    });
    reconcile();
  }
  function queueDecorate(){if(decorateQueued)return;decorateQueued=true;queueMicrotask(()=>{decorateQueued=false;decorate();});}
  function init() {
    root.classList.add('zero-anime');controls();applyMode();decorate();
    document.addEventListener('visibilitychange',reconcile);
    motion.addEventListener('change',reconcile);pointer.addEventListener('change',reconcile);
    darkQuery.addEventListener('change',()=>{if(mode==='system')applyMode();});
    connection?.addEventListener?.('change',reconcile);
    addEventListener('storage',event=>{if(event.key===storageKey){effects=readEffects();reconcile();}if(event.key===modeKey){mode=store.get(modeKey)||'system';if(!['system','light','dark'].includes(mode))mode='system';applyMode();}});
    if(window.jQuery)window.jQuery(document).on('pjax:complete.zeroAnime pjax:end.zeroAnime',queueDecorate);
    const main=document.getElementById('main');
    if(main)new MutationObserver(records=>{
      if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.matches('article,pre,.hljs-ln')||n.querySelector('article,pre,.hljs-ln')))))queueDecorate();
    }).observe(main,{childList:true,subtree:true});
    // 原主题配色按钮依然可用，并同步到统一偏好入口。
    document.addEventListener('click',event=>{
      if(event.target.closest('#fabtn_toggle_darkmode,#blog_setting_darkmode_switch,#blog_setting_toggle_darkmode_and_amoledarkmode'))queueMicrotask(()=>{mode=root.classList.contains('darkmode')?'dark':'light';store.set(modeKey,mode);applyMode();});
    });
    addEventListener('pageshow',()=>{applyMode();reconcile();});
  }
  window.ZeroAnime={version:config.version,setEffect,setMode(value){if(['system','light','dark'].includes(value)){mode=value;store.set(modeKey,mode);applyMode();}},status(){return {version:config.version,mode,effects:{...effects},active:Array.from(running.keys()),pending:Array.from(pending.keys()),reducedMotion:motion.matches,saveData:!!connection?.saveData,hidden:document.hidden};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
