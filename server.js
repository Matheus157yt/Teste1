/*
 Simple Express server for the Complex Sandbox (no folders)
 - Serves static files from root
 - Minimal APIs under /api/*
 - Persists to data.json (simple JSON file)
 - Intended for local testing or hosting on Replit/Glitch
*/
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const DATA_FILE = path.join(__dirname, 'data.json');

function readData(){
  try {
    const txt = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(txt);
  } catch(e){
    return { users: [], courses: [] };
  }
}
function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json({limit:'5mb'}));
app.use(express.urlencoded({extended:true}));

// serve static root files
app.use('/', express.static(path.join(__dirname)));

app.get('/api/ping', (req,res)=> res.json({ok:true,now:Date.now()}));

// load initial if empty: ensure admin exists (Matheus)
app.get('/api/init', (req,res)=>{
  const data = readData();
  if(!data.users || data.users.length===0){
    data.users = [
      { id: 1, nome: "Matheus Henrique", email: "matheush5432191@gmail.com", usuario: "f5432191", senha: "f5432191", tipo:"admin", avatar:"", progresso:{}, badges:[], xp:0, cursosComprados: [] },
      { id: 2, nome: "Aluno Exemplo", email: "aluno@exemplo.com", usuario: "aluno1", senha: "123456", tipo:"aluno", avatar:"", progresso:{}, badges:[], xp:0, cursosComprados: [] }
    ];
    data.courses = [
      { id:1, titulo:"Introdução Grátis", tipo:"gratis", desbloqueado:true, preco:0, banner:"https://picsum.photos/600/360?1", aulas:["Boas-vindas","Como usar a plataforma"], requisitos:[] },
      { id:2, titulo:"Avançado Pago", tipo:"pago", desbloqueado:false, preco:79.9, banner:"https://picsum.photos/600/360?2", aulas:["Aula 1","Aula 2","Aula 3"], requisitos:[1] },
      { id:3, titulo:"Desafio Especial", tipo:"gratis", desbloqueado:false, preco:0, banner:"https://picsum.photos/600/360?3", aulas:["Desafio 1"], requisitos:[1,2] }
    ];
    writeData(data);
    return res.json({ok:true,init:true});
  }
  res.json({ok:true,init:false});
});

// get courses
app.get('/api/courses', (req,res)=>{
  const data = readData();
  res.json(data.courses || []);
});

// get users (admin)
app.get('/api/users', (req,res)=>{
  const data = readData();
  res.json(data.users || []);
});

// register
app.post('/api/register', (req,res)=>{
  const { nome, usuario, email, senha } = req.body;
  if(!nome||!usuario||!email||!senha) return res.status(400).json({error:'missing'});
  const data = readData();
  if(data.users.find(u=>u.email===email||u.usuario===usuario)) return res.status(400).json({error:'exists'});
  const id = Date.now();
  const novo = { id, nome, usuario, email, senha, tipo:'aluno', avatar:'', progresso:{}, badges:[], xp:0, cursosComprados: [] };
  data.users.push(novo);
  writeData(data);
  res.json({ok:true,user:novo});
});

// login
app.post('/api/login', (req,res)=>{
  const { id, senha } = req.body;
  const data = readData();
  const user = data.users.find(u => (u.email===id || u.usuario===id) && u.senha===senha);
  if(!user) return res.status(401).json({error:'invalid'});
  res.json(user);
});

// get/update me
app.post('/api/me', (req,res)=>{
  const usr = req.body;
  const data = readData();
  const idx = data.users.findIndex(u=>u.id===usr.id);
  if(idx>=0){ data.users[idx]=usr; writeData(data); return res.json({ok:true}); }
  res.status(404).json({error:'notfound'});
});

// complete lesson
app.post('/api/complete', (req,res)=>{
  const { userId, courseId, lessonIndex } = req.body;
  const data = readData();
  const u = data.users.find(x=>x.id==userId);
  const c = data.courses.find(x=>x.id==courseId);
  if(!u||!c) return res.status(404).json({error:'notfound'});
  u.progresso = u.progresso || {};
  u.progresso[courseId] = u.progresso[courseId] || [];
  if(!u.progresso[courseId].includes(lessonIndex)) u.progresso[courseId].push(lessonIndex);
  u.xp = (u.xp||0) + 25;
  // try unlocking courses
  data.courses.forEach(course=>{
    if(course.desbloqueado) return;
    const ok = (course.requisitos||[]).every(r => u.progresso[r] && u.progresso[r].length>0);
    if(ok) course.desbloqueado = true;
  });
  writeData(data);
  res.json(u);
});

// purchase simulated
app.post('/api/purchase', (req,res)=>{
  const { userId, courseId } = req.body;
  const data = readData();
  const u = data.users.find(x=>x.id==userId);
  const c = data.courses.find(x=>x.id==courseId);
  if(!u||!c) return res.status(404).json({error:'notfound'});
  u.cursosComprados = u.cursosComprados || [];
  if(!u.cursosComprados.includes(courseId)) u.cursosComprados.push(courseId);
  writeData(data);
  res.json(u);
});

// create course (admin)
app.post('/api/course', (req,res)=>{
  const course = req.body;
  const data = readData();
  data.courses = data.courses || [];
  data.courses.push(course);
  writeData(data);
  res.json({ok:true});
});

// promote user (admin)
app.post('/api/promote', (req,res)=>{
  const { userId } = req.body;
  const data = readData();
  const u = data.users.find(x=>x.id==userId);
  if(u){ u.tipo='admin'; writeData(data); return res.json({ok:true}); }
  res.status(404).json({error:'notfound'});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Sandbox server listening on port',PORT));
