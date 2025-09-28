
let users = JSON.parse(localStorage.getItem('users')) || [
  {name:'Matheus Henrique',username:'f5432191',email:'matheush5432191@gmail.com',password:'f5432191',role:'admin'},
  {name:'Ninja DM',username:'ninjadm',email:'ninjadm@creativeacademy.com',password:'ninjadm123',role:'admin'},
  {name:'João Silva',username:'joao',email:'joao@exemplo.com',password:'123456',role:'aluno'}
];
document.getElementById('loginForm').addEventListener('submit',function(e){
e.preventDefault();
let u=document.getElementById('username').value;
let p=document.getElementById('password').value;
let user=users.find(x=>x.username===u&&x.password===p);
if(user){alert('Login bem-sucedido!');localStorage.setItem('currentUser',JSON.stringify(user));window.location.href='dashboard.html';}
else{alert('Credenciais inválidas');}
});
