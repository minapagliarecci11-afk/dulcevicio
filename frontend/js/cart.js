/**
 * DULCE VICIO - Pastelería Artesanal
 * Carrito de compras, cuotas y checkout
 */

class ShoppingCart {
  constructor() {
    this.storageKey = "dulce_vicio_cart_v1";
    this.items = this.loadCart();
    this.listeners = [];
  }

  loadCart() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.error("Error guardando carrito:", e);
    }
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this));
  }

  addItem(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        nombre: product.nombre,
        precio_final: product.precio_final,
        cuotas_cantidad: product.cuotas_cantidad || 3,
        cuotas_valor: product.cuotas_valor || (product.precio_final / 3),
        imagen_url: product.imagen_url,
        quantity: 1
      });
    }
    this.saveCart();
  }

  updateQuantity(productId, delta) {
    const item = this.items.find(i => i.id === productId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.removeItem(productId);
        return;
      }
      this.saveCart();
    }
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.saveCart();
  }

  clear() {
    this.items = [];
    this.saveCart();
  }

  getCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getTotal() {
    return this.items.reduce((sum, i) => sum + (i.precio_final * i.quantity), 0);
  }

  getInstallmentsInfo(cuotas = 3) {
    const total = this.getTotal();
    const cuotaMonto = total > 0 ? (total / cuotas).toFixed(2) : "0.00";
    return {
      cuotas,
      montoPorCuota: cuotaMonto,
      texto: `Hasta ${cuotas} cuotas sin interés de $${Number(cuotaMonto).toLocaleString("es-AR")}`
    };
  }

  createOrder(customerInfo) {
    const orderId = Math.floor(100000 + Math.random() * 900000);
    const order = {
      orderId,
      customer: customerInfo,
      items: [...this.items],
      total: this.getTotal(),
      date: new Date().toISOString(),
      estado: "confirmado"
    };

    // Guardar en historial de pedidos para poder probar arrepentimiento
    try {
      const ordersHistory = JSON.parse(localStorage.getItem("dulce_vicio_orders") || "[]");
      ordersHistory.unshift(order);
      localStorage.setItem("dulce_vicio_orders", JSON.stringify(ordersHistory));
    } catch {}

    this.clear();
    return order;
  }
}

export const cart = new ShoppingCart();
