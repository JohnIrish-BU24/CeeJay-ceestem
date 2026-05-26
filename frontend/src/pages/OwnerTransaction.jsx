import React, { useState, useEffect } from 'react';
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
  const [dbTransactions, setDbTransactions] = useState([]);

  const fetchTransactions = async (query = '') => {
    try {
      const response = await fetch(`http://localhost:5000/api/transaction/?search=${query}`);
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
    // This fetch runs immediately when the component mounts
    fetchTransactions(searchQuery);
  }, []); // Empty dependency array means "run once on mount"

  useEffect(() => {
      // This fetch runs when user types
      const handler = setTimeout(() => {
          fetchTransactions(searchQuery);
      }, 200);
      return () => clearTimeout(handler);
  }, [searchQuery]); // Run when searchQuery changes

  // Master checkbox selection logic
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

  // Open inline modal for specific transaction row editing
  const openEditModal = (tx) => {
    // Safely combine names if needed, or handle missing data
    const fullName = `${tx.lname || ''}, ${tx.fname || ''}`;
    setEditingTransaction({ 
        ...tx, 
        name: fullName, // This ensures the Edit form has a valid string to split
        Remarks: tx.status // Match the backend field name
    });
    setIsEditModalOpen(true);
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:5000/api/transaction/${editingTransaction.Trans_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Remarks: editingTransaction.Remarks }) // Matches controller
      });
      setIsEditModalOpen(false);
      // Force reload to refresh table
      window.location.reload(); 
    } catch (err) { console.error(err); }
  };

  const handleInlineDelete = async (Trans_ID) => {
    if (!Trans_ID) {
        alert("Error: Cannot delete, Trans_ID is missing!");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/transaction/${Trans_ID}`, { 
            method: 'DELETE' 
        });
        
        if (response.ok) {
            console.log("Successfully deleted!");
            fetchTransactions(); // Refresh the table
        } else {
            const errorData = await response.json();
            alert("Delete failed: " + (errorData.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Network error:", err);
        alert("Check your backend server! It might not be running.");
    }
  };

  const handleBatchDelete = async () => {
    for (const id of selectedIds) {
      await fetch(`http://localhost:5000/api/transaction/${id}`, { method: 'DELETE' });
    }
    setSelectedIds([]);
    fetchTransactions();
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
          <div style={styles.scrollableTableContainer}>
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '40px' }}></th>
                  <th style={styles.tableHeaderColumnCell}>ID</th>
                  <th style={styles.tableHeaderColumnCell}>DATE</th>
                  <th style={styles.tableHeaderColumnCell}>CUSTOMER</th>
                  <th style={styles.tableHeaderColumnCell}>REFILLER</th>
                  <th style={styles.tableHeaderColumnCell}>DRIVER</th>
                  <th style={styles.tableHeaderColumnCell}>QTY</th>
                  <th style={styles.tableHeaderColumnCell}>PRICE</th>
                  <th style={styles.tableHeaderColumnCell}>SERVICE</th>
                  <th style={styles.tableHeaderColumnCell}>STATUS</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {dbTransactions.map((tx, index) => (
                  <tr key={index} style={styles.tableBodyDataRow}>
                    <td style={styles.tableBodyCellBlock}>
                      <input type="checkbox" onChange={() => handleSelectRow(tx.Trans_ID)} style={styles.tableBodyCheckboxInput}/>
                    </td>
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
                  <input type="text" value={editingTransaction.Trans_ID} disabled style={styles.modalDisabledInputField} />
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
                  onClick={() => handleInlineDelete(editingTransaction.Trans_ID)} 
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
    padding: '20px ',
    boxSizing: 'border-box',
    display: 'flex', // Add this
    flexDirection: 'column'
  },
  dataLogTableCanvasCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #bde0fe',
    padding: '30px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 79, 134, 0.05)',
    height: 'calc(100vh - 110px)', 
    width: '100%',
    overflow: 'hidden'
  },
  tableScrollContainer: {
    flex: 1, 
    overflowY: 'auto',  
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0
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
    textAlign: 'left',
    tableLayout: 'fixed', 
  },
  tableHeadBorderRow: {
    borderBottom: '2px solid #bde0fe'
  },
  scrollableTableContainer: {
    overflowY: 'auto',  
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
  },
  tableHeaderColumnCell: {
    padding: '14px 10px',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.5px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    position: 'sticky', 
    top: 0,            
    backgroundColor: '#ffffff', 
    zIndex: 10,        
    borderBottom: '2px solid #bde0fe'
  },
  tableBodyDataRow: {
    borderBottom: '1px solid #e2e8f0',
    height: '52px'
  },
  tableBodyCellBlock: {
    padding: '10px',
    fontSize: '0.95rem',
    color: '#475569',
    wordWrap: 'break-word'
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