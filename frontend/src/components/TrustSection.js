import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TrustSection = () => {
  const statsRef = useRef([]);
  
  useEffect(() => {
    statsRef.current.forEach((stat, index) => {
      gsap.fromTo(
        stat,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          delay: index * 0.2,
          scrollTrigger: {
            trigger: stat,
            start: 'top 85%',
          }
        }
      );
    });
  }, []);
  
  const stats = [
    { number: '10,000+', label: 'ORDERS SHIPPED' },
    { number: '98%', label: 'SATISFACTION RATE' },
    { number: '100%', label: 'QUALITY GUARANTEE' }
  ];
  
  const timeline = [
    { icon: Package, label: 'Order', description: 'Confirmed instantly' },
    { icon: Package, label: 'Packaging', description: 'Premium packaging' },
    { icon: Truck, label: 'Shipping', description: 'Pan-India delivery' },
    { icon: CheckCircle, label: 'Delivery', description: '3-5 business days' }
  ];
  
  return (
    <section data-testid="trust-section" className="py-32 px-6 lg:px-12 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            BUILT ON TRUST
          </h2>
          <p className="text-white/60 text-lg font-mono">
            Quality and reliability you can count on
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-12 mb-24">
          {stats.map((stat, index) => (
            <div 
              key={index}
              ref={el => statsRef.current[index] = el}
              data-testid={`stat-${index}`}
              className="text-center"
            >
              <div className="text-5xl lg:text-6xl font-bold text-[#D00000] mb-2">
                {stat.number}
              </div>
              <div className="text-white/60 font-mono text-sm uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {timeline.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              data-testid={`timeline-item-${index}`}
              className="relative"
            >
              {index < timeline.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-[2px] bg-white/20" />
              )}
              
              <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-none bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                  <item.icon className="text-white" size={28} />
                </div>
                <h3 className="text-white font-bold uppercase mb-2">
                  {item.label}
                </h3>
                <p className="text-white/60 text-sm font-mono">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
