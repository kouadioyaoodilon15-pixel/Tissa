const path = require("path");
const crypto = require("crypto");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const port = Number(process.env.PORT || 3000);
const db = new Database(path.join(__dirname, "tissa.sqlite"));
const sessions = new Map();

app.use(express.json({ limit: "25mb" }));
app.use(express.static(__dirname));

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    gender TEXT,
    phone TEXT,
    location TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    sizes TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    video TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    payment TEXT NOT NULL,
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id)
  );
`);

const hash = value => {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(value, salt, 64).toString("hex")}`;
};
const verifyPassword = (value, stored) => {
  const [salt, digest] = String(stored || "").split(":");
  if (!salt || !digest) return false;
  const candidate = crypto.scryptSync(value, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(digest, "hex"));
};
const token = () => crypto.randomBytes(24).toString("hex");
const sendError = (res, status, message) => res.status(status).json({ error: message });

function auth(requiredRole) {
  return (req, res, next) => {
    const session = sessions.get((req.headers.authorization || "").replace("Bearer ", ""));
    if (!session || (requiredRole && session.role !== requiredRole)) {
      return sendError(res, 401, "Authentification requise.");
    }
    req.user = session;
    next();
  };
}

app.post("/api/auth/register", (req, res) => {
  const { lastName, firstName, gender, phone, location, email, password } = req.body;
  if (!lastName || !firstName || !email || !password) return sendError(res, 400, "Les champs obligatoires sont manquants.");
  try {
    const result = db.prepare(`
      INSERT INTO users (last_name, first_name, gender, phone, location, email, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(lastName.trim(), firstName.trim(), gender || "", phone || "", location || "", email.trim().toLowerCase(), hash(password));
    const sessionToken = token();
    sessions.set(sessionToken, { id: result.lastInsertRowid, role: "client", name: `${firstName} ${lastName}` });
    res.status(201).json({ token: sessionToken, user: sessions.get(sessionToken) });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) return sendError(res, 409, "Cette adresse e-mail est déjà utilisée.");
    return sendError(res, 500, "Impossible de créer le compte.");
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND role = 'client'").get(String(email || "").trim().toLowerCase());
  if (!user || !verifyPassword(String(password || ""), user.password_hash)) return sendError(res, 401, "E-mail ou mot de passe incorrect.");
  const sessionToken = token();
  sessions.set(sessionToken, { id: user.id, role: "client", name: `${user.first_name} ${user.last_name}` });
  res.json({ token: sessionToken, user: sessions.get(sessionToken) });
});

app.post("/api/auth/seller", (req, res) => {
  if (req.body.code !== (process.env.TISSA_SELLER_CODE || "TISSA2026")) return sendError(res, 401, "Code receveur invalide.");
  const sessionToken = token();
  sessions.set(sessionToken, { id: 0, role: "seller", name: "Atelier Kente" });
  res.json({ token: sessionToken, user: sessions.get(sessionToken) });
});

app.get("/api/products", (req, res) => {
  const rows = db.prepare("SELECT id, name, description, category, type, sizes AS size, price, stock, image, video, active FROM products ORDER BY created_at DESC").all();
  res.json(rows.map(row => ({ ...row, active: Boolean(row.active) })));
});

app.post("/api/products", auth("seller"), (req, res) => {
  const { name, description, category, type, size, price, stock, image, video } = req.body;
  if (!name || !description || !category || !type || !size || !Number.isFinite(Number(price)) || Number(stock) < 0) {
    return sendError(res, 400, "Les informations du produit sont incomplètes.");
  }
  const result = db.prepare(`
    INSERT INTO products (name, description, category, type, sizes, price, stock, image, video, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name.trim(), description.trim(), category, type, size, Number(price), Number(stock), image || "", video || "", Number(stock) > 0 ? 1 : 0);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.patch("/api/products/:id", auth("seller"), (req, res) => {
  const { active, stock } = req.body;
  if (active === undefined && stock === undefined) return sendError(res, 400, "Aucune modification fournie.");
  db.prepare("UPDATE products SET active = COALESCE(?, active), stock = COALESCE(?, stock) WHERE id = ?")
    .run(active === undefined ? null : (active ? 1 : 0), stock === undefined ? null : Number(stock), Number(req.params.id));
  res.status(204).end();
});

app.get("/api/orders", auth(), (req, res) => {
  const query = req.user.role === "seller"
    ? db.prepare("SELECT * FROM orders ORDER BY created_at DESC")
    : db.prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC");
  const rows = req.user.role === "seller" ? query.all() : query.all(req.user.id);
  res.json(rows.map(row => ({ ...row, items: JSON.parse(row.items) })));
});

app.post("/api/orders", auth("client"), (req, res) => {
  const { phone, address, payment, items, total } = req.body;
  if (!phone || !address || !payment || !Array.isArray(items) || !items.length || !Number.isFinite(Number(total))) {
    return sendError(res, 400, "Les informations de livraison sont incomplètes.");
  }
  const user = db.prepare("SELECT first_name, last_name FROM users WHERE id = ?").get(req.user.id);
  const id = `TS-${Math.floor(1000 + Math.random() * 8999)}`;
  db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, phone, address, payment, items, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, `${user.first_name} ${user.last_name}`, phone, address, payment, JSON.stringify(items), Number(total));
  res.status(201).json({ id, status: "new" });
});

app.patch("/api/orders/:id/status", auth("seller"), (req, res) => {
  const allowed = new Set(["new", "preparing", "delivery", "delivered"]);
  if (!allowed.has(req.body.status)) return sendError(res, 400, "Statut de commande invalide.");
  const result = db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(req.body.status, req.params.id);
  if (!result.changes) return sendError(res, 404, "Commande introuvable.");
  res.status(204).end();
});

if (db.prepare("SELECT COUNT(*) AS count FROM products").get().count === 0) {
  const seed = db.prepare(`
    INSERT INTO products (name, description, category, type, sizes, price, stock, image, video, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const defaults = [
    ["Robe Kente solaire", "Tenue de couture locale ivoirienne.", "Femme", "Robe", "S · M · L · XL", 28500, 12, "/assets/robe-kente.jpg"],
    ["Jupe pagne Baoulé", "Jupe inspirée du savoir-faire Baoulé.", "Femme", "Jupe", "S · M · L · XL", 22000, 8, "/assets/jupe-baoule.jpg"],
    ["Pantalon homme Kita", "Pantalon moderne en tissu Kita.", "Homme", "Pantalon", "M · L · XL · 2XL", 26000, 10, "/assets/pantalon-kita.jpg"],
    ["Chemise homme Bogolan", "Chemise légère aux motifs Bogolan.", "Homme", "Chemise", "M · L · XL · 2XL", 24000, 9, "/assets/chemise-bogolan.jpg"],
    ["Veste dame N'zima", "Veste élégante inspirée des motifs N'zima.", "Femme", "Veste", "S · M · L · XL", 35000, 6, "/assets/veste-nzima.jpg"],
    ["Complet ivoirien homme", "Complet habillé pour les grandes occasions.", "Homme", "Complet", "M · L · XL · 2XL", 48000, 5, "/assets/complet-ivoirien.jpg"],
    ["Robe enfant pagne", "Robe enfant colorée et confortable.", "Enfant", "Robe", "4 · 6 · 8 · 10 ans", 14500, 7, "/assets/robe-enfant.jpg"]
  ];
  defaults.forEach(item => seed.run(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7], ""));
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Tissa est disponible sur http://localhost:${port} et sur le réseau local`);
});
