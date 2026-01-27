import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Preloader = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-widest uppercase">
                    Rare
                </h1>
            </motion.div>
        </div>
    );
};

export default Preloader;
