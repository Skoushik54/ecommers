import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '@/App';
import { Package } from 'lucide-react';

const UserProfile = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, API } = useContext(AppContext);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API}/orders`, {
          credentials: 'include'
        });
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [API]);
  
  return (
    <div data-testid="user-profile-page" className="min-h-screen bg-[#050505] pt-32 pb-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
            MY ACCOUNT
          </h1>
          <p className="text-white/60 font-mono">{user?.email}</p>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="border border-white/10 p-6 space-y-4">
              <h2 className="text-xl font-bold text-white uppercase">PROFILE INFO</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-white/40 font-mono text-xs uppercase">Name</label>
                  <p className="text-white">{user?.name}</p>
                </div>
                <div>
                  <label className="text-white/40 font-mono text-xs uppercase">Email</label>
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white uppercase mb-6">ORDER HISTORY</h2>
            
            {loading ? (
              <div className="text-white/60 font-mono">LOADING ORDERS...</div>
            ) : orders.length === 0 ? (
              <div className="border border-white/10 p-12 text-center">
                <Package className="mx-auto mb-4 text-white/40" size={48} />
                <p className="text-white/60 font-mono">NO ORDERS YET</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order, index) => (
                  <motion.div
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`order-${index}`}
                    className="border border-white/10 p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-white font-mono text-sm">ORDER #{order.order_id.toUpperCase()}</p>
                        <p className="text-white/40 font-mono text-xs mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 font-mono text-xs uppercase ${
                        order.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-white/70">{item.product_name} (x{item.quantity}, {item.size})</span>
                          <span className="text-white font-mono">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between">
                        <span className="text-white font-bold uppercase">Total</span>
                        <span className="text-white font-bold font-mono text-lg">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
