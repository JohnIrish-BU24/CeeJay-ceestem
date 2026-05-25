import React, { useState } from 'react';
import { Search, ChevronDown, Edit2, Trash2, Plus, X } from 'lucide-react';

function OwnerTransaction() {
  const [activeMenu, setActiveMenu] = useState('Transaction');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [promoFilter, setPromoFilter] = useState('All Promo');
  
  // Selection states for batch actions
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modal toggle states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Core transaction records matching the exact rows from OwnerTransaction.png
  const [dbTransactions, setDbTransactions] = useState([
    { transId: 2001, custId: 1001, name: "Dela Cruz, Juan", date: "2024-01-02", service: "Walk-in", qty: 5, amount: 125.00, promo: "—", status: "Paid" },
    { transId: 2002, custId: 1002, name: "Santos, Maria", date: "2024-02-02", service: "Walk-in", qty: 11, amount: 450.00, promo: "Yes", status: "Paid" },
    { transId: 2003, custId: 1003, name: "Reyes, Pedro", date: "2024-04-03", service: "Walk-in", qty: 8, amount: 200.00, promo: "—", status: "Unpaid" },
    { transId: 2004, custId: 1004, name: "Garcia, Ana", date: "2024-04-03", service: "Delivered", qty: 1, amount: 30.00, promo: "—", status: "Paid" },
    { transId: 2005, custId: 1005, name: "Mendoza, Luis", date: "2024-05-04", service: "Walk-in", qty: 12, amount: 270.00, promo: "Yes", status: "Paid" },
    { transId: 2006, custId: 1006, name: "Torres, Carla", date: "2024-06-07", service: "Walk-in", qty: 4, amount: 100.00, promo: "—", status: "Unpaid" },
    { transId: 2007, custId: 1007, name: "Lopez, Mark", date: "2024-08-23", service: "Walk-in", qty: 1, amount: 200.00, promo: "—", status: "Paid" },
    { transId: 2008, custId: 1008, name: "Gonzales, Ella", date: "2024-08-26", service: "Delivered", qty: 13, amount: 100.00, promo: "Yes", status: "Paid" },
    { transId: 2009, custId: 1009, name: "Villanueva, Jose", date: "2024-09-27", service: "Walk-in", qty: 3, amount: 75.00, promo: "—", status: "Unpaid" }
  ]);

  // Master checkbox selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(dbTransactions.map(t => t.transId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (transId) => {
    if (selectedIds.includes(transId)) {
      setSelectedIds(selectedIds.filter(id => id !== transId));
    } else {
      setSelectedIds([...selectedIds, transId]);
    }
  };

  // Open inline modal for specific transaction row editing
  const openEditModal = (tx) => {
    setEditingTransaction({ ...tx });
    setIsEditModalOpen(true);
  };

  const handleModalSave = (e) => {
    e.preventDefault();
    setDbTransactions(dbTransactions.map(t => 
      t.transId === editingTransaction.transId ? editingTransaction : t
    ));
    setIsEditModalOpen(false);
  };

  const handleInlineDelete = (transId) => {
    setDbTransactions(dbTransactions.filter(t => t.transId !== transId));
    setSelectedIds(selectedIds.filter(id => id !== transId));
  };

  const handleBatchDelete = () => {
    setDbTransactions(dbTransactions.filter(t => !selectedIds.includes(t.transId)));
    setSelectedIds([]);
  };

  return (
    <div style={styles.appContainer}>
      
      {/* ================= GLOBAL NAVIGATION HEADER MENU ================= */}
      <nav style={styles.topNavbar}>
        <div style={styles.navBrandBlock}>
          <div style={styles.brandIconContainer}>💧</div>
          <div style={styles.brandTextGroup}>
            <span style={styles.brandMainTitle}>CeeStem</span>
            <span style={styles.brandSubTitle}>WATER REFILLING</span>
          </div>
        </div>

        <div style={styles.navMenuLinksRow}>
          {['Dashboard', 'Transaction', 'Services', 'Customers', 'Barangay', 'Employees', 'Payroll', 'Reports'].map((menu) => (
            <button
              key={menu}
              onClick={() => setActiveMenu(menu)}
              style={{
                ...styles.navMenuButton,
                color: activeMenu === menu ? '#00b4d8' : '#ffffff',
                borderBottom: activeMenu === menu ? '3px solid #00b4d8' : '3px solid transparent'
              }}
            >
              {menu}
            </button>
          ))}
        </div>
      </nav>

      {/* ================= MAIN BLUEPRINT ACTION BANNER ================= */}
      <div style={styles.actionSubHeaderArea}>
        <h1 style={styles.gradientSectionHeading}>
          Transaction <span style={styles.headingPixelIcon}>💧</span>
        </h1>
      </div>

      {/* ================= WORKSPACE SCREEN BLOCK ================= */}
      <div style={styles.workspaceBodyWrapper}>
        <div style={styles.dataLogTableCanvasCard}>
          
          {/* CONTROL SECTION ROW: Filtering, Searching, and Adding */}
          <div style={styles.tableControlsGridRow}>
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

            <div style={styles.filterGroupRightCluster}>
              <div style={styles.dropdownSelectContainer}>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={styles.nativeCustomSelect}
                >
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Unpaid</option>
                </select>
                <ChevronDown size={16} color="#0077b6" style={styles.dropdownChevronOverlay} />
              </div>

              <div style={styles.dropdownSelectContainer}>
                <select 
                  value={promoFilter} 
                  onChange={(e) => setPromoFilter(e.target.value)}
                  style={styles.nativeCustomSelect}
                >
                  <option>All Promo</option>
                  <option>Yes</option>
                  <option>—</option>
                </select>
                <ChevronDown size={16} color="#0077b6" style={styles.dropdownChevronOverlay} />
              </div>

              <button style={styles.addTransactionPrimaryActionButton}>
                <Plus size={16} /> Add Transaction
              </button>
            </div>
          </div>

          {/* DYNAMIC RED BATCH ACTION BAR (Triggers only when checkboxes are ticked) */}
          {selectedIds.length > 0 && (
            <div style={styles.batchActionAlertStrip}>
              <span style={styles.batchSelectionCountLabel}>{selectedIds.length} Selected</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBatchDelete} style={styles.batchDeleteActionButton}>Delete Selected</button>
                <button onClick={() => setSelectedIds([])} style={styles.batchCancelActionButton}>Cancel</button>
              </div>
            </div>
          )}

          {/* CENTRAL LEDGER DATA ELEMENT TABLE */}
          <table style={styles.ledgerTableMarkup}>
            <thead>
              <tr style={styles.tableHeadBorderRow}>
                <th style={{ ...styles.tableHeaderColumnCell, width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedIds.length === dbTransactions.length && dbTransactions.length > 0}
                    style={styles.tableBodyCheckboxInput}
                  />
                </th>
                <th style={styles.tableHeaderColumnCell}>TRANS ID</th>
                <th style={styles.tableHeaderColumnCell}>CUST ID</th>
                <th style={styles.tableHeaderColumnCell}>CUSTOMER</th>
                <th style={styles.tableHeaderColumnCell}>DATE</th>
                <th style={styles.tableHeaderColumnCell}>SERVICE</th>
                <th style={styles.tableHeaderColumnCell}>QTY</th>
                <th style={styles.tableHeaderColumnCell}>AMOUNT</th>
                <th style={styles.tableHeaderColumnCell}>PROMO</th>
                <th style={styles.tableHeaderColumnCell}>STATUS</th>
                <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {dbTransactions.map((tx) => (
                <tr key={tx.transId} style={styles.tableBodyDataRow}>
                  <td style={styles.tableBodyCellBlock}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(tx.transId)}
                      onChange={() => handleSelectRow(tx.transId)}
                      style={styles.tableBodyCheckboxInput}
                    />
                  </td>
                  <td style={styles.tableBodyCellBlock}>{tx.transId}</td>
                  <td style={styles.tableBodyCellBlock}>{tx.custId}</td>
                  <td style={{ ...styles.tableBodyCellBlock, color: '#334155', fontWeight: '600' }}>{tx.name}</td>
                  <td style={styles.tableBodyCellBlock}>{tx.date}</td>
                  <td style={styles.tableBodyCellBlock}>{tx.service}</td>
                  <td style={styles.tableBodyCellBlock}>{tx.qty}</td>
                  <td style={{ ...styles.tableBodyCellBlock, color: '#1e293b', fontWeight: '700' }}>₱{tx.amount.toFixed(2)}</td>
                  <td style={styles.tableBodyCellBlock}>
                    {tx.promo === 'Yes' ? (
                      <span style={styles.promoYesBadge}>Yes</span>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={styles.tableBodyCellBlock}>
                    <span style={{
                      ...styles.statusBadgeBase,
                      backgroundColor: tx.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                      color: tx.status === 'Paid' ? '#16a34a' : '#ef4444'
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={styles.tableBodyCellBlock}>
                    <div style={styles.inlineActionButtonsFlexGroup}>
                      <button onClick={() => openEditModal(tx)} style={styles.inlineRowEditButton}><Edit2 size={16} /></button>
                      <button onClick={() => handleInlineDelete(tx.transId)} style={styles.inlineRowDeleteButton}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>

      {/* ================= MODAL OVERLAY: EDIT TRANSACTION ================= */}
      {isEditModalOpen && editingTransaction && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={styles.modalHeaderTitleIconBox}>✏️</div>
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
                  <input type="text" value={editingTransaction.transId} disabled style={styles.modalDisabledInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>CUSTOMER LAST NAME</label>
                  <input 
                    type="text" 
                    value={editingTransaction.name.split(',')[0] || ''} 
                    onChange={(e) => {
                      const firstName = editingTransaction.name.split(',')[1] || '';
                      setEditingTransaction({ ...editingTransaction, name: `${e.target.value},${firstName}` });
                    }}
                    style={styles.modalActiveInputField} 
                  />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>CUSTOMER FIRST NAME</label>
                  <input 
                    type="text" 
                    value={(editingTransaction.name.split(',')[1] || '').trim()} 
                    onChange={(e) => {
                      const lastName = editingTransaction.name.split(',')[0] || '';
                      setEditingTransaction({ ...editingTransaction, name: `${lastName}, ${e.target.value}` });
                    }}
                    style={styles.modalActiveInputField} 
                  />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>SERVICE</label>
                  <input 
                    type="text" 
                    value={editingTransaction.service} 
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, service: e.target.value })}
                    style={styles.modalActiveInputField} 
                  />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>PRICE</label>
                  <input 
                    type="text" 
                    value={`₱${editingTransaction.amount.toFixed(2)}`} 
                    disabled 
                    style={styles.modalDisabledInputField} 
                  />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>QUANTITY</label>
                  <input 
                    type="number" 
                    value={editingTransaction.qty} 
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, qty: parseInt(e.target.value) || 0 })}
                    style={styles.modalActiveInputField} 
                  />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>PROMO</label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select 
                      value={editingTransaction.promo} 
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, promo: e.target.value })}
                      style={styles.modalNativeDropdownSelect}
                    >
                      <option value="Yes">YES</option>
                      <option value="—">NO</option>
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>STATUS</label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select 
                      value={editingTransaction.status} 
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, status: e.target.value })}
                      style={styles.modalNativeDropdownSelect}
                    >
                      <option value="Paid">PAID</option>
                      <option value="Unpaid">UNPAID</option>
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                </div>

              </div>

              {/* ACTION FOOTER SECTION ROW CONTROL */}
              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button 
                  type="button" 
                  onClick={() => handleInlineDelete(editingTransaction.transId)} 
                  style={styles.modalDangerActionDeleteButton}
                >
                  Delete
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  style={styles.modalDismissCancelButtonLink}
                >
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

    </div>
  );
}

// ================= STYLING STRUCTURAL GUIDE ENGINE =================
const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    boxSizing: 'border-box',
    fontFamily: 'sans-serif'
  },
  topNavbar: {
    height: '70px',
    backgroundColor: '#011627',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 30px',
    boxSizing: 'border-box',
    flexShrink: 0
  },
  navBrandBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  brandIconContainer: {
    fontSize: '1.4rem'
  },
  brandTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  brandMainTitle: {
    color: '#ffffff',
    fontSize: '1.15rem',
    fontWeight: 'bold',
    letterSpacing: '0.3px'
  },
  brandSubTitle: {
    color: '#00b4d8',
    fontSize: '0.68rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '1px'
  },
  navMenuLinksRow: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    gap: '4px'
  },
  navMenuButton: {
    background: 'none',
    border: 'none',
    height: '100%',
    padding: '0 16px',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  actionSubHeaderArea: {
    background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
    padding: '24px 40px',
    textAlign: 'left',
    boxSizing: 'border-box',
    flexShrink: 0
  },
  gradientSectionHeading: {
    color: '#ffffff',
    fontSize: '2.4rem',
    fontWeight: 'bold',
    margin: 0,
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headingPixelIcon: {
    fontSize: '2rem'
  },
  workspaceBodyWrapper: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#e6f2fa', // Soft teal-sky backdrop from screen imagery
    padding: '30px 40px',
    boxSizing: 'border-box'
  },
  dataLogTableCanvasCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #bde0fe',
    padding: '24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 79, 134, 0.05)'
  },
  tableControlsGridRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '20px',
    width: '100%',
    boxSizing: 'border-box'
  },
  searchBarBoxFrame: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    maxWidth: '560px'
  },
  searchLeftIcon: {
    position: 'absolute',
    left: '16px',
    pointerEvents: 'none'
  },
  searchFieldInput: {
    width: '100%',
    padding: '12px 16px 12px 46px',
    borderRadius: '8px',
    border: '1px solid #bde0fe',
    backgroundColor: '#eaf4fc',
    color: '#012a4a',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box'
  },
  filterGroupRightCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  dropdownSelectContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  nativeCustomSelect: {
    appearance: 'none',
    backgroundColor: '#eaf4fc',
    border: '1px solid #bde0fe',
    borderRadius: '8px',
    padding: '12px 40px 12px 18px',
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#014f86',
    outline: 'none',
    cursor: 'pointer'
  },
  dropdownChevronOverlay: {
    position: 'absolute',
    right: '14px',
    pointerEvents: 'none'
  },
  addTransactionPrimaryActionButton: {
    backgroundColor: '#ffffff',
    color: '#0077b6',
    border: '1px solid #0077b6',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  batchActionAlertStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffe3e3',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '12px 20px',
    marginBottom: '20px',
    width: '100%',
    boxSizing: 'border-box'
  },
  batchSelectionCountLabel: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: '0.95rem'
  },
  batchDeleteActionButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer'
  },
  batchCancelActionButton: {
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  ledgerTableMarkup: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeadBorderRow: {
    borderBottom: '2px solid #bde0fe'
  },
  tableHeaderColumnCell: {
    padding: '14px 10px',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.5px'
  },
  tableBodyDataRow: {
    borderBottom: '1px solid #e2e8f0',
    height: '52px'
  },
  tableBodyCellBlock: {
    padding: '10px',
    fontSize: '0.95rem',
    color: '#475569'
  },
  tableBodyCheckboxInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    borderRadius: '4px'
  },
  promoYesBadge: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.82rem',
    fontWeight: '700'
  },
  statusBadgeBase: {
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '700',
    display: 'inline-block'
  },
  inlineActionButtonsFlexGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  inlineRowEditButton: {
    backgroundColor: '#eaf4fc',
    border: 'none',
    borderRadius: '6px',
    color: '#0077b6',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  inlineRowDeleteButton: {
    backgroundColor: '#ffe3e3',
    border: 'none',
    borderRadius: '6px',
    color: '#ef4444',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },

  // ================= INTERACTIVE OVERLAY MODAL WINDOW SHIFT =================
  modalOverlayMask: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(1, 22, 39, 0.4)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  modalWindowContainer: {
    backgroundColor: '#e6f2fa', // Matching exact soft baby blue background inside window frame
    width: '90%',
    maxWidth: '680px',
    borderRadius: '24px',
    border: '2px solid #0077b6',
    padding: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  modalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    width: '100%'
  },
  modalHeaderTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  modalHeaderTitleIconBox: {
    fontSize: '1.5rem'
  },
  modalHeaderHeadingText: {
    fontSize: '1.75rem',
    fontWeight: '900',
    color: '#011627',
    margin: 0,
    letterSpacing: '0.5px'
  },
  modalHeaderCloseXButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px'
  },
  modalContentFormElement: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  modalFormInputFieldsDoubleColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px 24px',
    marginBottom: '32px',
    width: '100%'
  },
  modalFormInputGroupFieldUnit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%'
  },
  modalFormFieldLabelHeader: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#011627',
    marginBottom: '10px',
    letterSpacing: '0.3px'
  },
  modalDisabledInputField: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #bde0fe',
    backgroundColor: '#d0e4f2',
    color: '#64748b',
    fontSize: '0.98rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontWeight: '600'
  },
  modalActiveInputField: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #0077b6',
    backgroundColor: '#ffffff',
    color: '#012a4a',
    fontSize: '0.98rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontWeight: '600'
  },
  modalSelectFieldWrapperBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },
  modalNativeDropdownSelect: {
    appearance: 'none',
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #0077b6',
    backgroundColor: '#ffffff',
    color: '#012a4a',
    fontSize: '0.98rem',
    fontWeight: '700',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  modalSelectChevronOverlayIcon: {
    position: 'absolute',
    right: '16px',
    pointerEvents: 'none'
  },
  modalFooterButtonsControlFlexRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '14px',
    width: '100%'
  },
  modalDangerActionDeleteButton: {
    backgroundColor: '#fca5a5',
    color: '#b91c1c',
    border: '1px solid #f87171',
    borderRadius: '10px',
    padding: '14px 28px',
    fontSize: '0.98rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginRight: 'auto' // Pushes the delete button away to the far left side
  },
  modalDismissCancelButtonLink: {
    background: 'none',
    border: 'none',
    color: '#0077b6',
    fontWeight: '700',
    fontSize: '0.98rem',
    cursor: 'pointer',
    padding: '14px 20px'
  },
  modalPrimaryActionSaveButton: {
    backgroundColor: '#0077b6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 32px',
    fontSize: '0.98rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 119, 182, 0.25)'
  }
};

export default OwnerTransaction;