const WHATSAPP_NUMBER = '5588997452597';
let allProducts = [];
let currentCategory = 'Todos';
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchProductsSecurely();
  setupEvents();
});

function sanitizeHTML(str) {
  if (!str) return '';
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

async function fetchProductsSecurely() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Carregando produtos...</p>';

  try {
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
   const marcaTexto = p.marca ? ` - ${p.marca}` : '';
const safeName = sanitizeHTML(`${p.nome}${marcaTexto}`);

    let precoNumerico = parseFloat(String(p.preco).replace(',', '.')) || 0;
    let precoFormatado = precoNumerico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const safePrice = sanitizeHTML(precoFormatado);
    const safeDescription = sanitizeHTML(p.descricao || p.Descrição || '');

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
        ${safeDescription ? `<p class="product-installment">${safeDescription}</p>` : ''}
        <button 
          class="btn-add-cart ${!isAvailable ? 'disabled' : ''}" 
          ${!isAvailable ? 'disabled' : ''}
          onclick="addToCart('${p.id}', this)"
        >
          ${isAvailable ? 'Adicionar ao Carrinho 🛒' : 'Indisponível'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Lógica do Carrinho
function addToCart(productId, buttonElement) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    let precoNumerico = parseFloat(String(product.preco).replace(',', '.')) || 0;
    cart.push({
      id: product.id,
      nome: product.nome,
      preco: precoNumerico,
      foto: product.foto,
      quantity: 1
    });
  }

  // Animação no botão clicado
  if (buttonElement) {
    const originalText = buttonElement.innerHTML;
    buttonElement.classList.add('added');
    buttonElement.innerHTML = 'Adicionado! ✓';
    setTimeout(() => {
      buttonElement.classList.remove('added');
      buttonElement.innerHTML = originalText;
    }, 1200);
  }

  // Animação no botão flutuante do carrinho
  const cartBtn = document.getElementById('floatingCartBtn');
  if (cartBtn) {
    cartBtn.classList.add('bounce');
    setTimeout(() => cartBtn.classList.remove('bounce'), 400);
  }

  updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById('cartCountBadge');
  const container = document.getElementById('cartItemsContainer');
  const totalEl = document.getElementById('cartTotalValue');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.textContent = totalItems;

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #888; margin-top: 40px;">Seu carrinho está vazio.</p>`;
    if (totalEl) totalEl.textContent = 'R$ 0,00';
    return;
  }

  container.innerHTML = '';
  let grandTotal = 0;

  cart.forEach(item => {
    const itemTotal = item.preco * item.quantity;
    grandTotal += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.foto || 'https://via.placeholder.com/50'}" class="cart-item-img" alt="${sanitizeHTML(item.nome)}">
      <div class="cart-item-info">
        <div class="cart-item-title">${sanitizeHTML(item.nome)}</div>
        <div class="cart-item-price">R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div class="cart-qty-controls">
        <button class="cart-qty-btn" onclick="changeQuantity('${item.id}', -1)">-</button>
        <span>${item.quantity}</span>
        <button class="cart-qty-btn" onclick="changeQuantity('${item.id}', 1)">+</button>
      </div>
    `;
    container.appendChild(div);
  });

  if (totalEl) {
    totalEl.textContent = `R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function changeQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  updateCartUI();
}

function toggleCartModal() {
  const overlay = document.getElementById('cartModalOverlay');
  if (overlay) overlay.classList.toggle('active');
}

function closeCartOnOverlay(e) {
  if (e.target.id === 'cartModalOverlay') {
    toggleCartModal();
  }
}

function sendCartToWhatsApp() {
  if (cart.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  let text = `Olá! Gostaria de fazer o seguinte pedido:\n\n`;
  let grandTotal = 0;

  cart.forEach(item => {
    const subtotal = item.preco * item.quantity;
    grandTotal += subtotal;
    const subTotalFormatted = subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    text += `• ${item.quantity}x *${item.nome}* (R$ ${subTotalFormatted})\n`;
  });

  const totalFormatted = grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  text += `\n*Total:* R$ ${totalFormatted}`;
  text += `\n\nComo posso prosseguir com o pagamento?`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function setupEvents() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderProducts(allProducts));
  }

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      renderProducts(allProducts);
    });
  });
}