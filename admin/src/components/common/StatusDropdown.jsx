import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const StatusDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const handleToggle = (e) => {
    // DO NOT use e.stopPropagation() here, otherwise clicking another dropdown won't close this one
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 150; // Approximate height of the menu
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let topPos = rect.bottom + window.scrollY + 4;
      
      // If there's not enough space below, open it upwards
      if (spaceBelow < menuHeight) {
        topPos = rect.top + window.scrollY - menuHeight - 4;
      }
      
      setCoords({
        top: topPos,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 110)
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // If they clicked the toggle button itself, let handleToggle handle it
      if (buttonRef.current && buttonRef.current.contains(e.target)) {
        return;
      }
      // If they clicked inside the portal menu, the onClick on the item will close it anyway,
      // but if we want to stop it closing when clicking empty space in the portal we could check it here.
      // For now, any click outside the button closes the menu.
      setIsOpen(false);
    };

    if (isOpen) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Received': return { bg: '#fff8e1', text: '#f57c00' };
      case 'Pending': return { bg: '#fff8e1', text: '#f57c00' }; // Keeping for backwards compatibility
      case 'Working': return { bg: '#e3f2fd', text: '#1976d2' };
      case 'Running': return { bg: '#e3f2fd', text: '#1976d2' }; // Keeping for backwards compatibility
      case 'Complete': return { bg: '#e8f5e9', text: '#388e3c' };
      case 'Delivery': return { bg: '#f3e5f5', text: '#8e24aa' }; // Purple style
      case 'Cancel': return { bg: '#ffebee', text: '#d32f2f' };
      default: return { bg: '#fff8e1', text: '#f57c00' };
    }
  };

  const currentStyle = getStatusStyle(value || 'Received');
  const options = ['Received', 'Working', 'Complete', 'Delivery', 'Cancel'];

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={handleToggle}
        style={{
          background: currentStyle.bg,
          color: currentStyle.text,
          border: 'none',
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '105px', // Fixed width so they are all the same size
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? `0 0 0 3px ${currentStyle.bg}` : 'none',
          outline: 'none'
        }}
      >
        <span>{value || 'Received'}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && createPortal(
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            background: 'var(--bg-card)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)',
            padding: '4px',
            zIndex: 99999, // Ensure it floats above everything
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {options.map(opt => {
            const optStyle = getStatusStyle(opt);
            return (
              <div 
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: optStyle.text,
                  background: value === opt ? optStyle.bg : 'transparent',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => { if(value !== opt) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
                onMouseLeave={(e) => { if(value !== opt) e.currentTarget.style.background = 'transparent' }}
              >
                {opt}
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default StatusDropdown;
