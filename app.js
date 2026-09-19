let products = [
  { id: 1, name: "Robe Kente solaire", type: "Robe", price: 28500, size: "S · M · L · XL", emoji: "👗", color: "plum", category: "Femme", image: "assets/robe-kente.jpg" },
  { id: 2, name: "Jupe pagne Baoulé", type: "Jupe", price: 22000, size: "S · M · L · XL", emoji: "👗", color: "gold", category: "Femme", image: "assets/jupe-baoule.jpg" },
  { id: 3, name: "Pantalon homme Kita", type: "Pantalon", price: 26000, size: "M · L · XL · 2XL", emoji: "👖", color: "blue", category: "Homme", image: "assets/pantalon-kita.jpg" },
  { id: 4, name: "Chemise homme Bogolan", type: "Chemise", price: 24000, size: "M · L · XL · 2XL", emoji: "👕", color: "green", category: "Homme", image: "assets/chemise-bogolan.jpg" },
  { id: 5, name: "Veste dame N'zima", type: "Veste", price: 35000, size: "S · M · L · XL", emoji: "🧥", color: "plum", category: "Femme", image: "assets/veste-nzima.jpg" },
  { id: 6, name: "Complet ivoirien homme", type: "Complet", price: 48000, size: "M · L · XL · 2XL", emoji: "🧥", color: "gold", category: "Homme", image: "assets/complet-ivoirien.jpg" },
  { id: 7, name: "Robe enfant pagne", type: "Robe", price: 14500, size: "4 · 6 · 8 · 10 ans", emoji: "👚", color: "green", category: "Enfant", image: "assets/robe-enfant.jpg" }
];

try {
  const savedProducts = JSON.parse(localStorage.getItem("tissa-products") || "[]");
  if (Array.isArray(savedProducts)) {
    products = products.concat(savedProducts.filter(item => item.custom));
  }
} catch (error) {
  console.warn("Les produits enregistrés localement n'ont pas pu être chargés.", error);
}

const initialSellerOrders = [
  { id: "TS-1048", customer: "Aïcha K.", phone: "+225 07 08 12 34 56", address: "Cocody Angré, près du marché", item: "Robe Kente solaire × 1", total: 28500, payment: "Paiement à la livraison", status: "new" },
  { id: "TS-1042", customer: "Moussa D.", phone: "+225 05 22 40 11 09", address: "Yopougon Maroc, rue 12", item: "Ensemble Bogolan × 2", total: 64000, payment: "Wave payé", status: "preparing" },
  { id: "TS-1019", customer: "Ruth A.", phone: "+225 01 90 44 21 76", address: "Marcory Résidentiel, villa 18", item: "Chemise Indigo × 1", total: 18500, payment: "Paiement à la livraison", status: "delivery" }
];

const state = {
  auth: false,
  role: "client",
  screen: "home",
  category: "Tous",
  cart: [{ product: products[0], qty: 1 }],
  orders: [],
  sellerTab: "orders",
  sellerView: "new",
  sellerOrders: initialSellerOrders.slice(),
  sellerHistory: [],
  selectedProductId: null
};

const API_BASE = window.location.protocol === "http:" && window.location.port === "3000" ? "/api" : "";
let apiToken = "";
const apiRequest = async (path, options = {}) => {
  if (!API_BASE) return null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(apiToken ? { Authorization: "Bearer " + apiToken } : {}), ...(options.headers || {}) }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "La requête n'a pas abouti.");
  }
  return response.status === 204 ? null : response.json();
};

const money = value => new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
const app = document.querySelector("#app");
let promotionIndex = 0;
const sizeGuide = [
  { label: "XXS", intl: "32–34", us: "00–0", uk: "4–6", bust: "76–80 cm", waist: "60–64 cm", hips: "84–88 cm", note: "Très petite coupe adulte" },
  { label: "XS", intl: "34–36", us: "0–2", uk: "6–8", bust: "80–84 cm", waist: "64–68 cm", hips: "88–92 cm", note: "Petite coupe adulte" },
  { label: "S", intl: "36–38", us: "4–6", uk: "8–10", bust: "84–88 cm", waist: "68–72 cm", hips: "92–96 cm", note: "Small / petite" },
  { label: "M", intl: "38–40", us: "8–10", uk: "12–14", bust: "88–96 cm", waist: "72–80 cm", hips: "96–104 cm", note: "Medium / standard" },
  { label: "L", intl: "42–44", us: "12–14", uk: "16–18", bust: "96–104 cm", waist: "80–88 cm", hips: "104–112 cm", note: "Large" },
  { label: "XL", intl: "46–48", us: "16–18", uk: "20–22", bust: "104–112 cm", waist: "88–96 cm", hips: "112–120 cm", note: "Extra large" },
  { label: "2XL", intl: "50–52", us: "20–22", uk: "24–26", bust: "112–120 cm", waist: "96–106 cm", hips: "120–128 cm", note: "Grande taille" },
  { label: "3XL", intl: "54–56", us: "24–26", uk: "28–30", bust: "120–128 cm", waist: "106–116 cm", hips: "128–138 cm", note: "Grande taille +" },
  { label: "4XL", intl: "58–60", us: "28–30", uk: "32–34", bust: "128–138 cm", waist: "116–126 cm", hips: "138–148 cm", note: "Très grande taille" },
  { label: "5XL", intl: "62–64", us: "32–34", uk: "36–38", bust: "138–148 cm", waist: "126–138 cm", hips: "148–158 cm", note: "Très grande taille +" },
  { label: "Enfant 2 ans", intl: "92 cm", us: "2T", uk: "2T", bust: "52 cm", waist: "50 cm", hips: "54 cm", note: "Hauteur moyenne 92 cm" },
  { label: "Enfant 4 ans", intl: "104 cm", us: "4T", uk: "4T", bust: "56 cm", waist: "52 cm", hips: "58 cm", note: "Hauteur moyenne 104 cm" },
  { label: "Enfant 6 ans", intl: "116 cm", us: "6", uk: "6", bust: "60 cm", waist: "54 cm", hips: "64 cm", note: "Hauteur moyenne 116 cm" },
  { label: "Enfant 8 ans", intl: "128 cm", us: "8", uk: "8", bust: "64 cm", waist: "56 cm", hips: "68 cm", note: "Hauteur moyenne 128 cm" },
  { label: "Enfant 10 ans", intl: "140 cm", us: "10", uk: "10", bust: "70 cm", waist: "60 cm", hips: "74 cm", note: "Hauteur moyenne 140 cm" },
  { label: "Enfant 12 ans", intl: "152 cm", us: "12", uk: "12", bust: "76 cm", waist: "64 cm", hips: "80 cm", note: "Hauteur moyenne 152 cm" },
  { label: "Enfant 14 ans", intl: "164 cm", us: "14", uk: "14", bust: "82 cm", waist: "68 cm", hips: "86 cm", note: "Hauteur moyenne 164 cm" },
  { label: "Enfant 16 ans", intl: "176 cm", us: "16", uk: "16", bust: "88 cm", waist: "72 cm", hips: "92 cm", note: "Hauteur moyenne 176 cm" }
];

function render() {
  app.innerHTML = `<main class="phone">${state.auth ? (state.role === "client" ? clientApp() : vendorApp()) : authApp()}</main>`;
}

setInterval(() => {
  if (state.auth && state.role === "client" && state.screen === "home") {
    promotionIndex = (promotionIndex + 1) % products.length;
    render();
  }
}, 5000);

function promptSellerAccess() {
  const accessCode = window.prompt("Code receveur Tissa", "");

  if (accessCode === "TISSA2026") {
    apiRequest("/auth/seller", { method: "POST", body: JSON.stringify({ code: accessCode }) })
      .then(payload => {
        apiToken = payload?.token || "";
        state.role = "seller";
        state.auth = true;
        state.sellerTab = "orders";
        state.screen = "orders";
        render();
        syncBackendOrders();
      })
      .catch(error => alert(error.message));
    return;
  }

  if (accessCode !== null) {
    alert("Code invalide : accès refusé au volet receveur.");
  }
}

function authApp() {
  return `
    <section class="auth">
      <div class="auth-logo">Tiss<span>a</span></div>
      <p class="tagline">Au cœur de votre style.</p>
      <h1>Votre style,<br>notre histoire.</h1>
      <p>Découvrez des pièces uniques inspirées par les couleurs et les savoir-faire de l'Afrique.</p>

      <div class="auth-tabs">
        <button class="${state.screen === "login" ? "active" : ""}" onclick="state.screen='login';render()">Connexion</button>
        <button class="${state.screen === "signup" ? "active" : ""}" onclick="state.screen='signup';render()">Créer un compte</button>
      </div>

      ${state.screen === "login" ? `
        <label>Nom et prénom</label>
        <input id="login-name" value="Mariam Diop" placeholder="Ex. Aïcha Kone">
        <label>E-mail</label>
        <input id="login-email" type="email" value="mariam@gmail.com" placeholder="vous@email.com">
        <label>Mot de passe</label>
        <input id="login-password" type="password" value="123456" placeholder="••••••••">
      ` : `
        <label>Nom</label>
        <input id="signup-last-name" placeholder="Votre nom">
        <label>Prénom</label>
        <input id="signup-first-name" placeholder="Votre prénom">
        <label>Sexe</label>
        <input id="signup-gender" placeholder="Femme / Homme">
        <label>Numéro de téléphone</label>
        <input id="signup-phone" placeholder="+225 07 00 00 00 00">
        <label>Localisation</label>
        <input id="signup-location" placeholder="Abidjan, Yopougon">
        <label>E-mail</label>
        <input id="signup-email" type="email" placeholder="vous@email.com">
        <label>Mot de passe</label>
        <input id="signup-password" type="password" placeholder="Créer un mot de passe">
      `}

      <button class="primary" onclick="submitClientAuth()">${state.screen === "login" ? "Se connecter" : "Commencer l'aventure"} →</button>

      <div class="switch-role">
        Receveur / vendeur ?
        <button onclick="promptSellerAccess()">Accéder à l'application receveur</button>
      </div>
    </section>
  `;
}

async function submitClientAuth() {
  try {
    const login = state.screen === "login";
    const body = login
      ? { email: document.querySelector("#login-email").value.trim(), password: document.querySelector("#login-password").value }
      : {
          lastName: document.querySelector("#signup-last-name").value.trim(),
          firstName: document.querySelector("#signup-first-name").value.trim(),
          gender: document.querySelector("#signup-gender").value.trim(),
          phone: document.querySelector("#signup-phone").value.trim(),
          location: document.querySelector("#signup-location").value.trim(),
          email: document.querySelector("#signup-email").value.trim(),
          password: document.querySelector("#signup-password").value
        };
    const payload = await apiRequest(login ? "/auth/login" : "/auth/register", { method: "POST", body: JSON.stringify(body) });
    apiToken = payload?.token || "";
  } catch (error) {
    if (API_BASE) {
      alert(error.message);
      return;
    }
  }
  state.auth = true;
  state.role = "client";
  state.screen = "home";
  render();
  syncBackendProducts();
  syncBackendOrders();
}

function clientApp() {
  const content = state.screen === "home" ? home() : state.screen === "product-options" ? productOptions() : state.screen === "cart" ? cart() : state.screen === "checkout" ? checkout() : state.screen === "success" ? success() : state.screen === "track" ? track() : profile();
  return `${content}${["checkout", "success"].includes(state.screen) ? "" : nav()}`;
}

function home() {
  const visible = products.filter(product => state.category === "Tous" || product.category === state.category);
  const promotion = products[promotionIndex % products.length];
  const promotionMedia = promotion.video
    ? `<video src="${promotion.video}" autoplay muted loop playsinline></video>`
    : `<img src="${promotion.image}" alt="${promotion.name}">`;
  return `
    <section class="screen">
      <header class="topbar">
        <div>
          <div class="brand">Tiss<span>a</span></div>
          <p class="tagline">Au cœur de votre style.</p>
        </div>
        <button class="avatar" onclick="state.screen='profile'; render()">AK</button>
      </header>

      <div class="hero promotion-hero">
        ${promotionMedia}
        <div class="hero-copy">
          <span class="eyebrow">NOUVELLE COLLECTION</span>
          <h1>${promotion.name}</h1>
          <p>${promotion.type || "Couture locale"} · ${promotion.category}</p>
          <strong>${money(promotion.price)}</strong>
        </div>
        <img class="hero-logo" src="assets/tissa-logo.png" alt="Logo Tissa">
      </div>

      <div class="search">
        <input oninput="filterProducts(this.value)" placeholder="Rechercher une pièce, une couleur...">
      </div>

      <div class="section-title">
        <h2>Explorer par style</h2>
        <button>Voir tout</button>
      </div>

      <div class="chips">
        ${["Tous", "Femme", "Homme", "Enfant"].map(item => `<button class="chip ${state.category === item ? "active" : ""}" onclick="state.category='${item}'; render()">${item}</button>`).join("")}
      </div>

      <div class="chips categories">
        ${["Robes", "Jupes", "Pantalons", "Chemises", "Vestes", "Complets"].map(item => `<button class="chip">${item}</button>`).join("")}
      </div>

      <div class="section-title">
        <h2>La collection Tissa</h2>
        <button>Tout voir</button>
      </div>

      <div class="products">
        ${visible.map(productCard).join("")}
      </div>
    </section>
  `;
}

function productCard(product) {
  const unavailable = product.active === false || product.stock === 0;
  return `
    <article class="product">
      <div class="product-img ${product.color}">
        <img src="${product.image}" alt="${product.name}">
        <button class="heart">♡</button>
        ${unavailable ? `<span class="sold-out">Rupture de stock</span>` : ""}
      </div>
      <h3>${product.name}</h3>
      <small>${product.size}${product.description ? ` · ${product.description}` : ""}</small>
      <div class="product-bottom">
        <span class="price">${money(product.price)}</span>
        <button class="add ${unavailable ? "disabled" : ""}" ${unavailable ? "disabled" : `onclick="openProductOptions(${product.id})"`}>${unavailable ? "×" : "+"}</button>
      </div>
    </article>
  `;
}

function nav() {
  return `
    <nav class="bottom-nav">
      <button class="nav-item ${state.screen === "home" ? "active" : ""}" onclick="state.screen='home'; render()"><strong>⌂</strong>Accueil</button>
      <button class="nav-item ${state.screen === "cart" ? "active" : ""}" onclick="state.screen='cart'; render()"><strong>♧</strong><span class="badge">${state.cart.reduce((sum, item) => sum + item.qty, 0)}</span>Panier</button>
      <button class="nav-item ${state.screen === "track" ? "active" : ""}" onclick="state.screen='track'; render()"><strong>◷</strong>Suivi</button>
      <button class="nav-item ${state.screen === "profile" ? "active" : ""}" onclick="state.screen='profile'; render()"><strong>◎</strong>Compte</button>
    </nav>
  `;
}

function cart() {
  const total = state.cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  if (!state.cart.length) {
    return `
      <section class="screen">
        <div class="page-head"><button class="back" onclick="state.screen='home'; render()">‹</button><h1>Mon panier</h1></div>
        <div class="success">
          <div class="check">♧</div>
          <h1>Votre panier est vide</h1>
          <p>Ajoutez une pièce qui vous ressemble pour commencer.</p>
          <button class="primary" onclick="state.screen='home'; render()">Découvrir la collection</button>
        </div>
      </section>
    `;
  }

  return `
    <section class="screen">
      <div class="page-head"><button class="back" onclick="state.screen='home'; render()">‹</button><h1>Mon panier</h1></div>
      <div class="cart-card">
        ${state.cart.map((item, index) => `
          <div class="cart-row">
            <div class="mini-img ${item.product.color}">
              <img src="${item.product.image}" alt="${item.product.name}">
            </div>
            <div>
              <h3>${item.product.name}</h3>
              <p>Taille : ${item.size || item.product.size}</p>
              <div class="qty">
                <button onclick="changeQty(${index}, -1)">−</button>
                ${item.qty}
                <button onclick="changeQty(${index}, 1)">+</button>
              </div>
            </div>
            <span class="price">${money(item.product.price * item.qty)}</span>
          </div>
        `).join("")}
        <div class="total"><span>Total</span><span class="price">${money(total)}</span></div>
      </div>
      <button class="primary" onclick="state.screen='checkout'; render()">Commander maintenant →</button>
    </section>
  `;
}

function checkout() {
  return `
    <section class="screen">
      <div class="page-head"><button class="back" onclick="state.screen='cart'; render()">‹</button><h1>Finaliser</h1></div>
      <div class="form-card">
        <label>Adresse de livraison</label>
        <textarea id="checkout-address" rows="2" placeholder="Quartier, rue, repère..."></textarea>
        <label>Numéro de téléphone</label>
        <input id="checkout-phone" placeholder="+225 07 00 00 00 00">
        <label>Mode de paiement</label>
        <div class="payment">
          <button class="selected">À la livraison</button>
          <button onclick="alert('Paiement Wave en ligne')">Wave en ligne</button>
        </div>
      </div>
      <button class="primary" onclick="placeOrder()">Confirmer la commande →</button>
    </section>
  `;
}

function success() {
  return `
    <section class="screen">
      <div class="success">
        <div class="check">✓</div>
        <h1>Commande confirmée !</h1>
        <p>Merci pour votre confiance. Votre commande est en préparation et vous pourrez suivre sa livraison à tout moment.</p>
        <button class="primary" onclick="state.screen='track'; render()">Suivre ma commande →</button>
        <button class="primary" style="background:white;color:var(--wine);border:1px solid var(--line)" onclick="state.screen='home'; render()">Continuer mes achats</button>
      </div>
    </section>
  `;
}

function track() {
  if (!state.orders.length) {
    return `
      <section class="screen">
        <div class="page-head"><h1>Mes commandes</h1></div>
        <div class="success">
          <div class="check">◷</div>
          <h1>Rien à suivre</h1>
          <p>Vos commandes finalisées apparaîtront ici, étape par étape.</p>
          <button class="primary" onclick="state.screen='home'; render()">Voir les nouveautés</button>
        </div>
      </section>
    `;
  }

  return `
    <section class="screen">
      <div class="page-head"><h1>Mes commandes</h1></div>
      ${state.orders.map(order => `
        <div class="tracking">
          <div class="tracking-head">
            <div>
              <h3>Commande #${order.id}</h3>
              <small>Aujourd'hui · Livraison à domicile</small>
            </div>
            <span class="status">En préparation</span>
          </div>
          <div class="steps">
            <div class="step done"><div class="dot"></div>Préparation</div>
            <div class="step"><div class="dot"></div>En livraison</div>
            <div class="step"><div class="dot"></div>Colis livré</div>
          </div>
        </div>
      `).join("")}
    </section>
  `;
}

function profile() {
  return `
    <section class="screen">
      <div class="page-head"><h1>Mon compte</h1><button class="avatar">AK</button></div>
      <div class="form-card">
        <h3>Bonjour, Aïcha ✨</h3>
        <p style="font-size:12px;color:var(--muted)">Gérez vos informations et vos préférences.</p>
        <label>Nom et prénom</label>
        <input value="Aïcha Kone">
        <label>E-mail</label>
        <input value="aicha@email.com">
        <button class="primary" style="width:100%;margin:5px 0">Enregistrer</button>
      </div>
      <button class="primary" style="background:white;color:var(--wine);border:1px solid var(--line)" onclick="state.auth=false; render()">Se déconnecter</button>
    </section>
  `;
}

function openProductOptions(productId) {
  state.selectedProductId = productId;
  state.screen = "product-options";
  render();
}

function productOptions() {
  const product = products.find(item => item.id === state.selectedProductId);
  if (!product) {
    state.screen = "home";
    return "";
  }

  return `
    <section class="screen">
      <div class="page-head"><button class="back" onclick="state.screen='home'; render()">‹</button><h1>Personnaliser</h1></div>
      <div class="option-card">
        <img src="${product.image}" alt="${product.name}">
        <h2>${product.name}</h2>
        <p>${product.description || "Tenue de couture locale ivoirienne, réalisée avec soin."}</p>
        <strong class="price">${money(product.price)}</strong>
        <label>Choisir une taille</label>
        <div class="size-options">
          ${product.size.split("·").map((size, index) => `<button class="size-choice ${index === 0 ? "selected" : ""}" onclick="selectSize(this)">${size.trim()}</button>`).join("")}
        </div>
        <details class="size-guide">
          <summary>Guide des tailles internationales</summary>
          <p class="size-help">Mesurez le tour de poitrine, la taille et les hanches avec un mètre souple, sans serrer. En cas d'hésitation, choisissez la taille supérieure.</p>
          <div class="size-table-wrap">
            <table>
              <thead><tr><th>Taille</th><th>INT / EU</th><th>US</th><th>UK</th><th>Poitrine</th><th>Taille</th><th>Hanches</th></tr></thead>
              <tbody>${sizeGuide.map(row => `<tr><td><b>${row.label}</b></td><td>${row.intl}</td><td>${row.us}</td><td>${row.uk}</td><td>${row.bust}</td><td>${row.waist}</td><td>${row.hips}</td></tr>`).join("")}</tbody>
            </table>
          </div>
          <p class="size-note">Repère : ${sizeGuide.find(row => row.label === product.size.split("·")[0].trim())?.note || "Les mesures peuvent varier selon la coupe."}</p>
        </details>
        <label>Quantité</label>
        <div class="quantity-picker"><button onclick="changeOptionQuantity(-1)">−</button><span id="option-quantity">1</span><button onclick="changeOptionQuantity(1)">+</button></div>
        <button class="primary" onclick="addConfiguredProduct()">Ajouter au panier →</button>
      </div>
    </section>
  `;
}

function selectSize(button) {
  document.querySelectorAll(".size-choice").forEach(item => item.classList.remove("selected"));
  button.classList.add("selected");
}

function changeOptionQuantity(delta) {
  const quantity = document.querySelector("#option-quantity");
  quantity.textContent = Math.max(1, Number(quantity.textContent) + delta);
}

function addConfiguredProduct() {
  const product = products.find(item => item.id === state.selectedProductId);
  const quantity = Number(document.querySelector("#option-quantity").textContent);
  const size = document.querySelector(".size-choice.selected")?.textContent.trim() || product.size.split("·")[0].trim();
  const existing = state.cart.find(item => item.product.id === product.id && item.size === size);

  if (existing) existing.qty += quantity;
  else state.cart.push({ product, size, qty: quantity });
  state.screen = "cart";
  state.selectedProductId = null;
  render();
}

function addToCart(productId, color = "Bordeaux", quantity = 1) {
  const product = products.find(item => item.id === productId);
  const existing = state.cart.find(item => item.product.id === productId && item.color === color);

  if (existing) {
    existing.qty += quantity;
  } else {
    state.cart.push({ product, color, qty: quantity });
  }

  state.screen = "cart";
  render();
}

function changeQty(index, delta) {
  state.cart[index].qty += delta;
  if (state.cart[index].qty < 1) {
    state.cart.splice(index, 1);
  }
  render();
}

async function placeOrder() {
  const address = document.querySelector("#checkout-address").value.trim();
  const phone = document.querySelector("#checkout-phone").value.trim();
  const total = state.cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const items = state.cart.map(item => ({ productId: item.product.id, name: item.product.name, size: item.size || "", quantity: item.qty, price: item.product.price }));
  if (!address || !phone) {
    alert("Veuillez renseigner l'adresse et le numéro de téléphone.");
    return;
  }
  try {
    const order = await apiRequest("/orders", { method: "POST", body: JSON.stringify({ address, phone, payment: "Paiement à la livraison", items, total }) });
    state.orders.unshift({ id: order?.id || `TS-${Math.floor(1000 + Math.random() * 8999)}`, status: "preparing" });
  } catch (error) {
    if (API_BASE) {
      alert(error.message);
      return;
    }
    state.orders.unshift({ id: `TS-${Math.floor(1000 + Math.random() * 8999)}`, status: "preparing" });
  }
  state.cart = [];
  state.screen = "success";
  render();
}

function filterProducts(query) {
  const lower = query.toLowerCase();
  document.querySelectorAll(".product").forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(lower) ? "block" : "none";
  });
}

function vendorApp() {
  const selectedTab = state.sellerTab;

  if (selectedTab === "add-product") {
    return addProductForm();
  }

  return `
    <section class="screen seller-screen">
      <div class="seller-bar">
        <div class="brand">Tiss<span>a</span> <small>Receveur</small></div>
        <p>Bonjour, Atelier Kente • Tableau de bord</p>
      </div>

      <div class="seller-tabs">
        <button class="${selectedTab === "orders" ? "active" : ""}" onclick="state.sellerTab='orders'; render()">Nouvelles commandes</button>
        <button class="${selectedTab === "products" ? "active" : ""}" onclick="state.sellerTab='products'; render()">Mes produits</button>
        <button class="${selectedTab === "history" ? "active" : ""}" onclick="state.sellerTab='history'; render()">Historique</button>
      </div>

      ${selectedTab === "orders" ? vendorOrders() : selectedTab === "products" ? vendorProducts() : vendorHistory()}

      <nav class="bottom-nav vendor-nav">
        <button class="nav-item ${selectedTab === "orders" ? "active" : ""}" onclick="state.sellerTab='orders'; render()"><strong>☰</strong>Accueil</button>
        <button class="nav-item ${selectedTab === "products" ? "active" : ""}" onclick="state.sellerTab='products'; render()"><strong>◫</strong>Produits</button>
        <button class="nav-item ${selectedTab === "history" ? "active" : ""}" onclick="state.sellerTab='history'; render()"><strong>◷</strong>Historique</button>
        <button class="nav-item" onclick="state.auth=false; state.role='client'; state.screen='home'; render()"><strong>◎</strong>Compte</button>
      </nav>
    </section>
  `;
}

function vendorOrders() {
  const visibleOrders = state.sellerOrders.filter(order => {
    if (state.sellerView === "new") return order.status === "new";
    if (state.sellerView === "current") return ["preparing", "delivery"].includes(order.status);
    return false;
  });
  const deliveredOrders = state.sellerHistory;
  const displayedOrders = state.sellerView === "delivered" ? deliveredOrders : visibleOrders;

  return `
    <div class="metric-grid">
      <button class="metric ${state.sellerView === "new" ? "selected" : ""}" onclick="state.sellerView='new'; render()"><b>${state.sellerOrders.filter(order => order.status === "new").length}</b><small>Nouvelles</small></button>
      <button class="metric ${state.sellerView === "current" ? "selected" : ""}" onclick="state.sellerView='current'; render()"><b>${state.sellerOrders.filter(order => ["preparing", "delivery"].includes(order.status)).length}</b><small>En cours</small></button>
      <button class="metric ${state.sellerView === "delivered" ? "selected" : ""}" onclick="state.sellerView='delivered'; render()"><b>${state.sellerHistory.length}</b><small>Livrées</small></button>
    </div>

    <div class="seller-section">
      <h2>${state.sellerView === "new" ? "Nouvelles commandes" : state.sellerView === "current" ? "Commandes en cours" : "Commandes livrées"}</h2>
      ${displayedOrders.length ? displayedOrders.map(order => `
        <div class="seller-order">
          <div class="seller-order-head">
            <div>
              <h3>#${order.id} · ${order.customer}</h3>
              <small>${order.item}</small>
            </div>
            <span class="status">${statusLabel(order.status)}</span>
          </div>
          <div class="delivery-info">
            <p><b>Livraison</b></p>
            <p>☎ ${order.phone}</p>
            <p>⌖ ${order.address}</p>
            <p>💳 ${order.payment}</p>
            <p>Total : <b>${money(order.total)}</b></p>
          </div>
          ${order.status !== "delivered" ? `<button class="seller-action ${order.status === "preparing" ? "alt" : ""}" onclick="advanceOrder('${order.id}')">${actionLabel(order.status)}</button>` : `<small class="delivered-note">✓ Colis remis au client</small>`}
        </div>
      `).join("") : `<div class="empty-orders"><strong>✓</strong><p>Aucune commande dans cette catégorie.</p></div>`}
    </div>
  `;
}

function vendorProducts() {
  return `
    <div class="seller-section">
      <h2>Mes produits</h2>
      <button class="primary" style="width:100%;margin-bottom:16px" onclick="state.sellerTab='add-product'; render()">+ Ajouter un article</button>
      ${products.map((product, index) => `
        <div class="product-admin">
          <div class="mini-img ${product.color}">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <div>
            <h3>${product.name}</h3>
            <p>${money(product.price)}</p>
          </div>
          <button class="toggle ${product.active === false || index === 2 ? "off" : ""}" onclick="toggleProduct(${product.id}, this)"></button>
        </div>
      `).join("")}
    </div>
  `;
}

function addProductForm() {
  return `
    <section class="screen seller-screen">
      <div class="seller-bar">
        <div class="brand">Tiss<span>a</span> <small>Receveur</small></div>
        <p>Ajouter un produit</p>
      </div>

      <div class="form-card" style="margin-top:20px">
        <label>Photo de l'article</label>
        <div class="upload-preview" id="product-image-preview">
          <span>Votre photo apparaîtra ici</span>
        </div>
        <input id="product-image" type="file" accept="image/*" capture="environment" onchange="previewProductImage(event)" style="padding:10px; background:#f9f5f2;">
        <small class="field-help">Choisissez une photo dans la galerie ou prenez-la directement.</small>
        <label>Vidéo courte de l'article (facultatif)</label>
        <div class="upload-preview video-preview" id="product-video-preview">
          <span>Ajoutez une vidéo de présentation (10 à 30 secondes)</span>
        </div>
        <input id="product-video" type="file" accept="video/*" capture="environment" onchange="previewProductVideo(event)" style="padding:10px; background:#f9f5f2;">
        <small class="field-help">La vidéo sera visible dans la publicité de l'accueil.</small>
        <label>Nom de l'article</label>
        <input id="product-name" placeholder="Ex: Robe Kente élégante">
        <label>Description</label>
        <textarea id="product-description" rows="4" placeholder="Décrivez le produit..."></textarea>
        <label>Catégorie</label>
        <select id="product-category">
          <option>Femme</option>
          <option>Homme</option>
          <option>Enfant</option>
        </select>
        <label>Type d'article</label>
        <select id="product-type">
          <option>Jupe</option>
          <option>Robe</option>
          <option>Pantalon</option>
          <option>Chemise</option>
          <option>Veste</option>
          <option>Complet</option>
        </select>
        <label>Tailles disponibles</label>
        <input id="product-size" placeholder="S, M, L, XL, 2XL">
        <label>Prix (FCFA)</label>
        <input id="product-price" type="number" min="0" placeholder="25000">
        <label>Stock disponible</label>
        <input id="product-stock" type="number" min="0" placeholder="10">
      </div>

      <button class="primary" onclick="saveProductDraft()">Enregistrer le produit</button>
      <button class="primary" style="background:white;color:var(--wine);border:1px solid var(--line)" onclick="state.sellerTab='products'; render()">Retour</button>
    </section>
  `;
}

async function saveProductDraft() {
  const name = document.querySelector("#product-name").value.trim();
  const description = document.querySelector("#product-description").value.trim();
  const size = document.querySelector("#product-size").value.trim();
  const price = Number(document.querySelector("#product-price").value);
  const stock = Number(document.querySelector("#product-stock").value);
  const category = document.querySelector("#product-category").value;
  const type = document.querySelector("#product-type").value;
  const image = document.querySelector("#product-image").dataset.image;
  const video = document.querySelector("#product-video").dataset.video || "";

  if (!image || !name || !description || !size || !price || stock < 0) {
    alert("Veuillez renseigner la photo, le nom, la description, les tailles, le prix et le stock.");
    return;
  }

  const product = {
    id: Date.now(),
    name,
    description,
    price,
    stock,
    type,
    size: size.split(",").map(item => item.trim()).filter(Boolean).join(" · "),
    category,
    image,
    video,
    active: stock > 0,
    custom: true,
    color: "gold",
    emoji: "👕"
  };

  if (API_BASE) {
    try {
      const result = await apiRequest("/products", { method: "POST", body: JSON.stringify(product) });
      product.id = result.id;
    } catch (error) {
      alert(error.message);
      return;
    }
  }
  products.push(product);
  try {
    const savedProducts = products.filter(item => item.custom);
    localStorage.setItem("tissa-products", JSON.stringify(savedProducts));
  } catch (error) {
    console.warn("Le produit a été ajouté pour cette session, mais n'a pas pu être sauvegardé.", error);
  }

  alert(stock > 0 ? "Produit ajouté avec succès au catalogue Tissa." : "Produit ajouté en rupture de stock.");
  state.sellerTab = 'products';
  render();
}

function previewProductImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    event.target.dataset.image = reader.result;
    document.querySelector("#product-image-preview").innerHTML = `<img src="${reader.result}" alt="Aperçu du produit">`;
  };
  reader.readAsDataURL(file);
}

function previewProductVideo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    event.target.dataset.video = reader.result;
    document.querySelector("#product-video-preview").innerHTML = `<video src="${reader.result}" controls muted playsinline></video>`;
  };
  reader.readAsDataURL(file);
}

async function toggleProduct(productId, button) {
  const product = products.find(item => item.id === productId);
  if (!product) return;
  product.active = product.active === false;
  if (API_BASE) {
    try {
      await apiRequest(`/products/${productId}`, { method: "PATCH", body: JSON.stringify({ active: product.active }) });
    } catch (error) {
      product.active = !product.active;
      alert(error.message);
      return;
    }
  }
  button.classList.toggle("off", product.active === false);
  try {
    localStorage.setItem("tissa-products", JSON.stringify(products.filter(item => item.custom)));
  } catch (error) {
    console.warn("Le changement de stock n'a pas pu être sauvegardé.", error);
  }
}

function vendorHistory() {
  const delivered = state.sellerHistory;
  return `
    <div class="seller-section">
      <h2>Historique des commandes</h2>
      ${delivered.length ? delivered.map(order => `<div class="seller-order">
        <div class="seller-order-head">
          <div>
            <h3>#${order.id} · ${order.customer}</h3>
            <small>${order.item}</small>
          </div>
          <span class="status" style="background:#e5f4ed;color:var(--success)">Livrée</span>
        </div>
        <div class="delivery-info"><p>☎ ${order.phone}</p><p>⌖ ${order.address}</p><p>💳 ${order.payment}</p><p>Total : <b>${money(order.total)}</b></p></div>
        <p>★★★★★ <b style="color:var(--ink)">Avis client reçu après livraison</b></p>
      </div>`).join("") : `<div class="empty-orders"><strong>◷</strong><p>Aucune commande livrée pour le moment.</p></div>`}
    </div>
  `;
}

function statusLabel(status) {
  const labels = {
    new: "Nouvelle",
    preparing: "En préparation",
    delivery: "En livraison",
    delivered: "Livrée"
  };
  return labels[status] || "Nouvelle";
}

function actionLabel(status) {
  const labels = {
    new: "Préparer la commande",
    preparing: "Passer à la livraison",
    delivery: "Colis livré"
  };
  return labels[status] || "Préparer la commande";
}

async function advanceOrder(orderId) {
  const nextState = {
    new: "preparing",
    preparing: "delivery",
    delivery: "delivered"
  };

  const order = state.sellerOrders.find(item => item.id === orderId);
  if (!order) return;
  const current = order.status;
  order.status = nextState[current] || current;
  if (API_BASE) {
    try {
      await apiRequest(`/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status: order.status }) });
    } catch (error) {
      order.status = current;
      alert(error.message);
      return;
    }
  }
  if (order.status === "delivered") {
    state.sellerHistory.unshift(order);
    state.sellerOrders = state.sellerOrders.filter(item => item.id !== orderId);
    state.sellerView = "delivered";
  }
  render();
}

async function syncBackendProducts() {
  if (!API_BASE) return;
  try {
    const remoteProducts = await apiRequest("/products");
    if (Array.isArray(remoteProducts) && remoteProducts.length) {
      products = remoteProducts.map(item => ({
        ...item,
        custom: true,
        color: item.color || "gold",
        emoji: item.emoji || "👕"
      }));
      render();
    }
  } catch (error) {
    console.warn("Le catalogue local est utilisé : API produits indisponible.", error.message);
  }
}

async function syncBackendOrders() {
  if (!API_BASE || !apiToken) return;
  try {
    const remoteOrders = await apiRequest("/orders");
    if (!Array.isArray(remoteOrders)) return;
    if (state.role === "seller") {
      state.sellerOrders = remoteOrders.filter(order => order.status !== "delivered");
      state.sellerHistory = remoteOrders.filter(order => order.status === "delivered");
    } else {
      state.orders = remoteOrders;
    }
    render();
  } catch (error) {
    console.warn("Les commandes locales sont utilisées : API commandes indisponible.", error.message);
  }
}

render();
syncBackendProducts();
