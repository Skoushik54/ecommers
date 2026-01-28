import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings,
  Plus, Search, Filter, MoreVertical, Trash2, Edit, ChevronDown, MessageSquare
} from 'lucide-react';
import { AppContext } from '@/App';
import { toast } from 'sonner';

// --- Sidebar Component ---
const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'support', icon: MessageSquare, label: 'Support' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-white/10 h-screen fixed left-0 top-0 pt-8 px-4 hidden lg:block">
      <div className="mb-12 px-4">
        <h1 className="text-3xl font-black text-white tracking-widest uppercase">RARE</h1>
        <p className="text-white/40 text-[10px] font-mono tracking-[0.3em] uppercase">Admin Console</p>
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-mono uppercase transition-colors rounded-lg ${activeTab === item.id
              ? 'bg-white text-black font-bold'
              : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="absolute bottom-8 left-4 right-4">
        <div className="p-4 bg-white/5 rounded-lg border border-white/5">
          <p className="text-white/40 text-xs font-mono mb-2 uppercase">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-500 text-xs font-mono uppercase">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Stats Card Component ---
const StatsCard = ({ label, value, trend, trendUp }) => (
  <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
    <p className="text-white/40 text-xs font-mono uppercase mb-2">{label}</p>
    <h3 className="text-3xl font-bold text-white mb-4">{value}</h3>
    <div className={`text-xs font-mono flex items-center gap-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
      {trendUp ? '↑' : '↓'} {trend} <span className="text-white/40 ml-1">vs last week</span>
    </div>
  </div>
);

// --- Product List Component ---
const ProductList = ({ products, onEdit, onDelete, onAdd }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white uppercase">Products Inventory</h2>
        <button
          onClick={onAdd}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus size={18} />
          ADD NEW
        </button>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-white/40 font-mono text-xs uppercase border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {products.map((product) => (
              <tr key={product.product_id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.images[0]}
                      alt=""
                      className="w-10 h-10 rounded bg-white/10 object-cover"
                    />
                    <div>
                      <p className="text-white font-bold text-sm uppercase">{product.name}</p>
                      <p className="text-white/40 text-xs truncate max-w-[150px]">{product.product_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/60 text-sm">{product.category}</td>
                <td className="px-6 py-4 text-white font-mono text-sm">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-mono border ${product.stock > 10
                    ? 'border-green-500/30 text-green-500 bg-green-500/10'
                    : 'border-red-500/30 text-red-500 bg-red-500/10'
                    }`}>
                    {product.stock} IN STOCK
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-white"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(product.product_id)}
                      className="p-2 hover:bg-red-500/10 rounded text-white/60 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Orders List Component ---
const OrderList = ({ orders, onUpdateStatus }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'pending': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case 'cancelled': return 'text-red-500 border-red-500/30 bg-red-500/10';
      default: return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white uppercase">Recent Orders</h2>
        <div className="flex gap-2">
          <button className="p-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white/60 hover:text-white">
            <Filter size={18} />
          </button>
          <button className="p-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white/60 hover:text-white">
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.order_id} className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl hover:border-white/30 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <ShoppingBag size={24} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-bold font-mono">#{order.order_id.slice(-6).toUpperCase()}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase border rounded ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs font-mono">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex-1 lg:px-12">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex-shrink-0 text-center">
                      <div className="w-10 h-10 bg-white/10 rounded mb-1 mx-auto flex items-center justify-center text-white/40 text-xs">
                        {item.quantity}x
                      </div>
                    </div>
                  ))}
                  <p className="text-white/60 text-sm ml-2">
                    {order.items.length} items
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-white/40 text-xs font-mono uppercase">Total Amount</p>
                  <p className="text-white font-bold font-mono">${order.total.toFixed(2)}</p>
                </div>

                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.order_id, e.target.value)}
                  className="bg-[#1A1A1A] border border-white/20 text-white px-3 py-2 text-sm font-mono rounded focus:border-white/50 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



// --- Support Tab ---
const SupportTab = ({ API }) => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetch(`${API}/admin/support`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json()).then(setTickets).catch(console.error);
  }, [API]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Support Tickets</h2>
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 text-white/60 font-mono text-xs uppercase">Ticket ID</th>
              <th className="p-4 text-white/60 font-mono text-xs uppercase">Subject</th>
              <th className="p-4 text-white/60 font-mono text-xs uppercase">User</th>
              <th className="p-4 text-white/60 font-mono text-xs uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tickets.map(t => (
              <tr key={t.ticket_id}>
                <td className="p-4 text-white/40 font-mono text-xs">{t.ticket_id}</td>
                <td className="p-4 text-white">
                  <p className="font-bold">{t.subject}</p>
                  <p className="text-white/40 text-xs truncate max-w-xs">{t.message}</p>
                </td>
                <td className="p-4 text-white text-sm">{t.user_email}</td>
                <td className="p-4">
                  <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs border border-yellow-500/50 uppercase">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main AdminPage Component ---
const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { API } = useContext(AppContext);

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    sizes: [],
    images: [],
    category: '',
    stock: '',
    featured: false
  });

  useEffect(() => {
    fetchData();
  }, [API]); // Added dependency

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`${API}/products`, {}), // Public endpoint, no auth needed usually, but good practice if rate limited
        fetch(`${API}/admin/orders`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();

      setProducts(productsData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers (Same as before but cleaner) ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      sizes: typeof productForm.sizes === 'string' ? productForm.sizes.split(',').map(s => s.trim()) : productForm.sizes,
      images: typeof productForm.images === 'string' ? productForm.images.split(',').map(s => s.trim()) : productForm.images
    };

    try {
      const url = editingProduct ? `${API}/products/${editingProduct.product_id}` : `${API}/products`;
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed');
      toast.success(`Product ${editingProduct ? 'updated' : 'created'}`);
      setShowProductModal(false);
      fetchData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await fetch(`${API}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Deleted");
      fetchData();
    } catch (e) { toast.error("Failed"); }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {

      await fetch(`${API}/admin/orders/${id}?status=${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Status Updated");
      fetchData();
    } catch (e) { toast.error("Failed"); }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: '', sizes: '', images: '', category: '', stock: '', featured: false });
    setShowProductModal(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name, description: p.description, price: p.price,
      sizes: p.sizes.join(', '), images: p.images.join(', '),
      category: p.category, stock: p.stock, featured: p.featured
    });
    setShowProductModal(true);
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono">LOADING SYSTEM...</div>;

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-8 pt-32">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-bold text-white uppercase mb-2">Dashboard</h1>
                <p className="text-white/40 font-mono text-sm">Welcome back, Admin</p>
              </div>
              <div className="text-right">
                <p className="text-white font-mono text-xl">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <StatsCard label="Total Revenue" value={`$${orders.reduce((acc, o) => acc + (o.total || 0), 0).toFixed(2)}`} trend="--" trendUp={true} />
              <StatsCard label="Active Orders" value={orders.filter(o => o.status === 'pending').length} trend={orders.length > 0 ? `${((orders.filter(o => o.status === 'pending').length / orders.length) * 100).toFixed(0)}%` : "0%"} trendUp={true} />
              <StatsCard label="Total Products" value={products.length} trend="--" trendUp={true} />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                <h3 className="text-white font-bold uppercase mb-4">Sales Analytics</h3>
                <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
                  <p className="text-white/20 font-mono">CHART VISUALIZATION COMING SOON</p>
                </div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl">
                <h3 className="text-white font-bold uppercase mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.order_id} className="flex gap-4 items-center">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      <div className="flex-1">
                        <p className="text-white/60 text-sm">
                          Order <span className="text-white font-mono">#{order.order_id.slice(-6).toUpperCase()}</span> - <span className="capitalize">{order.status}</span>
                        </p>
                        <p className="text-white/20 text-xs">${order.total?.toFixed(2)} • {order.items?.length} items</p>
                      </div>
                      <span className="ml-auto text-white/20 text-xs font-mono">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-white/20 text-sm font-mono">No recent activity</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <ProductList
            products={products}
            onEdit={openEditModal}
            onDelete={handleDeleteProduct}
            onAdd={openAddModal}
          />
        )}

        {activeTab === 'orders' && (
          <OrderList orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
        )}

        {activeTab === 'support' && <SupportTab API={API} />}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0A0A] border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setShowProductModal(false)} className="text-white/40 hover:text-white">
                <Settings size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Product Name</label>
                  <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="input-field w-full bg-[#151515] border border-white/10 text-white p-3 rounded focus:outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Category</label>
                  <input required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="input-field w-full bg-[#151515] border border-white/10 text-white p-3 rounded focus:outline-none focus:border-white/40" />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Description</label>
                <textarea required rows={3} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="input-field w-full bg-[#151515] border border-white/10 text-white p-3 rounded focus:outline-none focus:border-white/40" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Price ($)</label>
                  <input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="input-field w-full bg-[#151515] border border-white/10 text-white p-3 rounded focus:outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Stock Qty</label>
                  <input type="number" required value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} className="input-field w-full bg-[#151515] border border-white/10 text-white p-3 rounded focus:outline-none focus:border-white/40" />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Sizes (Comma separated)</label>
                <input required value={productForm.sizes} onChange={e => setProductForm({ ...productForm, sizes: e.target.value })} placeholder="S, M, L" className="input-field w-full bg-[#151515] border border-white/10 text-white p-3 rounded focus:outline-none focus:border-white/40" />
              </div>

              <div>
                <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Image URLs (Comma separated)</label>
                <input required value={productForm.images} onChange={e => setProductForm({ ...productForm, images: e.target.value })} placeholder="https://..." className="input-field w-full bg-[#151515] border border-white/10 text-white p-3 rounded focus:outline-none focus:border-white/40" />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="featured" checked={productForm.featured} onChange={e => setProductForm({ ...productForm, featured: e.target.checked })} className="w-5 h-5 accent-white" />
                <label htmlFor="featured" className="text-sm text-white font-mono uppercase">Mark as Featured Product</label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 btn-outline">CANCEL</button>
                <button type="submit" className="flex-1 btn-primary">SAVE PRODUCT</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
