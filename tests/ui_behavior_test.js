'use strict';
/* 临时验证：[2] 机型识别 placeholder / [3] 推进时滚动题目框。跑完即删。 */
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
    remove(){}, focus(){}, querySelector(){ return null; }, querySelectorAll(){ return []; },
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
  const els={};
  const mk=(id)=>{ const e=makeEl('DIV',id); els[id]=e; return e; };
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
  vm.runInNewContext(wbSrc,g);
  vm.runInNewContext(appSrc,g);
  return { els, doc };
}

let fail=0; const ck=(n,c)=>{ if(!c){fail++;console.log('  FAIL:',n);} else console.log('  ok:',n); };

// [2] desktop
const D=build({mobile:false});
ck('[2] desktop letter placeholder 长版', D.els['letter-input'].getAttribute('placeholder')==='输入字母，回车或点确定');
ck('[2] desktop word placeholder 长版', D.els['word-input'].getAttribute('placeholder')==='输入单词，回车或点确定');
// [2] mobile
const M=build({mobile:true});
ck('[2] mobile letter placeholder 短版', M.els['letter-input'].getAttribute('placeholder')==='输入字母');
ck('[2] mobile word placeholder 短版', M.els['word-input'].getAttribute('placeholder')==='输入单词');

// [3] 认字母：提交 -> 继续 应触发滚动；初次初始化不应滚动
const stageSpy={ __scrollCalls:0, scrollIntoView(o){ this.__scrollCalls++; this.__lastScrollOpts=o; } };
D.els['letter-glyph'].__closest=stageSpy;
ck('[3] init 不滚动', (stageSpy.__scrollCalls||0)===0);
const li=D.els['letter-input'], ls=D.els['letter-submit'];
li.value='q'; ls.dispatch('click');
ck('[3] 提交本身不滚动(仍显示判定)', (stageSpy.__scrollCalls||0)===0);
ls.dispatch('click'); // 继续 -> 推进
ck('[3] 继续推进触发滚动', stageSpy.__scrollCalls>=1);
ck('[3] 用 smooth+start', stageSpy.__lastScrollOpts && stageSpy.__lastScrollOpts.behavior==='smooth' && stageSpy.__lastScrollOpts.block==='start');
D.els['letter-next'].dispatch('click');
ck('[3] 换一个也触发滚动', stageSpy.__scrollCalls>=2);
// [3] 认单词
const wStage={ __scrollCalls:0, scrollIntoView(o){ this.__scrollCalls++; this.__lastScrollOpts=o; } };
D.els['word-glyph'].__closest=wStage;
const wi=D.els['word-input'], ws=D.els['word-submit'];
wi.value=D.els['word-glyph'].textContent; ws.dispatch('click');
ck('[3] 认单词提交不滚动', (wStage.__scrollCalls||0)===0);
ws.dispatch('click'); // 继续
ck('[3] 认单词继续推进触发滚动', wStage.__scrollCalls>=1);
D.els['word-next'].dispatch('click');
ck('[3] 认单词换一个触发滚动', wStage.__scrollCalls>=2);

console.log(fail===0?'\n[2][3] VERIFY: all ok':('\nFAILED '+fail));
process.exit(fail===0?0:1);
