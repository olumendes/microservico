# API de Pedidos (json-server)

API do trabalho de Microsserviços, feita com **json-server** — a mesma
ferramenta que o resto da turma está usando.

## O que é o json-server

O json-server lê um arquivo `db.json` e, sozinho, cria uma API REST completa
em volta dele. Ou seja: o `db.json` **é o seu banco de dados** — quando você
cria, edita ou apaga um pedido pela API, esse arquivo é atualizado
automaticamente no disco. Se você reiniciar o servidor, os dados continuam
lá (diferente de guardar só na memória).

## Como rodar

```bash
npm install
npm start
```

Vai aparecer isso no terminal:

```
API de Pedidos (json-server) rodando na porta 3002
Acesse local:    http://localhost:3002/pedidos
```

Abra `http://localhost:3002` no navegador pra ver a tela de testes (front-end).

## Como os outros grupos acessam a sua API (mesma rede Wi-Fi)

1. Descubra o IP do seu notebook na rede:
   - **Windows**: abra o `cmd` e digite `ipconfig`. Procure por "Endereço IPv4" (algo como `192.168.1.45`).
   - **Mac/Linux**: abra o terminal e digite `ifconfig` ou `ip a`. Procure por algo parecido com `192.168.1.45`.

2. Avise os outros grupos esse IP. Eles acessam sua API assim:
   ```
   http://SEU_IP:3002/pedidos
   ```
   Exemplo: `http://192.168.1.45:3002/pedidos`

3. O seu notebook precisa ficar com `npm start` rodando enquanto os outros
   grupos forem usar a sua API.

4. Se não funcionar, o motivo mais comum é o firewall do Windows. Na primeira
   vez que rodar `npm start`, se aparecer uma janela perguntando "Permitir
   acesso na rede?", clique em **Permitir**.

## Endpoints (criados automaticamente pelo json-server)

| Método | Rota                      | O que faz                                |
|--------|---------------------------|-------------------------------------------|
| GET    | `/pedidos`                 | Lista todos os pedidos                    |
| GET    | `/pedidos/:id`              | Busca um pedido específico pelo ID        |
| GET    | `/pedidos?cliente=1`         | Filtra pedidos por campo (qualquer campo) |
| POST   | `/pedidos`                 | Cria um novo pedido                       |
| PUT    | `/pedidos/:id`              | Substitui todos os dados de um pedido     |
| PATCH  | `/pedidos/:id`              | Atualiza só alguns campos de um pedido    |
| DELETE | `/pedidos/:id`              | Remove um pedido                          |

Isso é a "mágica" do json-server: você não escreve essas rotas, elas já
existem automaticamente a partir do nome da chave `"pedidos"` dentro do
`db.json`.

### Exemplo de POST (criar pedido)

```json
{
  "cliente": 1,
  "data": "2026-06-22",
  "prato": "Feijoada",
  "valor": 35.90
}
```

O json-server gera o `id` automaticamente.

## Estrutura do projeto

```
api_pedidos/
├── server.js          # inicia o json-server na porta certa, liberado pra rede
├── db.json            # o "banco de dados" - aqui ficam os pedidos
├── public/
│   └── index.html      # front-end de teste (criar, listar, excluir pedidos)
└── package.json
```

## Como explicar pro professor (resumo)

- Isso é um **microsserviço**: uma API independente, só do recurso "pedidos".
- Usamos o **json-server**, que cria automaticamente os endpoints REST
  (GET, POST, PUT, PATCH, DELETE) a partir de um arquivo `db.json`, que
  funciona como banco de dados — os dados ficam salvos em arquivo, não só
  na memória.
- A API responde sempre em **JSON**, via HTTP, como pede o trabalho.
- O grupo de **Clientes** pode consultar `GET /pedidos?cliente=ID` para ver
  os pedidos de um cliente específico, e o grupo de **Pagamento** pode usar
  `GET /pedidos/:id` para confirmar que um pedido existe antes de registrar
  o pagamento.
- Cada grupo roda sua própria API no próprio notebook, e todos se conectam
  pela rede Wi-Fi da sala, usando o IP de quem está com a API ligada.
- O front-end (página HTML) é uma tela simples só pra demonstrar a API
  funcionando — criar, listar e excluir pedidos pelo navegador.

## Dica: testando se o banco está "vivo"

Depois de criar um pedido pela tela ou pelo Postman, abra o arquivo
`db.json` num editor de texto — você vai ver o pedido novo apareceu ali
de verdade. Isso é uma boa forma de mostrar pro professor que a API
realmente persiste dados, e não só guarda na memória.
