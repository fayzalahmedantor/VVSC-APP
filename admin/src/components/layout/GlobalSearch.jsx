import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Package } from 'lucide-react';
import { getCustomers } from '../../services/customerService';
import { getProducts } from '../../services/inventoryService';

const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custData, prodData] = await Promise.all([
        getCustomers(),
        getProducts()
      ]);
      setCustomers(custData);
      setProducts(prodData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const filteredCustomers = searchTerm ? customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm) || 
    c.imeiOrSerial?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5) : [];

  const filteredProducts = searchTerm ? products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5) : [];

  const handleSelectCustomer = (customer) => {
    onClose();
    navigate('/customers');
  };

  const handleSelectProduct = (product) => {
    onClose();
    navigate('/inventory');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', paddingTop: '80px',
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', 
          width: '90%', maxWidth: '600px', 
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '70vh'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <Search size={24} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            autoFocus
            placeholder="Search customers, phones, products, or serials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              flex: 1, border: 'none', background: 'transparent', 
              fontSize: '18px', padding: '8px 16px', color: 'var(--text-main)',
              outline: 'none'
            }}
          />
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '16px 24px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Loading data...</div>
          ) : searchTerm === '' ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Type something to search across the system...</div>
          ) : filteredCustomers.length === 0 && filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No results found for "{searchTerm}"</div>
          ) : (
            <>
              {filteredCustomers.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>Customers & Repairs</h4>
                  {filteredCustomers.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => handleSelectCustomer(c)}
                      style={{ 
                        display: 'flex', alignItems: 'center', padding: '12px', 
                        borderRadius: '8px', cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: 'rgba(0,0,0,0.02)',
                        marginBottom: '8px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e3f2fd', color: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                        <Users size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name} - {c.phone}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.brand} {c.deviceType} • {c.status} • {c.imeiOrSerial}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredProducts.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>Inventory Products</h4>
                  {filteredProducts.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleSelectProduct(p)}
                      style={{ 
                        display: 'flex', alignItems: 'center', padding: '12px', 
                        borderRadius: '8px', cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: 'rgba(0,0,0,0.02)',
                        marginBottom: '8px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e8f5e9', color: '#388e3c', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                        <Package size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name} {p.model}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.category} • {p.brand} • Stock: {p.stock} • Price: ৳{p.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
