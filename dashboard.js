
let currentUser=JSON.parse(localStorage.getItem('currentUser'));
if(!currentUser){alert('Faça login primeiro');window.location.href='index.html';}
let courses=[
  {title:'Design Gráfico Profissional',type:'Pago',price:19.90,link:'#',banner:'https://via.placeholder.com/300x150/000000/FF0000?text=Design+Gráfico+Profissional'},
  {title:'Photoshop do Zero ao Avançado',type:'Grátis',price:0,link:'#',banner:'https://via.placeholder.com/300x150/000000/FF0000?text=Photoshop+Zero+Avançado'}
];
let container=document.getElementById('courses');
courses.forEach(c=>{let card=document.createElement('div');card.innerHTML=`<h3>${c.title}</h3><img src="${c.banner}"><p>Tipo: ${c.type} | Preço: R$${c.price}</p>`;container.appendChild(card);});
