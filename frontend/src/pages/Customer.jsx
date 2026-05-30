import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Edit2, Trash2, Plus, X } from 'lucide-react';

function Customer({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [customerDataList, setCustomerDataList] = useState([]);
  const [barangayOptions, setBarangayOptions] = useState([]);
  const [searchPhrase, setSearchPhrase] = useState('');
  
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
  const [selectedCustomerIdentifiers, setSelectedCustomerIdentifiers] = useState([]);
  
  const [newCustomerDetails, setNewCustomerDetails] = useState({ Cust_ID: '', Cust_FName: '', Cust_LName: '', Barangay_ID: '', Cust_Type: 'Personal', Borrowed_Cont: 0 });
  const [draftCustomerEdits, setDraftCustomerEdits] = useState(null);

  const fetchCustomerRecords = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customer');
      const rawData = await response.json();
      
      const filteredData = searchPhrase 
        ? rawData.filter(item => 
            item.Cust_LName.toLowerCase().includes(searchPhrase.toLowerCase()) || 
            item.Cust_FName.toLowerCase().includes(searchPhrase.toLowerCase()) || 
            item.Cust_ID.toString().includes(searchPhrase)
          )
        : rawData;
        
      setCustomerDataList(filteredData);
    } catch (error) { console.error("Fetch error:", error); }
  };

  const fetchBarangays = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/barangay');
      const data = await response.json();
      setBarangayOptions(data);
      if (data.length > 0) {
        setNewCustomerDetails(prev => ({ ...prev, Barangay_ID: data[0].Barangay_ID }));
      }
    } catch (err) { console.error("Failed to load barangays"); }
  };

  useEffect(() => {
    fetchCustomerRecords();
  }, [searchPhrase]); 

  useEffect(() => {
    fetchBarangays();
  }, []);

  const handleAddNewCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerDetails)
      });
      if (response.ok) {
        setIsAddEntryModalOpen(false);
        setNewCustomerDetails({ Cust_ID: '', Cust_FName: '', Cust_LName: '', Barangay_ID: barangayOptions[0]?.Barangay_ID || '', Cust_Type: 'Personal', Borrowed_Cont: 0 });
        fetchCustomerRecords();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (err) { console.error("Submission error:", err); }
  };

  const handleSaveCustomerEdits = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/customer/${draftCustomerEdits.Cust_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Cust_FName: draftCustomerEdits.Cust_FName,
          Cust_LName: draftCustomerEdits.Cust_LName,
          Barangay_ID: draftCustomerEdits.Barangay_ID,
          Cust_Type: draftCustomerEdits.Cust_Type,
          Borrowed_Cont: draftCustomerEdits.Borrowed_Cont
        })
      });
      if (response.ok) {
        setIsEditEntryModalOpen(false);
        fetchCustomerRecords();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (err) { console.error("Update error:", err); }
  };

  const handleInlineRecordDelete = async (identifier) => {
    if (!window.confirm("Are you sure you want to delete this Customer?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/customer/${identifier}`, { method: 'DELETE' });
      if (response.ok) { fetchCustomerRecords(); }
      else { const err = await response.json(); alert(err.error); }
    } catch (err) { console.error("Delete error:", err); }
  };

  const handleBatchRecordDelete = async () => {
    if (!window.confirm(`Delete ${selectedCustomerIdentifiers.length} customers?`)) return;
    for (const id of selectedCustomerIdentifiers) {
      await fetch(`http://localhost:5000/api/customer/${id}`, { method: 'DELETE' });
    }
    setSelectedCustomerIdentifiers([]);
    fetchCustomerRecords();
  };

  const handleToggleAllSelection = (e) => {
    if (e.target.checked) setSelectedCustomerIdentifiers(customerDataList.map(c => c.Cust_ID));
    else setSelectedCustomerIdentifiers([]);
  };

  const handleToggleSingleSelection = (identifier) => {
    if (selectedCustomerIdentifiers.includes(identifier)) {
      setSelectedCustomerIdentifiers(selectedCustomerIdentifiers.filter(id => id !== identifier));
    } else {
      setSelectedCustomerIdentifiers([...selectedCustomerIdentifiers, identifier]);
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
                             (menu === 'Transaction' && currentPath === '/transaction') ||
                             (menu === 'Customers' && currentPath === '/customers');
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
                  placeholder="Search by Name or ID..." 
                  value={searchPhrase}
                  onChange={(e) => setSearchPhrase(e.target.value)}
                  style={styles.searchFieldInput}
                />
              </div>
            </div>

            <button onClick={() => setIsAddEntryModalOpen(true)} style={styles.addPrimaryActionButton}>
              <Plus size={16} /> Add Customer
            </button>
          </div>

          {selectedCustomerIdentifiers.length > 0 && (
            <div style={styles.batchActionAlertStrip}>
              <span style={styles.batchSelectionCountLabel}>{selectedCustomerIdentifiers.length} Selected</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBatchRecordDelete} style={styles.batchDeleteActionButton}>Delete Selected</button>
                <button onClick={() => setSelectedCustomerIdentifiers([])} style={styles.batchCancelActionButton}>Cancel</button>
              </div>
            </div>
          )}

          <div style={styles.scrollableTableContainer}>
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" onChange={handleToggleAllSelection} checked={selectedCustomerIdentifiers.length === customerDataList.length && customerDataList.length > 0} style={styles.tableBodyCheckboxInput} />
                  </th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '60px' }}>ID</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '130px' }}>FIRST NAME</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '130px' }}>LAST NAME</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '160px' }}>BARANGAY</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>TYPE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>BORROWED</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center', width: '120px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {customerDataList.map((cust) => (
                  <tr key={cust.Cust_ID} style={styles.tableBodyDataRow}>
                    <td style={{ ...styles.tableBodyCellBlock, textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedCustomerIdentifiers.includes(cust.Cust_ID)} onChange={() => handleToggleSingleSelection(cust.Cust_ID)} style={styles.tableBodyCheckboxInput} />
                    </td>
                    <td style={styles.tableBodyCellBlock}><strong>{cust.Cust_ID}</strong></td>
                    <td style={styles.tableBodyCellBlock}>{cust.Cust_FName}</td>
                    <td style={styles.tableBodyCellBlock}>{cust.Cust_LName}</td>
                    <td style={styles.tableBodyCellBlock}>{cust.Barangay_Name} (P{cust.Purok})</td>
                    <td style={styles.tableBodyCellBlock}>
                       <span style={{ 
                         ...styles.typeBadge, 
                         backgroundColor: cust.Cust_Type === 'Reseller' ? '#e0e7ff' : '#dcfce7',
                         color: cust.Cust_Type === 'Reseller' ? '#3730a3' : '#166534'
                       }}>
                         {cust.Cust_Type}
                       </span>
                    </td>
                    <td style={styles.tableBodyCellBlock}>{cust.Borrowed_Cont}</td>
                    <td style={styles.tableBodyCellBlock}>
                      <div style={styles.inlineActionButtonsFlexGroup}>
                        <button onClick={() => { setDraftCustomerEdits({...cust}); setIsEditEntryModalOpen(true); }} style={styles.inlineRowEditButton}><Edit2 size={16} /></button>
                        <button onClick={() => handleInlineRecordDelete(cust.Cust_ID)} style={styles.inlineRowDeleteButton}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODAL: ADD CUSTOMER ================= */}
      {isAddEntryModalOpen && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Plus size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>ADD CUSTOMER</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsAddEntryModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddNewCustomerSubmit} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputFieldsDoubleColumnGrid}>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>CUSTOMER ID <span style={{color: 'red'}}>*</span></label>
                  <input type="number" required min="1" value={newCustomerDetails.Cust_ID} onChange={(e) => setNewCustomerDetails({...newCustomerDetails, Cust_ID: e.target.value})} style={styles.modalActiveInputField} />
                </div>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>TYPE <span style={{color: 'red'}}>*</span></label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select value={newCustomerDetails.Cust_Type} onChange={(e) => setNewCustomerDetails({...newCustomerDetails, Cust_Type: e.target.value})} style={styles.modalNativeDropdownSelect}>
                      <option value="Personal">Personal</option>
                      <option value="Reseller">Reseller</option>
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>FIRST NAME <span style={{color: 'red'}}>*</span></label>
                  <input type="text" required value={newCustomerDetails.Cust_FName} onChange={(e) => setNewCustomerDetails({...newCustomerDetails, Cust_FName: e.target.value})} style={styles.modalActiveInputField} />
                </div>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>LAST NAME <span style={{color: 'red'}}>*</span></label>
                  <input type="text" required value={newCustomerDetails.Cust_LName} onChange={(e) => setNewCustomerDetails({...newCustomerDetails, Cust_LName: e.target.value})} style={styles.modalActiveInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>BARANGAY <span style={{color: 'red'}}>*</span></label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select required value={newCustomerDetails.Barangay_ID} onChange={(e) => setNewCustomerDetails({...newCustomerDetails, Barangay_ID: e.target.value})} style={styles.modalNativeDropdownSelect}>
                      {barangayOptions.map(b => (
                        <option key={b.Barangay_ID} value={b.Barangay_ID}>{b.Barangay_Name} (P{b.Purok})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>BORROWED CONT.</label>
                  <input type="number" min="0" max={newCustomerDetails.Cust_Type === 'Reseller' ? "11" : "99"} value={newCustomerDetails.Borrowed_Cont} onChange={(e) => setNewCustomerDetails({...newCustomerDetails, Borrowed_Cont: e.target.value})} style={styles.modalActiveInputField} />
                </div>
              </div>

              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsAddEntryModalOpen(false)} style={styles.modalDismissCancelButtonLink}>Cancel</button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT CUSTOMER ================= */}
      {isEditEntryModalOpen && draftCustomerEdits && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Edit2 size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>EDIT CUSTOMER</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsEditEntryModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveCustomerEdits} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputFieldsDoubleColumnGrid}>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>CUSTOMER ID</label>
                  <input type="text" value={draftCustomerEdits.Cust_ID} disabled style={styles.modalDisabledInputField} />
                </div>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>TYPE <span style={{color: 'red'}}>*</span></label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select value={draftCustomerEdits.Cust_Type} onChange={(e) => setDraftCustomerEdits({...draftCustomerEdits, Cust_Type: e.target.value})} style={styles.modalNativeDropdownSelect}>
                      <option value="Personal">Personal</option>
                      <option value="Reseller">Reseller</option>
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>FIRST NAME <span style={{color: 'red'}}>*</span></label>
                  <input type="text" required value={draftCustomerEdits.Cust_FName} onChange={(e) => setDraftCustomerEdits({...draftCustomerEdits, Cust_FName: e.target.value})} style={styles.modalActiveInputField} />
                </div>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>LAST NAME <span style={{color: 'red'}}>*</span></label>
                  <input type="text" required value={draftCustomerEdits.Cust_LName} onChange={(e) => setDraftCustomerEdits({...draftCustomerEdits, Cust_LName: e.target.value})} style={styles.modalActiveInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>BARANGAY <span style={{color: 'red'}}>*</span></label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select required value={draftCustomerEdits.Barangay_ID} onChange={(e) => setDraftCustomerEdits({...draftCustomerEdits, Barangay_ID: e.target.value})} style={styles.modalNativeDropdownSelect}>
                      {barangayOptions.map(b => (
                        <option key={b.Barangay_ID} value={b.Barangay_ID}>{b.Barangay_Name} (P{b.Purok})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>BORROWED CONT.</label>
                  <input type="number" min="0" max={draftCustomerEdits.Cust_Type === 'Reseller' ? "11" : "99"} value={draftCustomerEdits.Borrowed_Cont} onChange={(e) => setDraftCustomerEdits({...draftCustomerEdits, Borrowed_Cont: e.target.value})} style={styles.modalActiveInputField} />
                </div>
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
  scrollableTableContainer: { overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 },
  tableHeaderColumnCell: { padding: '14px 10px', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10, borderBottom: '2px solid #bde0fe' },
  tableBodyDataRow: { borderBottom: '1px solid #e2e8f0', height: '52px' },
  tableBodyCellBlock: { padding: '12px 10px', fontSize: '0.9rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tableBodyCheckboxInput: { width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' },
  typeBadge: { padding: '4px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700' },
  inlineActionButtonsFlexGroup: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  inlineRowEditButton: { backgroundColor: '#eaf4fc', border: 'none', borderRadius: '6px', color: '#0077b6', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowDeleteButton: { backgroundColor: '#ffe3e3', border: 'none', borderRadius: '6px', color: '#ef4444', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  modalOverlayMask: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalWindowContainer: { backgroundColor: '#ffffff', width: '90%', maxWidth: '600px', borderRadius: '12px', border: '1px solid #0077b6', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  modalHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' },
  modalHeaderTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #bde0fe', paddingBottom: '15px' },
  modalHeaderTitleIconBox: { fontSize: '1.5rem', display: 'flex' },
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
  modalDismissCancelButtonLink: { background: 'none', border: 'none', color: '#0077b6', fontWeight: '700', fontSize: '0.98rem', cursor: 'pointer', padding: '14px 20px' },
  modalPrimaryActionSaveButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '0.98rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 119, 182, 0.25)' }
};

export default Customer;