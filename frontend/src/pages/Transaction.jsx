import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

function Transaction({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [dbTransactions, setDbTransactions] = useState([]);

  const fetchTransactions = async (query = '', range = 'All Time') => {
    try {
        const url = `http://localhost:5000/api/transaction/?search=${encodeURIComponent(query.trim())}&dateRange=${encodeURIComponent(range.trim())}`;
        const response = await fetch(url);
        const data = await response.json();
      
      const formatted = data.map(tx => ({
        Trans_ID: tx.Trans_ID,
        date: tx.Trans_Date ? new Date(tx.Trans_Date).toLocaleString() : 'N/A',
        customer: tx.Customer || 'N/A',
        refiller: tx.Refiller || '—',
        driver: tx.Driver || '—',
        qty: tx.Quantity || 0,
        amount: parseFloat(tx.Selling_Price) || 0,
        service: tx.Serv_Name || 'No',
        status: tx.Remarks
      }));
      setDbTransactions(formatted);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTransactions(searchQuery, dateFilter);
  }, []);

  useEffect(() => {
      const handler = setTimeout(() => {
          fetchTransactions(searchQuery, dateFilter);
      }, 200);
      return () => clearTimeout(handler);
  }, [searchQuery, dateFilter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(dbTransactions.map(t => t.Trans_ID));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (Trans_ID) => {
    if (selectedIds.includes(Trans_ID)) {
      setSelectedIds(selectedIds.filter(id => id !== Trans_ID));
    } else {
      setSelectedIds([...selectedIds, Trans_ID]);
    }
  };

  const openEditModal = (tx) => {
    const fullName = `${tx.lname || ''}, ${tx.fname || ''}`;
    setEditingTransaction({ 
        ...tx, 
        name: fullName, 
        Remarks: tx.status 
    });
    setIsEditModalOpen(true);
  };

  const handleModalSave = async (e) => {
    e.preventDefault(); 
    try {
      const response = await fetch(`http://localhost:5000/api/transaction/${editingTransaction.Trans_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service: editingTransaction.service,
          qty: editingTransaction.qty,
          amount: editingTransaction.amount,
          status: editingTransaction.status
        })
      });

      if (!response.ok) throw new Error("Failed to update transaction");

      setIsEditModalOpen(false);
      fetchTransactions(); 
    } catch (err) {
      console.error("Update error:", err);
      alert("Could not update transaction. Check console.");
    }
  };
  
  const handleInlineDelete = async (Trans_ID) => {
    if (!Trans_ID) {
        alert("Error: Cannot delete, Trans_ID is missing!");
        return;
    }

    const isConfirmed = window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.");
    if (!isConfirmed) return;

    try {
        const response = await fetch(`http://localhost:5000/api/transaction/${Trans_ID}`, { 
            method: 'DELETE' 
        });
        
        if (response.ok) {
            fetchTransactions(); 
        } else {
            const errorData = await response.json();
            alert("Delete failed: " + (errorData.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Network error:", err);
        alert("Check your backend server!");
    }
  };

  const handleBatchDelete = async () => {
    for (const id of selectedIds) {
      await fetch(`http://localhost:5000/api/transaction/${id}`, { method: 'DELETE' });
    }
    setSelectedIds([]);
    fetchTransactions();
  };

  const handleDeleteAll = async () => {
    try {
        const response = await fetch(`http://localhost:5000/api/transaction/all`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: deletePassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message); 
            setIsDeleteAllModalOpen(false);
            setDeletePassword('');
            fetchTransactions(); 
        } else {
            alert("Error: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Fetch failed:", err);
        alert("Failed to connect to the server.");
    }
  };

  const handleRibbonNavigation = (menuName) => {
    if (menuName === 'Transaction') navigate('/transaction');
    else if (menuName === 'Barangay') navigate('/barangay');
    else if (menuName === 'Customers') navigate('/customers');
    else if (menuName === 'Services') navigate('/services');
    else if (menuName === 'Employees') navigate('/employees');
    else alert(`${menuName} page not yet implemented`);
  };

  return (
    <div style={styles.appContainer}>
      
      <nav style={styles.topNavbar}>
        <div style={styles.navBrandBlock}>
          <div style={styles.brandIconContainer}>💧</div>
          <div style={styles.brandTextGroup}>
            <span style={styles.brandMainTitle}>CeeStem</span>
            <span style={styles.brandSubTitle}>WATER REFILLING</span>
          </div>
        </div>

        <div style={styles.navMenuLinksRow}>
          {['Dashboard', 'Transaction', 'Services', 'Customers', 'Barangay', 'Employees', 'Payroll', 'Reports'].map((menu) => {
            const isActive = (menu === 'Barangay' && currentPath === '/barangay') || 
                             (menu === 'Transaction' && currentPath === '/transaction');
            return (
              <button
                key={menu}
                onClick={() => handleRibbonNavigation(menu)}
                style={{
                  ...styles.navMenuButton,
                  color: isActive ? '#00b4d8' : '#ffffff',
                  borderBottom: isActive ? '3px solid #00b4d8' : '3px solid transparent'
                }}
              >
                {menu}
              </button>
            );
          })}
        </div>
      </nav>

      <div style={styles.workspaceBodyWrapper}>
        <div style={styles.dataLogTableCanvasCard}>
          <div style={styles.tableControlsGridRow}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
              <div style={styles.searchBarBoxFrame}>
                <Search size={18} color="#0077b6" style={styles.searchLeftIcon} />
                <input 
                  type="text" 
                  placeholder="Search by customer or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchFieldInput}
                />
              </div>

              <div style={styles.dropdownSelectContainer}>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={styles.nativeCustomSelect}
                >
                  <option>All Time</option>
                  <option>Last Week</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                  <option>Last Year</option>
                </select>
                <ChevronDown size={16} color="#0077b6" style={styles.dropdownChevronOverlay} />
              </div>
            </div>

            <button 
              onClick={() => setIsDeleteAllModalOpen(true)}
              style={{...styles.addTransactionPrimaryActionButton, borderColor: '#ef4444', color: '#ef4444'}}
            >
              <Trash2 size={16} /> Clear All
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div style={styles.batchActionAlertStrip}>
              <span style={styles.batchSelectionCountLabel}>{selectedIds.length} Selected</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBatchDelete} style={styles.batchDeleteActionButton}>Delete Selected</button>
                <button onClick={() => setSelectedIds([])} style={styles.batchCancelActionButton}>Cancel</button>
              </div>
            </div>
          )}

          <div style={styles.scrollableTableContainer}>
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '60px' }}>ID</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '170px' }}>DATE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '130px' }}>CUSTOMER</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '130px' }}>REFILLER</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '120px' }}>DRIVER</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '60px' }}>QTY</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '90px' }}>PRICE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>SERVICE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>STATUS</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center', width: '100px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {dbTransactions.map((tx, index) => (
                  <tr key={index} style={styles.tableBodyDataRow}>
                    <td style={styles.tableBodyCellBlock}>{tx.Trans_ID}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.date}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.customer}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.refiller}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.driver}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.qty}</td>
                    <td style={{ ...styles.tableBodyCellBlock, fontWeight: '700' }}>₱{tx.amount.toFixed(2)}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.service}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.status}</td>
                    <td style={styles.tableBodyCellBlock}>
                      <div style={styles.inlineActionButtonsFlexGroup}>
                        <button onClick={() => openEditModal(tx)} style={styles.inlineRowEditButton}><Edit2 size={16} /></button>
                        <button onClick={() => handleInlineDelete(tx.Trans_ID)} style={styles.inlineRowDeleteButton}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isEditModalOpen && editingTransaction && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, width: '30px', display: 'flex', alignItems: 'center', color: '#0077b6' }}>
                  <Edit2 size={20} />
                </div>
                <h2 style={styles.modalHeaderHeadingText}>EDIT TRANSACTION</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSave} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputFieldsDoubleColumnGrid}>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>TRANS ID</label>
                  <input type="text" value={editingTransaction.Trans_ID} disabled style={styles.modalDisabledInputField} />
                </div>
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>CUSTOMER NAME</label>
                  <input type="text" value={editingTransaction.customer} disabled style={styles.modalDisabledInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>REFILLER</label>
                  <input type="text" value={editingTransaction.refiller} disabled style={styles.modalDisabledInputField} />
                </div>
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>DRIVER</label>
                  <input type="text" value={editingTransaction.driver} disabled style={styles.modalDisabledInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>SERVICE</label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select 
                      value={editingTransaction.service} 
                      onChange={(e) => {
                        const newService = e.target.value;
                        const fixedPrice = newService === 'Delivery' ? 35 : 30;
                        setEditingTransaction({...editingTransaction, service: newService, amount: fixedPrice});
                      }}
                      style={styles.modalNativeDropdownSelect}
                    >
                      <option value="Delivery">Delivery</option>
                      <option value="Walk-in">Walk-in</option>
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>QUANTITY</label>
                  <input 
                    type="number" 
                    value={editingTransaction.qty} 
                    onChange={(e) => {
                      const newQty = Math.max(1, parseInt(e.target.value) || 1);
                      setEditingTransaction({...editingTransaction, qty: newQty});
                    }}
                    style={styles.modalActiveInputField} 
                  />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>PRICE</label>
                  <input type="text" value={`₱${editingTransaction.amount.toFixed(2)}`} disabled style={styles.modalDisabledInputField} />
                </div>
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>STATUS</label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select value={editingTransaction.status} onChange={(e) => setEditingTransaction({...editingTransaction, status: e.target.value})} style={styles.modalNativeDropdownSelect}>
                      <option value="Paid">PAID</option>
                      <option value="Unpaid">UNPAID</option>
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={styles.modalDismissCancelButtonLink}>
                  Cancel
                </button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteAllModalOpen && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            
            <div style={styles.modalHeaderTitleGroup}>
              <span>⚠️</span> 
              <h2 style={styles.modalHeaderHeadingText}>DELETE ALL RECORDS</h2>
            </div>

            <p style={{ color: '#475569', margin: '0' }}>
              This action is irreversible. Please enter the owner password to confirm:
            </p>
            
            <input 
              type="text" 
              value={deletePassword} 
              onChange={(e) => setDeletePassword(e.target.value)} 
              style={{
                ...styles.modalActiveInputField,
                WebkitTextSecurity: 'disc' 
              }}
              name="admin-secret-code"
              id="admin-secret-code"
              autoComplete="off"
              placeholder="Enter Admin Password"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readOnly')}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleDeleteAll} style={styles.modalDangerActionDeleteButton}>
                Confirm Delete
              </button>
              <button onClick={() => setIsDeleteAllModalOpen(false)} style={styles.modalDismissCancelButtonLink}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  appContainer: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#ffffff', overflow: 'hidden', position: 'fixed', top: 0, left: 0, boxSizing: 'border-box', fontFamily: 'sans-serif' },
  topNavbar: { height: '70px', backgroundColor: '#011627', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', flexShrink: 0 },
  navBrandBlock: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandIconContainer: { fontSize: '1.4rem' },
  brandTextGroup: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  brandMainTitle: { color: '#ffffff', fontSize: '1.15rem', fontWeight: 'bold', letterSpacing: '0.3px' },
  brandSubTitle: { color: '#00b4d8', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' },
  navMenuLinksRow: { display: 'flex', height: '100%', alignItems: 'center', gap: '4px' },
  navMenuButton: { background: 'none', border: 'none', height: '100%', padding: '0 16px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s ease' },
  workspaceBodyWrapper: { flex: 1, overflowY: 'auto', backgroundColor: '#e6f2fa', padding: '20px ', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  dataLogTableCanvasCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #bde0fe', padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0, 79, 134, 0.05)', height: 'calc(100vh - 110px)', width: '100%', overflow: 'hidden' },
  tableControlsGridRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', width: '100%', boxSizing: 'border-box' },
  searchBarBoxFrame: { position: 'relative', display: 'flex', alignItems: 'center', flex: '0 1 400px', maxWidth: '560px' },
  searchLeftIcon: { position: 'absolute', left: '16px', pointerEvents: 'none' },
  searchFieldInput: { width: '100%', padding: '12px 16px 12px 46px', borderRadius: '8px', border: '1px solid #bde0fe', backgroundColor: '#eaf4fc', color: '#012a4a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  dropdownSelectContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  nativeCustomSelect: { appearance: 'none', backgroundColor: '#eaf4fc', border: '1px solid #bde0fe', borderRadius: '8px', padding: '12px 40px 12px 18px', fontSize: '0.92rem', fontWeight: '600', color: '#014f86', outline: 'none', cursor: 'pointer' },
  dropdownChevronOverlay: { position: 'absolute', right: '14px', pointerEvents: 'none' },
  addTransactionPrimaryActionButton: { backgroundColor: '#ffffff', color: '#0077b6', border: '1px solid #0077b6', borderRadius: '8px', padding: '12px 20px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  batchActionAlertStrip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffe3e3', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 20px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' },
  batchSelectionCountLabel: { color: '#b91c1c', fontWeight: '700', fontSize: '0.95rem' },
  batchDeleteActionButton: { backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer' },
  batchCancelActionButton: { backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 16px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' },
  ledgerTableMarkup: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' },
  tableHeadBorderRow: { borderBottom: '2px solid #bde0fe' },
  scrollableTableContainer: { overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, marginTop: '10px' },
  tableHeaderColumnCell: { padding: '14px 10px', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10, borderBottom: '2px solid #bde0fe' },
  tableBodyDataRow: { borderBottom: '1px solid #e2e8f0', height: '52px' },
  tableBodyCellBlock: { padding: '12px 10px', fontSize: '0.9rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  inlineActionButtonsFlexGroup: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  inlineRowEditButton: { backgroundColor: '#eaf4fc', border: 'none', borderRadius: '6px', color: '#0077b6', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowDeleteButton: { backgroundColor: '#ffe3e3', border: 'none', borderRadius: '6px', color: '#ef4444', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  modalOverlayMask: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalWindowContainer: { backgroundColor: '#ffffff', width: '90%', maxWidth: '500px', borderRadius: '12px', border: '1px solid #0077b6', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  modalHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' },
  modalHeaderTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #bde0fe', paddingBottom: '15px' },
  modalHeaderTitleIconBox: { fontSize: '1.5rem' },
  modalHeaderHeadingText: { fontSize: '1.25rem', fontWeight: '700', color: '#011627', margin: 0 },
  modalHeaderCloseXButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
  modalContentFormElement: { display: 'flex', flexDirection: 'column', width: '100%' },
  modalFormInputFieldsDoubleColumnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px', marginBottom: '32px', width: '100%' },
  modalFormInputGroupFieldUnit: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' },
  modalFormFieldLabelHeader: { fontSize: '0.85rem', fontWeight: '800', color: '#011627', marginBottom: '10px', letterSpacing: '0.3px' },
  modalDisabledInputField: { width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #bde0fe', backgroundColor: '#d0e4f2', color: '#64748b', fontSize: '0.98rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' },
  modalActiveInputField: { width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.98rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' },
  modalSelectFieldWrapperBox: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%' },
  modalNativeDropdownSelect: { appearance: 'none', width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.98rem', fontWeight: '700', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  modalSelectChevronOverlayIcon: { position: 'absolute', right: '16px', pointerEvents: 'none' },
  modalFooterButtonsControlFlexRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px', width: '100%' },
  modalDangerActionDeleteButton: { backgroundColor: '#fca5a5', color: '#b91c1c', border: '1px solid #f87171', borderRadius: '10px', padding: '14px 28px', fontSize: '0.98rem', fontWeight: '700', cursor: 'pointer', marginRight: 'auto' },
  modalDismissCancelButtonLink: { background: 'none', border: 'none', color: '#0077b6', fontWeight: '700', fontSize: '0.98rem', cursor: 'pointer', padding: '14px 20px' },
  modalPrimaryActionSaveButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '0.98rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 119, 182, 0.25)' }
};

export default Transaction;