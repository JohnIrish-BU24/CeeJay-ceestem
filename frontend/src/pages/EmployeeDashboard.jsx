import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Plus, LogOut, History, User, Settings, FileText, Tag, CheckCircle, Clock, ChevronLeft, ChevronRight, Truck, PersonStanding, Info, MapPin, Phone } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// ─── Helpers ────────────────────────────────────────────────────────────────
const calcTotal = (qty, serviceType, promo) => {
  const price = serviceType === 'delivery' ? 35 : 30;
  let total = qty * price;
  if (promo === 'yes' && qty >= 10) total -= price;
  return total;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function RadioOption({ label, value, selected, onSelect, icon }) {
  return (
    <div
      onClick={() => onSelect(value)}
      style={{
        flex: 1,
        minWidth: 130,
        border: selected ? '1.5px solid #1a7ab5' : '1.5px solid #b8d6ea',
        borderRadius: 10,
        padding: '10px 14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        fontSize: 16,
        color: selected ? '#1a5c8a' : '#1a3a5a',
        background: selected ? '#fff' : '#f4f9fd',
        userSelect: 'none',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `2px solid ${selected ? '#1a7ab5' : '#b8d6ea'}`,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      background: '#fff',
      borderRadius: 14,
      padding: '30px 24px',
      marginBottom: 16,
      border: '0.5px solid #b8d6ea',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#1a7ab5', fontSize: 20, fontWeight: 500,
        borderBottom: '1.5px solid #d0e8f5', paddingBottom: 12, marginBottom: 18,
      }}>
        <div style={{
          width: 28, height: 28, background: '#1a7ab5', color: '#fff',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14, fontWeight: 500, flexShrink: 0,
        }}>{step}</div>
        {icon}
        {title} <span style={{ color: '#e04040' }}>*</span>
      </div>
      {children}
    </div>
  );
}

function FormGroup({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
      <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
        {label} {required && <span style={{ color: '#e04040' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  border: '1.5px solid #b8d6ea',
  borderRadius: 8,
  padding: '12px',
  fontSize: '16px',
  width: '100%',            // Fills the grid cell perfectly
  boxSizing: 'border-box',  // Prevents padding from breaking the width
  color: '#1a3a5a',
  background: '#f4f9fd',
};

// ─── Transaction Form Modal / Inline ─────────────────────────────────────────

function TransactionForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || {
    custID: '',
    barangayID: '',
    lastName: '',
    firstName: '',
    purok: '',
    barangay: '', // Used for "Barangay_Name" in your backend lookup
    customerType: 'Personal',
    contactNums: [''],
    serviceType: 'walkin',
    quantity: 1,
    promo: 'no',
    status: 'paid',
    total: 0 // Added this, as your payload uses form.total
  });

  const validatePhoneNumber = (num) => {
    // Regex: starts with 09, followed by exactly 9 digits (total 11)
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(num);
  };

  const updateQty = (delta) => {
    setForm(f => ({ ...f, quantity: Math.max(1, Number(f.quantity) + delta) }));
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
        set('custID', ''); // This clears the invalid ID
      }
    } catch (err) {
      console.error("Validation failed");
    }
  };

  return (
    <div>
      {/* Section 1 */}
<SectionCard step="1" icon={<User size={18} />} title="Customer Information">
  {/* ROW 1: 4 columns for Name, Barangay, Purok */}
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: '16px', 
    marginBottom: '16px' 
  }}>
    <FormGroup label="Last Name" required><input className="custom-input" style={inputStyle} placeholder="e.g. Dela Cruz" value={form.lastName} onChange={e => set('lastName', e.target.value)} /></FormGroup>
    <FormGroup label="First Name" required><input className="custom-input" style={inputStyle} placeholder="e.g. Juan" value={form.firstName} onChange={e => set('firstName', e.target.value)} /></FormGroup>
    <FormGroup label="Barangay" required><input className="custom-input" style={inputStyle} placeholder="e.g. Dinoronan" value={form.barangay} onChange={e => set('barangay', e.target.value)} /></FormGroup>
    <FormGroup label="Purok" required>
      <input 
        className="custom-input" 
        style={inputStyle} 
        type="number" // <--- Force number input
        min="1"       // <--- Optional: prevent negative puroks
        placeholder="e.g. 1" 
        value={form.purok} 
        onChange={e => {
          // Only allow numeric input (or empty)
          const val = e.target.value;
          if (val === '' || /^\d+$/.test(val)) {
            set('purok', val);
          }
        }} 
      />
    </FormGroup>
  </div>

    {/* ROW 2: Adjusted grid for better width balance */}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 0.8fr', // Customer Type gets 1 fraction, Contacts get 0.8
      gap: '24px',
      alignItems: 'start'
    }}>
      
      {/* Customer Type: Now takes up more proportional space */}
      <FormGroup label="Customer Type" required>
        <div style={{ display: 'flex', gap: 10 }}>
          <RadioOption label="Personal" value="Personal" selected={form.customerType === 'Personal'} onSelect={v => set('customerType', v)} />
          <RadioOption label="Reseller" value="Reseller" selected={form.customerType === 'Reseller'} onSelect={v => set('customerType', v)} />
        </div>
      </FormGroup>

      {/* Contact Numbers: Now slightly shorter/more constrained */}
      <FormGroup label="Contact Number(s)" required>
        {form.contactNums.map((num, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <input 
              className="custom-input"
              style={{ 
                ...inputStyle, 
                flex: 1, // Will shrink to fit the smaller column
                borderColor: (num !== '' && !/^09\d{9}$/.test(num)) ? '#e04040' : '#b8d6ea'
              }} 
              placeholder="09xxxxxxxxx" 
              value={num}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val) && val.length <= 11) {
                  const newNums = [...form.contactNums];
                  newNums[index] = val;
                  set('contactNums', newNums);
                }
              }} 
            />
            
            {/* Buttons remain same layout for uniformity */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {index === form.contactNums.length - 1 && (
                <button type="button" onClick={() => set('contactNums', [...form.contactNums, ''])} style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #1a7ab5', background: '#eaf4fb', cursor: 'pointer', height: '46px', display: 'flex', alignItems: 'center' }}><Plus size={18} color="#1a7ab5" /></button>
              )}
              {index > 0 && (
                <button type="button" onClick={() => { const newNums = form.contactNums.filter((_, i) => i !== index); set('contactNums', newNums); }} style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e04040', background: '#fff5f5', cursor: 'pointer', height: '46px', display: 'flex', alignItems: 'center' }}><Trash2 size={18} color="#e04040" /></button>
              )}
            </div>
          </div>
        ))}
      </FormGroup>
    </div>
</SectionCard>

      {/* Section 2 */}
      <SectionCard step="2" icon={<Settings size={18} />} title="Service Selection">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <RadioOption label="Walk-in (₱30.00)" value="walkin"
            selected={form.serviceType === 'walkin'} onSelect={v => set('serviceType', v)}
            icon={<PersonStanding size={16} />} />
          <RadioOption label="Delivery (₱35.00)" value="delivery"
            selected={form.serviceType === 'delivery'} onSelect={v => set('serviceType', v)}
            icon={<Truck size={16} />} />
        </div>
      </SectionCard>

      {/* Section 3 */}
      <SectionCard step="3" icon={<FileText size={18} />} title="Transaction Details">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FormGroup label="Quantity" required style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex' }}>
              <button onClick={() => set('quantity', Math.max(1, Number(form.quantity) - 1))}
                style={{ width: 36, height: 38, border: '1.5px solid #b8d6ea', borderRadius: '8px 0 0 8px', background: '#d0e8f5', color: '#1a5c8a', fontSize: 18, cursor: 'pointer' }}>−</button>
              <input type="number" value={form.quantity} min={1}
                onChange={e => set('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 100, height: 38, border: '1.5px solid #b8d6ea', borderLeft: 'none', borderRight: 'none', textAlign: 'center', fontSize: 15, background: '#fff', color: '#1a3a5a', outline: 'none' }} />
              <button onClick={() => set('quantity', Number(form.quantity) + 1)}
                style={{ width: 36, height: 38, border: '1.5px solid #b8d6ea', borderRadius: '0 8px 8px 0', background: '#d0e8f5', color: '#1a5c8a', fontSize: 18, cursor: 'pointer' }}>+</button>
            </div>
          </FormGroup>
          <FormGroup label={<>Promo</>} required>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                padding: '10px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                background: isPromo ? '#c8edda' : '#f4f9fd',
                border: `1.5px solid ${isPromo ? '#3da96b' : '#b8d6ea'}`,
                color: isPromo ? '#145c30' : '#6a9ab8'
              }}>
                {isPromo ? 'Promo Applied (Get 1 Free gallon)' : 'No Promo Applied'}
              </div>
              
              {/* Info Icon Button */}
              <div className="info-tooltip-container">
                <Info size={20} color="#2a7ab5" />
                <span className="tooltip-text">
                  Promo is auto-applied when quantity is 10 or greater (Get 1 free container).
                </span>
              </div>
            </div>
          </FormGroup>
        </div>
      </SectionCard>

      {/* Section 4 */}
      <SectionCard step="4" icon={<Tag size={18} />} title="Payment">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FormGroup label="Total Amount" style={{ maxWidth: 420 }}>
            <div style={{ border: '1.5px solid #b8d6ea', borderRadius: 8, padding: '9px 13px', fontSize: 14, color: '#1a3a5a', background: '#f4f9fd', minWidth: 160 }}>
              ₱{total.toFixed(2)}
            </div>
          </FormGroup>
          <FormGroup label="Status" required>
            <div style={{ display: 'flex', gap: '16px' }}>
              
              {/* PAID OPTION */}
              <label className="status-radio-label paid-label" style={{ 
                borderColor: form.status === 'paid' ? '#2e7d32' : '#e0e0e0',
                backgroundColor: form.status === 'paid' ? '#e6f4ea' : 'transparent',
                color: form.status === 'paid' ? '#2e7d32' : '#555'
              }}>
                <input 
                  type="radio" 
                  className="status-radio-input"
                  checked={form.status === 'paid'} 
                  onChange={() => set('status', 'paid')} 
                />
                <CheckCircle size={16} style={{ marginRight: 8 }} />
                Paid
              </label>

              {/* UNPAID OPTION */}
              <label className="status-radio-label unpaid-label" style={{ 
                borderColor: form.status === 'unpaid' ? '#d84315' : '#e0e0e0',
                backgroundColor: form.status === 'unpaid' ? '#fff3f0' : 'transparent',
                color: form.status === 'unpaid' ? '#d84315' : '#555'
              }}>
                <input 
                  type="radio" 
                  className="status-radio-input"
                  checked={form.status === 'unpaid'} 
                  onChange={() => set('status', 'unpaid')} 
                />
                <Clock size={16} style={{ marginRight: 8 }} />
                Unpaid
              </label>
            </div>
          </FormGroup>
        </div>
      </SectionCard>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        {onCancel && (
          <button onClick={onCancel} style={{
            flex: 1, padding: '16px', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            background: '#fff', color: '#1a3a5a', border: '1.5px solid #b8d6ea', borderRadius: 100,
          }}>Cancel</button>
        )}
        <button onClick={() => onSubmit({ ...form, total })} disabled={loading} style={{
          flex: 3, padding: '16px', fontSize: 16, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          background: '#03537f', color: '#fff', border: 'none', borderRadius: 100,
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Submitting…' : 'Submit Transaction'}
        </button>
      </div>
    </div>
  );
}

// ─── Today's Transactions List ────────────────────────────────────────────────

// Find this function in your code!
{/* 📍 NEW 9-COLUMN TRANSACTION ROW */}
{/* 📍 PERFECTLY ALIGNED TRANSACTION ROW (With Updated Yellow & Blue Theme) */}
{/* 📍 PERFECTLY CENTERED TRANSACTION ROW */}
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

      {/* 3. ADDRESS (Added justifyContent: center) */}
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

      {/* 4. CONTACT (Changed alignItems to center) */}
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
      <div style={{ flex: 0.5, minWidth: 60, textAlign: 'center', fontSize: 13, color: '#486581' }}>
        Qty: {tx.Quantity}
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

      {/* 9. ACTIONS (Added justifyContent: center) */}
      <div style={{ flex: 0.7, minWidth: 80, display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button onClick={() => onEdit(tx)} style={{ background: '#fff', border: '1px solid #b8d6ea', borderRadius: 6, cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', color: '#1a5c8a', transition: '0.2s' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
        </button>
        <button onClick={() => onDelete(tx.Trans_ID)} style={{ background: '#fff', border: '1px solid #ffcdd2', borderRadius: 6, cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', color: '#d32f2f', transition: '0.2s' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c0-1-2-2-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c0 1 2 1 2 2v2"></path></svg>
        </button>
      </div>

    </div>
  );
};

const styles = {
  radioOption: {
    padding: '10px 14px',
    border: '1.5px solid #b8d6ea',
    borderRadius: 10,
    background: '#f4f9fd',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    fontSize: 16,
    color: '#1a3a5a',
    transition: 'all 0.15s',
  },
  formSection: {
    background: '#fff',
    borderRadius: 14,
    padding: '30px 24px',
    marginBottom: 16,
    border: '0.5px solid #b8d6ea',
  },
  input: {
    border: '1.5px solid #b8d6ea',
    borderRadius: 8,
    padding: '13px 13px',
    fontSize: 16,
    color: '#1a3a5a',
    background: '#f4f9fd',
    outline: 'none',
    width: '95%',
  }
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function EmployeeDashboard({ onSignOut, refiller = 'Refiller' }) {
  const [view, setView] = useState('transactions'); // 'transactions' | 'new' | 'edit'
  

  // Remove default browser body/html margins so the app fills edge-to-edge
  useEffect(() => {
    const prev = document.body.style.cssText;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    return () => { document.body.style.cssText = prev; };
  }, []);
  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState('');

  // ── Fetch today's transactions ──
  const fetchToday = async () => {
    setLoadingList(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/transaction/today`);
      if (!res.ok) throw new Error('Failed to load transactions');
      const data = await res.json();
      console.log("Raw Database Data:", data);
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
      return; // Stop the function from running any further!
  }

  // Parse the saved data back into an object
  const activeEmployee = JSON.parse(storedUserData);
  // ==========================================

  const generatedCustID = formData.custID || 'C' + Date.now().toString().slice(-6); 
  const generatedTransID = parseInt(Date.now().toString().slice(-9));
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19).replace('T', ' ');
  
  const payload = {
    Trans_ID: generatedTransID,
    Trans_Date: localTime,
    Remarks: formData.status.charAt(0).toUpperCase() + formData.status.slice(1), 
    
    // ---> DYNAMIC VARIABLES INJECTED HERE <---
    empID: activeEmployee.id,       // Replaces the hardcoded 'E001'
    roleID: activeEmployee.role,    // Replaces the backend's hardcoded 'R'
    
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
    fetchToday(); // Refresh the list
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

  // ── Search customers by name (for auto-fill) ──
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (val) => {
      set('lastName', val); // Trigger search on name change
      if (val.length > 2) {
          const res = await fetch(`${API_BASE}/customer/search?name=${val}`);
          const data = await res.json();
          setSearchResults(data);
      }
  };

  const startEdit = (tx) => {
    setEditTarget(tx);
    setView('edit');
  };

  // ── Styles ──
  const topbarStyle = {
    background: '#1a2a3a', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 24px', height: 56,
    position: 'sticky', top: 0, zIndex: 100,
  };

  return (
    <div style={{ background: '#dceef8', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', width: '100%', boxSizing: 'border-box', margin: 0, padding: 0 }}>
      {/* ── Top Bar ── */}
      <div style={topbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#2a7ab5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8 2 5 7 5 12s3 8 7 8 7-3 7-8-3-10-7-10z"/></svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 500, lineHeight: 1.2, }}>CeeStem</div>
            <div style={{ color: '#4ab8e8', fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' }}>Water Refilling</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => {}} style={{ background: '#2a7ab5', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={25} /> {refiller}
          </button>
          <button onClick={() => { setView('transactions'); fetchToday(); }} style={{ background: 'transparent', color: '#fff', border: '1.5px solid #fff', borderRadius: 20, padding: '7px 16px', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={25} /> View Transaction History
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: 24 }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          {view === 'transactions' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1a5c8a', fontSize: 22, fontWeight: 500 }}>
              <History size={24} color="#1a7ab5" />
              Today's Transactions
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1a5c8a', fontSize: 22, fontWeight: 500 }}>
              <Plus size={24} color="#1a7ab5" />
              {view === 'edit' ? 'Edit Transaction' : 'New Transaction'}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {view === 'transactions' && (
              <button onClick={() => { console.log("Button clicked, setting view to 'new'"); setView('new'); }} style={{ background: '#2a7ab5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} /> New Transaction
              </button>
            )}
            {view !== 'transactions' && (
              <button onClick={() => { setView('transactions'); setEditTarget(null); }} style={{ background: '#f4f9fd', color: '#1a3a5a', border: '1.5px solid #b8d6ea', borderRadius: 8, padding: '9px 18px', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <button onClick={onSignOut} style={{ background: '#2a7ab5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── Views ── */}
        {view === 'new' && (
          <div style={{ 
            maxWidth: '1500px', // Restrict width so it doesn't stretch too wide
            margin: '20px auto', // Center it
            padding: '30px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)' // Subtle shadow makes it "pop"
          }}>
            <TransactionForm
              onSubmit={handleSubmit}
              onCancel={() => setView('transactions')}
              loading={formLoading}
            />
          </div>
        )}

        {view === 'edit' && editTarget && (
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

        {view === 'transactions' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #b8d6ea', overflow: 'hidden' }}>
            {/* 📍 NEW 9-COLUMN TABLE HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: '#eaf4fb', borderBottom: '1.5px solid #d0e8f5' }}>
              <div style={{ flex: 1.5, minWidth: 140, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</div>
              <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</div>
              <div style={{ flex: 1.5, minWidth: 140, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Address</div>
              <div style={{ flex: 1.2, minWidth: 120, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact</div>
              <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Service</div>
              <div style={{ flex: 0.5, minWidth: 60, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Qty</div>
              <div style={{ flex: 0.7, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</div>
              <div style={{ flex: 0.8, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</div>
              <div style={{ flex: 0.7, minWidth: 80, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</div>
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