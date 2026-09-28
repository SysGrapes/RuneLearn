'use strict';
/* UI 行为验证：[2] 机型识别 placeholder / [3] 电脑端禁用自动滚动 / [4] 手机平板滚动与点击输入框。
 * 离线 Node DOM 桩，零依赖：node tests\ui_behavior_test.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const appSrc = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const wbSrc = fs.readFileSync(path.join(__dirname, '../js/wordbank.js'), 'utf8');

function makeEl(tag, id) {
  const e = {
    tagName: tag, id: id || '', children: [], listeners: {}, _textContent: '', style: {}, attributes: {},
    scrollHeight: 120, clientWidth: 600, value: '', disabled: false, _innerHTML: '',
    classList: { _s: new Set(), toggle(c, on){ const h=this._s.has(c); const w=(on===undefined)?!h:!!on; if(w)this._s.add(c); else this._s.delete(c); }, add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, contains(c){return this._s.has(c);} },
    addEventListener(t, fn){ (this.listeners[t]=this.listeners[t]||[]).push(fn); },
    dispatch(t, ev){ (this.listeners[t]||[]).slice().forEach(fn=>fn(ev||{})); },
    appendChild(c){ this.children.push(c); if(c) c.parentNode=this; return c; },
    // __dispatchFocus 让桩的 focus() 真实派发 focus 事件（真实浏览器里程序化 focus 会同步派发）
    remove(){}, focus(){ if(this.__dispatchFocus) this.dispatch('focus'); }, querySelector(){ return null; }, querySelectorAll(){ return []; },
    setAttribute(k,v){ this.attributes[k]=String(v); }, getAttribute(k){ return this.attributes[k]!==undefined?this.attributes[k]:null; },
    getContext(){ return { measureText(t){ return { width: String(t).length*40 }; }, font:'', textAlign:'', textBaseline:'', lineJoin:'', lineWidth:0, strokeStyle:'', fillStyle:'', fillText(){}, clearRect(){} }; },
    toBlob(cb){ cb({}); },
    scrollIntoView(opts){ this.__scrollCalls=(this.__scrollCalls||0)+1; this.__lastScrollOpts=opts; },
    closest(sel){ return this.__closest || this; }
  };
  Object.defineProperty(e,'textContent',{ get(){ return (this.children&&this.children.length)?this.children.map(c=>c.textContent||'').join(''):this._textContent; }, set(v){ this._textContent=String(v); this.children=[]; } });
  Object.defineProperty(e,'innerHTML',{ get(){ return this._innerHTML; }, set(v){ this._innerHTML=String(v); } });
  Object.defineProperty(e,'parentNode',{ get(){ return this._parent||null; }, set(v){ this._parent=v; } });
  return e;
}

function build(opts){
  opts = opts || {};
  const els={};
  const mk=(id)=>{ const e=makeEl('DIV',id); e.__dispatchFocus=!!opts.dispatchFocus; els[id]=e; return e; };
  const ids=['convert-input','convert-stage','convert-color','convert-stroke','convert-size','convert-stroke-color','convert-hint','convert-clear','convert-export','brand-title','letter-glyph','letter-input','letter-verdict','letter-history','letter-submit','letter-next','letter-history-clear','word-glyph','word-meta','word-input','word-verdict','word-history','word-submit','word-next','word-history-clear','word-streak-hint','panel-convert','panel-recognize'];
  ids.forEach(mk);
  const doc={
    querySelector(sel){ const id=sel.replace(/^#/,''); return els[id]||null; },
    querySelectorAll(sel){
      if(sel==='.main-tabs .tab')return[makeEl('BUTTON'),makeEl('BUTTON')];
      if(sel==='.sub-tabs .sub-tab')return[makeEl('BUTTON'),makeEl('BUTTON')];
      if(sel==='.script-btn'){const a=makeEl('BUTTON');a.attributes['data-script']='normal';const b=makeEl('BUTTON');b.attributes['data-script']='rune';return[a,b];}
      if(sel==='.difficulty'){return['easy','med','hard','expert'].map(k=>{const e=makeEl('BUTTON');e.attributes['data-diff']=k;return e;});}
      if(sel==='.panel')return[els['panel-convert'],els['panel-recognize']];
      if(sel==='.subpanel')return[makeEl('DIV'),makeEl('DIV')];
      return[];
    },
    createElement(tag){ return makeEl((tag||'div').toUpperCase()); },
    fonts:{ load(){return Promise.resolve([]);}, add(){} },
    body: makeEl('BODY')
  };
  const localStorage={ getItem(){return null;}, setItem(){}, removeItem(){} };
  const g={ document: doc, console, Math, URL:{createObjectURL(){return 'blob:x';},revokeObjectURL(){}},
    window:{ localStorage, FontFace:function(){this.load=function(){return {then(){return this;},catch(){return this;}};};}, setTimeout(){return 1;}, clearTimeout(){} },
    localStorage, setTimeout(){return 1;}, clearTimeout(){} };
  g.global=g;
  if(opts.mobile){ g.window.matchMedia=function(q){ return { matches: /coarse|hover/.test(q) }; }; g.window.navigator={ userAgent:'Mozilla/5.0 (Linux; Android 13; Mobile)' }; }
  else { g.window.navigator={ userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }; }
  // prepare 在 app.js 执行前调用，用于挂滚动探针：否则初始化是否滚动根本观测不到
  if(opts.prepare) opts.prepare(els);
  vm.runInNewContext(wbSrc,g);
  vm.runInNewContext(appSrc,g);
  return { els, doc };
}

function spy(){ return { __scrollCalls:0, scrollIntoView(o){ this.__scrollCalls++; this.__lastScrollOpts=o; } }; }
function isSmoothStart(o){ return !!o && o.behavior==='smooth' && o.block==='start'; }

let fail=0; const ck=(n,c)=>{ if(!c){fail++;console.log('  FAIL:',n);} else console.log('  ok:',n); };

/* ---------- [2] 机型识别 placeholder ---------- */
const D=build({mobile:false});
ck('[2] desktop letter placeholder 长版', D.els['letter-input'].getAttribute('placeholder')==='输入字母，回车或点确定');
ck('[2] desktop word placeholder 长版', D.els['word-input'].getAttribute('placeholder')==='输入单词，回车或点确定');
const M=build({mobile:true});
ck('[2] mobile letter placeholder 短版', M.els['letter-input'].getAttribute('placeholder')==='输入字母');
ck('[2] mobile word placeholder 短版', M.els['word-input'].getAttribute('placeholder')==='输入单词');

/* ---------- [3] 电脑端：完全禁用自动滚动 ---------- */
const dL=spy(), dW=spy();
const DK=build({mobile:false, prepare(els){ els['letter-glyph'].__closest=dL; els['word-glyph'].__closest=dW; }});
ck('[3] 电脑初始化不滚动', dL.__scrollCalls===0 && dW.__scrollCalls===0);
DK.els['letter-input'].value='q'; DK.els['letter-submit'].dispatch('click');    // 提交
ck('[3] 电脑提交本身不滚动', dL.__scrollCalls===0);
DK.els['letter-submit'].dispatch('click');                                      // 继续
ck('[3] 电脑点「继续」不滚动', dL.__scrollCalls===0);
DK.els['letter-next'].dispatch('click');                                        // 换一个
ck('[3] 电脑点「换一个」不滚动', dL.__scrollCalls===0);
DK.els['letter-input'].dispatch('click');                                       // 直接点输入框
ck('[3] 电脑点输入框不滚动', dL.__scrollCalls===0);
DK.els['letter-input'].dispatch('focus');                                       // 聚焦输入框
ck('[3] 电脑聚焦输入框不滚动', dL.__scrollCalls===0);
DK.els['word-input'].value='cat'; DK.els['word-submit'].dispatch('click');
DK.els['word-submit'].dispatch('click');
DK.els['word-next'].dispatch('click');
DK.els['word-input'].dispatch('click');
ck('[3] 电脑认单词全流程也不滚动', dW.__scrollCalls===0);

/* ---------- [3] 手机/平板：推进时滚动到题目框顶端 ---------- */
const mL=spy(), mW=spy();
const MB=build({mobile:true, prepare(els){ els['letter-glyph'].__closest=mL; els['word-glyph'].__closest=mW; }});
ck('[3] 移动端初始化不滚动', mL.__scrollCalls===0 && mW.__scrollCalls===0);
MB.els['letter-input'].value='q'; MB.els['letter-submit'].dispatch('click');    // 提交
ck('[3] 移动端提交本身不滚动(仍显示判定)', mL.__scrollCalls===0);
MB.els['letter-submit'].dispatch('click');                                      // 继续
ck('[3] 移动端点「继续」触发滚动', mL.__scrollCalls>=1);
ck('[3] 移动端用 smooth+start', isSmoothStart(mL.__lastScrollOpts));
MB.els['letter-next'].dispatch('click');                                        // 换一个
ck('[3] 移动端点「换一个」也触发滚动', mL.__scrollCalls>=2);
ck('[3] 移动端「换一个」仍用 smooth+start', isSmoothStart(mL.__lastScrollOpts));
MB.els['word-input'].value=MB.els['word-glyph'].textContent; MB.els['word-submit'].dispatch('click');
ck('[3] 移动端认单词提交不滚动', mW.__scrollCalls===0);
MB.els['word-submit'].dispatch('click');                                        // 继续
ck('[3] 移动端认单词继续触发滚动', mW.__scrollCalls>=1);
MB.els['word-next'].dispatch('click');
ck('[3] 移动端认单词换一个触发滚动', mW.__scrollCalls>=2);

/* ---------- [4] 直接点击/聚焦输入框也滚动；程序化聚焦不滚动 ----------
 * dispatchFocus 让 focus() 真实派发 focus 事件，才能验证“程序化聚焦被排除”。 */
const gL=spy(), gW=spy();
const G=build({mobile:true, dispatchFocus:true, prepare(els){
  els['letter-glyph'].__closest=gL;
  els['word-glyph'].__closest=gW;
}});
ck('[4] 移动端初始化(程序化聚焦)认字母不滚动', gL.__scrollCalls===0);
ck('[4] 移动端初始化(程序化聚焦)认单词不滚动', gW.__scrollCalls===0);
// 证明上面的“不滚动”不是因为没派发 focus：初始化时 placeholder 确实被 focus 监听清空了
ck('[4] 初始化确实发生过程序化聚焦(placeholder 被清空)', G.els['letter-input'].getAttribute('placeholder')==='' && G.els['word-input'].getAttribute('placeholder')==='');

G.els['letter-input'].dispatch('click');
ck('[4] 移动端直接点击认字母输入框触发滚动', gL.__scrollCalls>=1);
ck('[4] 点击输入框用 smooth+start', isSmoothStart(gL.__lastScrollOpts));
const beforeWordClick=gW.__scrollCalls;
G.els['word-input'].dispatch('click');
ck('[4] 移动端直接点击认单词输入框触发滚动', gW.__scrollCalls>beforeWordClick);
const beforeFocus=gL.__scrollCalls;
G.els['letter-input'].dispatch('focus');   // 用户聚焦（非程序化）
ck('[4] 移动端用户聚焦输入框触发滚动', gL.__scrollCalls>beforeFocus);
const beforeSubmit=gL.__scrollCalls;
G.els['letter-input'].value='q'; G.els['letter-submit'].dispatch('click');
ck('[4] 移动端提交判定本身仍不滚动', gL.__scrollCalls===beforeSubmit);
// 程序化聚焦（继续切题）仍要滚动，且不因 focus 而多滚
const beforeNext=gL.__scrollCalls;
G.els['letter-submit'].dispatch('click');  // done 态 -> 继续
ck('[4] 移动端切题时滚动', gL.__scrollCalls>beforeNext);

/* ---------- [5] 转换输入框：隐藏时不得把已增高的高度压回去；补上下边框 ---------- */
const C=build({mobile:false});
const ta=C.els['convert-input'];
ta.scrollHeight=160; ta.style.height='200px';
ta.offsetParent=null;                       // 模拟已切到识记板块（display:none）
ta.dispatch('input');
ck('[5] 隐藏(display:none)时不改写已增高的高度', ta.style.height==='200px');
ta.offsetParent={};                         // 恢复可见
ta.offsetHeight=42; ta.clientHeight=40;     // 上下边框合计 2px
ta.dispatch('input');
ck('[5] 可见时按内容增高并补上边框(scrollHeight 160 + 2)', ta.style.height==='162px');

/* ---------- [6] 同一次手势的 focus→click 只滚一次 ---------- */
const dd=spy();
const DD=build({mobile:true, prepare(els){ els['letter-glyph'].__closest=dd; }});
DD.els['letter-input'].dispatch('focus');
const afterFocus=dd.__scrollCalls;
ck('[6] 用户聚焦输入框触发滚动', afterFocus>=1);
DD.els['letter-input'].dispatch('click');   // 同一次点击紧随 focus
ck('[6] 紧随 focus 的同一次 click 不重复滚动', dd.__scrollCalls===afterFocus);
const fresh=build({mobile:true, prepare(els){ els['letter-glyph'].__closest=dd; }});
ck('[6] 无前置 focus 的独立点击仍会滚动', (function(){ const b=dd.__scrollCalls; fresh.els['letter-input'].dispatch('click'); return dd.__scrollCalls>b; })());

console.log(fail===0?'\n[2][3][4][5][6] VERIFY: all ok':('\nFAILED '+fail));
process.exit(fail===0?0:1);
