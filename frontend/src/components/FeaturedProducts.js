import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { AppContext } from '@/App';
import { toast } from 'sonner';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { API, setCartOpen } = useContext(AppContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API}/products?featured=true`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [API]);

  const handleQuickAdd = async (e, product) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Cart-Session-ID': localStorage.getItem('cart_session_id')
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: product.product_id,
          quantity: 1,
          size: product.sizes?.[0] || 'M'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to add to cart');
      }

      if (data.session_id) {
        localStorage.setItem('cart_session_id', data.session_id);
      }

      toast.success('Added to cart!');
      setCartOpen(true);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="py-32 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-16 text-center">
            LOADING...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <section data-testid="featured-products-section" className="py-32 px-6 lg:px-12 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl lg:text-6xl font-bold text-white mb-16"
        >
          FEATURED COLLECTION
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.product_id}
              data-testid={`product-card-${index}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group cursor-pointer"
              onClick={() => navigate(`/products/${product.product_id}`)}
            >
              <div className="relative overflow-hidden aspect-[3/4] bg-[#1A1A1A] mb-4">
                <motion.img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                // Removed Framer Motion scale to improve performance on low-end devices
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                <button
                  data-testid={`quick-add-${index}`}
                  onClick={(e) => handleQuickAdd(e, product)}
                  className="absolute bottom-4 right-4 bg-white text-black p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#D00000] hover:text-white"
                >
                  <ShoppingCart size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  {product.name}
                </h3>
                <p className="text-white/60 font-mono text-sm">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <button
            data-testid="view-all-products-btn"
            onClick={() => navigate('/products')}
            className="btn-outline"
          >
            VIEW ALL PRODUCTS
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
