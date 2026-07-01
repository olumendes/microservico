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

// permitir parse do body e CORS para receber requisições da rede
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

server.use(middlewares);

// Armazena temporariamente o último pedido recebido pela rede
let currentOrder = null;

// Recebe pedido via POST (body JSON) e guarda em memória, depois redireciona para a UI
server.post('/receive-order', (req, res) => {
  try {
    const body = req.body || {};
    currentOrder = {
      cliente: body.cliente || body.clienteId || body.client || null,
      prato: body.prato || body.item || body.nome_prato || '',
      valor: body.valor !== undefined ? Number(body.valor) : (body.price ? Number(body.price) : 0),
      data: body.data || new Date().toISOString().slice(0,10),
      pagamentoUrl: body.pagamentoUrl || body.paymentUrl || null,
      raw: body
    };

    // Se a requisição vier de um navegador (redirect desejado), redireciona para root
    if (req.headers['user-agent'] && req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/');
    }

    return res.json({ ok: true, received: currentOrder });
  } catch (e) {
    return res.status(500).json({ error: 'erro ao processar' });
  }
});

// Suporta GET com querystring para facilitar redirecionamentos simples
server.get('/receive-order', (req, res) => {
  const q = req.query || {};
  currentOrder = {
    cliente: q.cliente || q.clienteId || q.client || null,
    prato: q.prato || q.item || q.nome_prato || '',
    valor: q.valor !== undefined ? Number(q.valor) : (q.price ? Number(q.price) : 0),
    data: q.data || new Date().toISOString().slice(0,10),
    pagamentoUrl: q.pagamentoUrl || q.paymentUrl || null,
    raw: q
  };
  return res.redirect('/');
});

// Endpoint que o front-end consulta para obter o pedido recebido pela rede.
// Após entregar o objeto, limpa-o para evitar duplicatas.
server.get('/current-order', (req, res) => {
  if (!currentOrder) return res.json({});
  const copied = currentOrder;
  currentOrder = null; // consumir uma vez
  return res.json(copied);
});

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
