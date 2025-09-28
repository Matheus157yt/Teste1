
let currentUser=JSON.parse(localStorage.getItem('currentUser'));
if(!currentUser||currentUser.role!=='admin'){alert('Acesso negado');window.location.href='index.html';}
document.getElementById('adminPanel').innerHTML='<p>Admin: Edite cursos e usuários aqui</p>';
