/* ===== InvestCode ===== */
const USERS_KEY='investcode_users',SESSION_KEY='investcode_session',PAL=['#2447d6','#13a37f','#e0a21b','#d4533b','#8a5cd6','#3a9bc9'];
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let user=null,K='',data=[],authMode='login';
let view='home',editId=null,q='',fs='todos',delId=null;

/* ===== Ecrãs ===== */
function show(id){['splash','auth','shell'].forEach(s=>{$('#'+s).hidden=s!==id})}

/* ===== Autenticação ===== */
const readUsers=()=>{try{const u=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');return Array.isArray(u)?u:[]}catch(e){return[]}};
const saveUsers=u=>{try{localStorage.setItem(USERS_KEY,JSON.stringify(u));return true}catch(e){return false}};
async function hashPw(email,pw){
const s='investcode:'+email+':'+pw;
if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
return btoa(unescape(encodeURIComponent(s)))}

function authHtml(){const reg=authMode==='registo';
return '<div class="auth-card"><img class="auth-logo" src="logo.svg" alt="Logotipo InvestCode"><h1>'+(reg?'Criar conta':'Entrar no InvestCode')+'</h1>'+
'<p class="m">'+(reg?'Preenche os teus dados para começar a registar os teus investimentos.':'Introduz o teu email e a tua palavra-passe para aceder.')+'</p>'+
'<form onsubmit="return authSubmit(event)" novalidate>'+
(reg?'<label for="a_nome">Nome</label><input id="a_nome" autocomplete="name">':'')+
'<label for="a_email">Email</label><input id="a_email" type="email" inputmode="email" autocomplete="email">'+
'<label for="a_pw">Palavra-passe</label><input id="a_pw" type="password" autocomplete="'+(reg?'new-password':'current-password')+'">'+
(reg?'<label for="a_pw2">Confirmar palavra-passe</label><input id="a_pw2" type="password" autocomplete="new-password">':'')+
'<p class="err" id="a_err" role="alert"></p>'+
'<button class="btn full" type="submit">'+(reg?'Criar conta':'Entrar')+'</button></form>'+
'<p class="m switch">'+(reg?'Já tens conta?':'Ainda não tens conta?')+' <button class="link" type="button" onclick="setAuth(\''+(reg?'login':'registo')+'\')">'+(reg?'Entrar':'Criar conta')+'</button></p></div>'}

function renderAuth(){$('#auth').innerHTML=authHtml();const f=$('#auth input');if(f)f.focus()}
function showAuth(){authMode=readUsers().length?'login':'registo';show('auth');renderAuth()}
function setAuth(m){authMode=m;renderAuth()}
const showErr=m=>{$('#a_err').textContent=m};

async function authSubmit(ev){
ev.preventDefault();
const val=k=>$('#a_'+k)?$('#a_'+k).value.trim():'';
const nome=val('nome'),email=val('email').toLowerCase(),pw=$('#a_pw').value,pw2=$('#a_pw2')?$('#a_pw2').value:'';
const reg=authMode==='registo',us=readUsers();
let e='';
if(reg&&!nome)e='Indica o teu nome.';
else if(!/^\S+@\S+\.\S+$/.test(email))e='Indica um email válido.';
else if(!pw)e='Indica a palavra-passe.';
else if(reg&&pw.length<6)e='A palavra-passe deve ter pelo menos 6 caracteres.';
else if(reg&&pw!==pw2)e='As palavras-passe não coincidem.';
if(e){showErr(e);return false}
const h=await hashPw(email,pw);
if(reg){
if(us.some(u=>u.email===email)){showErr('Já existe uma conta com este email. Entra com a tua palavra-passe.');return false}
const u={id:'u'+Date.now(),nome,email,hash:h};us.push(u);
if(!saveUsers(us)){showErr('Não foi possível guardar a conta neste navegador.');return false}
enter(u)
}else{
const u=us.find(x=>x.email===email&&x.hash===h);
if(!u){showErr('Email ou palavra-passe incorretos.');return false}
enter(u)}
return false}

function enter(u){user=u;try{sessionStorage.setItem(SESSION_KEY,u.id)}catch(e){}startApp()}
function logout(){try{sessionStorage.removeItem(SESSION_KEY)}catch(e){}user=null;data=[];showAuth()}

/* ===== Sistema de investimentos ===== */
function startApp(){
K='inv_mvp_v1_'+user.id;
data=[];try{data=JSON.parse(localStorage.getItem(K)||'[]')}catch(e){data=[]}
if(!Array.isArray(data))data=[];
view='home';editId=null;delId=null;q='';fs='todos';
show('shell');render();window.scrollTo(0,0)}

const persist=()=>{try{localStorage.setItem(K,JSON.stringify(data))}catch(e){}};
const fmt=(v,c)=>new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2}).format(v)+(c==='USD'?' US$':' Kz');
const fd=d=>d?d.split('-').reverse().join('/'):'—';
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const left=i=>Math.round((new Date(i.fim+'T00:00:00')-new Date(today()+'T00:00:00'))/864e5);
const st=i=>i.estado==='Resgatado'?'Resgatado':(i.fim&&left(i)<0?'Vencido':'Ativo');
const sum=l=>l.reduce((a,i)=>a+i.valor,0);
function nav(v){view=v;editId=null;delId=null;render();window.scrollTo(0,0)}
function when(i){const d=left(i);return d<0?'venceu há '+(-d)+' d':d===0?'vence hoje':'vence em '+d+' d'}

function bars(ti,l,k,t,c){const g={};l.forEach(i=>{const n=i[k]||'Sem indicação';g[n]=(g[n]||0)+i.valor});
return '<h3>'+ti+'</h3>'+Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([n,v])=>'<div class="bar"><div class="bl"><span>'+esc(n)+'</span><span>'+fmt(v,c)+' ('+Math.round(v/t*100)+'%)</span></div><div class="tr"><i style="width:'+(v/t*100)+'%"></i></div></div>').join('')}

function home(){
const act=data.filter(i=>i.estado!=='Resgatado');
if(!data.length)return '<div class="empty"><h1>Começa o teu registo</h1><p class="m">Ainda não há investimentos. Adiciona o primeiro ou carrega exemplos para experimentar.</p><div class="btns" style="justify-content:center"><button class="btn" onclick="nav(\'form\')">Adicionar investimento</button><button class="btn ghost" onclick="demo()">Carregar exemplos</button></div></div>';
const curs=[...new Set(act.map(i=>i.moeda))];
const al=act.filter(i=>i.fim&&left(i)<=30).sort((a,b)=>left(a)-left(b));
let h='<h1>Resumo</h1>';
curs.forEach(c=>{const l=act.filter(i=>i.moeda===c),t=sum(l),g={};
l.forEach(i=>g[i.inst]=(g[i.inst]||0)+i.valor);
const ent=Object.entries(g).sort((a,b)=>b[1]-a[1]);
h+='<div class="hero"><div class="m">Total em aberto ('+(c==='USD'?'Dólar':'Kwanza')+')</div><div class="big">'+fmt(t,c)+'</div><div class="seg">'+ent.map(([n,v],x)=>'<i style="width:'+(v/t*100)+'%;background:'+PAL[x%6]+'"></i>').join('')+'</div><div class="leg">'+ent.map(([n,v],x)=>'<span style="--c:'+PAL[x%6]+'">'+esc(n)+' '+Math.round(v/t*100)+'%</span>').join('')+'</div></div>';
const ex=l.filter(i=>i.esp>0);
if(ex.length)h+='<div class="row"><span class="m">Ganho esperado</span><span class="ok">+'+fmt(ex.reduce((a,i)=>a+i.esp-i.valor,0),c)+'</span></div>';
h+='<div class="sec">'+bars('Por modalidade',l,'mod',t,c)+'</div><div class="sec">'+bars('Por finalidade',l,'fin',t,c)+'</div>'});
if(al.length)h+='<div class="sec"><h3>Alertas de vencimento</h3>'+al.map(i=>'<div class="row"><span>'+esc(i.inst)+', '+esc(i.mod)+'</span><span class="'+(left(i)<0?'bad':'warn')+'">'+when(i)+'</span></div>').join('')+'</div>';
const rs=data.filter(i=>i.estado==='Resgatado'&&i.rec>0);
if(rs.length){const cs=[...new Set(rs.map(i=>i.moeda))];h+='<div class="sec"><h3>Resultado dos resgatados</h3>'+cs.map(c=>{const r=rs.filter(i=>i.moeda===c).reduce((a,i)=>a+i.rec-i.valor,0);return '<div class="row"><span class="m">'+(c==='USD'?'Dólar':'Kwanza')+'</span><span class="'+(r>=0?'ok':'bad')+'">'+(r>=0?'+':'')+fmt(r,c)+'</span></div>'}).join('')+'</div>'}
return h}

function itemsHtml(){
const s=q.trim().toLowerCase();
const l=data.filter(i=>(fs==='todos'||st(i)===fs)&&(!s||[i.inst,i.mod,i.fin,i.nota].join(' ').toLowerCase().includes(s))).sort((a,b)=>(a.fim||'9').localeCompare(b.fim||'9'));
if(!l.length)return '<p class="m empty">Nenhum investimento encontrado.</p>';
return l.map(i=>{const s=st(i),cl=s==='Vencido'?'bad':s==='Resgatado'?'m':'ok';
return '<div class="item"><div class="top"><b>'+esc(i.inst)+'</b><span class="val">'+fmt(i.valor,i.moeda)+'</span></div>'+
'<div class="m">'+esc(i.mod)+(i.fin?' para '+esc(i.fin):'')+'</div>'+
'<div class="m">De '+fd(i.ini)+' até '+fd(i.fim)+'</div>'+
'<div><span class="tag '+cl+'">'+s+'</span>'+(s==='Ativo'&&i.fim&&left(i)<=30?' <span class="warn tag">'+when(i)+'</span>':'')+(i.esp>0?' <span class="m">Esperado: '+fmt(i.esp,i.moeda)+(i.pct!=null?' (+'+i.pct+'%)':'')+'</span>':'')+(i.rec>0?' <span class="m">Recebido: '+fmt(i.rec,i.moeda)+'</span>':'')+'</div>'+
(i.nota?'<div class="m">“'+esc(i.nota)+'”</div>':'')+
'<div class="btns"><button class="btn ghost sm" onclick="edit('+i.id+')">Editar</button><button class="btn ghost sm" onclick="del('+i.id+')">'+(delId===i.id?'Confirmar apagar':'Apagar')+'</button></div></div>'}).join('')}
const items=()=>{$('#items').innerHTML=itemsHtml()};
function list(){return '<h1>Investimentos</h1><input id="q" type="search" placeholder="Pesquisar por banco, modalidade, finalidade" value="'+esc(q)+'" oninput="q=this.value;items()"><div class="chips">'+['todos','Ativo','Vencido','Resgatado'].map(s=>'<button class="chip '+(fs===s?'on':'')+'" onclick="fs=\''+s+'\';render()">'+(s==='todos'?'Todos':s)+'</button>').join('')+'</div><div id="items">'+itemsHtml()+'</div>'}
function edit(id){editId=id;view='form';render();window.scrollTo(0,0)}
function del(id){if(delId===id){data=data.filter(i=>i.id!==id);delId=null;persist()}else delId=id;render()}

const expected=(v,p)=>Math.round(v*(1+p/100)*100)/100;
function calcHtml(v,p,c){
v=parseFloat(v);p=parseFloat(p);
if(!(v>0)||isNaN(p)||p<0)return '<span class="m">Indica o valor investido e a percentagem para ver o valor esperado.</span>';
const t=expected(v,p),g=Math.round((t-v)*100)/100;
return '<div class="row"><span class="m">Retorno ('+p+'% de '+fmt(v,c)+')</span><span class="ok">+'+fmt(g,c)+'</span></div><div class="row"><b>Valor esperado</b><span class="val">'+fmt(t,c)+'</span></div>'}
function updCalc(){const e=$('#f_calc');if(e)e.innerHTML=calcHtml($('#f_valor').value,$('#f_pct').value,$('#f_moeda').value)}

function form(){
const i=data.find(x=>x.id===editId)||{moeda:'AOA',estado:'Ativo',ini:today()};
const ins=[...new Set(data.map(x=>x.inst))],mods=[...new Set(['Depósito a prazo','Ações','Títulos do Tesouro','Fundo de investimento','Poupança','Cripto'].concat(data.map(x=>x.mod)))];
const v=(k)=>esc(i[k]==null?'':i[k]);
const pct=i.pct!=null?i.pct:(i.valor>0&&i.esp>0?Math.round((i.esp/i.valor-1)*10000)/100:'');
return '<h1>'+(editId?'Editar investimento':'Novo investimento')+'</h1>'+
'<label>Banco, corretora ou bolsa</label><input id="f_inst" list="dl_i" value="'+v('inst')+'" placeholder="Ex.: BAI, BODIVA, Trade Republic"><datalist id="dl_i">'+ins.map(x=>'<option value="'+esc(x)+'">').join('')+'</datalist>'+
'<div class="two"><div><label>Valor investido</label><input id="f_valor" type="number" inputmode="decimal" min="0" value="'+v('valor')+'" oninput="updCalc()"></div><div><label>Moeda</label><select id="f_moeda" onchange="updCalc()"><option value="AOA"'+(i.moeda==='AOA'?' selected':'')+'>Kwanza</option><option value="USD"'+(i.moeda==='USD'?' selected':'')+'>Dólar</option></select></div>'+
'<div><label>Data de início</label><input id="f_ini" type="date" value="'+v('ini')+'"></div><div><label>Data de fim</label><input id="f_fim" type="date" value="'+v('fim')+'"></div></div>'+
'<label>Modalidade</label><input id="f_mod" list="dl_m" value="'+v('mod')+'"><datalist id="dl_m">'+mods.map(x=>'<option value="'+esc(x)+'">').join('')+'</datalist>'+
'<label>Finalidade</label><input id="f_fin" value="'+v('fin')+'" placeholder="Ex.: propinas, carro, reserva de emergência">'+
'<div class="two"><div><label>Percentagem de retorno (%)</label><input id="f_pct" type="number" inputmode="decimal" min="0" step="any" value="'+esc(pct)+'" placeholder="Ex.: 12" oninput="updCalc()"></div><div><label>Valor recebido</label><input id="f_rec" type="number" inputmode="decimal" min="0" value="'+v('rec')+'"></div></div>'+
'<div class="calc" id="f_calc" aria-live="polite">'+calcHtml(i.valor,pct,i.moeda)+'</div>'+
'<label>Estado</label><select id="f_estado"><option'+(i.estado==='Ativo'?' selected':'')+'>Ativo</option><option'+(i.estado==='Resgatado'?' selected':'')+'>Resgatado</option></select>'+
'<label>Notas</label><textarea id="f_nota">'+v('nota')+'</textarea><p class="err" id="err"></p>'+
'<div class="btns"><button class="btn" onclick="submitF()">Guardar investimento</button><button class="btn ghost" onclick="nav(\'list\')">Cancelar</button></div>'}
function submitF(){
const g=k=>$('#f_'+k).value.trim(),o={inst:g('inst'),valor:parseFloat(g('valor')),moeda:g('moeda'),ini:g('ini'),fim:g('fim'),mod:g('mod'),fin:g('fin'),pct:parseFloat(g('pct')),esp:0,rec:parseFloat(g('rec'))||0,estado:g('estado'),nota:g('nota')};
const e=!o.inst?'Indica o banco, corretora ou bolsa.':!(o.valor>0)?'Indica um valor investido maior que zero.':isNaN(o.pct)||o.pct<0?'Indica a percentagem de retorno (0 ou mais).':!o.ini?'Indica a data de início.':!o.fim?'Indica a data de fim.':o.fim<o.ini?'A data de fim não pode ser antes da data de início.':!o.mod?'Indica a modalidade.':'';
if(e){$('#err').textContent=e;return}
o.esp=expected(o.valor,o.pct);
if(editId){const x=data.find(i=>i.id===editId);Object.assign(x,o)}else{o.id=Date.now();data.push(o)}
persist();editId=null;view='list';render();window.scrollTo(0,0)}
function demo(){const d=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
data=data.concat([
{id:1,inst:'BAI',valor:500000,moeda:'AOA',ini:d(-150),fim:d(12),mod:'Depósito a prazo',fin:'Propinas',pct:12,esp:560000,rec:0,estado:'Ativo',nota:'Renovar se a taxa subir'},
{id:2,inst:'BODIVA',valor:300000,moeda:'AOA',ini:d(-60),fim:d(200),mod:'Títulos do Tesouro',fin:'Reserva de emergência',pct:15,esp:345000,rec:0,estado:'Ativo',nota:''},
{id:3,inst:'Trade Republic',valor:400,moeda:'USD',ini:d(-90),fim:d(300),mod:'Ações',fin:'Carro',esp:0,rec:0,estado:'Ativo',nota:''},
{id:4,inst:'BFA',valor:200000,moeda:'AOA',ini:d(-300),fim:d(-5),mod:'Poupança',fin:'Telemóvel novo',esp:0,rec:0,estado:'Ativo',nota:''},
{id:5,inst:'BAI',valor:100000,moeda:'AOA',ini:d(-400),fim:d(-40),mod:'Depósito a prazo',fin:'Viagem',esp:0,rec:112000,estado:'Resgatado',nota:''}]);
persist();render()}

function render(){
document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));
const bar='<div class="userbar"><span class="m">'+esc(user.nome)+'</span><button class="link" onclick="logout()">Sair</button></div>';
$('#app').innerHTML=bar+(view==='home'?home():view==='list'?list():form())}

/* ===== Arranque: logotipo -> login -> sistema ===== */
(function boot(){
let sid=null;try{sid=sessionStorage.getItem(SESSION_KEY)}catch(e){}
const saved=readUsers().find(u=>u.id===sid);
show('splash');
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
setTimeout(()=>{
$('#splash').classList.add('out');
setTimeout(()=>{if(saved){user=saved;startApp()}else showAuth()},reduce?0:450)
},reduce?800:2400)})();
