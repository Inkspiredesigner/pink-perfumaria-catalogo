const WHATSAPP_NUMBER = '5588997452597';
let allProducts = [];
let currentCategory = 'Todos';

document.addEventListener('DOMContentLoaded', () => {
  fetchProductsSecurely();
  setupEvents();
});

// Função para prevenir Injeção de Código (XSS)
function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

async function fetchProductsSecurely() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Carregando produtos...</p>';

  try {
    // Chama o backend em vez do Airtable direto
    const response = await fetch('/api/produtos');
    if (!response.ok) throw new Error('Falha na resposta da API');
    
    allProducts = await response.json();
    renderProducts(allProducts);
  } catch (error) {
    console.error('Erro de segurança/conexão:', error);
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Não foi possível carregar o catálogo no momento.</p>';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';

  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

  const filtered = products.filter(p => {
    const matchesCategory = currentCategory === 'Todos' || p.categoria === currentCategory;
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">Nenhum produto encontrado.</p>`;
    return;
  }

  filtered.forEach(p => {
    const isAvailable = p.status === 'Disponível';
    const safeName = sanitizeHTML(p.nome);
    // Como deve ficar:
let precoNumerico = parseFloat(String(p.preco).replace(',', '.')) || 0;
let precoFormatado = precoNumerico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safePrice = sanitizeHTML(precoFormatado);
    
    const message = encodeURIComponent(`Olá! Vi o produto *${p.nome}* no catálogo e gostaria de confirmar a compra!`);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <span class="badge ${isAvailable ? 'disponivel' : 'esgotado'}">
        ${isAvailable ? 'Pronta Entrega' : 'Esgotado'}
      </span>
      <img src="${p.foto || 'https://via.placeholder.com/300'}" alt="${safeName}" class="product-img" loading="lazy">
      <div class="product-info">
        <h3 class="product-title">${safeName}</h3>
        <p class="product-price">R$ ${safePrice}</p>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp ${!isAvailable ? 'disabled' : ''}">
          ${isAvailable ? 'Pedir no WhatsApp' : 'Indisponível'}
        </a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function setupEvents() {
  document.getElementById('searchInput').addEventListener('input', () => renderProducts(allProducts));

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      renderProducts(allProducts);
    });
  });
}
