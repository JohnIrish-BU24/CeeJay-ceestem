import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplet, Trash2, Plus, LogOut, History, Settings, FileText, Tag, CheckCircle, Clock, ChevronLeft, Truck, PersonStanding, Info, MapPin, LayoutGrid, List, Search, User, ChevronDown } from 'lucide-react';

// 📍 Import your logo here!
import logoImg from '../assets/logo.png'; 

const API_BASE = 'http://localhost:5000/api';

// ─── Helpers ────────────────────────────────────────────────────────────────
const calcTotal = (qty, serviceType, promo) => {
  const price = serviceType === 'delivery' ? 35 : 30;
  let total = qty * price;
  if (promo === 'yes' && qty >= 10) total -= price;
  return total;
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// ─── Form Styles & Sub-components ───────────────────────────────────────────

const inputStyle = {
  border: '1px solid #cbe4f4',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
  color: '#102a43',
  background: '#f4f9fd',
  outline: 'none',
  transition: 'border 0.2s',
};

function RadioOption({ label, value, selected, onSelect, icon, disabled }) {
  return (
    <div
      onClick={() => { if (!disabled) onSelect(value); }}
      style={{
        flex: 1, minWidth: 130, boxSizing: 'border-box',
        border: `1px solid ${selected && !disabled ? '#1a7ab5' : '#cbe4f4'}`,
        borderRadius: '10px', padding: '10px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 9,
        fontSize: '14px', fontWeight: 600,
        color: disabled ? '#94a3b8' : (selected ? '#1a5c8a' : '#475569'),
        background: disabled ? '#f8fafc' : (selected ? '#eaf4fb' : '#ffffff'),
        userSelect: 'none', transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', boxSizing: 'border-box',
        border: `2px solid ${disabled ? '#cbe4f4' : (selected ? '#1a7ab5' : '#cbe4f4')}`,
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: disabled ? '#f1f5f9' : '#fff'
      }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: disabled ? '#94a3b8' : '#1a7ab5' }} />}
      </div>
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {label}
    </div>
  );
}

function SectionCard({ step, icon, title, children }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      
      /* 📍 UPDATED BORDER: Now matches the crisp, thin blue of your input boxes */
      border: '1px solid #cbe4f4',
      
      boxShadow: '0 6px 16px rgba(16, 42, 67, 0.03), 0 2px 4px rgba(16, 42, 67, 0.015)' 
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#102a43', fontSize: 18, fontWeight: 600,
        
        /* 📍 I also updated this divider line to match so the aesthetic stays 100% consistent! */
        borderBottom: '1px solid #cbe4f4', 
        
        paddingBottom: 12, marginBottom: 18,
      }}>
        <div style={{
          width: 28, height: 28, background: '#eaf4fb', color: '#1a7ab5',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0,
        }}>{step}</div>
        {icon && React.cloneElement(icon, { color: '#1a7ab5' })}
        {title} <span style={{ color: '#e04040' }}>*</span>
      </div>
      {children}
    </div>
  );
}

function FormGroup({ label, required, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', ...style }}>
      <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
        {label} {required && <span style={{ color: '#e04040' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Custom Aesthetic Dropdown ──────────────────────────────────────────────
// ─── Custom Premium Dropdown ──────────────────────────────────────────────
function CustomDropdown({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(o => o.value === value);

  // Helper function to extract initials (e.g., "Carlo Pineda" -> "CP")
  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      
      {/* 1. Main Input Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: `1px solid ${isOpen ? '#1a7ab5' : '#cbe4f4'}`,
          borderRadius: '10px', padding: '0 14px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f4f9fd', cursor: 'pointer',
          color: value ? '#102a43' : '#64748b', fontSize: '14px',
          fontWeight: value ? 600 : 500, boxSizing: 'border-box',
          transition: 'all 0.2s ease', 
          boxShadow: isOpen ? '0 0 0 3px rgba(26, 122, 181, 0.15)' : '0 2px 4px rgba(16, 42, 67, 0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar displayed in the closed box once selected */}
          {selectedOption && (
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1a7ab5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
              {getInitials(selectedOption.label)}
            </div>
          )}
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <ChevronDown size={18} color={isOpen ? "#1a7ab5" : "#6a9ab8"} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>

      {/* Invisible closing overlay */}
      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
      )}

      {/* 2. Floating Premium Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%',
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px',
          // Softer, deeper shadow for a floating effect
          boxShadow: '0 12px 30px -6px rgba(16, 42, 67, 0.15), 0 4px 6px -2px rgba(16, 42, 67, 0.05)', 
          zIndex: 50, maxHeight: '240px', overflowY: 'auto', padding: '8px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', gap: '4px' 
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>No refillers available</div>
          ) : (
            options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', borderRadius: '8px',
                    fontSize: '14px', color: isSelected ? '#1a5c8a' : '#334e68',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? '#eaf4fb' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { if (!isSelected) { e.currentTarget.style.background = '#f4f9fd'; e.currentTarget.style.color = '#102a43'; } }}
                  onMouseOut={(e) => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334e68'; } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    
                    {/* 3. The Avatar Circle */}
                    <div style={{ 
                      width: 28, height: 28, borderRadius: '50%', 
                      background: isSelected ? '#1a7ab5' : '#f1f5f9', 
                      color: isSelected ? '#fff' : '#64748b', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '11px', fontWeight: 700,
                      transition: 'all 0.2s'
                    }}>
                      {getInitials(opt.label)}
                    </div>
                    {opt.label}
                    
                  </div>
                  
                  {/* Checkmark for the active selection */}
                  {isSelected && <CheckCircle size={18} color="#1a7ab5" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Transaction Form Component ──────────────────────────────────────────────

function TransactionForm({ initial, onSubmit, onCancel, loading }) {
  
  // 📍 1. GET THE LOGGED-IN EMPLOYEE'S ROLE
  const storedUserData = localStorage.getItem('activeEmployee');
  const activeRole = storedUserData ? JSON.parse(storedUserData).role : '';
  const isRefiller = activeRole === 'R'; 
  const isDriver = activeRole === 'D'; // 📍 Added Driver Check

  // 📍 2. FETCH REFILLERS (For Drivers)
  const [refillerList, setRefillerList] = useState([]);
  useEffect(() => {
    if (isDriver) {
      const getRefillers = async () => {
        try {
          const res = await fetch(`${API_BASE}/employee/refillers`);
          if (res.ok) setRefillerList(await res.json());
        } catch (err) { console.error("Error fetching refillers:", err); }
      };
      getRefillers();
    }
  }, [isDriver]);

  // ─── 2. NEW STATES GO RIGHT AT THE TOP ──────────────────────────────────
  const [customerMode, setCustomerMode] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedContactCount, setLockedContactCount] = useState(0);

  // 📍 INDEPENDENT STATES
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [lastSuggestions, setLastSuggestions] = useState([]);
  const [isLastFocused, setIsLastFocused] = useState(false);

  const [firstSearchTerm, setFirstSearchTerm] = useState("");
  const [firstSuggestions, setFirstSuggestions] = useState([]);
  const [isFirstFocused, setIsFirstFocused] = useState(false);
  

  // ─── 3. YOUR EXISTING FORM STATE (Updated Service Type) ─────────────────
  const [form, setForm] = useState(initial || {
    custID: '',
    barangayID: '',
    lastName: '',
    firstName: '',
    purok: '',
    barangay: '', 
    customerType: 'Personal',
    contactNums: [''],
    serviceType: isDriver ? 'delivery' : 'walkin', 
    refillerEmpID: '',
    quantity: 1,
    promo: 'no',
    status: 'paid',
    total: 0 
  });

  // ─── 3. YOUR EXISTING HELPERS (Untouched) ───────────────────────────────
  const validatePhoneNumber = (num) => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(num);
  };

  const isPromo = form.quantity >= 10;
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const total = calcTotal(Number(form.quantity), form.serviceType, form.promo);
  
  const checkIDExists = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/check-customer/${id}`);
      const data = await res.json();
      if (data.exists) {
        alert("⚠️ Warning: This Customer ID already exists. Please create a different ID.");
        set('custID', ''); 
      }
    } catch (err) {
      console.error("Validation failed");
    }
  };

  const isNameValid = (str) => /^[a-zA-Z\s\-]*$/.test(str);
  const isNumber = (str) => /^\d*$/.test(str);


  // ─── 4. INDEPENDENT DATABASE SEARCH LOGIC ─────────────────────────
  
  // Last Name Search Effect
  useEffect(() => {
    if (customerMode !== 'existing' || !lastSearchTerm || lastSearchTerm.trim().length === 0) {
      setLastSuggestions([]); return;
    }
    const timer = setTimeout(async () => {
      // 📍 Directly querying the backend for Last Name
      const res = await fetch(`${API_BASE}/customer/search?lname=${encodeURIComponent(lastSearchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setLastSuggestions(data); 
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [lastSearchTerm, customerMode]);

  // First Name Search Effect
  useEffect(() => {
    if (customerMode !== 'existing' || !firstSearchTerm || firstSearchTerm.trim().length === 0) {
      setFirstSuggestions([]); return;
    }
    const timer = setTimeout(async () => {
      // 📍 Directly querying the backend for First Name
      const res = await fetch(`${API_BASE}/customer/search?fname=${encodeURIComponent(firstSearchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setFirstSuggestions(data); 
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [firstSearchTerm, customerMode]);

  // ─── 5. THE POP-UP CHOICE MODAL ───────────────────────────────────────────────
  if (!customerMode) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(10, 25, 41, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
      }}>
        
        <div style={{
          background: '#ffffff',
          padding: '40px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(16, 42, 67, 0.2)',
          textAlign: 'center',
          width: '380px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ color: '#0f172a', marginBottom: '8px', fontSize: '20px', fontWeight: 700 }}>
            Start a transaction
          </h2>
          <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>
            Choose how you would like to proceed.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* New Entry */}
            <button onClick={() => setCustomerMode('new')} 
              style={{ 
                padding: '16px 20px', borderRadius: '16px',
                border: '1px solid #e2e8f0', background: '#ffffff',
                display: 'flex', alignItems: 'center', gap: '16px',
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left'
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#1a7ab5'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '12px' }}>
                <Plus size={20} color="#1a7ab5" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>New Customer</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Register a customer manually</div>
              </div>
            </button>

            {/* Search Entry */}
            <button onClick={() => setCustomerMode('existing')} 
              style={{ 
                padding: '16px 20px', borderRadius: '16px',
                border: '1px solid #e2e8f0', background: '#ffffff',
                display: 'flex', alignItems: 'center', gap: '16px',
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left'
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#1a7ab5'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '12px' }}>
                <User size={20} color="#1a7ab5" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>Existing Customer</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Look up a customer record</div>
              </div>
            </button>
          </div>

          <button onClick={onCancel} 
            style={{ marginTop: '28px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>

      <style>
        {`
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
            appearance: textfield;
          }
        `}
      </style>

      {/* Section 1 */}
      <SectionCard step="1" icon={<User size={18} />} title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>Customer Information {customerMode === 'existing' && <span style={{fontSize: 12, color: '#1a7ab5', background: '#eaf4fb', padding: '2px 8px', borderRadius: 4, marginLeft: 8}}>Existing</span>}</span>
          
          {isLocked && (
            <button onClick={() => { 
              setIsLocked(false); 
              setLockedContactCount(0); 
              set('lastName', ''); 
              set('firstName', ''); 
              set('barangay', ''); 
              set('purok', ''); 
              set('contactNums', ['']); 
            }} style={{ fontSize: 12, background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              Clear selection
            </button>
          )}
        </div>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {/* 📍 SMART LAST NAME SEARCH FIELD (CONNECTED TO DB) */}
          {/* LAST NAME */}
          {/* LAST NAME */}
<FormGroup label="Last Name" required>
  <div style={{ position: 'relative' }}>
    <input 
      className="custom-input" 
      style={{ 
        ...inputStyle, 
        background: isLocked ? '#f8fafc' : (inputStyle.background || '#ffffff'), 
        color: isLocked ? '#94a3b8' : (inputStyle.color || '#102a43'),
        width: '100%',
        boxSizing: 'border-box'
      }} 
      placeholder="e.g. Dela Cruz" 
      value={form.lastName} 
      readOnly={isLocked}
      onFocus={() => setIsLastFocused(true)}
      onBlur={() => setTimeout(() => setIsLastFocused(false), 200)}
      onChange={e => {
        const val = e.target.value;
        if (isNameValid(val)) {
          set('lastName', toTitleCase(val));
          if (!isLocked) setLastSearchTerm(val);
        }
      }} 
    />
    
    {/* 📍 Added safeguard: form.lastName must have text */}
    {lastSuggestions.length > 0 && form.lastName.trim().length > 0 && !isLocked && isLastFocused && (
      <div style={{ 
        position: 'absolute', top: '100%', left: 0, width: '100%', 
        background: '#ffffff', border: '1px solid #cbe4f4', borderRadius: '0 0 10px 10px', 
        zIndex: 9999, boxShadow: '0 8px 24px rgba(16, 42, 67, 0.12)', 
        maxHeight: '180px', overflowY: 'auto' 
      }}>
        {lastSuggestions.map((c, i) => (
          <div key={i} onClick={() => {
            set('custID', c.Cust_ID); 
            set('barangayID', c.Barangay_ID);
            set('lastName', c.Cust_LName); 
            set('firstName', c.Cust_FName);
            set('barangay', c.Barangay_Name); 
            set('purok', c.Purok);
            set('customerType', c.Cust_Type);
            const dbContacts = c.Contact_Nums ? c.Contact_Nums.split(',') : [''];
            set('contactNums', dbContacts);
            setLockedContactCount(dbContacts[0] !== '' ? dbContacts.length : 0);
            
            setLastSearchTerm(""); 
            setLastSuggestions([]); 
            setIsLocked(true);
          }}
          style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, borderBottom: i === lastSuggestions.length - 1 ? 'none' : '1px solid #eaf4fb', background: '#ffffff', lineHeight: '1.6' }}
          onMouseOver={e => e.currentTarget.style.background = '#f4f9fd'}
          onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
            
            {/* 📍 Kept your exact format, but added color to differentiate the actively searched name */}
            <strong>(</strong>
            <span style={{ color: '#64748b', fontWeight: 'normal' }}>Last Name: </span>
            <span style={{ color: '#1a7ab5', fontWeight: 'bold' }}>{c.Cust_LName}</span>
            <span style={{ color: '#64748b', fontWeight: 'normal' }}>, First Name: </span>
            <span style={{ color: '#102a43', fontWeight: '600' }}>{c.Cust_FName}</span>
            <strong>)</strong>
            <span style={{ color: '#475569' }}>, {c.Barangay_Name}, Purok {c.Purok}</span>
            
          </div>
        ))}
      </div>
    )}
  </div>
</FormGroup>

{/* FIRST NAME */}
<FormGroup label="First Name" required>
  <div style={{ position: 'relative' }}>
    <input 
      className="custom-input" 
      style={{ 
        ...inputStyle, 
        background: isLocked ? '#f8fafc' : (inputStyle.background || '#ffffff'), 
        color: isLocked ? '#94a3b8' : (inputStyle.color || '#102a43'),
        width: '100%',
        boxSizing: 'border-box'
      }} 
      placeholder="e.g. Juan" 
      value={form.firstName} 
      readOnly={isLocked}
      onFocus={() => setIsFirstFocused(true)}
      onBlur={() => setTimeout(() => setIsFirstFocused(false), 200)}
      onChange={e => {
        const val = e.target.value;
        if (isNameValid(val)) {
          set('firstName', toTitleCase(val));
          if (!isLocked) setFirstSearchTerm(val);
        }
      }} 
    />
    
    {/* 📍 Added safeguard: form.firstName must have text */}
    {firstSuggestions.length > 0 && form.firstName.trim().length > 0 && !isLocked && isFirstFocused && (
      <div style={{ 
        position: 'absolute', top: '100%', left: 0, width: '100%', 
        background: '#ffffff', border: '1px solid #cbe4f4', borderRadius: '0 0 10px 10px', 
        zIndex: 9999, boxShadow: '0 8px 24px rgba(16, 42, 67, 0.12)', 
        maxHeight: '180px', overflowY: 'auto' 
      }}>
        {firstSuggestions.map((c, i) => (
          <div key={i} onClick={() => {
            set('custID', c.Cust_ID); 
            set('barangayID', c.Barangay_ID);
            set('lastName', c.Cust_LName); 
            set('firstName', c.Cust_FName);
            set('barangay', c.Barangay_Name); 
            set('purok', c.Purok);
            set('customerType', c.Cust_Type);
            const dbContacts = c.Contact_Nums ? c.Contact_Nums.split(',') : [''];
            set('contactNums', dbContacts);
            setLockedContactCount(dbContacts[0] !== '' ? dbContacts.length : 0);
            
            setFirstSearchTerm(""); 
            setFirstSuggestions([]); 
            setIsLocked(true);
          }}
          style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 13, borderBottom: i === firstSuggestions.length - 1 ? 'none' : '1px solid #eaf4fb', background: '#ffffff', lineHeight: '1.6' }}
          onMouseOver={e => e.currentTarget.style.background = '#f4f9fd'}
          onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
            
            {/* 📍 Kept your exact format, but highlighted First Name in blue */}
            <strong>(</strong>
            <span style={{ color: '#64748b', fontWeight: 'normal' }}>First Name: </span>
            <span style={{ color: '#1a7ab5', fontWeight: 'bold' }}>{c.Cust_FName}</span>
            <span style={{ color: '#64748b', fontWeight: 'normal' }}>, Last Name: </span>
            <span style={{ color: '#102a43', fontWeight: '600' }}>{c.Cust_LName}</span>
            <strong>)</strong>
            <span style={{ color: '#475569' }}>, {c.Barangay_Name}, Purok {c.Purok}</span>
            
          </div>
        ))}
      </div>
    )}
  </div>
</FormGroup>

          {/* Barangay */}
          <FormGroup label="Barangay" required>
            <input 
              className="custom-input" 
              style={{ 
                ...inputStyle, 
                background: isLocked ? '#f8fafc' : inputStyle.background, 
                color: isLocked ? '#94a3b8' : inputStyle.color 
              }} 
              placeholder="e.g. Dinoronan" 
              value={form.barangay} 
              readOnly={isLocked}
              onChange={e => {
                const val = e.target.value;
                if (isNameValid(val)) set('barangay', toTitleCase(val));
              }} 
            />
          </FormGroup>

          {/* Purok */}
          <FormGroup label="Purok" required>
            <input 
              className="custom-input" 
              style={{ 
                ...inputStyle, 
                background: isLocked ? '#f8fafc' : inputStyle.background, 
                color: isLocked ? '#94a3b8' : inputStyle.color 
              }} 
              placeholder="e.g. 1" 
              value={form.purok} 
              readOnly={isLocked}
              onChange={e => {
                const val = e.target.value;
                if (isNumber(val)) set('purok', val);
              }} 
            />
          </FormGroup>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          <FormGroup label="Customer Type" required>
            <div style={{ display: 'flex', gap: 10 }}>
              <RadioOption 
                label="Personal" 
                value="Personal" 
                selected={form.customerType === 'Personal'} 
                onSelect={v => set('customerType', v)} 
                disabled={isLocked} // 📍 Locks when an existing customer is selected
              />
              <RadioOption 
                label="Reseller" 
                value="Reseller" 
                selected={form.customerType === 'Reseller'} 
                onSelect={v => set('customerType', v)} 
                disabled={isLocked} // 📍 Locks when an existing customer is selected
              />
            </div>
          </FormGroup>

          {/* CONTACT NUMBER */}
          <FormGroup label="Contact Number(s)" required>
            {form.contactNums.map((num, index) => {
              // 1. Determine if this specific box is locked
              const isContactLocked = isLocked && index < lockedContactCount;
              
              // 2. Calculate error regardless of lock state
              let errorMsg = null;
              if (num.length > 0 && !isContactLocked) {
                if (num[0] !== '0' || (num.length >= 2 && !num.startsWith('09'))) {
                  errorMsg = "Invalid: Must start with '09'";
                } else if (num.length < 11) {
                  errorMsg = `Incomplete: Need ${11 - num.length} more digits`;
                }
              }

              return (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                    <input 
                      className="custom-input"
                      style={{ 
                        ...inputStyle, flex: 1, margin: 0,
                        borderColor: errorMsg ? '#ef4444' : '#cbe4f4', 
                        background: isContactLocked ? '#f8fafc' : (errorMsg ? '#fef2f2' : '#f4f9fd'),
                        color: isContactLocked ? '#94a3b8' : '#102a43'
                      }} 
                      placeholder="09xxxxxxxxx" 
                      value={num}
                      readOnly={isContactLocked}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isNumber(val) && val.length <= 11) {
                          const newNums = [...form.contactNums];
                          newNums[index] = val;
                          set('contactNums', newNums);
                        }
                      }} 
                    />
                    
                    {/* Add/Remove Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {index === form.contactNums.length - 1 && (
                        <button type="button" onClick={() => set('contactNums', [...form.contactNums, ''])} 
                          style={{ width: 44, borderRadius: '10px', border: '1px solid #cbe4f4', background: '#eaf4fb', cursor: 'pointer' }}>
                          <Plus size={20} color="#1a7ab5" />
                        </button>
                      )}
                      {!isContactLocked && index > 0 && (
                        <button type="button" onClick={() => { const newNums = form.contactNums.filter((_, i) => i !== index); set('contactNums', newNums); }} 
                          style={{ width: 44, borderRadius: '10px', border: '1px solid #fecaca', background: '#fee2e2', cursor: 'pointer' }}>
                          <Trash2 size={18} color="#ef4444" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Render the warning message directly below the input */}
                  {errorMsg && (
                    <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Info size={14} /> {errorMsg}
                    </div>
                  )}
                </div>
              );
            })}
          </FormGroup>
        </div>
      </SectionCard>

      {/* Section 2 */}
      <SectionCard step="2" icon={<Settings size={18} />} title="Service Details">
        
        {/* 📍 USING A GRID FOR PERFECT ALIGNMENT */}
        <div style={{ display: 'grid', gridTemplateColumns: isDriver ? '2fr 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Column 1: Radio Buttons now have a matching label */}
          <FormGroup label="Transaction Type" required style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 10, height: '44px' }}>
              <RadioOption 
                label="Walk-in (₱30.00)" 
                value="walkin" 
                selected={form.serviceType === 'walkin'} 
                onSelect={v => set('serviceType', v)} 
                icon={<PersonStanding size={18} />} 
                disabled={isDriver} 
              />
              <RadioOption 
                label="Delivery (₱35.00)" 
                value="delivery" 
                selected={form.serviceType === 'delivery'} 
                onSelect={v => set('serviceType', v)} 
                icon={<Truck size={18} />} 
                disabled={isRefiller} 
              />
            </div>
          </FormGroup>

          {/* Column 2: Refiller Dropdown */}
          {isDriver && (
            <FormGroup label="Assigned Refiller" required style={{ marginBottom: 0 }}>
              <CustomDropdown
                value={form.refillerEmpID}
                onChange={(val) => set('refillerEmpID', val)}
                placeholder="Select Refiller..."
                options={refillerList.map(r => ({
                  value: r.Emp_ID,
                  label: `${r.Emp_FName} ${r.Emp_LName}`
                }))}
              />
            </FormGroup>
          )}
          
        </div>
        
        {/* Dynamic Warning Message */}
        {(isRefiller || isDriver) && (
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '8px 12px', borderRadius: 8 }}>
            <Info color="#1a7ab5" size={14} /> 
            {isRefiller ? 'Refillers are restricted to Walk-in transactions.' : 'Drivers are restricted to Delivery transactions.'}
          </div>
        )}
      </SectionCard>

      {/* 📍 SIDE-BY-SIDE WRAPPER FOR SECTIONS 3 & 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Section 3 */}
        <SectionCard step="3" icon={<FileText size={18} />} title="Transaction Details">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <FormGroup label="Quantity" required style={{ maxWidth: 400 }}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <button type="button" onClick={() => set('quantity', Math.max(1, Number(form.quantity) - 1))}
                  style={{ width: 42, height: 44, boxSizing: 'border-box', margin: 0, border: '1px solid #cbe4f4', borderRadius: '10px 0 0 10px', background: '#eaf4fb', color: '#1a7ab5', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>−</button>
                <input type="number" value={form.quantity} min={1}
                  onChange={e => set('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: 100, height: 44, boxSizing: 'border-box', margin: 0, padding: 0, borderTop: '1px solid #cbe4f4', borderBottom: '1px solid #cbe4f4', borderLeft: 'none', borderRight: 'none', textAlign: 'center', fontSize: 15, fontWeight: 600, background: '#f4f9fd', color: '#102a43', outline: 'none' }} />
                <button type="button" onClick={() => set('quantity', Number(form.quantity) + 1)}
                  style={{ width: 42, height: 44, boxSizing: 'border-box', margin: 0, border: '1px solid #cbe4f4', borderRadius: '0 10px 10px 0', background: '#eaf4fb', color: '#1a7ab5', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>+</button>
              </div>
            </FormGroup>
            
            <FormGroup 
              required 
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Promo
                  <div className="info-tooltip-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Info size={15} color="#94a3b8" style={{ marginTop: '1px' }} />
                    <span className="tooltip-text">
                      Promo is auto-applied when quantity is 10 or greater (Get 1 free container).
                    </span>
                  </div>
                </span>
              }
            >
              <div style={{ height: 44, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '10px', fontSize: 14, fontWeight: 600, background: isPromo ? '#dcfce7' : '#f4f9fd', border: `1px solid ${isPromo ? '#bbf7d0' : '#cbe4f4'}`, color: isPromo ? '#15803d' : '#6a9ab8', transition: '0.2s' }}>
                {isPromo ? 'Promo Applied' : 'No Promo Applied'}
              </div>
            </FormGroup>
          </div>
        </SectionCard>

        {/* Section 4 */}
        <SectionCard step="4" icon={<Tag size={18} />} title="Payment">
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            
            <FormGroup label="Total Amount" style={{ flex: 1 }}>
              <div style={{ border: '1px solid #cbe4f4', borderRadius: '10px', padding: '0 16px', fontSize: 15, fontWeight: 700, color: '#102a43', background: '#f4f9fd', height: 44, boxSizing: 'border-box', display: 'flex', alignItems: 'center' }}>
                ₱{total.toFixed(2)}
              </div>
            </FormGroup>
            
            <FormGroup label="Status" required>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ borderColor: form.status === 'paid' ? '#bbf7d0' : '#cbe4f4', backgroundColor: form.status === 'paid' ? '#dcfce7' : '#ffffff', color: form.status === 'paid' ? '#15803d' : '#6a9ab8', borderWidth: '1px', borderStyle: 'solid', padding: '0 16px', height: 44, boxSizing: 'border-box', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: '0.2s' }}>
                  <input type="radio" checked={form.status === 'paid'} onChange={() => set('status', 'paid')} style={{ display: 'none' }} />
                  <CheckCircle size={18} style={{ marginRight: 8 }} /> Paid
                </label>
                
                <label style={{ borderColor: form.status === 'unpaid' ? '#fecaca' : '#cbe4f4', backgroundColor: form.status === 'unpaid' ? '#fee2e2' : '#ffffff', color: form.status === 'unpaid' ? '#b91c1c' : '#6a9ab8', borderWidth: '1px', borderStyle: 'solid', padding: '0 16px', height: 44, boxSizing: 'border-box', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: '0.2s' }}>
                  <input type="radio" checked={form.status === 'unpaid'} onChange={() => set('status', 'unpaid')} style={{ display: 'none' }} />
                  <Clock size={18} style={{ marginRight: 8 }} /> Unpaid
                </label>
              </div>
            </FormGroup>

          </div>
        </SectionCard>

      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        
        {onCancel && (
          <button 
            onClick={onCancel} 
            type="button" 
            style={{
              flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: '#f4f9fd', color: '#1a3a5a', border: '1px solid #b8d6ea', borderRadius: '10px', 
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 6px rgba(16, 42, 67, 0.04)' 
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#eaf4fb'; 
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(16, 42, 67, 0.08)'; 
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#f4f9fd'; 
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 42, 67, 0.04)';
            }}
          >
            Cancel
          </button>
        )}

        <button 
          /* 📍 THE VALIDATION LOGIC IS INSERTED HERE */
          onClick={() => {
            if (isDriver && !form.refillerEmpID) {
              alert("Please select the Refiller who prepared these containers.");
              return;
            }
            onSubmit({ ...form, total });
          }} 
          type="button" 
          disabled={loading} 
          style={{
            flex: 3, padding: '14px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            background: '#2a7ab5', color: '#fff', border: 'none', borderRadius: '10px',
            opacity: loading ? 0.7 : 1, 
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 6px 16px rgba(42, 122, 181, 0.15)' 
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#256b9e'; 
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(42, 122, 181, 0.25)'; 
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#2a7ab5'; 
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 122, 181, 0.15)';
            }
          }}
        >
          {loading ? 'Submitting…' : 'Submit Transaction'}
        </button>
        
      </div>
    </div>
  );
}

// ─── Transaction Card Component (For Grid View) ────────────────────────────
const TransactionCard = ({ tx, onDelete }) => {
  const isReseller = tx.Cust_Type?.toLowerCase() === 'reseller';
  const isDelivery = tx.Serv_Name?.toLowerCase() === 'delivery';

  return (
    <div style={{ 
      background: '#fff', border: '1px solid #eaf4fb', borderRadius: '16px', padding: '20px', 
      display: 'flex', flexDirection: 'column', gap: '16px', 
      boxShadow: '0 4px 12px rgba(16, 42, 67, 0.03)', transition: 'transform 0.2s', cursor: 'default' 
    }}
    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseOut={e => e.currentTarget.style.transform = 'none'}>
      
      {/* Header: Name & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#102a43' }}>
            {tx.Cust_LName || tx.Cust_FName ? [tx.Cust_LName, tx.Cust_FName].filter(Boolean).join(', ') : 'Walk-in Customer'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MapPin size={12} /> {[tx.Purok ? `Purok ${tx.Purok}` : '', tx.Barangay_Name].filter(Boolean).join(', ') || 'No Address'}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: tx.Remarks === 'Paid' ? '#dcfce7' : '#fee2e2', color: tx.Remarks === 'Paid' ? '#15803d' : '#b91c1c' }}>
          {tx.Remarks || 'Unpaid'}
        </span>
      </div>

      {/* Middle: Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tx.Cust_Type && <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6, background: isReseller ? '#fffcdd' : '#eaf1fe', color: isReseller ? '#a58501' : '#0043d3' }}>{tx.Cust_Type}</span>}
        <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6, background: isDelivery ? '#f3e8ff' : '#fff3e0', color: isDelivery ? '#581c87' : '#e65100' }}>{tx.Serv_Name}</span>
        {tx.Contact_Num && <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569' }}>{tx.Contact_Num}</span>}
      </div>

      {/* Footer: Qty, Total, Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 16, borderTop: '1px dashed #e2e8f0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Amount ({tx.Quantity} qty)</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1a7ab5' }}>₱{Number(tx.Selling_Price || 0).toFixed(2)}</span>
          {tx.Borrowed_Qty > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#e65100' }}>{tx.Borrowed_Qty} owed containers</span>}
        </div>
        
        <button onClick={() => onDelete(tx.Trans_ID)} style={{ background: '#fee2e2', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', color: '#d32f2f', transition: '0.2s' }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// ─── Transaction Row Component ──────────────────────────────────────────────

const TransactionRow = ({ tx, onEdit, onDelete }) => {
  const isReseller = tx.Cust_Type?.toLowerCase() === 'reseller';
  const isDelivery = tx.Serv_Name?.toLowerCase() === 'delivery';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderBottom: '1px solid #eaf4fb' }}>
      
      {/* 1. CUSTOMER */}
      <div style={{ flex: 1.5, minWidth: 140, textAlign: 'center', fontSize: 14, color: '#102a43', fontWeight: 600 }}>
        {tx.Cust_LName || tx.Cust_FName 
          ? [tx.Cust_LName, tx.Cust_FName].filter(Boolean).join(', ')
          : 'Walk-in Customer'}
      </div>

      {/* 2. CUSTOMER TYPE */}
      <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center' }}>
        {tx.Cust_Type && (
          <span style={{ 
            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, textTransform: 'capitalize',
            background: isReseller ? '#fffcdd' : '#eaf1fe', 
            color: isReseller ? '#a58501' : '#0043d3',      
            border: `1px solid ${isReseller ? '#f1cc35' : '#b2bdee'}`
          }}>
            {tx.Cust_Type}
          </span>
        )}
      </div>

      {/* 3. ADDRESS */}
      <div style={{ flex: 1.5, minWidth: 140, fontSize: 13, color: '#486581', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {(tx.Purok || tx.Barangay_Name) ? (
          <>
            <MapPin size={14} color="#82a5bc" style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {[tx.Purok ? `Purok ${tx.Purok}` : '', tx.Barangay_Name].filter(Boolean).join(', ')}
            </span>
          </>
        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
      </div>

      {/* 4. CONTACT */}
      <div style={{ flex: 1.2, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {tx.Contact_Nums ? (
          tx.Contact_Nums.split(',').map((num, index) => (
            <span 
              key={index} 
              style={{ 
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, 
                background: '#eaf4fb', color: '#1a5c8a', border: '1px solid #b8d6ea', 
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block'
              }}
            >
              {num.trim()}
            </span>
          ))
        ) : (
          <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>
        )}
      </div>

      {/* 5. SERVICE TYPE */}
      <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center' }}>
        <span style={{ 
            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
            background: isDelivery ? '#f3e8ff' : '#fff3e0', 
            color: isDelivery ? '#581c87' : '#e65100',
            border: `1px solid ${isDelivery ? '#d8b4fe' : '#fdba74'}`
          }}>
          {tx.Serv_Name}
        </span>
      </div>

      {/* 6. QUANTITY */}
      <div style={{ flex: 0.5, minWidth: 60, textAlign: 'center', fontSize: 14, fontWeight: 500, color: '#486581' }}>
        {tx.Quantity}
      </div>

      {/* 7. AMOUNT */}
      <div style={{ flex: 0.7, minWidth: 80, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#102a43' }}>
        ₱{Number(tx.Selling_Price || 0).toFixed(2)}
      </div>

      {/* 8. STATUS */}
      <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center' }}>
        <span style={{ 
          fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20, 
          background: tx.Remarks === 'Paid' ? '#dcfce7' : '#fee2e2', 
          color: tx.Remarks === 'Paid' ? '#15803d' : '#b91c1c',      
          border: `1px solid ${tx.Remarks === 'Paid' ? '#bbf7d0' : '#fecaca'}` 
        }}>
          {tx.Remarks || 'Unpaid'}
        </span>
      </div>

      {/* 9. ACTIONS */}
      <div style={{ flex: 0.7, minWidth: 80, display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button 
          onClick={() => onDelete(tx.Trans_ID)} 
          style={{ 
            background: '#fff', border: '1px solid #ffcdd2', borderRadius: 6, 
            cursor: 'pointer', padding: '6px 8px', display: 'flex', 
            alignItems: 'center', color: '#d32f2f', transition: '0.2s' 
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>

    </div>
  );
};


// ─── Main Dashboard Component ──────────────────────────────────────────────────

export default function EmployeeDashboard({ onSignOut, refiller = 'Refiller' }) {
  const [view, setView] = useState('transactions'); 
  const [layout, setLayout] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState('');

  const storedUserData = localStorage.getItem('activeEmployee');
  const activeEmployee = storedUserData ? JSON.parse(storedUserData) : null;

  let roleLabel = "Employee";
  let RoleIcon = User;

  if (activeEmployee?.role === 'R') {
    roleLabel = "Refiller";
    RoleIcon = Droplet;
  } else if (activeEmployee?.role === 'D') {
    roleLabel = "Driver";
    RoleIcon = Truck;
  }

  // Combined useEffect for both the Clock and the Body Margins
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const prev = document.body.style.cssText;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    return () => { 
      clearInterval(timer); 
      document.body.style.cssText = prev; 
    };
  }, []);

  // ── Fetch today's transactions ──
  const fetchToday = async () => {
    setLoadingList(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/transaction/today`);
      if (!res.ok) throw new Error('Failed to load transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchToday(); }, []);

  // ── Submit new transaction ──
  const handleSubmit = async (formData) => {
    const storedUserData = localStorage.getItem('activeEmployee');
    if (!storedUserData) {
        alert("Error: No user logged in. Please return to the login screen.");
        return; 
    }
    const activeEmployee = JSON.parse(storedUserData);

    // 1. Generate Transaction Details
    const generatedTransID = Math.floor(10000 + Math.random() * 90000);
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19).replace('T', ' ');
    
    // 2. Build the Payload
    const payload = {
      Trans_ID: generatedTransID,
      Trans_Date: localTime,
      Remarks: formData.status.charAt(0).toUpperCase() + formData.status.slice(1), 
      empID: activeEmployee.id,       
      roleID: activeEmployee.role,
      refillerEmpID: formData.refillerEmpID, 
      
      // 📍 CUSTOMER DETAILS (If existing, formData.custID is passed here. If new, it generates one)
      customer: {
        Cust_ID: formData.custID || 'C' + Math.random().toString(36).substring(2, 6).toUpperCase(), 
        Barangay_ID: formData.barangayID || null, 
        Barangay_Name: formData.barangay, 
        Purok: formData.purok,
        Cust_LName: formData.lastName,
        Cust_FName: formData.firstName,
        Cust_Type: formData.customerType,
        Contact_Nums: formData.contactNums.filter(n => n.trim() !== '')
      },
      
      // 📍 ITEM DETAILS
      items: [{
        Trans_Detail_ID: generatedTransID + 1,
        
        // 📍 THE FIX: Swap the 2 and 1 here so it matches your specific database!
        Serv_ID: formData.serviceType === 'delivery' ? 2 : 1,
        
        Quantity: Number(formData.quantity),
        Selling_Price: Number(formData.total),
        Promo: formData.quantity >= 10 ? 'Yes' : 'No'
      }]
    };

    try {
      await axios.post(`${API_BASE}/transaction`, payload);
      alert('Transaction successful!');
      setView('transactions');
      fetchToday(); 
    } catch (error) {
      console.error("Submission failed:", error);
      alert('Transaction failed. Check console for details.');
    }
  };

  // ── Update existing transaction ──
  const handleUpdate = async (form) => {
    setFormLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transaction/${editTarget.Trans_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update transaction');
      await fetchToday();
      setView('transactions');
      setEditTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete transaction ──
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      const res = await fetch(`${API_BASE}/transaction/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTransactions(prev => prev.filter(t => t.Trans_ID !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (tx) => {
    setEditTarget(tx);
    setView('edit');
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear your auth token
    window.location.href = '/login';   // Redirect to login page
  };

  // 📍 THE SEARCH FILTER LOGIC
  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true; // If search is empty, show everything
    
    const query = searchQuery.toLowerCase();
    const fullName = `${tx.Cust_FName || ''} ${tx.Cust_LName || ''}`.toLowerCase();
    
    // Safely grab the contact number (Checking both Path A and Path B formats)
    const contact = (tx.Contact_Nums || tx.Contact_Num || '').toLowerCase();
    
    return fullName.includes(query) || contact.includes(query);
  });


  return (
    <div style={{ background: '#dceef8', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', width: '100%', boxSizing: 'border-box', margin: 0, padding: 0 }}>
      
      {/* ── Top Bar ── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        background: '#102a43', 
        padding: '10px 28px', // Trims the top and bottom fat
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
      }}>
        
        {/* LOGO AND BRANDING */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img 
            src={logoImg} 
            alt="CeeStem Logo"
            style={{ 
              width: 44, height: 44, 
              objectFit: 'contain', 
              transform: 'scale(1.1)', 
              transformOrigin: 'center' 
            }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.1 }}>
              CeeStem
            </div>
            <div style={{ color: '#62b0e8', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Water Refilling
            </div>
          </div>
        </div>
        

        {/* 📍 RIGHT SIDE: BADGE, SEARCH, AND TOGGLES */}
        {/* 📍 ADDED: alignItems: 'center' to this parent wrapper so everything stays perfectly leveled */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          
          {/* Dynamic Role Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', 
            height: '38px', boxSizing: 'border-box',
            
            /* 📍 UNIFIED COLORS: Matches the search bar exactly */
            border: '1px solid rgba(255, 255, 255, 0.15)', 
            backgroundColor: 'rgba(255, 255, 255, 0.08)', 
            
            borderRadius: '999px', color: '#f8fafc'
          }}>
            <RoleIcon size={16} color="#7cc4fa" /> 
            <span style={{ fontSize: '13.5px', fontWeight: 600, letterSpacing: '0.5px' }}>
              {roleLabel}
            </span>
          </div>
          
          {/* DARK THEMED SEARCH BAR */}
          {view === 'transactions' && (
            <div style={{ 
              display: 'flex', alignItems: 'center', padding: '0 16px', width: '280px',
              
              /* 📍 ADDED: boxSizing to prevent the borders from adding extra height */
              height: '38px', boxSizing: 'border-box', 
              
              /* 📍 UNIFIED COLORS: Matches the badge exactly */
              border: '1px solid rgba(255, 255, 255, 0.15)', 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              
              borderRadius: '30px', transition: '0.2s' 
            }}>
              <Search size={16} color="#90cdf4" />
              <input
                type="text"
                placeholder="Search customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  border: 'none', background: 'transparent', outline: 'none', 
                  marginLeft: '8px', fontSize: '13px', 
                  width: '100%', color: '#ffffff' 
                }}
              />
            </div>
          )}

          {/* THE NEW TOGGLE (Replaces the old History button) */}
          {view === 'transactions' && (
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setLayout('table')} style={{ background: layout === 'table' ? '#62b0e8' : 'transparent', color: layout === 'table' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: '0.2s' }}>
                <List size={18} />
              </button>
              <button onClick={() => setLayout('card')} style={{ background: layout === 'card' ? '#62b0e8' : 'transparent', color: layout === 'card' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: '0.2s' }}>
                <LayoutGrid size={18} />
              </button>
            </div>
          )}
          
        </div>
      </div>
      

      {/* ── Content ── */}
      <div style={{ padding: 24 }}>

        {/* Page Header */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          marginBottom: 24, background: '#ffffff', padding: '20px 28px', 
          borderRadius: '16px', boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)', border: '1px solid #eaf4fb' 
        }}>
          {view === 'transactions' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: '#eaf4fb', width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbe4f4', boxShadow: '0 2px 8px rgba(26, 92, 138, 0.05)' }}>
                  <FileText size={24} color="#1a7ab5" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ color: '#102a43', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Today's Transactions</div>
                  <div style={{ color: '#627d98', fontSize: 13, fontWeight: 500 }}>Monitor your daily sales and deliveries</div>
                </div>
              </div>
              <div style={{ background: '#f4f9fd', padding: '8px 16px', borderRadius: '30px', color: '#1a5c8a', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: 0.3 }}>
                <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)' }}></div>
                <Clock size={16} color="#6a9ab8" />
                {currentTime ? currentTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) : 'Loading...'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: '#eaf4fb', width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbe4f4', boxShadow: '0 2px 8px rgba(26, 92, 138, 0.05)' }}>
                <Plus size={24} color="#1a7ab5" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ color: '#102a43', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
                  {view === 'edit' ? 'Edit Transaction' : 'New Transaction'}
                </div>
                <div style={{ color: '#627d98', fontSize: 13, fontWeight: 500 }}>
                  {view === 'edit' ? 'Update customer and service details' : 'Record a new water refill or delivery'}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            {view === 'transactions' && (
              <button onClick={() => setView('new')} style={{ background: '#2a7ab5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 10px rgba(42, 122, 181, 0.2)', transition: 'all 0.2s' }}>
                <Plus size={18} strokeWidth={2.5} /> New Transaction
              </button>
            )}
            
            {view !== 'transactions' && (
              <button onClick={() => { setView('transactions'); setEditTarget(null); }} style={{ background: '#f4f9fd', color: '#1a3a5a', border: '1px solid #b8d6ea', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                <ChevronLeft size={18} strokeWidth={2.5} /> Back
              </button>
            )}
            <button 
              onClick={handleLogout} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: 'none', 
                background: '#fff5f5', 
                color: '#e53e3e', 
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              <LogOut size={16} /> {/* Ensure you have this icon imported */}
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Views ── */}
        
        {/* 📍 NEW & EDIT FORM WRAPPER */}
        {(view === 'new' || (view === 'edit' && editTarget)) && (
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '16px', 
            border: '1px solid #eaf4fb', 
            boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)', 
            padding: '32px',
            boxSizing: 'border-box'
          }}>
            {view === 'new' ? (
              <TransactionForm onSubmit={handleSubmit} onCancel={() => setView('transactions')} loading={formLoading} />
            ) : (
              <TransactionForm
                initial={{
                  custID: editTarget.Cust_ID || '',
                  lastName: editTarget.Cust_LName || '',
                  firstName: editTarget.Cust_FName || '',
                  barangay: editTarget.Barangay_Name || '',
                  purok: editTarget.Purok || '',
                  customerType: editTarget.Cust_Type || 'Personal',
                  contactNums: editTarget.Contact_Nums ? editTarget.Contact_Nums.split(', ') : [''],
                  serviceType: editTarget.Serv_Name?.toLowerCase() === 'delivery' ? 'delivery' : 'walkin',
                  quantity: editTarget.Quantity || 1,
                  promo: editTarget.Quantity >= 10 ? 'yes' : 'no',
                  status: editTarget.Remarks?.toLowerCase() === 'paid' ? 'paid' : 'unpaid',
                }}
                onSubmit={handleUpdate}
                onCancel={() => { setView('transactions'); setEditTarget(null); }}
                loading={formLoading}
              />
            )}
          </div>
        )}

        {/* 📍 TRANSACTIONS TABLE WRAPPER */}
        {/* 📍 TRANSACTIONS LIST WRAPPER */}
        {view === 'transactions' && (
          <div style={{ background: layout === 'table' ? '#ffffff' : 'transparent', borderRadius: '16px', border: layout === 'table' ? '1px solid #eaf4fb' : 'none', boxShadow: layout === 'table' ? '0 4px 16px rgba(16, 42, 67, 0.04)' : 'none', overflow: 'hidden' }}>
            
            {loadingList && <div style={{ padding: 32, textAlign: 'center', color: '#6a9ab8', fontSize: 14 }}>Loading transactions…</div>}
            {error && <div style={{ padding: 20, color: '#e04040', fontSize: 14, textAlign: 'center' }}>{error}</div>}
            {!loadingList && !error && transactions.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#6a9ab8', fontSize: 14, background: '#fff', borderRadius: 16 }}>No transactions recorded today.</div>}
            
            {/* TABLE LAYOUT */}
            
            {!loadingList && transactions.length > 0 && layout === 'table' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: '#f4f7fa', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ flex: 1.5, minWidth: 140, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Customer</div>
                  <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Type</div>
                  <div style={{ flex: 1.5, minWidth: 140, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Address</div>
                  <div style={{ flex: 1.2, minWidth: 120, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Contact</div>
                  <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Service</div>
                  <div style={{ flex: 0.5, minWidth: 60, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Qty</div>
                  <div style={{ flex: 0.7, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Amount</div>
                  <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ flex: 0.7, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Actions</div>
                </div>
                {filteredTransactions.map(tx => <TransactionRow key={tx.Trans_ID} tx={tx} onEdit={startEdit} onDelete={handleDelete} />)}
              </>
            )}

            {/* 📍 MESSAGE IF SEARCH FINDS NOTHING */}
            {!loadingList && transactions.length > 0 && filteredTransactions.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#6a9ab8', fontSize: 14, background: '#fff', borderRadius: 16 }}>
                No customers found matching "{searchQuery}"
              </div>
            )}

            {/* CARD LAYOUT */}
            {!loadingList && transactions.length > 0 && layout === 'card' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                
                {/* 📍 FIX: Ensure this says TransactionCard, not TransactionRow! */}
                {filteredTransactions.map(tx => (
                  <TransactionCard key={tx.Trans_ID} tx={tx} onDelete={handleDelete} />
                ))}

              </div>
            )}
          </div>
        )}

      </div> 
    </div>
  );
}