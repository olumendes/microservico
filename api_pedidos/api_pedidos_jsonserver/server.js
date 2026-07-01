// server.js
// Sobe o json-server apontando para o arquivo db.json
// db.json funciona como o "banco de dados": tudo que é criado, editado ou
// excluído pela API fica salvo nesse arquivo, mesmo depois de reiniciar.

const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults({ static: path.join(__dirname, 'public') });

const PORT = 3002;

server.use(middlewares);
server.use(router);

// '0.0.0.0' faz a API escutar em todas as redes do computador,
// não só localhost. É isso que permite outros notebooks na mesma
// rede Wi-Fi acessarem usando o seu IP.
server.listen(PORT, '0.0.0.0', () => {
  console.log('=================================================');
  console.log(`API de Pedidos (json-server) rodando na porta ${PORT}`);
  console.log(`Acesse local:    http://localhost:${PORT}/pedidos`);
  console.log('Para os outros grupos acessarem pela rede, use o');
  console.log('seu IP no lugar de "localhost" (ex: http://192.168.1.45:3002/pedidos)');
  console.log('=================================================');
});
