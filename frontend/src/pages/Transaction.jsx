import CeeStemLogo from '../assets/CeeStem.png';
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Trash2, X, RotateCcw, LogOut, Trash, Info, Edit, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

function Transaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [viewMode, setViewMode] = useState('Active'); 
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [dbTransactions, setDbTransactions] = useState([]);
  
  // New states for editing and tooltips
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingStatus, setEditingStatus] = useState('');
  const [showNoticeTooltip, setShowNoticeTooltip] = useState(false);

  const fetchTransactions = async (query = '', range = 'All Time', mode = 'Active') => {
    try {
        const statusParam = mode === 'Trash' ? 'Archived' : 'Active'; 
        const url = `http://localhost:5000/api/transaction/?search=${encodeURIComponent(query.trim())}&dateRange=${encodeURIComponent(range.trim())}&status=${statusParam}`;
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
        status: tx.Remarks || 'Unpaid' // Defaulting to Unpaid if empty, adjust as needed
      }));
      setDbTransactions(formatted);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTransactions(searchQuery, dateFilter, viewMode);
  }, []);

  useEffect(() => {
      const handler = setTimeout(() => {
          fetchTransactions(searchQuery, dateFilter, viewMode);
      }, 0);
      return () => clearTimeout(handler);
  }, [searchQuery, dateFilter, viewMode]);

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
  
  // NEW: Save Status Handler
  const handleSaveStatus = async (Trans_ID) => {
    try {
        // Adjust this endpoint if your backend route for updating status is named differently.
        // I am passing the status as "Remarks" based on your mapping.
        const response = await fetch(`http://localhost:5000/api/transaction/${Trans_ID}/status`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Remarks: editingStatus })
        });
        
        if (response.ok) {
            setEditingRowId(null);
            fetchTransactions(searchQuery, dateFilter, viewMode); 
        } else {
            const errorData = await response.json();
            alert("Failed to update status: " + (errorData.error || "Unknown error"));
        }
    } catch (err) { console.error("Network error:", err); }
  };

  const handleMoveToTrash = async (Trans_ID) => {
    if (!Trans_ID) return;
    const isConfirmed = window.confirm("Move this transaction to the Trash Bin?");
    if (!isConfirmed) return;

    try {
        const response = await fetch(`http://localhost:5000/api/transaction/${Trans_ID}/archive`, { 
            method: 'PUT' 
        });
        
        if (response.ok) {
            fetchTransactions(searchQuery, dateFilter, viewMode); 
        } else {
            const errorData = await response.json();
            alert("Action failed: " + (errorData.error || "Unknown error"));
        }
    } catch (err) { console.error("Network error:", err); }
  };

  const handleRestore = async (Trans_ID) => {
    try {
      const response = await fetch(`http://localhost:5000/api/transaction/${Trans_ID}/restore`, { 
          method: 'PUT' 
      });
      if (response.ok) {
          fetchTransactions(searchQuery, dateFilter, viewMode); 
      }
    } catch (err) { console.error("Network error:", err); }
  };

  const handleBatchTrash = async () => {
    const isConfirmed = window.confirm(`Move ${selectedIds.length} transactions to the Trash Bin?`);
    if (!isConfirmed) return;

    for (const id of selectedIds) {
      await fetch(`http://localhost:5000/api/transaction/${id}/archive`, { method: 'PUT' });
    }
    setSelectedIds([]);
    fetchTransactions(searchQuery, dateFilter, viewMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('activeEmployee');
    window.location.href = '/login'; 
  };

  const handleRibbonNavigation = (menuName) => {
    if (menuName === 'Dashboard') navigate('/dashboard'); // 📍 This is the new line!
    else if (menuName === 'Transaction') navigate('/transaction');
    else if (menuName === 'Barangay') navigate('/barangay');
    else if (menuName === 'Customers') navigate('/customers');
    else if (menuName === 'Services') navigate('/services');
    else if (menuName === 'Employees') navigate('/employees');
    else if (menuName === 'Payroll') navigate('/payroll');
    else if (menuName === 'Reports') navigate('/reports');
    else alert(`${menuName} page not yet implemented`);
  };

  return (
    <div style={styles.appContainer}>
      
      <nav style={styles.topNavbar}>
        <div style={styles.navBrandBlock}>
          <img src={CeeStemLogo} alt="CeeStem Logo" style={styles.brandLogo} />
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
          
          <div style={styles.navDivider}></div>
          <button onClick={handleLogout} style={styles.signOutButton}>
            <LogOut size={16} /> Sign Out
          </button>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Notice Tooltip applied here on the active view */}
              {viewMode === 'Active' && (
                <div 
                  style={styles.tooltipWrapper}
                  onMouseEnter={() => setShowNoticeTooltip(true)}
                  onMouseLeave={() => setShowNoticeTooltip(false)}
                >
                  <Info size={20} color="#0077b6" style={{ cursor: 'pointer' }} />
                  {showNoticeTooltip && (
                    <div style={styles.tooltipBox}>
                      Valid logs auto-delete after 5 years.
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => setViewMode(viewMode === 'Active' ? 'Trash' : 'Active')} 
                style={{...styles.archiveToggleBtn, backgroundColor: viewMode === 'Trash' ? '#fee2e2' : '#ffffff', color: viewMode === 'Trash' ? '#b91c1c' : '#475569', borderColor: viewMode === 'Trash' ? '#fca5a5' : '#cbd5e1'}}
              >
                <Trash size={16} /> {viewMode === 'Active' ? 'View Trash Bin' : 'Back to Active'}
              </button>
            </div>
          </div>

          {viewMode === 'Trash' && (
            <div style={styles.trashNoticeBanner}>
               <Info size={18} />
               <span><strong>Notice:</strong> Transactions in the Trash Bin are permanently deleted automatically after 90 days.</span>
            </div>
          )}

          {selectedIds.length > 0 && viewMode === 'Active' && (
            <div style={styles.batchActionAlertStrip}>
              <span style={styles.batchSelectionCountLabel}>{selectedIds.length} Selected</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBatchTrash} style={styles.batchDeleteActionButton}>Move to Trash</button>
                <button onClick={() => setSelectedIds([])} style={styles.batchCancelActionButton}>Cancel</button>
              </div>
            </div>
          )}

          <div style={styles.scrollableTableContainer}>
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  {viewMode === 'Active' && (
                     <th style={{ ...styles.tableHeaderColumnCell, width: '40px', paddingLeft: '16px' }}>
                       <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === dbTransactions.length && dbTransactions.length > 0} />
                     </th>
                  )}
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
                    {viewMode === 'Active' && (
                       <td style={{ ...styles.tableBodyCellBlock, paddingLeft: '16px' }}>
                         <input type="checkbox" checked={selectedIds.includes(tx.Trans_ID)} onChange={() => handleSelectRow(tx.Trans_ID)} />
                       </td>
                    )}
                    <td style={styles.tableBodyCellBlock}>{tx.Trans_ID}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.date}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.customer}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.refiller}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.driver}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.qty}</td>
                    <td style={{ ...styles.tableBodyCellBlock, fontWeight: '700' }}>₱{tx.amount.toFixed(2)}</td>
                    <td style={styles.tableBodyCellBlock}>{tx.service}</td>
                    <td style={styles.tableBodyCellBlock}>
                      {/* Inline Status Edit Dropdown */}
                      {editingRowId === tx.Trans_ID ? (
                        <select 
                          value={editingStatus} 
                          onChange={(e) => setEditingStatus(e.target.value)}
                          style={styles.inlineStatusEditSelect}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                        </select>
                      ) : (
                        <span style={{ 
                          color: tx.status?.toLowerCase() === 'unpaid' ? '#ef4444' : '#16a34a',
                          fontWeight: '600'
                        }}>
                          {tx.status}
                        </span>
                      )}
                    </td>
                    <td style={styles.tableBodyCellBlock}>
                      <div style={styles.inlineActionButtonsFlexGroup}>
                        {viewMode === 'Active' ? (
                           <>
                             {/* Toggles between Edit/Save based on editingRowId */}
                             {editingRowId === tx.Trans_ID ? (
                                <>
                                  <button onClick={() => handleSaveStatus(tx.Trans_ID)} style={styles.inlineRowSaveButton} title="Save Status">
                                    <Check size={16} />
                                  </button>
                                  <button onClick={() => setEditingRowId(null)} style={styles.inlineRowCancelButton} title="Cancel">
                                    <X size={16} />
                                  </button>
                                </>
                             ) : (
                                <>
                                  <button 
                                    onClick={() => { setEditingRowId(tx.Trans_ID); setEditingStatus(tx.status); }} 
                                    style={styles.inlineRowEditButton} 
                                    title="Edit Status"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button onClick={() => handleMoveToTrash(tx.Trans_ID)} style={styles.inlineRowDeleteButton} title="Move to Trash">
                                    <Trash2 size={16} />
                                  </button>
                                </>
                             )}
                           </>
                        ) : (
                           <button onClick={() => handleRestore(tx.Trans_ID)} style={styles.inlineRowRestoreButton} title="Restore Transaction">
                             <RotateCcw size={16} /> Restore
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  brandLogo: {width: '60px', height: '60px', objectFit: 'contain'},
  appContainer: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#ffffff', overflow: 'hidden', position: 'fixed', top: 0, left: 0, boxSizing: 'border-box', fontFamily: 'sans-serif' },
  topNavbar: { height: '70px', backgroundColor: '#011627', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', flexShrink: 0 },
  navBrandBlock: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandTextGroup: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  brandMainTitle: { color: '#ffffff', fontSize: '1.15rem', fontWeight: 'bold', letterSpacing: '0.3px' },
  brandSubTitle: { color: '#00b4d8', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' },
  navMenuLinksRow: { display: 'flex', height: '100%', alignItems: 'center', gap: '4px' },
  navMenuButton: { background: 'none', border: 'none', height: '100%', padding: '0 16px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s ease' },
  navDivider: { width: '2px', height: '24px', backgroundColor: '#00b4d8', margin: '0 10px', opacity: 0.5 },
  signOutButton: { backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', height: '36px', padding: '0 16px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' },
  archiveToggleBtn: { border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', padding: '12px 16px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
  workspaceBodyWrapper: { flex: 1, overflowY: 'auto', backgroundColor: '#e6f2fa', padding: '20px ', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  dataLogTableCanvasCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #bde0fe', padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0, 79, 134, 0.05)', height: 'calc(100vh - 110px)', width: '100%', overflow: 'hidden' },
  tableControlsGridRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', width: '100%', boxSizing: 'border-box' },
  searchBarBoxFrame: { position: 'relative', display: 'flex', alignItems: 'center', flex: '0 1 400px', maxWidth: '560px' },
  searchLeftIcon: { position: 'absolute', left: '16px', pointerEvents: 'none' },
  searchFieldInput: { width: '100%', padding: '12px 16px 12px 46px', borderRadius: '8px', border: '1px solid #bde0fe', backgroundColor: '#eaf4fc', color: '#012a4a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  dropdownSelectContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  nativeCustomSelect: { appearance: 'none', backgroundColor: '#eaf4fc', border: '1px solid #bde0fe', borderRadius: '8px', padding: '12px 40px 12px 18px', fontSize: '0.92rem', fontWeight: '600', color: '#014f86', outline: 'none', cursor: 'pointer' },
  dropdownChevronOverlay: { position: 'absolute', right: '14px', pointerEvents: 'none' },
  
  trashNoticeBanner: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff8f1', borderLeft: '4px solid #f97316', padding: '12px 20px', borderRadius: '4px', color: '#9a3412', marginBottom: '20px', fontSize: '0.9rem' },

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
  inlineRowDeleteButton: { backgroundColor: '#ffe3e3', border: 'none', borderRadius: '6px', color: '#ef4444', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' },
  inlineRowRestoreButton: { backgroundColor: '#dcfce7', border: 'none', borderRadius: '6px', color: '#16a34a', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  
  // New Styles added for the inline edit and tooltip
  inlineRowEditButton: { backgroundColor: '#e0f2fe', border: 'none', borderRadius: '6px', color: '#0284c7', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' },
  inlineRowSaveButton: { backgroundColor: '#dcfce7', border: 'none', borderRadius: '6px', color: '#16a34a', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' },
  inlineRowCancelButton: { backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#64748b', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' },
  inlineStatusEditSelect: { padding: '6px', borderRadius: '4px', border: '1px solid #0ea5e9', outline: 'none', fontSize: '0.85rem', color: '#0f172a' },
  tooltipWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  tooltipBox: { position: 'absolute', right: '0', top: '130%', backgroundColor: '#1e293b', color: '#ffffff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', width: '220px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 100, pointerEvents: 'none' }
};

export default Transaction;