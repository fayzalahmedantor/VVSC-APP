import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, placeholder = "Select option", required, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => {
    if (typeof opt === 'object') return opt.value === value;
    return opt === value;
  });

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : '';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      {required && (
        <input 
          type="text" 
          value={value || ''} 
          required 
          onChange={() => {}} 
          tabIndex={-1}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} 
        />
      )}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: isOpen ? '1px solid var(--primary, #2D2A54)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: '12px',
          background: disabled ? 'rgba(0,0,0,0.02)' : 'var(--bg-main, #f8fafc)',
          color: displayValue ? 'var(--text-main, #1e293b)' : 'var(--text-muted, #64748b)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '15px',
          boxShadow: isOpen ? '0 0 0 4px color-mix(in srgb, var(--primary, #2D2A54) 15%, transparent)' : 'inset 0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s',
          userSelect: 'none',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
          {displayValue || placeholder}
        </span>
        <ChevronDown 
          size={18} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s',
            color: 'var(--text-muted, #64748b)',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '6px',
            boxSizing: 'border-box'
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '10px 12px', color: 'var(--text-muted, #64748b)', fontSize: '14px', fontStyle: 'italic', textAlign: 'center' }}>
              No options available
            </div>
          ) : (
            options.map((opt, i) => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const isSelected = optVal === value;

              return (
                <div 
                  key={i} 
                  onClick={() => handleSelect(optVal)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: isSelected ? 'white' : 'var(--text-main, #1e293b)',
                    background: isSelected 
                      ? 'linear-gradient(135deg, var(--primary, #2D2A54) 0%, var(--primary-light, #5A54A4) 100%)' 
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontWeight: isSelected ? '600' : 'normal',
                    marginBottom: i === options.length - 1 ? 0 : '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'color-mix(in srgb, var(--primary, #2D2A54) 6%, transparent)';
                      e.currentTarget.style.color = 'var(--primary, #2D2A54)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-main, #1e293b)';
                    }
                  }}
                >
                  {optLabel}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
