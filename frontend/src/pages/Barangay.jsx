import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Edit2, Trash2, Plus, X } from 'lucide-react';

function Barangay({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Navigation active state based on current URL path
  const currentPath = location.pathname;

  // Descriptive state variables for data management
  const [barangayDataList, setBarangayDataList] = useState([]);
  const [searchPhrase, setSearchPhrase] = useState('');
  
  // Modal visibility states
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
  
  // Batch selection state
  const [selectedBarangayIdentifiers, setSelectedBarangayIdentifiers] = useState([]);
  
  // Form data states
  const [newBarangayDetails, setNewBarangayDetails] = useState({ Barangay_ID: '', Barangay_Name: '', Purok: '' });
  const [draftBarangayEdits, setDraftBarangayEdits] = useState(null);

  const fetchBarangayRecords = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/barangay');
      const rawData = await response.json();
      
      // Simple client-side search filtering
      const filteredData = searchPhrase 
        ? rawData.filter(item => 
            item.Barangay_Name.toLowerCase().includes(searchPhrase.toLowerCase()) || 
            item.Barangay_ID.toString().includes(searchPhrase)
          )
        : rawData;
        
      setBarangayDataList(filteredData);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchBarangayRecords();
  }, [searchPhrase]); 

  // --- Handlers for Add, Edit, Delete ---

  const handleAddNewBarangaySubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/barangay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBarangayDetails)
      });
      if (response.ok) {
        setIsAddEntryModalOpen(false);
        setNewBarangayDetails({ Barangay_ID: '', Barangay_Name: '', Purok: '' });
        fetchBarangayRecords();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  const handleSaveBarangayEdits = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/barangay/${draftBarangayEdits.Barangay_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Barangay_Name: draftBarangayEdits.Barangay_Name,
          Purok: draftBarangayEdits.Purok
        })
      });
      if (response.ok) {
        setIsEditEntryModalOpen(false);
        fetchBarangayRecords();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleInlineRecordDelete = async (identifier) => {
    if (!window.confirm("Are you sure you want to delete this Barangay?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/barangay/${identifier}`, { method: 'DELETE' });
      if (response.ok) {
        fetchBarangayRecords();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleBatchRecordDelete = async () => {
    if (!window.confirm(`Delete ${selectedBarangayIdentifiers.length} barangays?`)) return;
    for (const id of selectedBarangayIdentifiers) {
      await fetch(`http://localhost:5000/api/barangay/${id}`, { method: 'DELETE' });
    }
    setSelectedBarangayIdentifiers([]);
    fetchBarangayRecords();
  };

  // Checkbox Logic
  const handleToggleAllSelection = (e) => {
    if (e.target.checked) setSelectedBarangayIdentifiers(barangayDataList.map(b => b.Barangay_ID));
    else setSelectedBarangayIdentifiers([]);
  };

  const handleToggleSingleSelection = (identifier) => {
    if (selectedBarangayIdentifiers.includes(identifier)) {
      setSelectedBarangayIdentifiers(selectedBarangayIdentifiers.filter(id => id !== identifier));
    } else {
      setSelectedBarangayIdentifiers([...selectedBarangayIdentifiers, identifier]);
    }
  };

  // --- Navigation Ribbon Click Handler ---
  const handleRibbonNavigation = (menuName) => {
    if (menuName === 'Transaction') navigate('/transaction');
    else if (menuName === 'Customers') navigate('/customers');
    else if (menuName === 'Barangay') navigate('/barangay');
    else alert(`${menuName} page not yet implemented`);
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
          {['Dashboard', 'Transaction', 'Services', 'Customers', 'Barangay', 'Employees', 'Payroll', 'Reports'].map((menu) => {
            const isActive = (menu === 'Barangay' && currentPath === '/barangay') || (menu === 'Transaction' && currentPath === '/transaction');
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

      {/* ================= WORKSPACE SCREEN BLOCK ================= */}
      <div style={styles.workspaceBodyWrapper}>
        <div style={styles.dataLogTableCanvasCard}>
          
          {/* CONTROL SECTION ROW */}
          <div style={styles.tableControlsGridRow}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
              <div style={styles.searchBarBoxFrame}>
                <Search size={18} color="#0077b6" style={styles.searchLeftIcon} />
                <input 
                  type="text" 
                  placeholder="Search by Barangay Name or ID..." 
                  value={searchPhrase}
                  onChange={(e) => setSearchPhrase(e.target.value)}
                  style={styles.searchFieldInput}
                />
              </div>
            </div>

            <button 
              onClick={() => setIsAddEntryModalOpen(true)}
              style={styles.addPrimaryActionButton}
            >
              <Plus size={16} /> Add Barangay
            </button>
          </div>

          {/* DYNAMIC BATCH ACTION BAR */}
          {selectedBarangayIdentifiers.length > 0 && (
            <div style={styles.batchActionAlertStrip}>
              <span style={styles.batchSelectionCountLabel}>{selectedBarangayIdentifiers.length} Selected</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBatchRecordDelete} style={styles.batchDeleteActionButton}>Delete Selected</button>
                <button onClick={() => setSelectedBarangayIdentifiers([])} style={styles.batchCancelActionButton}>Cancel</button>
              </div>
            </div>
          )}

          {/* CENTRAL LEDGER DATA ELEMENT TABLE */}
          <div style={styles.scrollableTableContainer}>
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleToggleAllSelection}
                      checked={selectedBarangayIdentifiers.length === barangayDataList.length && barangayDataList.length > 0}
                      style={styles.tableBodyCheckboxInput}
                    />
                  </th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '120px' }}>BARANGAY ID</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '300px' }}>BARANGAY NAME</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '120px' }}>PUROK</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center', width: '150px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {barangayDataList.map((barangay) => (
                  <tr key={barangay.Barangay_ID} style={styles.tableBodyDataRow}>
                    <td style={{ ...styles.tableBodyCellBlock, textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedBarangayIdentifiers.includes(barangay.Barangay_ID)}
                        onChange={() => handleToggleSingleSelection(barangay.Barangay_ID)}
                        style={styles.tableBodyCheckboxInput}
                      />
                    </td>
                    <td style={styles.tableBodyCellBlock}><strong>{barangay.Barangay_ID}</strong></td>
                    <td style={styles.tableBodyCellBlock}>{barangay.Barangay_Name}</td>
                    <td style={styles.tableBodyCellBlock}>{barangay.Purok}</td>
                    <td style={styles.tableBodyCellBlock}>
                      <div style={styles.inlineActionButtonsFlexGroup}>
                        <button 
                          onClick={() => { setDraftBarangayEdits({...barangay}); setIsEditEntryModalOpen(true); }} 
                          style={styles.inlineRowEditButton}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleInlineRecordDelete(barangay.Barangay_ID)} 
                          style={styles.inlineRowDeleteButton}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {barangayDataList.length === 0 && (
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>No barangays found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODAL OVERLAY: ADD BARANGAY ================= */}
      {isAddEntryModalOpen && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Plus size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>ADD BARANGAY</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsAddEntryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNewBarangaySubmit} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>BARANGAY ID <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  required
                  value={newBarangayDetails.Barangay_ID} 
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
                    setNewBarangayDetails({...newBarangayDetails, Barangay_ID: onlyNumbers});
                  }} 
                  style={{...styles.modalActiveInputField, marginBottom: '20px'}} 
                  placeholder="e.g. 1"
                />
              </div>
              
              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>BARANGAY NAME <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  required
                  value={newBarangayDetails.Barangay_Name} 
                  onChange={(e) => setNewBarangayDetails({...newBarangayDetails, Barangay_Name: e.target.value})} 
                  style={{...styles.modalActiveInputField, marginBottom: '20px'}} 
                  placeholder="e.g. Peñafrancia"
                />
              </div>

              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>PUROK <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  required
                  value={newBarangayDetails.Purok} 
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
                    setNewBarangayDetails({...newBarangayDetails, Purok: onlyNumbers});
                  }} 
                  style={{...styles.modalActiveInputField, marginBottom: '32px'}} 
                  placeholder="e.g. 1"
                />
              </div>

              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsAddEntryModalOpen(false)} style={styles.modalDismissCancelButtonLink}>Cancel</button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>Add Barangay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL OVERLAY: EDIT BARANGAY ================= */}
      {isEditEntryModalOpen && draftBarangayEdits && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Edit2 size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>EDIT BARANGAY</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsEditEntryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBarangayEdits} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>BARANGAY ID</label>
                <input 
                  type="text" 
                  value={draftBarangayEdits.Barangay_ID} 
                  disabled 
                  style={{...styles.modalDisabledInputField, marginBottom: '20px'}} 
                />
              </div>
              
              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>BARANGAY NAME <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  required
                  value={draftBarangayEdits.Barangay_Name} 
                  onChange={(e) => setDraftBarangayEdits({...draftBarangayEdits, Barangay_Name: e.target.value})} 
                  style={{...styles.modalActiveInputField, marginBottom: '20px'}} 
                />
              </div>

              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>PUROK <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  required
                  value={draftBarangayEdits.Purok} 
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setDraftBarangayEdits({...draftBarangayEdits, Purok: numericValue});
                  }} 
                  style={{...styles.modalActiveInputField, marginBottom: '32px'}} 
                />
              </div>

              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsEditEntryModalOpen(false)} style={styles.modalDismissCancelButtonLink}>Cancel</button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>Save Changes</button>
              </div>
            </form>
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
  workspaceBodyWrapper: { flex: 1, overflowY: 'auto', backgroundColor: '#e6f2fa', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  dataLogTableCanvasCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #bde0fe', padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0, 79, 134, 0.05)', height: 'calc(100vh - 110px)', width: '100%', overflow: 'hidden' },
  tableControlsGridRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', width: '100%', boxSizing: 'border-box' },
  searchBarBoxFrame: { position: 'relative', display: 'flex', alignItems: 'center', flex: '0 1 400px', maxWidth: '560px' },
  searchLeftIcon: { position: 'absolute', left: '16px', pointerEvents: 'none' },
  searchFieldInput: { width: '100%', padding: '12px 16px 12px 46px', borderRadius: '8px', border: '1px solid #bde0fe', backgroundColor: '#eaf4fc', color: '#012a4a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  addPrimaryActionButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0, 119, 182, 0.2)' },
  batchActionAlertStrip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffe3e3', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 20px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' },
  batchSelectionCountLabel: { color: '#b91c1c', fontWeight: '700', fontSize: '0.95rem' },
  batchDeleteActionButton: { backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer' },
  batchCancelActionButton: { backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 16px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' },
  ledgerTableMarkup: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' },
  tableHeadBorderRow: { borderBottom: '2px solid #bde0fe' },
  scrollableTableContainer: { overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' },
  tableHeaderColumnCell: { padding: '14px 10px', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10, borderBottom: '2px solid #bde0fe' },
  tableBodyDataRow: { borderBottom: '1px solid #e2e8f0', height: '52px' },
  tableBodyCellBlock: { padding: '12px 10px', fontSize: '0.9rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tableBodyCheckboxInput: { width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' },
  inlineActionButtonsFlexGroup: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  inlineRowEditButton: { backgroundColor: '#eaf4fc', border: 'none', borderRadius: '6px', color: '#0077b6', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowDeleteButton: { backgroundColor: '#ffe3e3', border: 'none', borderRadius: '6px', color: '#ef4444', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  modalOverlayMask: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalWindowContainer: { backgroundColor: '#ffffff', width: '90%', maxWidth: '450px', borderRadius: '12px', border: '1px solid #0077b6', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  modalHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' },
  modalHeaderTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #bde0fe', paddingBottom: '15px' },
  modalHeaderTitleIconBox: { fontSize: '1.5rem', display: 'flex' },
  modalHeaderHeadingText: { fontSize: '1.25rem', fontWeight: '700', color: '#011627', margin: 0 },
  modalHeaderCloseXButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
  modalContentFormElement: { display: 'flex', flexDirection: 'column', width: '100%' },
  modalFormInputGroupFieldUnit: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' },
  modalFormFieldLabelHeader: { fontSize: '0.85rem', fontWeight: '800', color: '#011627', marginBottom: '10px', letterSpacing: '0.3px' },
  modalDisabledInputField: { width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #bde0fe', backgroundColor: '#d0e4f2', color: '#64748b', fontSize: '0.98rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' },
  modalActiveInputField: { width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.98rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' },
  modalFooterButtonsControlFlexRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px', width: '100%' },
  modalDismissCancelButtonLink: { background: 'none', border: 'none', color: '#0077b6', fontWeight: '700', fontSize: '0.98rem', cursor: 'pointer', padding: '14px 20px' },
  modalPrimaryActionSaveButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '0.98rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 119, 182, 0.25)' }
};

export default Barangay;