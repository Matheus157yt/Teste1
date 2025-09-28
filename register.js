
let users = JSON.parse(localStorage.getItem('users')) || [];
document.getElementById('registerForm').addEventListener('submit',function(e){
e.preventDefault();
let name=document.getElementById('name').value;
let username=document.getElementById('username').value;
let email=document.getElementById('email').value;
let password=document.getElementById('password').value;
users.push({name,username,email,password,role:'aluno'});
localStorage.setItem('users',JSON.stringify(users));
alert('Cadastro realizado!');window.location.href='index.html';
});
