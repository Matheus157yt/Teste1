// script.js - frontend for complex sandbox
// Tries to use backend endpoints under /api/*, otherwise falls back to localStorage-only mode.

const state = {
  me: null,
  courses: [],
  users: [],
  online: false
};

const els = {
  authPanel: id('authPanel'),
  dashboardPanel: id('dashboardPanel'),
  profilePanel: id('profilePanel'),
  concursoPanel: id('concursoPanel'),
  adminPanel: id('adminPanel'),
  previewPanel: id('previewPanel'),
  who: id('who'),
  loginId: id('loginId'),
  loginSenha: id('loginSenha'),
  btnLogin: id('btnLogin'),
  btnRegister: id('btnRegister'),
  regNome: id('regNome'),
  regUsuario: id('regUsuario'),
  regEmail: id('regEmail'),
  regSenha: id('regSenha'),
  userName: id('userName'),
  userXP: id('userXP'),
  btnProfile: id('btnProfile'),
  btnConcurso: id('btnConcurso'),
  btnAdmin: id('btnAdmin'),
  btnLogout: id('btnLogout'),
  badges: id('badges'),
  courses: id('courses'),
  avatarFile: id('avatarFile'),
  avatarImg: id('avatarImg'),
  profileName: id('profileName'),
  profileEmail: id('profileEmail'),
  profileUsuario: id('profileUsuario'),
  btnSaveProfile: id('btnSaveProfile'),
  btnBackDash: id('btnBackDash'),
  zipUpload: id('zipUpload'),
  previewFrame: id('previewFrame'),
  btnCreateCourse: id('btnCreateCourse'),
  newCourseTitle: id('newCourseTitle'),
  newCourseBanner: id('newCourseBanner'),
  newCoursePrice: id('newCoursePrice'),
  newCourseAulas: id('newCourseAulas'),
  newCourseReq: id('newCourseReq'),
  adminUsers: id('adminUsers'),
  adminCourses: id('adminCourses'),
  runIndex: null
};

// helper
function id(i){ return document.getElementById(i); }

async function init(){
  // detect backend
  try{
    const r = await fetch('/api/ping',{cache:'no-store'});
    if(r.ok){ state.online = true; els.who.innerText = 'Server: OK'; }
  }catch(e){ state.online = false; els.who.innerText = 'Offline (localStorage mode)'; }

  bindEvents();
  loadInitial();
  showPanel('authPanel');
}

function bindEvents(){
  els.btnLogin.addEventListener('click', login);
  els.btnRegister.addEventListener('click', register);
  els.btnProfile.addEventListener('click', ()=> showPanel('profilePanel'));
  els.btnConcurso.addEventListener('click', ()=> showPanel('concursoPanel'));
  els.btnLogout.addEventListener('click', logout);
  els.btnBackDash.addEventListener('click', ()=> showPanel('dashboardPanel'));
  els.btnSaveProfile.addEventListener('click', saveProfile);
  els.zipUpload.addEventListener('change', handleZip);
  els.btnCreateCourse.addEventListener('click', createCourse);
  id('btnBackDash2').addEventListener('click', ()=> showPanel('dashboardPanel'));
  id('btnBackDash3').addEventListener('click', ()=> showPanel('dashboardPanel'));
}

async function loadInitial(){
  if(state.online){
    try{
      const r = await fetch('/api/courses'); state.courses = await r.json();
      const u = await fetch('/api/users'); state.users = await u.json();
    }catch(e){
      console.warn('error fetching from api',e);
      state.online = false;
    }
  }
  if(!state.online){
    // load from localStorage or default
    const cs = localStorage.getItem('sandbox_courses');
    if(cs) state.courses = JSON.parse(cs);
    else {
      state.courses = [
        {id:1,titulo:'Intro Grátis',tipo:'gratis',desbloqueado:true,preco:0,banner:'https://picsum.photos/600/360?1',aulas:['Bem-vindo','Como usar']},
        {id:2,titulo:'Avançado Pago',tipo:'pago',desbloqueado:false,preco:79.9,banner:'https://picsum.photos/600/360?2',aulas:['Aula1','Aula2','Aula3'],requisitos:[1]},
        {id:3,titulo:'Desafio',tipo:'gratis',desbloqueado:false,preco:0,banner:'https://picsum.photos/600/360?3',aulas:['Desafio 1'],requisitos:[1,2]}
      ];
      localStorage.setItem('sandbox_courses', JSON.stringify(state.courses));
    }
  }
  renderCourses();
}

function showPanel(panelId){
  ['authPanel','dashboardPanel','profilePanel','concursoPanel','adminPanel','previewPanel'].forEach(id=>{
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(panelId).classList.remove('hidden');
}

async function login(){
  const idv = els.loginId.value.trim(); const senha = els.loginSenha.value.trim();
  if(state.online){
    try{
      const r = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:idv,senha})});
      if(r.ok){ const data = await r.json(); state.me = data; afterLogin(); return; }
      else { alert('Login falhou'); return; }
    }catch(e){ console.warn(e); }
  }
  // fallback local
  const users = JSON.parse(localStorage.getItem('sandbox_users')||'[]');
  const u = users.find(x=> (x.email===idv||x.usuario===idv) && x.senha===senha);
  if(!u){ alert('Credenciais inválidas (local)'); return; }
  state.me = u; afterLogin();
}

async function register(){
  const nome = els.regNome.value.trim(), usuario = els.regUsuario.value.trim(), email=els.regEmail.value.trim(), senha=els.regSenha.value.trim();
  if(!nome||!usuario||!email||!senha) return alert('Preencha tudo');
  if(state.online){
    try{
      const r = await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome,usuario,email,senha})});
      if(r.ok){ alert('Registrado'); return; }
    }catch(e){ console.warn(e); }
  }
  // local fallback
  const users = JSON.parse(localStorage.getItem('sandbox_users')||'[]');
  if(users.find(u=>u.email===email||u.usuario===usuario)) return alert('Email ou usuário já existe');
  const novo = {id:Date.now(),nome,usuario,email,senha,tipo:'aluno',avatar:'',progresso:{},badges:[],xp:0,cursosComprados:[]};
  users.push(novo); localStorage.setItem('sandbox_users', JSON.stringify(users));
  alert('Registrado (local)');
}

function afterLogin(){
  els.userName.innerText = state.me.nome || state.me.usuario;
  els.userXP.innerText = state.me.xp || 0;
  els.authPanel.classList.add('hidden');
  showPanel('dashboardPanel');
  renderCourses();
  // show admin button if admin
  if(state.me.tipo==='admin') id('btnAdmin').classList.remove('hidden');
}

function logout(){
  state.me = null;
  els.authPanel.classList.remove('hidden');
  showPanel('authPanel');
}

function renderCourses(){
  const container = els.courses; container.innerHTML = '';
  state.courses.forEach(c=>{
    if(!c.desbloqueado) return;
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = '<img src="'+c.banner+'" /><div class="body"><h4>'+c.titulo+'</h4><p>Tipo: '+c.tipo+' '+(c.tipo==='pago'?'• R$ '+(c.preco||0).toFixed(2):'')+'</p><p>Aulas: '+(c.aulas?c.aulas.length:0)+'</p><div>';
    const actions = document.createElement('div');
    const ul = document.createElement('ul');
    (c.aulas||[]).forEach((a,i)=>{
      const li = document.createElement('li');
      let done=false;
      if(state.me && state.me.progresso && state.me.progresso[c.id]) done = state.me.progresso[c.id].includes(i);
      if(c.tipo==='gratis' || (state.me && state.me.cursosComprados && state.me.cursosComprados.includes(c.id)) || (state.me && state.me.tipo==='admin')){
        li.innerHTML = a + (done? ' ✅':' <button onclick="completeLesson('+c.id+','+i+')">Completar</button>');
      } else {
        li.innerHTML = a + ' <button onclick="buyCourse('+c.id+')">Comprar R$ '+(c.preco||0).toFixed(2)+'</button>';
      }
      ul.appendChild(li);
    });
    card.querySelector('.body').appendChild(ul);
    container.appendChild(card);
  });
}

async function completeLesson(courseId, lessonIndex){
  if(!state.me) return alert('Faça login');
  if(state.online){
    try{
      const r=await fetch('/api/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId,lessonIndex,userId:state.me.id})});
      if(r.ok){ const u=await r.json(); state.me=u; els.userXP.innerText = u.xp; renderCourses(); alert('Aula marcada e XP adicionada'); return; }
    }catch(e){ console.warn(e); }
  }
  if(!state.me.progresso[courseId]) state.me.progresso[courseId]=[];
  if(!state.me.progresso[courseId].includes(lessonIndex)) state.me.progresso[courseId].push(lessonIndex);
  state.me.xp = (state.me.xp||0) + 25;
  saveLocalUser(state.me);
  els.userXP.innerText = state.me.xp;
  renderCourses();
  alert('Aula completada (local) +25 XP');
}

async function buyCourse(courseId){
  if(!state.me) return alert('Faça login');
  if(state.online){
    try{
      const r=await fetch('/api/purchase',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId,userId:state.me.id})});
      if(r.ok){ const u=await r.json(); state.me=u; alert('Compra simulada (server)'); renderCourses(); return; }
    }catch(e){ console.warn(e); }
  }
  if(!state.me.cursosComprados) state.me.cursosComprados=[];
  state.me.cursosComprados.push(courseId);
  saveLocalUser(state.me);
  alert('Compra simulada (local)');
  renderCourses();
}

function saveLocalUser(u){
  const users = JSON.parse(localStorage.getItem('sandbox_users')||'[]');
  const idx = users.findIndex(x=>x.id===u.id);
  if(idx>=0) users[idx]=u; else users.push(u);
  localStorage.setItem('sandbox_users', JSON.stringify(users));
}

async function saveProfile(){
  if(!state.me) return;
  const nome = els.profileName.value.trim(), email=els.profileEmail.value.trim(), usuario=els.profileUsuario.value.trim();
  state.me.nome = nome; state.me.email = email; state.me.usuario = usuario;
  const f = els.avatarFile.files[0];
  if(f){
    const data = await f.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    state.me.avatar = 'data:'+f.type+';base64,'+b64;
  }
  if(state.online){
    try{
      await fetch('/api/me',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state.me)});
    }catch(e){ console.warn(e); }
  } else {
    saveLocalUser(state.me);
  }
  alert('Perfil salvo');
  afterLogin();
}

async function handleZip(e){
  const file = e.target.files[0];
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.zip')) {
    alert('Envie um ZIP.');
    return;
  }
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], {type:'application/zip'});
  const url = URL.createObjectURL(blob);
  // naive approach: can't run zip directly, but we can show link for download
  const iframe = id('previewFrame');
  iframe.srcdoc = '<p style="padding:20px">ZIP carregado no navegador. Extração avançada não implementada aqui.</p><p><a href="'+url+'" download="'+file.name+'">Baixar ZIP</a></p>';
}

function renderAdmin(){
  const du = els.adminUsers; du.innerHTML = '';
  const users = state.online ? state.users : JSON.parse(localStorage.getItem('sandbox_users')||'[]');
  users.forEach(u=>{
    const d = document.createElement('div'); d.style.padding='6px'; d.innerText = u.nome+' • '+u.email+' • '+(u.tipo||'aluno');
    const btn = document.createElement('button'); btn.innerText='Promover';
    btn.onclick = ()=>{
      u.tipo='admin';
      if(!state.online) { saveLocalUser(u); renderAdmin(); alert(u.nome+' promovido (local)'); }
      else { fetch('/api/promote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:u.id})}); alert('Promovido (server)'); }
    };
    d.appendChild(btn);
    du.appendChild(d);
  });
  const dc = els.adminCourses; dc.innerHTML='';
  state.courses.forEach(c=>{
    const d = document.createElement('div'); d.style.padding='6px';
    d.innerHTML = '<strong>'+c.titulo+'</strong> • '+c.tipo+' • R$ '+(c.preco||0);
    dc.appendChild(d);
  });
}

function createCourse(){
  const titulo = els.newCourseTitle.value.trim(); const banner=els.newCourseBanner.value.trim(); const preco=parseFloat(els.newCoursePrice.value)||0;
  const aulas = (els.newCourseAulas.value||'').split('|').map(s=>s.trim()).filter(Boolean);
  const req = (els.newCourseReq.value||'').split(',').map(x=>parseInt(x)).filter(Boolean);
  if(!titulo||!aulas.length) return alert('Título e aulas necessárias');
  const novo = {id: Date.now(), titulo, banner: banner||('https://picsum.photos/600/360?'+Date.now()), tipo: preco>0?'pago':'gratis', preco, aulas, requisitos: req, desbloqueado: preco===0};
  state.courses.push(novo);
  if(state.online){
    fetch('/api/course',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(novo)}).then(()=> alert('Criado server')).catch(()=> alert('Criado local'));
  } else {
    localStorage.setItem('sandbox_courses', JSON.stringify(state.courses));
    alert('Curso criado (local)');
  }
  renderCourses();
}

// initial
init();
