import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer data-testid="footer" className="bg-[#0A0A0A] border-t border-white/10 py-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-3xl font-bold text-white mb-4">RARE</h3>
            <p className="text-white/60 text-sm">
              Bold. Minimal. Experimental. <br />
              Not for everyone.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold uppercase mb-4 font-mono text-sm">Shop</h4>
            <ul className="space-y-2">
              <li><Link to="/products" data-testid="footer-products-link" className="text-white/60 hover:text-white text-sm font-mono">All Products</Link></li>
              <li><Link to="/products" data-testid="footer-hoodies-link" className="text-white/60 hover:text-white text-sm font-mono">Hoodies</Link></li>
              <li><Link to="/products" data-testid="footer-jackets-link" className="text-white/60 hover:text-white text-sm font-mono">Jackets</Link></li>
              <li><Link to="/products" data-testid="footer-tees-link" className="text-white/60 hover:text-white text-sm font-mono">T-Shirts</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold uppercase mb-4 font-mono text-sm">Info</h4>
            <ul className="space-y-2">
              <li><a href="#" data-testid="footer-about-link" className="text-white/60 hover:text-white text-sm font-mono">About Us</a></li>
              <li><a href="#" data-testid="footer-shipping-link" className="text-white/60 hover:text-white text-sm font-mono">Shipping</a></li>
              <li><a href="#" data-testid="footer-returns-link" className="text-white/60 hover:text-white text-sm font-mono">Returns</a></li>
              <li><a href="#" data-testid="footer-contact-link" className="text-white/60 hover:text-white text-sm font-mono">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold uppercase mb-4 font-mono text-sm">Follow</h4>
            <div className="flex gap-4">
              <a href="#" data-testid="footer-instagram-link" className="text-white/60 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" data-testid="footer-twitter-link" className="text-white/60 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" data-testid="footer-youtube-link" className="text-white/60 hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm font-mono">
            © 2025 RARE. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" data-testid="footer-privacy-link" className="text-white/40 hover:text-white text-sm font-mono">Privacy Policy</a>
            <a href="#" data-testid="footer-terms-link" className="text-white/40 hover:text-white text-sm font-mono">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
