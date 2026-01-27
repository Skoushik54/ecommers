import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, X } from 'lucide-react';
import { AppContext } from '@/App';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();
  const { API } = useContext(AppContext);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/');
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;

    const checkPaymentStatus = async () => {
      // COD Bypass
      if (sessionId.startsWith('cod_')) {
        setStatus('success');
        const orderId = sessionId.replace('cod_', '');
        try {
          const orderResponse = await fetch(`${API}/orders/${orderId}`, { credentials: 'include' });
          const orderData = await orderResponse.json();
          setOrderDetails(orderData);
        } catch (e) { console.error(e); }
        return;
      }

      try {
        const response = await fetch(`${API}/payments/status/${sessionId}`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.payment_status === 'paid') {
          setStatus('success');

          const orderResponse = await fetch(`${API}/orders/${data.order_id}`, {
            credentials: 'include'
          });
          const orderData = await orderResponse.json();
          setOrderDetails(orderData);
          return;
        }

        if (data.status === 'expired') {
          setStatus('expired');
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkPaymentStatus, 2000);
        } else {
          setStatus('timeout');
        }
      } catch (error) {
        console.error('Error checking payment:', error);
        setStatus('error');
      }
    };

    checkPaymentStatus();
  }, [searchParams, API, navigate]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"
          />
          <p className="text-white font-mono">VERIFYING PAYMENT...</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'expired' || status === 'timeout') {
    return (
      <div data-testid="order-error" className="min-h-screen flex items-center justify-center bg-[#050505] px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="text-red-500" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">PAYMENT FAILED</h1>
          <p className="text-white/60 mb-8">
            {status === 'expired' ? 'Payment session expired' : 'Unable to verify payment'}
          </p>
          <button onClick={() => navigate('/products')} className="btn-primary">
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="order-confirmation-page" className="min-h-screen bg-[#050505] pt-32 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={48} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            ORDER CONFIRMED
          </h1>
          <p className="text-white/60 font-mono">
            Thank you for your purchase!
          </p>
        </motion.div>

        {orderDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-white/10 p-8 space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-2 uppercase">Order Details</h2>
              <p className="text-white/60 font-mono text-sm">
                Order ID: {orderDetails.order_id.toUpperCase()}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-white font-bold uppercase mb-4">Items</h3>
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-white/70">
                      {item.product_name} (x{item.quantity}, {item.size})
                    </span>
                    <span className="text-white font-mono">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-white font-bold uppercase mb-4">Shipping Address</h3>
              <div className="text-white/70 text-sm space-y-1">
                <p>{orderDetails.shipping_info.full_name}</p>
                <p>{orderDetails.shipping_info.address_line1}</p>
                {orderDetails.shipping_info.address_line2 && (
                  <p>{orderDetails.shipping_info.address_line2}</p>
                )}
                <p>
                  {orderDetails.shipping_info.city}, {orderDetails.shipping_info.state} {orderDetails.shipping_info.postal_code}
                </p>
                <p>{orderDetails.shipping_info.country}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold uppercase text-lg">Total Paid</span>
                <span className="text-white font-bold font-mono text-3xl">
                  ${orderDetails.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-[#1A1A1A] p-6 border border-white/10">
              <div className="flex items-start gap-4">
                <Package className="text-white/60 flex-shrink-0" size={24} />
                <div>
                  <h4 className="text-white font-bold mb-2">WHAT'S NEXT?</h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    You'll receive an email confirmation shortly. Your order will be processed and shipped within 1-2 business days. Track your order from your profile page.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-8 flex gap-4 justify-center">
          <button onClick={() => navigate('/products')} className="btn-outline">
            CONTINUE SHOPPING
          </button>
          <button onClick={() => navigate('/profile')} className="btn-primary">
            VIEW MY ORDERS
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
