import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/App';
import { toast } from 'sonner';

const Cart = ({ open, onClose }) => {
  const [cart, setCart] = useState({ items: [] });
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { API, cartKey } = useContext(AppContext);

  useEffect(() => {
    if (open) {
      fetchCart();
    }
  }, [open, cartKey]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/cart`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Cart-Session-ID': localStorage.getItem('cart_session_id')
        },
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      setCart(data);

      const productPromises = data.items?.map(item =>
        fetch(`${API}/products/${item.product_id}`).then(r => r.json())
      ) || [];

      const productsData = await Promise.all(productPromises);
      const productsMap = {};
      productsData.forEach(p => {
        productsMap[p.product_id] = p;
      });
      setProducts(productsMap);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, size, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await fetch(`${API}/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Cart-Session-ID': localStorage.getItem('cart_session_id')
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          size: size,
          quantity: newQuantity
        })
      });
      fetchCart();
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const removeItem = async (productId, size) => {
    try {
      await fetch(`${API}/cart/remove/${productId}/${size}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Cart-Session-ID': localStorage.getItem('cart_session_id')
        }
      });
      fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cart.items?.reduce((sum, item) => {
      const product = products[item.product_id];
      return sum + (product?.price || 0) * item.quantity;
    }, 0) || 0;
  };

  const handleCheckout = () => {
    if (cart.items?.length > 0) {
      onClose();
      navigate('/checkout');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
            data-testid="cart-overlay"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-[#0A0A0A] border-l border-white/10 z-50 flex flex-col"
            data-testid="cart-panel"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white uppercase">YOUR CART</h2>
              <button
                data-testid="close-cart-button"
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-white/60 font-mono">LOADING...</div>
              </div>
            ) : cart.items?.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white/60 font-mono mb-4">YOUR CART IS EMPTY</p>
                  <button
                    data-testid="continue-shopping-button"
                    onClick={() => { onClose(); navigate('/products'); }}
                    className="btn-outline"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {cart.items?.map((item, index) => {
                    const product = products[item.product_id];
                    if (!product) return null;

                    return (
                      <div
                        key={`${item.product_id}-${item.size}`}
                        data-testid={`cart-item-${index}`}
                        className="flex gap-4"
                      >
                        <div className="w-24 h-32 bg-[#1A1A1A] flex-shrink-0">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-white font-bold text-sm mb-1 uppercase">
                            {product.name}
                          </h3>
                          <p className="text-white/60 text-xs font-mono mb-2">
                            SIZE: {item.size}
                          </p>
                          <p className="text-white font-mono text-sm mb-3">
                            ${product.price.toFixed(2)}
                          </p>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-white/20">
                              <button
                                data-testid={`decrease-qty-${index}`}
                                onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)}
                                className="px-3 py-1 text-white hover:bg-white/10"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 text-white font-mono text-sm">
                                {item.quantity}
                              </span>
                              <button
                                data-testid={`increase-qty-${index}`}
                                onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)}
                                className="px-3 py-1 text-white hover:bg-white/10"
                              >
                                +
                              </button>
                            </div>

                            <button
                              data-testid={`remove-item-${index}`}
                              onClick={() => removeItem(item.product_id, item.size)}
                              className="text-white/60 hover:text-[#D00000] transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-mono uppercase">Total</span>
                    <span className="text-2xl font-bold text-white">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <button
                    data-testid="checkout-button"
                    onClick={handleCheckout}
                    className="w-full btn-primary"
                  >
                    CHECKOUT
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;
