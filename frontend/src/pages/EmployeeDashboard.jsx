import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, LogOut, History, User, Settings, FileText, Tag, CheckCircle, Clock, ChevronLeft, ChevronRight, Truck, PersonStanding, Info } from 'lucide-react';

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
        fontSize: 14,
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
      padding: '22px 24px',
      marginBottom: 16,
      border: '0.5px solid #b8d6ea',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#1a7ab5', fontSize: 16, fontWeight: 500,
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

function FormGroup({ label, required, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 140, ...style }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#1a3a5a' }}>
        {label} {required && <span style={{ color: '#e04040' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  border: '1.5px solid #b8d6ea',
  borderRadius: 8,
  padding: '9px 13px',
  fontSize: 14,
  color: '#1a3a5a',
  background: '#f4f9fd',
  outline: 'none',
  width: '95%',
};

// ─── Transaction Form Modal / Inline ─────────────────────────────────────────

function TransactionForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || {
    lastName: '', firstName: '', barangay: '', purok: '',
    customerType: 'personal', serviceType: 'walkin',
    quantity: 1, promo: 'no', status: 'paid',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const total = calcTotal(Number(form.quantity), form.serviceType, form.promo);

  return (
    <div>
      {/* Section 1 */}
      <SectionCard step="1" icon={<User size={18} />} title="Customer Information">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          <FormGroup label="Last Name" required>
            <input style={inputStyle} placeholder="e.g. Dela Cruz" value={form.lastName}
              onChange={e => set('lastName', e.target.value)} />
          </FormGroup>
          <FormGroup label="First Name" required>
            <input style={inputStyle} placeholder="e.g. Juan" value={form.firstName}
              onChange={e => set('firstName', e.target.value)} />
          </FormGroup>
          <FormGroup label="Barangay" required>
            <input style={inputStyle} placeholder="e.g. Dinoronan" value={form.barangay}
              onChange={e => set('barangay', e.target.value)} />
          </FormGroup>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <FormGroup label="Purok" required style={{ maxWidth: 400 }}>
            <input style={inputStyle} placeholder="e.g. 1" value={form.purok}
              onChange={e => set('purok', e.target.value)} />
          </FormGroup>
          <FormGroup label="Customer Type" required>
            <div style={{ display: 'flex', gap: 10 }}>
              <RadioOption label="Personal" value="personal"
                selected={form.customerType === 'personal'} onSelect={v => set('customerType', v)} />
              <RadioOption label="Reseller" value="reseller"
                selected={form.customerType === 'reseller'} onSelect={v => set('customerType', v)} />
            </div>
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
                style={{ width: 56, height: 38, border: '1.5px solid #b8d6ea', borderLeft: 'none', borderRight: 'none', textAlign: 'center', fontSize: 15, background: '#fff', color: '#1a3a5a', outline: 'none' }} />
              <button onClick={() => set('quantity', Number(form.quantity) + 1)}
                style={{ width: 36, height: 38, border: '1.5px solid #b8d6ea', borderRadius: '0 8px 8px 0', background: '#d0e8f5', color: '#1a5c8a', fontSize: 18, cursor: 'pointer' }}>+</button>
            </div>
          </FormGroup>
          <FormGroup label={<>Promo <span title="Promo deducts 1 unit price when qty ≥ 10" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 17, height: 17, borderRadius: '50%', border: '1.5px solid #7ab0d0', color: '#2a7ab5', fontSize: 10, fontWeight: 600, marginLeft: 3, cursor: 'help' }}>i</span></>} required>
            <div style={{ display: 'flex', gap: 10 }}>
              <RadioOption label="Yes" value="yes" selected={form.promo === 'yes'} onSelect={v => set('promo', v)} />
              <RadioOption label="No" value="no" selected={form.promo === 'no'} onSelect={v => set('promo', v)} />
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
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Paid */}
              <div onClick={() => set('status', 'paid')} style={{
                flex: 1, borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500,
                background: form.status === 'paid' ? '#c8edda' : '#e6f5ee',
                color: form.status === 'paid' ? '#145c30' : '#1a6b3a',
                border: `1.5px solid ${form.status === 'paid' ? '#3da96b' : '#7ecfa4'}`,
                transition: 'all 0.15s',
              }}>
                <CheckCircle size={16} /> Paid
              </div>
              {/* Unpaid */}
              <div onClick={() => set('status', 'unpaid')} style={{
                flex: 1, borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500,
                background: form.status === 'unpaid' ? '#fbd6d6' : '#fdecea',
                color: form.status === 'unpaid' ? '#8b2222' : '#b93333',
                border: `1.5px solid ${form.status === 'unpaid' ? '#e05555' : '#f5a5a5'}`,
                transition: 'all 0.15s',
              }}>
                <Clock size={16} /> Unpaid
              </div>
            </div>
          </FormGroup>
        </div>
      </SectionCard>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        {onCancel && (
          <button onClick={onCancel} style={{
            flex: 1, padding: '16px', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            background: '#fff', color: '#1a3a5a', border: '1.5px solid #b8d6ea', borderRadius: 10,
          }}>Cancel</button>
        )}
        <button onClick={() => onSubmit({ ...form, total })} disabled={loading} style={{
          flex: 3, padding: '16px', fontSize: 16, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          background: '#1a2a3a', color: '#fff', border: 'none', borderRadius: 10,
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Submitting…' : 'Submit Transaction'}
        </button>
      </div>
    </div>
  );
}

// ─── Today's Transactions List ────────────────────────────────────────────────

function TransactionRow({ tx, onEdit, onDelete }) {
  const statusColor = tx.Status === 'paid'
    ? { bg: '#e6f5ee', color: '#1a6b3a', border: '#7ecfa4' }
    : { bg: '#fdecea', color: '#b93333', border: '#f5a5a5' };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderBottom: '0.5px solid #d0e8f5',
      background: '#fff', flexWrap: 'wrap',
    }}>
      <div style={{ flex: 2, minWidth: 120 }}>
        <div style={{ fontWeight: 500, color: '#1a3a5a', fontSize: 14 }}>
          {tx.LastName}, {tx.FirstName}
        </div>
        <div style={{ fontSize: 12, color: '#6a9ab8' }}>{tx.Barangay} — Purok {tx.Purok}</div>
      </div>
      <div style={{ flex: 1, minWidth: 80, fontSize: 13, color: '#1a5c8a' }}>
        {tx.ServiceType === 'delivery' ? '🚚 Delivery' : '🚶 Walk-in'}
      </div>
      <div style={{ fontSize: 13, color: '#1a3a5a', minWidth: 60 }}>Qty: {tx.Quantity}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a3a5a', minWidth: 80 }}>₱{Number(tx.TotalAmount).toFixed(2)}</div>
      <div style={{
        fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 20,
        background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}`,
        minWidth: 60, textAlign: 'center',
      }}>
        {tx.Status === 'paid' ? 'Paid' : 'Unpaid'}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onEdit(tx)} style={{
          width: 32, height: 32, borderRadius: 8, border: '1.5px solid #b8d6ea',
          background: '#f4f9fd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Edit2 size={14} color="#2a7ab5" />
        </button>
        <button onClick={() => onDelete(tx.Trans_ID)} style={{
          width: 32, height: 32, borderRadius: 8, border: '1.5px solid #fdd',
          background: '#fff5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trash2 size={14} color="#e04040" />
        </button>
      </div>
    </div>
  );
}

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
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchToday(); }, []);

  // ── Submit new transaction ──
  const handleSubmit = async (form) => {
    if (!form.lastName.trim() || !form.firstName.trim()) {
      alert('Please fill in the customer name.'); return;
    }
    setFormLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to submit transaction');
      await fetchToday();
      setView('transactions');
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
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
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>CeeStem</div>
            <div style={{ color: '#4ab8e8', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Water Refilling</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => {}} style={{ background: '#2a7ab5', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} /> {refiller}
          </button>
          <button onClick={() => { setView('transactions'); fetchToday(); }} style={{ background: 'transparent', color: '#fff', border: '1.5px solid #fff', borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={14} /> View Transaction History
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
              <button onClick={() => setView('new')} style={{ background: '#2a7ab5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} /> New Transaction
              </button>
            )}
            {view !== 'transactions' && (
              <button onClick={() => { setView('transactions'); setEditTarget(null); }} style={{ background: '#f4f9fd', color: '#1a3a5a', border: '1.5px solid #b8d6ea', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <button onClick={onSignOut} style={{ background: '#2a7ab5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── Views ── */}
        {view === 'new' && (
          <TransactionForm
            onSubmit={handleSubmit}
            onCancel={() => setView('transactions')}
            loading={formLoading}
          />
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
            {/* Table Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#eaf4fb', borderBottom: '1.5px solid #d0e8f5', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 120, fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</div>
              <div style={{ flex: 1, minWidth: 80, fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Service</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Qty</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 80 }}>Amount</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Status</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a5c8a', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</div>
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