const API_URL = '/pedidos';

// Estado global da página
let pedidosData = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  carregarPedidos();
  carregarClientes();
  
  // Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  });

  // Event Listeners Formulário
  document.getElementById('form-pedido').addEventListener('submit', salvarPedido);
  document.getElementById('btn-limpar').addEventListener('click', limparFormulario);
  
  // Busca
  document.getElementById('search-input').addEventListener('input', (e) => {
    renderizarTabela(e.target.value);
  });

  // Poll para checar se um pedido foi recebido pela rede (de outra ferramenta)
  setInterval(checkCurrentOrder, 1500);
});

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'triangle-exclamation'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Formatação Monetária BR
function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseMoeda(valorString) {
  return Number(valorString);
}

// Carregar Clientes da API externa
async function carregarClientes() {
  const urlClientes = document.getElementById('url-clientes').value;
  const select = document.getElementById('cliente');
  
  if (!urlClientes) {
    select.innerHTML = '<option value="">-- Preencha a URL de Clientes primeiro --</option>';
    return;
  }
  
  select.innerHTML = '<option value="">Carregando clientes...</option>';
  try {
    const res = await fetch(urlClientes);
    const clientes = await res.json();
    
    if (clientes.length === 0) {
      select.innerHTML = '<option value="">Nenhum cliente retornado da API</option>';
      return;
    }
    
    select.innerHTML = '<option value="">-- Selecione o Cliente --</option>' + 
      clientes.map(c => `<option value="${c.id}">${c.id} - ${c.nome || 'Cliente sem nome'}</option>`).join('');
      
  } catch(e) {
    select.innerHTML = '<option value="">Erro ao conectar na API de Clientes</option>';
    showToast('Falha ao conectar no Serviço de Clientes', 'error');
  }
}

// CRUD - Read
async function carregarPedidos() {
  const tbody = document.getElementById('tbody-pedidos');
  tbody.innerHTML = `
    <tr>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
    </tr>
  `;
  
  try {
    const resposta = await fetch(API_URL);
    pedidosData = await resposta.json();
    renderizarTabela();
  } catch (error) {
    showToast('Erro ao carregar dados', 'error');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Erro de conexão</td></tr>';
  }
}

// Renderização Tabela
function renderizarTabela(filtro = '') {
  const tbody = document.getElementById('tbody-pedidos');
  
  const filtrados = pedidosData.filter(p => 
    p.prato.toLowerCase().includes(filtro.toLowerCase()) || 
    p.id.toString().includes(filtro)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="fa-solid fa-box-open"></i>
            <p>Nenhum pedido encontrado.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtrados.map(p => `
    <tr>
      <td><b>#${p.id}</b></td>
      <td><span class="badge badge-primary">Cliente ${p.cliente}</span></td>
      <td>${p.data_2 ? p.data_2.split('-').reverse().join('/') : '-'}</td>
      <td>${p.prato}</td>
      <td><b>${formatarMoeda(p.valor)}</b></td>
      <td class="actions-cell">
        <button class="btn-icon" title="Editar" onclick="editarPedido(${p.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icon" style="color: var(--danger)" title="Excluir" onclick="excluirPedido(${p.id})"><i class="fa-solid fa-trash"></i></button>
        <button class="btn-icon" style="color: var(--success)" title="Enviar Pagamento" onclick="enviarParaPagamento(${p.id}, ${p.valor})"><i class="fa-solid fa-paper-plane"></i></button>
      </td>
    </tr>
  `).join('');
}

// CRUD - Create / Update
async function salvarPedido(e) {
  e.preventDefault();
  
  const clienteId = document.getElementById('cliente').value;
  if (!clienteId) {
    showToast('Selecione um cliente válido!', 'error');
    return;
  }
  
  const prato = document.getElementById('prato').value;
  const valor = document.getElementById('valor').value;
  const data = document.getElementById('data').value || new Date().toISOString().slice(0, 10);
  
  const payload = {
    cliente: Number(clienteId),
    prato,
    valor: parseMoeda(valor),
    data_2: data
  };

  try {
    const created = await postPedido(payload, editingId);
    if (created) {
      showToast(editingId ? 'Pedido atualizado com sucesso!' : 'Pedido criado com sucesso!', 'success');
      limparFormulario();
      carregarPedidos();
    } else {
      showToast('Erro ao salvar pedido', 'error');
    }
  } catch (error) {
    showToast('Falha na conexão', 'error');
  }
}

// Função genérica para criar ou atualizar pedido e retornar o objeto criado/atualizado
async function postPedido(payload, id = null) {
  try {
    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// Consulta periódica para verificar se um pedido foi recebido pela rede
async function checkCurrentOrder() {
  try {
    const res = await fetch('/current-order');
    if (!res.ok) return;
    const ord = await res.json();
    if (!ord || Object.keys(ord).length === 0) return;

    // Preencher formulário com os dados recebidos
    if (ord.cliente) document.getElementById('cliente').value = ord.cliente;
    if (ord.prato) document.getElementById('prato').value = ord.prato;
    if (ord.valor !== undefined) document.getElementById('valor').value = ord.valor;
    if (ord.data) document.getElementById('data').value = ord.data;

    // Construir payload e salvar automaticamente
    const payload = {
      cliente: Number(document.getElementById('cliente').value) || null,
      prato: document.getElementById('prato').value,
      valor: parseMoeda(document.getElementById('valor').value) || 0,
      data_2: document.getElementById('data').value || new Date().toISOString().slice(0,10)
    };

    const created = await postPedido(payload);
    if (created && created.id) {
      showToast('Pedido recebido e criado automaticamente (id ' + created.id + ')', 'success');
      carregarPedidos();

      // Encaminhar para pagamento: preferir pagamentoUrl do pedido recebido
      const pagamentoUrl = ord.pagamentoUrl || document.getElementById('url-pagamento').value;
      if (pagamentoUrl) {
        // usar a função existente para enviar para pagamento
        enviarParaPagamento(created.id, payload.valor || created.valor).catch(() => {});
        // tentar redirecionar para a origem do serviço de pagamento
        setTimeout(() => {
          try { window.location.href = new URL(pagamentoUrl).origin; }
          catch (e) { window.location.href = pagamentoUrl; }
        }, 800);
      }
    }
  } catch (e) {
    // silencioso
  }
}

// Preparar Edição
function editarPedido(id) {
  const p = pedidosData.find(x => x.id === id);
  if (!p) return;
  
  editingId = p.id;
  document.getElementById('id_readonly').value = p.id;
  document.getElementById('prato').value = p.prato;
  document.getElementById('valor').value = p.valor;
  document.getElementById('data').value = p.data_2 || '';
  
  document.getElementById('btn-salvar').innerHTML = '<i class="fa-solid fa-save"></i> Atualizar';
  
  // Rolar suavemente para o form
  document.querySelector('.page').scrollTo({ top: 0, behavior: 'smooth' });
}

// Limpar Form
function limparFormulario() {
  editingId = null;
  document.getElementById('form-pedido').reset();
  document.getElementById('id_readonly').value = '';
  document.getElementById('btn-salvar').innerHTML = '<i class="fa-solid fa-plus"></i> Salvar';
}

// CRUD - Delete
async function excluirPedido(id) {
  if (!confirm('Deseja realmente excluir este pedido?')) return;
  
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Pedido excluído!', 'success');
      carregarPedidos();
    }
  } catch (err) {
    showToast('Erro ao excluir', 'error');
  }
}

// Enviar Pagamento
async function enviarParaPagamento(pedidoId, valor) {
  const urlPagamento = document.getElementById('url-pagamento').value;
  if (!urlPagamento) {
    showToast('Preencha a URL de Pagamentos no topo da página', 'error');
    document.getElementById('url-pagamento').focus();
    return;
  }

  const forma = prompt('Forma de Pagamento (PIX, CARTAO, DINHEIRO):', 'PIX');
  if (!forma) return;

  try {
    const resposta = await fetch(urlPagamento, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pedido: pedidoId,
        forma_pagamento: forma.toUpperCase(),
        valor: valor
      })
    });

    if (resposta.ok) {
      showToast('Enviado para pagamento! Redirecionando...', 'success');
      setTimeout(() => {
        try { window.location.href = new URL(urlPagamento).origin; } 
        catch (e) { window.location.href = urlPagamento; }
      }, 1500);
    } else {
      showToast(`Erro do servidor de pagamentos: ${resposta.status}`, 'error');
    }
  } catch (erro) {
    showToast('Falha ao comunicar com o microsserviço de pagamentos.', 'error');
  }
}
