import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Plus, LogOut, History, User, Settings, FileText, Tag, CheckCircle, Clock, ChevronLeft, Truck, PersonStanding, Info, MapPin } from 'lucide-react';

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

function RadioOption({ label, value, selected, onSelect, icon }) {
  return (
    <div
      onClick={() => onSelect(value)}
      style={{
        flex: 1,
        minWidth: 130,
        boxSizing: 'border-box', /* 📍 Ensures padding/borders don't stretch the box */
        border: `1px solid ${selected ? '#1a7ab5' : '#cbe4f4'}`, /* 📍 FIXED: Locked to 1px always */
        borderRadius: '10px',
        padding: '10px 14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        fontSize: '14px',
        fontWeight: 600, /* 📍 FIXED: Locked to 600 always so the words don't stretch */
        color: selected ? '#1a5c8a' : '#475569',
        background: selected ? '#eaf4fb' : '#ffffff',
        userSelect: 'none',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        boxSizing: 'border-box',
        border: `2px solid ${selected ? '#1a7ab5' : '#cbe4f4'}`,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff'
      }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a7ab5' }} />}
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

// ─── Transaction Form Component ──────────────────────────────────────────────

function TransactionForm({ initial, onSubmit, onCancel, loading }) {
  
  // ─── 1. NEW STATES GO RIGHT AT THE TOP ──────────────────────────────────
  const [customerMode, setCustomerMode] = useState(null); // 'new' | 'existing' | null
  const [suggestions, setSuggestions] = useState([]);     
  const [isLocked, setIsLocked] = useState(false);        
  const [searchTerm, setSearchTerm] = useState("");       
  const [isSearching, setIsSearching] = useState(false);  
  const [lockedContactCount, setLockedContactCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  

  // ─── 2. YOUR EXISTING FORM STATE (Untouched) ────────────────────────────
  const [form, setForm] = useState(initial || {
    custID: '',
    barangayID: '',
    lastName: '',
    firstName: '',
    purok: '',
    barangay: '', 
    customerType: 'Personal',
    contactNums: [''],
    serviceType: 'walkin',
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


  // ─── 4. THE NEW DATABASE SEARCH LOGIC GOES HERE ─────────────────────────
  useEffect(() => {
    // If not in existing mode, or search is empty, stop
    if (customerMode !== 'existing' || !searchTerm || searchTerm.length === 0) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true); 

    const delayDebounceFn = setTimeout(async () => {
      try {
        console.log("Searching for:", searchTerm); // 📍 DEBUG: Check console to see if this fires
        const res = await fetch(`${API_BASE}/customer/search?name=${encodeURIComponent(searchTerm)}`);
        
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []); 
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false); 
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, customerMode]); // searchTerm is the trigger!

  // ─── 5. THE POP-UP CHOICE MODAL ───────────────────────────────────────────────
  // ─── 5. THE PREMIUM WORK-FLOW MODAL ───────────────────────────────────────────
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
            Go back
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
          <span>Customer Information {customerMode === 'existing' && <span style={{fontSize: 12, color: '#1a7ab5', background: '#eaf4fb', padding: '2px 8px', borderRadius: 4, marginLeft: 8}}>Existing Mode</span>}</span>
          
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
              Unlock & Clear
            </button>
          )}
        </div>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {/* 📍 SMART LAST NAME SEARCH FIELD (CONNECTED TO DB) */}
          {/* Last Name */}
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
      // 📍 Focus logic to show/hide dropdown
      onFocus={() => setIsFocused(true)}
      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      onChange={e => {
        const val = e.target.value;
        if (isNameValid(val)) {
          set('lastName', toTitleCase(val));
          if (!isLocked) {
            setSearchTerm(val);
          }
        }
      }} 
    />
    
    {/* 📍 DROPDOWN: Shows only when focused, has items, and is not locked */}
    {suggestions.length > 0 && !isLocked && isFocused && (
      <div style={{ 
        position: 'absolute', 
        top: '100%', 
        left: 0, 
        width: '100%', 
        background: '#ffffff', 
        border: '1px solid #cbe4f4', 
        borderRadius: '0 0 10px 10px', 
        marginTop: '0px', 
        zIndex: 9999, 
        boxShadow: '0 8px 24px rgba(16, 42, 67, 0.12)', 
        
        // 📍 Scrollbar functionality
        maxHeight: '180px',      
        overflowY: 'auto'        
      }}>
        {suggestions.map((c, i) => (
          <div 
            key={i} 
            // 📍 AUTO-FILL LOGIC PRESERVED HERE
            onClick={() => {
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
              
              setSearchTerm(""); 
              setSuggestions([]);
              setIsLocked(true);
            }}
            style={{ 
              padding: '12px 16px', 
              cursor: 'pointer', 
              fontSize: 13, 
              borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid #eaf4fb',
              color: '#102a43',
              background: '#ffffff'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f4f9fd'}
            onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
          >
            <strong>({c.Cust_LName}, {c.Cust_FName})</strong>, {c.Barangay_Name}, Purok {c.Purok}
          </div>
        ))}
      </div>
    )}
  </div>
</FormGroup>

          {/* First Name */}
          <FormGroup label="First Name" required>
            <input 
              className="custom-input" 
              style={{ 
                ...inputStyle, 
                background: isLocked ? '#f8fafc' : inputStyle.background, 
                color: isLocked ? '#94a3b8' : inputStyle.color 
              }} 
              placeholder="e.g. Juan" 
              value={form.firstName} 
              readOnly={isLocked}
              onChange={e => {
                const val = e.target.value;
                if (isNameValid(val)) set('firstName', toTitleCase(val));
              }} 
            />
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
              <RadioOption label="Personal" value="Personal" selected={form.customerType === 'Personal'} onSelect={v => set('customerType', v)} />
              <RadioOption label="Reseller" value="Reseller" selected={form.customerType === 'Reseller'} onSelect={v => set('customerType', v)} />
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
      <SectionCard step="2" icon={<Settings size={18} />} title="Service Selection">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <RadioOption label="Walk-in (₱30.00)" value="walkin" selected={form.serviceType === 'walkin'} onSelect={v => set('serviceType', v)} icon={<PersonStanding size={18} />} />
          <RadioOption label="Delivery (₱35.00)" value="delivery" selected={form.serviceType === 'delivery'} onSelect={v => set('serviceType', v)} icon={<Truck size={18} />} />
        </div>
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
                {isPromo ? 'Promo Applied (Get 1 Free gallon)' : 'No Promo Applied'}
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
          onClick={() => onSubmit({ ...form, total })} 
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
              /* 📍 Clean, slightly deeper blue (no muddy gray), and NO bouncing! */
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
        <button onClick={() => onEdit(tx)} style={{ background: '#fff', border: '1px solid #b8d6ea', borderRadius: 6, cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', color: '#1a5c8a', transition: '0.2s' }}>
          <Edit2 size={15} />
        </button>
        <button onClick={() => onDelete(tx.Trans_ID)} style={{ background: '#fff', border: '1px solid #ffcdd2', borderRadius: 6, cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', color: '#d32f2f', transition: '0.2s' }}>
          <Trash2 size={15} />
        </button>
      </div>

    </div>
  );
};


// ─── Main Dashboard Component ──────────────────────────────────────────────────

export default function EmployeeDashboard({ onSignOut, refiller = 'Refiller' }) {
  const [view, setView] = useState('transactions'); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState('');

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

    const generatedCustID = formData.custID || 'C' + Date.now().toString().slice(-6); 
    const generatedTransID = parseInt(Date.now().toString().slice(-9));
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19).replace('T', ' ');
    
    const payload = {
      Trans_ID: generatedTransID,
      Trans_Date: localTime,
      Remarks: formData.status.charAt(0).toUpperCase() + formData.status.slice(1), 
      empID: activeEmployee.id,       
      roleID: activeEmployee.role,    
      customer: {
        Cust_ID: generatedCustID, 
        Barangay_ID: formData.barangayID || null, 
        Barangay_Name: formData.barangay, 
        Purok: formData.purok,
        Cust_LName: formData.lastName,
        Cust_FName: formData.firstName,
        Cust_Type: formData.customerType,
        Contact_Nums: formData.contactNums.filter(n => n.trim() !== '')
      },
      items: [{
        Trans_Detail_ID: generatedTransID + 1,
        Serv_ID: formData.serviceType === 'delivery' ? 2 : 1,
        Quantity: Number(formData.quantity),
        Selling_Price: Number(formData.total),
        Promo: formData.quantity >= 10 ? 'Yes' : 'No'
      }]
    };

    try {
      await axios.post('http://localhost:5000/api/transaction', payload);
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

  return (
    <div style={{ background: '#dceef8', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', width: '100%', boxSizing: 'border-box', margin: 0, padding: 0 }}>
      
      {/* ── Top Bar ── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        background: '#102a43', 
        padding: '16px 28px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img 
            src={logoImg} 
            alt="CeeStem Logo"
            style={{ 
              width: 56, height: 56, 
              objectFit: 'contain', 
              transform: 'scale(1.35)', 
              transformOrigin: 'center' 
            }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.1 }}>
              CeeStem
            </div>
            <div style={{ color: '#62b0e8', fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Water Refilling
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', borderRadius: '30px', 
            padding: '8px 16px', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <User size={18} color="#90cdf4" /> 
            {refiller}
          </div>
          <button 
            onClick={() => { setView('transactions'); fetchToday(); }} 
            style={{ 
              background: 'transparent', color: '#ffffff', border: '1px solid #62b0e8', borderRadius: '30px', 
              padding: '8px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(98, 176, 232, 0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <History size={18} color="#62b0e8" /> View Transaction History
          </button>
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
                  lastName: editTarget.LastName || '',
                  firstName: editTarget.FirstName || '',
                  barangay: editTarget.Barangay || '',
                  purok: editTarget.Purok || '',
                  customerType: editTarget.CustomerType || 'personal',
                  serviceType: editTarget.ServiceType || 'walkin',
                  quantity: editTarget.Quantity || 1,
                  promo: editTarget.Promo || 'no',
                  status: editTarget.Status || 'paid',
                }}
                onSubmit={handleUpdate}
                onCancel={() => { setView('transactions'); setEditTarget(null); }}
                loading={formLoading}
              />
            )}
          </div>
        )}

        {/* 📍 TRANSACTIONS TABLE WRAPPER */}
        {view === 'transactions' && (
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '16px', 
            border: '1px solid #eaf4fb', 
            boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)', 
            overflow: 'hidden' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: '#f4f7fa', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1.5, minWidth: 140, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</div>
              <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</div>
              <div style={{ flex: 1.5, minWidth: 140, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Address</div>
              <div style={{ flex: 1.2, minWidth: 120, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact</div>
              <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Service</div>
              <div style={{ flex: 0.5, minWidth: 60, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Qty</div>
              <div style={{ flex: 0.7, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</div>
              <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</div>
              <div style={{ flex: 0.7, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</div>
            </div>

            {loadingList && (
              <div style={{ padding: 32, textAlign: 'center', color: '#6a9ab8', fontSize: 14 }}>Loading transactions…</div>
            )}
            {error && (
              <div style={{ padding: 20, color: '#e04040', fontSize: 14, textAlign: 'center' }}>{error}</div>
            )}
            {!loadingList && !error && transactions.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#6a9ab8', fontSize: 14 }}>No transactions recorded today.</div>
            )}
            {!loadingList && transactions.map(tx => (
              <TransactionRow key={tx.Trans_ID} tx={tx} onEdit={startEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </div> 
    </div>
  );
}