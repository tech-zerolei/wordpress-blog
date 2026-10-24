/* No real browser or network. Small DOM harness verifies each module's start/stop resource contract. */
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const moduleDir = new URL('../wordpress/wp-content/mu-plugins/zero-anime/modules/', import.meta.url);
const nodes=new Map();const windowEvents=new EventTarget();let rafId=0;const frames=new Map();let observerCount=0;
class FakeElement extends EventTarget {
 constructor(tag){super();this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.style={};this.classList={set:new Set(),add(x){this.set.add(x);},remove(x){this.set.delete(x);},contains(x){return this.set.has(x);}};}
 set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
 setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')this.id=v;}
 append(e){this.children.push(e);e.parentNode=this;}prepend(e){this.children.unshift(e);e.parentNode=this;}
 remove(){nodes.delete(this.id);if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(e=>e!==this);}
 getBoundingClientRect(){return {x:0,y:80,top:80,left:0,width:1200,height:400};}
 getContext(){return {setTransform(){},clearRect(){},beginPath(){},ellipse(){},fill(){}};}
 closest(){return null;}
}
const document=new class extends EventTarget {}();document.body=new FakeElement('body');document.createElement=tag=>new FakeElement(tag);document.getElementById=id=>nodes.get(id)||null;
Object.assign(globalThis,{document,addEventListener:windowEvents.addEventListener.bind(windowEvents),requestAnimationFrame:fn=>{const id=++rafId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),innerHeight:800,scrollY:0,devicePixelRatio:2,CSS:{supports(){return true;}}});
class Observer{constructor(cb){this.cb=cb;observerCount++;}observe(){}disconnect(){observerCount--;}}
Object.assign(globalThis,{ResizeObserver:Observer,IntersectionObserver:Observer});
const root=new FakeElement('html');const banner=new FakeElement('section');banner.id='banner';const article=new FakeElement('div');article.id='post_content';
const config={petalsDesktop:14,petalsMobile:5,pixelRatioMax:1.5,maxFps:30};
const results=[];
for(const [name,cls] of [['cardLift','za-cardLift'],['heroGlow','za-heroGlow'],['glassNav','za-glassNav']]){
 const module=await import(new URL(name+'.js',moduleDir));const cleanup=module.mount({root,config});assert(root.classList.contains(cls));cleanup();assert(!root.classList.contains(cls));cleanup();results.push(name+': mount/unmount PASS');
}
{
 const module=await import(new URL('petals.js',moduleDir));const cleanup=module.mount({root,config});assert(nodes.has('za-petals'));assert.equal(nodes.get('za-petals').width,1800);assert.equal(frames.size,1);cleanup();assert(!nodes.has('za-petals'));assert.equal(frames.size,0);assert.equal(observerCount,0);results.push('petals: DPR cap, canvas removal, RAF cancellation PASS');
}
{
 const module=await import(new URL('readingProgress.js',moduleDir));const cleanup=module.mount({root,config});assert(nodes.has('za-reading-progress'));windowEvents.dispatchEvent(new Event('scroll'));assert.equal(frames.size,1);cleanup();assert(!nodes.has('za-reading-progress'));assert.equal(frames.size,0);assert.equal(observerCount,0);windowEvents.dispatchEvent(new Event('scroll'));assert.equal(frames.size,0);results.push('readingProgress: listener/RAF/observer cleanup PASS');
}
{
 const module=await import(new URL('clickStars.js',moduleDir));const cleanup=module.mount();cleanup();const click=new Event('click');Object.defineProperty(click,'detail',{value:1});document.dispatchEvent(click);assert.equal(document.body.children.length,0);results.push('clickStars: aborted listener PASS');
}
console.log(results.join('\n'));console.log('6 module lifecycle tests passed.');
