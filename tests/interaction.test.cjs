const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  const handlers = {};
  const attrs = {};
  const classes = new Set();
  const linkHandlers = [];
  const formHandlers = {};
  const opened = [];
  const toggle = {setAttribute:(key,value)=>attrs[key]=value, addEventListener:(name,fn)=>handlers[name]=fn};
  const nav = {classList:{add:value=>classes.add(value),remove:value=>classes.delete(value),toggle(value){if(classes.has(value)){classes.delete(value);return false;}classes.add(value);return true;}},querySelectorAll:()=>Array.from({length:4},()=>({addEventListener:(name,fn)=>linkHandlers.push(fn)}))};
  const elements = {'.menu':toggle,'.links':nav,'#form':{addEventListener:(name,fn)=>formHandlers[name]=fn},'#year':{},'#service':{value:''},'#car':{value:''},'#details':{value:''}};
  const docHandlers = {};
  const document = {querySelector:selector=>elements[selector]??null,querySelectorAll:()=>[],getElementById:id=>elements['#'+id],addEventListener:(name,fn)=>docHandlers[name]=fn};
  const html = fs.readFileSync('index.html','utf8');
  const script = fs.existsSync('assets/site.js') ? fs.readFileSync('assets/site.js','utf8') : html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script,{document,window:{open:(...args)=>opened.push(args)},Date,encodeURIComponent});
  return {handlers,docHandlers,attrs,classes,linkHandlers,formHandlers,opened,elements};
}
test('Escape closes menu and resets accessible name and expanded state',()=>{
  const f=fixture(); f.handlers.click();
  assert.equal(f.attrs['aria-expanded'],'true');
  assert.equal(typeof f.docHandlers.keydown,'function','Escape handler missing');
  f.docHandlers.keydown({key:'Escape'});
  assert.equal(f.classes.has('open'),false);
  assert.equal(f.attrs['aria-expanded'],'false');
  assert.equal(f.attrs['aria-label'],'Abrir menu');
});

test('each navigation link closes the expanded menu',()=>{
  const f=fixture();
  assert.equal(f.linkHandlers.length,4);
  for(const click of f.linkHandlers){
    f.handlers.click();
    assert.equal(f.classes.has('open'),true);
    click();
    assert.equal(f.classes.has('open'),false);
    assert.equal(f.attrs['aria-expanded'],'false');
    assert.equal(f.attrs['aria-label'],'Abrir menu');
  }
});

test('form prepares correctly encoded WhatsApp message without sending it',()=>{
  const f=fixture(); let prevented=false;
  f.elements['#service'].value='Proteção da pintura';
  f.elements['#car'].value='  Hyundai 2020  ';
  f.elements['#details'].value='  Risco & dúvida? #porta  ';
  f.formHandlers.submit({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.equal(f.opened.length,1);
  const [href,target,features]=f.opened[0];
  const url=new URL(href);
  assert.equal(url.origin,'https://wa.me');
  assert.equal(url.pathname,'/5555996185305');
  assert.equal(url.searchParams.get('text'),'Olá, RW! Gostaria de consultar um serviço.\nServiço: Proteção da pintura\nVeículo: Hyundai 2020\nDetalhes: Risco & dúvida? #porta');
  assert.equal(url.hash,'');
  assert.equal(target,'_blank');
  assert.equal(features,'noopener,noreferrer');
});

test('form ignores empty service and omits empty optional fields',()=>{
  const f=fixture();
  f.formHandlers.submit({preventDefault(){}});
  assert.equal(f.opened.length,0);
  f.elements['#service'].value='Outro serviço';
  f.elements['#car'].value='   ';
  f.elements['#details'].value='  ';
  f.formHandlers.submit({preventDefault(){}});
  assert.equal(new URL(f.opened[0][0]).searchParams.get('text'),'Olá, RW! Gostaria de consultar um serviço.\nServiço: Outro serviço');
});
