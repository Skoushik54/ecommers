import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/App';
import { toast } from 'sonner';

const CheckoutPage = () => {
  const [cart, setCart] = useState({ items: [] });
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });
  const navigate = useNavigate();
  const { API, user } = useContext(AppContext);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch(`${API}/cart`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          credentials: 'include'
        });
        const data = await response.json();
        setCart(data);

        if (data.items?.length === 0) {
          navigate('/products');
          return;
        }

        const productPromises = data.items?.map(item =>
          fetch(`${API}/products/${item.product_id}`).then(r => r.json())
        ) || [];

        const productsData = await Promise.all(productPromises);
        const productsMap = {};
        productsData.forEach(p => {
          productsMap[p.product_id] = p;
        });
        setProducts(productsMap);

        if (user) {
          setFormData(prev => ({
            ...prev,
            full_name: user.name,
            email: user.email
          }));
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [API, navigate, user]);



  const calculateTotal = () => {
    return cart.items?.reduce((sum, item) => {
      const product = products[item.product_id];
      return sum + (product?.price || 0) * item.quantity;
    }, 0) || 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderItems = cart.items.map(item => ({
        product_id: item.product_id,
        product_name: products[item.product_id]?.name || '',
        quantity: item.quantity,
        size: item.size,
        price: products[item.product_id]?.price || 0
      }));

      const orderResponse = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: orderItems,
          total: calculateTotal(),
          shipping_info: formData,
          payment_method: paymentMethod
        })
      });

      if (!orderResponse.ok) throw new Error('Failed to create order');
      const order = await orderResponse.json();

      if (paymentMethod === 'cod') {
        navigate(`/order-confirmation?session_id=cod_${order.order_id}`);
        return;
      }

      const paymentResponse = await fetch(`${API}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          order_id: order.order_id,
          origin_url: window.location.origin
        })
      });

      if (!paymentResponse.ok) throw new Error('Failed to create payment session');
      const paymentData = await paymentResponse.json();

      window.location.href = paymentData.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process checkout');
      setSubmitting(false);
    }
  };

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressSelect, setShowAddressSelect] = useState(false);

  useEffect(() => {
    if (user) {
      fetch(`${API}/user/addresses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setSavedAddresses(data);
            setShowAddressSelect(true);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user, API]);

  const handleAddressSelect = (addr) => {
    setFormData({
      ...formData,
      full_name: addr.full_name,
      address_line1: addr.street,
      city: addr.city,
      state: addr.state,
      postal_code: addr.zip_code,
      country: addr.country,
      phone: addr.phone || ''
    });
    toast.info("Address populated from " + addr.label);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-20">
        <div className="text-white font-mono">LOADING...</div>
      </div>
    );
  }

  return (
    <div data-testid="checkout-page" className="min-h-screen bg-[#050505] pt-32 pb-16 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl lg:text-6xl font-bold text-white mb-12"
        >
          CHECKOUT
        </motion.h1>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            {showAddressSelect && (
              <div className="mb-8 p-4 border border-white/10 rounded-lg bg-[#0A0A0A]">
                <h3 className="text-white font-bold uppercase mb-4 text-sm">Select Saved Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleAddressSelect(addr)}
                      className="text-left p-3 border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all rounded"
                    >
                      <span className="block text-white/60 text-[10px] font-mono uppercase mb-1">{addr.label}</span>
                      <span className="block text-white font-bold text-sm">{addr.full_name}</span>
                      <span className="block text-white/40 text-xs truncate">{addr.street}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-white uppercase mb-6">SHIPPING INFORMATION</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 font-mono text-xs uppercase mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    data-testid="full-name-input"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1A1A1A] border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-white/60 font-mono text-xs uppercase mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    data-testid="email-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1A1A1A] border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 font-mono text-xs uppercase mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  data-testid="phone-input"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1A1A1A] border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-white/60 font-mono text-xs uppercase mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="address_line1"
                  data-testid="address1-input"
                  value={formData.address_line1}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#1A1A1A] border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-white/60 font-mono text-xs uppercase mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address_line2"
                  data-testid="address2-input"
                  value={formData.address_line2}
                  onChange={handleChange}
                  className="w-full bg-[#1A1A1A] border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/60 font-mono text-xs uppercase mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    data-testid="city-input"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1A1A1A] border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-white/60 font-mono text-xs uppercase mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    data-testid="state-input"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1A1A1A] border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-white/60 font-mono text-xs uppercase mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    data-testid="postal-code-input"
                    value={formData.postal_code}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1A1A1A] border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white/60 font-mono text-xs uppercase">Payment Method</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 border rounded ${paymentMethod === 'stripe' ? 'border-white bg-white/10' : 'border-white/20 bg-transparent'}`}
                  >
                    <span className="text-white font-bold block">Credit Card</span>
                    <span className="text-white/40 text-xs">Powered by Stripe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 border rounded ${paymentMethod === 'cod' ? 'border-white bg-white/10' : 'border-white/20 bg-transparent'}`}
                  >
                    <span className="text-white font-bold block">Cash on Delivery</span>
                    <span className="text-white/40 text-xs">Pay upon receipt</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                data-testid="place-order-button"
                disabled={submitting}
                className="w-full btn-primary disabled:opacity-50"
              >
                {submitting ? 'PROCESSING...' : (paymentMethod === 'cod' ? 'PLACE ORDER' : 'PROCEED TO PAYMENT')}
              </button>
            </form>
          </div>

          <div>
            <div className="border border-white/10 p-8 sticky top-32">
              <h2 className="text-2xl font-bold text-white uppercase mb-6">ORDER SUMMARY</h2>

              <div className="space-y-4 mb-6">
                {cart.items?.map((item, index) => {
                  const product = products[item.product_id];
                  if (!product) return null;

                  return (
                    <div key={index} data-testid={`order-item-${index}`} className="flex gap-4">
                      <div className="w-20 h-24 bg-[#1A1A1A] flex-shrink-0">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-sm uppercase">{product.name}</h3>
                        <p className="text-white/60 text-xs font-mono">SIZE: {item.size} | QTY: {item.quantity}</p>
                        <p className="text-white font-mono text-sm mt-2">
                          ${(product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/10 pt-6 space-y-3">
                <div className="flex justify-between text-white/60 font-mono text-sm">
                  <span>Subtotal</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60 font-mono text-sm">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-bold uppercase">Total</span>
                  <span className="text-white font-bold font-mono text-2xl">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
