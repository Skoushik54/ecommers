import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '@/App';
import {
    Package, MapPin, Shield, Star, RefreshCcw,
    Truck, CheckCircle, Clock, ChevronRight, X
} from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet Default Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- Map Picker Component ---
const MapController = ({ onLocationSelect, externalPosition }) => {
    const [position, setPosition] = useState(externalPosition || null);
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng);
        },
    });

    // Update marker when external position changes (from text input)
    useEffect(() => {
        if (externalPosition) {
            setPosition(externalPosition);
            map.setView(externalPosition, 13);
        }
    }, [externalPosition, map]);

    const handleCurrentLocation = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported");
            return;
        }

        toast.info("Fetching location...");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const latlng = { lat: latitude, lng: longitude };
                setPosition(latlng);
                map.setView(latlng, 16); // Use setView for stability
                onLocationSelect(latlng);
                toast.success("Location found!");
            },
            (err) => {
                console.error(err);
                toast.error("Unable to retrieve location");
            }
        );
    };

    return (
        <>
            {position && <Marker position={position} />}
            <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto' }}>
                <div className="leaflet-control leaflet-bar">
                    <button
                        onClick={handleCurrentLocation}
                        className="bg-white text-black text-xs font-bold px-3 py-2 flex items-center gap-2 hover:bg-gray-100 border-none cursor-pointer"
                        title="Use My Current Location"
                    >
                        <MapPin size={14} /> Use My Location
                    </button>
                </div>
            </div>
        </>
    );
};

const MapPicker = ({ onLocationSelect, externalPosition }) => {
    return (
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController onLocationSelect={onLocationSelect} externalPosition={externalPosition} />
        </MapContainer>
    );
};

// --- Tracking Modal ---
const TrackingModal = ({ order, onClose }) => {
    if (!order) return null;
    const steps = [
        { label: 'Ordered', date: 'Oct 24', done: true },
        { label: 'Shipped', date: 'Oct 25', done: true },
        { label: 'Out for Delivery', date: 'Today', done: order.status !== 'pending' },
        { label: 'Delivered', date: 'Expected Tomorrow', done: order.status === 'delivered' }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0A0A0A] border border-white/10 max-w-lg w-full p-8 rounded-xl shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white uppercase mb-1">Tracking Details</h2>
                <p className="text-white/40 text-xs font-mono mb-8">Order #{order.order_id.slice(-8).toUpperCase()}</p>

                <div className="space-y-8 relative">
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-white/10"></div>
                    {steps.map((step, i) => (
                        <div key={i} className="relative flex items-center gap-6">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-[#0A0A0A] ${step.done ? 'border-green-500 text-green-500' : 'border-white/20 text-white/20'
                                }`}>
                                {step.done && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold text-sm ${step.done ? 'text-white' : 'text-white/40'}`}>{step.label}</p>
                                <p className="text-white/20 text-xs font-mono">{step.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

// --- Support Modal ---
const SupportModal = ({ order, onClose, API }) => {
    const [subject, setSubject] = useState(order ? `Issue with Order #${order.order_id.slice(-8)}` : '');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API}/support`, {
                method: 'POST',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    order_id: order?.order_id,
                    subject,
                    message
                }),
                credentials: 'include'
            });
            toast.success('Support ticket created. We will contact you shortly.');
            onClose();
        } catch (e) { toast.error('Failed to submit ticket'); }
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-xl max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20} /></button>
                <h2 className="text-xl font-bold text-white uppercase mb-6">Report an Issue</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-white/60 text-xs uppercase block mb-2">Subject</label>
                        <input className="input-field w-full bg-[#151515] border border-white/10 p-3 rounded text-white" value={subject} onChange={e => setSubject(e.target.value)} required />
                    </div>
                    <div>
                        <label className="text-white/60 text-xs uppercase block mb-2">Message</label>
                        <textarea className="input-field w-full h-32 bg-[#151515] border border-white/10 p-3 rounded text-white" value={message} onChange={e => setMessage(e.target.value)} required placeholder="Describe your issue..." />
                    </div>
                    <button className="btn-primary w-full">Submit Ticket</button>
                </form>
            </div>
        </div>
    );
};

// --- Orders Tab ---
const OrdersTab = ({ API, triggerCartUpdate }) => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [supportOrder, setSupportOrder] = useState(null);

    const refreshOrders = () => {
        fetch(`${API}/orders`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setOrders(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        refreshOrders();
    }, [API]);

    const handleCancel = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            const res = await fetch(`${API}/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) { toast.success('Order Cancelled'); refreshOrders(); }
            else toast.error('Cannot cancel this order');
        } catch (e) { toast.error('Error'); }
    };

    const handleReturn = async (orderId) => {
        if (!window.confirm("Request a return?")) return;
        try {
            const res = await fetch(`${API}/orders/${orderId}/return`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) { toast.success('Return Requested'); refreshOrders(); }
            else toast.error('Failed');
        } catch (e) { toast.error('Error'); }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white uppercase">Your Orders</h2>
            {orders.length === 0 ? (
                <p className="text-white/40 font-mono">No orders found.</p>
            ) : (
                <div className="grid gap-6">
                    {orders.map(order => (
                        <div key={order.order_id} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                            <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/10">
                                <div className="flex gap-8 text-sm text-white/60">
                                    <div>
                                        <p className="uppercase text-[10px] font-mono mb-1">Order Placed</p>
                                        <p className="text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="uppercase text-[10px] font-mono mb-1">Total</p>
                                        <p className="text-white">${order.total.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="uppercase text-[10px] font-mono mb-1">Ship To</p>
                                        <p className="text-white hover:underline cursor-pointer relative group">
                                            {order.shipping_info.full_name}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="uppercase text-[10px] font-mono mb-1">Order # {order.order_id.slice(-8)}</p>
                                    <button onClick={() => setSupportOrder(order)} className="text-white text-sm hover:underline font-bold text-red-400">Report Issue</button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-4">
                                        <h3 className={`font-bold text-lg mb-2 capitalize ${['delivered', 'confirmed'].includes(order.status) ? 'text-green-500' : (order.status === 'cancelled' ? 'text-red-500' : 'text-white')}`}>
                                            {order.status} {order.status === 'delivered' ? '' : (order.status === 'cancelled' ? '' : 'Expected soon')}
                                        </h3>
                                        {order.items.map((item, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-20 h-24 bg-white/5 rounded">
                                                    <div className="w-full h-full flex items-center justify-center text-white/20">IMG</div>
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold">{item.product_name}</p>
                                                    <p className="text-white/60 text-xs">Size: {item.size}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={async () => {
                                                                // Quick Add Logic
                                                                try {
                                                                    await fetch(`${API}/cart/add`, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                                        },
                                                                        body: JSON.stringify({
                                                                            product_id: item.product_id,
                                                                            quantity: 1,
                                                                            size: item.size
                                                                        }),
                                                                        credentials: 'include'
                                                                    });
                                                                    toast.success('Added to cart');
                                                                    triggerCartUpdate();
                                                                } catch (e) { toast.error('Failed to add'); }
                                                            }}
                                                            className="btn-primary px-4 py-1 text-xs"
                                                        >
                                                            Buy it again
                                                        </button>
                                                        <button
                                                            onClick={() => window.location.href = `/products/${item.product_id}`}
                                                            className="btn-outline px-4 py-1 text-xs"
                                                        >
                                                            View item
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-3 md:w-64 border-l border-white/10 md:pl-6">
                                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="btn-primary w-full text-sm py-2"
                                            >
                                                Track Package
                                            </button>
                                        )}

                                        {order.status === 'delivered' && (
                                            <>
                                                <button onClick={() => handleReturn(order.order_id)} className="btn-outline w-full text-sm py-2 flex items-center justify-center gap-2">
                                                    <RefreshCcw size={14} /> Return items
                                                </button>
                                                <button className="btn-outline w-full text-sm py-2 flex items-center justify-center gap-2">
                                                    <Star size={14} /> Write review
                                                </button>
                                            </>
                                        )}

                                        {(order.status === 'pending' || order.status === 'confirmed') && (
                                            <button onClick={() => handleCancel(order.order_id)} className="btn-outline w-full text-sm py-2 text-red-500 border-red-500/50 hover:bg-red-500/10">
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <AnimatePresence>
                {selectedOrder && <TrackingModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
                {supportOrder && <SupportModal order={supportOrder} onClose={() => setSupportOrder(null)} API={API} />}
            </AnimatePresence>
        </div>
    );
};

// --- Addresses Tab (Updated) ---
const AddressesTab = ({ API, user }) => {
    const [addresses, setAddresses] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: 'Home', full_name: '', street: '', city: '', state: '', zip_code: '', country: 'India' });
    const [mapPosition, setMapPosition] = useState(null);

    useEffect(() => {
        if (!user) return;
        const fetchAddresses = async () => {
            try {
                const res = await fetch(`${API}/user/addresses`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAddresses(Array.isArray(data) ? data : []);
                } else {
                    setAddresses(user.addresses || []);
                }
            } catch (e) { console.error(e); }
        }
        fetchAddresses();
    }, [user, API]);

    // Forward geocoding: Convert address text to coordinates
    const geocodeAddress = async (address) => {
        const { street, city, state, zip_code, country } = address;
        const query = [street, city, state, zip_code, country].filter(Boolean).join(', ');

        if (!query || query.length < 5) return; // Need enough info

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();
            if (data && data[0]) {
                const { lat, lon } = data[0];
                setMapPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
        }
    };

    // Debounced geocoding when user types
    useEffect(() => {
        const timer = setTimeout(() => {
            geocodeAddress(newAddress);
        }, 1000); // Wait 1 second after user stops typing

        return () => clearTimeout(timer);
    }, [newAddress.street, newAddress.city, newAddress.state, newAddress.zip_code, newAddress.country]);

    const handleLocationSelect = async (latlng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = await res.json();
            if (data && data.address) {
                // Try multiple postal code fields as different regions use different names
                const postalCode = data.address.postcode ||
                    data.address.postal_code ||
                    data.address['ISO3166-2-lvl6'] ||
                    '';

                setNewAddress(prev => ({
                    ...prev,
                    street: data.address.road || data.address.suburb || data.address.neighbourhood || '',
                    city: data.address.city || data.address.town || data.address.village || data.address.municipality || '',
                    state: data.address.state || data.address.province || data.address.region || '',
                    zip_code: postalCode,
                    country: data.address.country || prev.country
                }));
                toast.success("Address Updated from Map");
            }
        } catch (error) {
            toast.error("Failed to fetch address details");
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/user/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newAddress)
            });

            if (res.ok) {
                const data = await res.json();
                setAddresses(data.addresses || data); // Store addresses array
                toast.success('Address Added');
                // Reset form and close modal
                setNewAddress({ label: 'Home', full_name: '', street: '', city: '', state: '', zip_code: '', country: 'India' });
                setMapPosition(null);
                setShowAddressModal(false);
            } else {
                toast.error('Failed to save address');
            }
        } catch (e) { toast.error('Failed'); }
    };

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/user/addresses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                toast.success('Address Deleted');
                setAddresses(prev => prev.filter(a => a.id !== id));
            }
            setDeleteConfirm(null);
        } catch (e) {
            toast.error('Error');
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white uppercase">Saved Addresses</h2>
                <button onClick={() => setShowAddressModal(true)} className="btn-outline flex items-center gap-2 px-4 py-2"><MapPin size={16} /> Add New</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                {addresses.map(addr => (
                    <div key={addr.id} className="bg-[#0A0A0A] border border-white/10 p-6 rounded-lg relative">
                        <button onClick={() => setDeleteConfirm(addr)} className="absolute top-4 right-4 text-white/40 hover:text-red-500"><X size={16} /></button>
                        <span className="bg-white/10 text-white text-[10px] px-2 py-1 rounded uppercase mb-2 inline-block">{addr.label}</span>
                        <p className="text-white font-bold">{addr.full_name}</p>
                        <p className="text-white/60 text-sm">{addr.street}</p>
                        <p className="text-white/60 text-sm">{addr.city}, {addr.state}, {addr.zip_code}</p>
                        <p className="text-white/60 text-sm">{addr.country}</p>
                    </div>
                ))}
                {showAddressModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-xl max-w-4xl w-full my-8 relative">
                            <button onClick={() => {
                                setShowAddressModal(false);
                                setNewAddress({ label: 'Home', full_name: '', street: '', city: '', state: '', zip_code: '', country: 'India' });
                                setMapPosition(null);
                            }} className="absolute top-4 right-4 text-white/40 hover:text-white">
                                <X size={20} />
                            </button>
                            <h2 className="text-white font-bold mb-6 text-xl">Add New Address</h2>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Left Column: Map */}
                                <div className="space-y-2">
                                    <label className="text-white/60 text-xs uppercase font-bold">Pin Location</label>
                                    <div className="border border-white/20 rounded-lg overflow-hidden h-[300px] md:h-[400px]">
                                        <MapPicker onLocationSelect={handleLocationSelect} externalPosition={mapPosition} />
                                    </div>
                                    <p className="text-xs text-white/40 text-center">Click map to update address OR type address to update map</p>
                                </div>

                                {/* Right Column: Form */}
                                <form onSubmit={handleAdd} className="space-y-4">
                                    <div>
                                        <label className="text-white/60 text-xs uppercase block mb-1">Address Label</label>
                                        <input placeholder="e.g. Home, Work" value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })} className="input-field w-full bg-[#151515] text-white p-3 border border-white/10 rounded" />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs uppercase block mb-1">Full Name</label>
                                        <input placeholder="Receiver's Name" value={newAddress.full_name} onChange={e => setNewAddress({ ...newAddress, full_name: e.target.value })} className="input-field w-full bg-[#151515] text-white p-3 border border-white/10 rounded" />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs uppercase block mb-1">Street Address</label>
                                        <input placeholder="House No, Street Area" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} className="input-field w-full bg-[#151515] text-white p-3 border border-white/10 rounded" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-white/60 text-xs uppercase block mb-1">City</label>
                                            <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="input-field w-full bg-[#151515] text-white p-3 border border-white/10 rounded" />
                                        </div>
                                        <div>
                                            <label className="text-white/60 text-xs uppercase block mb-1">State</label>
                                            <input placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="input-field w-full bg-[#151515] text-white p-3 border border-white/10 rounded" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-white/60 text-xs uppercase block mb-1">Zip Code</label>
                                            <input placeholder="Zip Code" value={newAddress.zip_code} onChange={e => setNewAddress({ ...newAddress, zip_code: e.target.value })} className="input-field w-full bg-[#151515] text-white p-3 border border-white/10 rounded" />
                                        </div>
                                        <div>
                                            <label className="text-white/60 text-xs uppercase block mb-1">Country</label>
                                            <input placeholder="Country" value={newAddress.country} onChange={e => setNewAddress({ ...newAddress, country: e.target.value })} className="input-field w-full bg-[#151515] text-white p-3 border border-white/10 rounded" />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <button type="button" onClick={() => {
                                            setShowAddressModal(false);
                                            setNewAddress({ label: 'Home', full_name: '', street: '', city: '', state: '', zip_code: '', country: 'India' });
                                            setMapPosition(null);
                                        }} className="flex-1 btn-outline py-3">Cancel</button>
                                        <button type="submit" className="flex-1 btn-primary py-3">Save Address</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0A0A0A] border-2 border-red-500/50 p-8 rounded-xl max-w-md w-full"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-red-500/20 p-3 rounded-lg">
                                    <X size={24} className="text-red-500" />
                                </div>
                                <h2 className="text-white font-bold text-xl">Delete Address?</h2>
                            </div>
                            <p className="text-white/60 mb-2">Are you sure you want to remove this address?</p>
                            <div className="bg-white/5 p-3 rounded-lg mb-6 border border-white/10">
                                <p className="text-white text-sm font-bold">{deleteConfirm.label}</p>
                                <p className="text-white/60 text-xs">{deleteConfirm.street}, {deleteConfirm.city}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 btn-outline py-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main Page ---
const ProfilePage = () => {
    const { user, setUser, API, triggerCartUpdate } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('orders');

    if (!user) return <div className="min-h-screen bg-[#050505] pt-32 text-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar */}
                    <div className="lg:w-64 space-y-2">
                        <div className="mb-8 p-4 bg-[#0A0A0A] border border-white/10 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                                <img src={user.picture} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Hello,</p>
                                <p className="text-white font-bold text-lg leading-none">{user.name}</p>
                            </div>
                        </div>

                        {[
                            { id: 'orders', label: 'Your Orders', icon: Package },
                            { id: 'addresses', label: 'Addresses', icon: MapPin },
                            { id: 'security', label: 'Login & Security', icon: Shield },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-white text-black font-bold'
                                    : 'text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <tab.icon size={18} />
                                    <span>{tab.label}</span>
                                </div>
                                {activeTab === tab.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {activeTab === 'orders' && <OrdersTab API={API} triggerCartUpdate={triggerCartUpdate} />}
                        {activeTab === 'addresses' && <AddressesTab API={API} user={user} />}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-white uppercase">Login & Security</h2>
                                <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-bold">Email</p>
                                        <p className="text-white/60 text-sm">{user.email}</p>
                                    </div>
                                    <button className="btn-outline px-4 py-2 text-sm">Edit</button>
                                </div>
                                <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-bold">Password</p>
                                        <p className="text-white/60 text-sm">********</p>
                                    </div>
                                    <button className="btn-outline px-4 py-2 text-sm">Change</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
