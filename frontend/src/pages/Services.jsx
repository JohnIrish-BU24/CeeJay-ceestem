import CeeStemLogo from '../assets/CeeStem.png';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Edit2, Trash2, Plus, X } from 'lucide-react';

function Services() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [servicesList, setServicesList] = useState([]);
  const [searchPhrase, setSearchPhrase] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIdentifiers, setSelectedIdentifiers] = useState([]);
  
  const [newServiceDetails, setNewServiceDetails] = useState({ Serv_ID: '', Serv_Name: '', Price: '' });
  const [draftServiceEdits, setDraftServiceEdits] = useState(null);

  const fetchServiceRecords = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/service');
      const data = await response.json();
      
      const filtered = searchPhrase 
        ? data.filter(item => 
            item.Serv_Name.toLowerCase().includes(searchPhrase.toLowerCase()) || 
            item.Serv_ID.toString().includes(searchPhrase)
          )
        : data;
        
      setServicesList(filtered);
    } catch (error) { console.error("Fetch error:", error); }
  };

  useEffect(() => {
    fetchServiceRecords();
  }, [searchPhrase]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newServiceDetails)
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewServiceDetails({ Serv_ID: '', Serv_Name: '', Price: '' });
        fetchServiceRecords();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (err) { console.error("Submission error:", err); }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/service/${draftServiceEdits.Serv_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Serv_Name: draftServiceEdits.Serv_Name,
          Price: draftServiceEdits.Price
        })
      });
      if (response.ok) {
        setIsEditModalOpen(false);
        fetchServiceRecords();
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (err) { console.error("Update error:", err); }
  };

  const handleRecordDelete = async (identifier) => {
    if (!window.confirm("Are you sure you want to delete this service configuration?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/service/${identifier}`, { method: 'DELETE' });
      if (response.ok) { fetchServiceRecords(); }
      else { const err = await response.json(); alert(err.error); }
    } catch (err) { console.error("Delete error:", err); }
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Delete ${selectedIdentifiers.length} service offerings?`)) return;
    for (const id of selectedIdentifiers) {
      await fetch(`http://localhost:5000/api/service/${id}`, { method: 'DELETE' });
    }
    setSelectedIdentifiers([]);
    fetchServiceRecords();
  };

  const handleToggleAll = (e) => {
    if (e.target.checked) setSelectedIdentifiers(servicesList.map(s => s.Serv_ID));
    else setSelectedIdentifiers([]);
  };

  const handleToggleSingle = (id) => {
    if (selectedIdentifiers.includes(id)) {
      setSelectedIdentifiers(selectedIdentifiers.filter(item => item !== id));
    } else {
      setSelectedIdentifiers([...selectedIdentifiers, id]);
    }
  };

  const handleRibbonNavigation = (menuName) => {
    if (menuName === 'Transaction') navigate('/transaction');
    else if (menuName === 'Barangay') navigate('/barangay');
    else if (menuName === 'Customers') navigate('/customers');
    else if (menuName === 'Services') navigate('/services');
    else if (menuName === 'Reports') navigate('/reports');
    else if (menuName === 'Employees') navigate('/employees');
    else alert(`${menuName} page not yet implemented`);
  };

  return (
    <div style={styles.appContainer}>
      <nav style={styles.topNavbar}>
        <div style={styles.navBrandBlock}>
          {/* Replace the emoji div with this img tag */}
          <img src={CeeStemLogo} alt="CeeStem Logo" style={styles.brandLogo} />
          
          <div style={styles.brandTextGroup}>
            <span style={styles.brandMainTitle}>CeeStem</span>
            <span style={styles.brandSubTitle}>WATER REFILLING</span>
          </div>
        </div>

        <div style={styles.navMenuLinksRow}>
          {['Dashboard', 'Transaction', 'Services', 'Customers', 'Barangay', 'Employees', 'Payroll', 'Reports'].map((menu) => {
            const isActive = (menu === 'Barangay' && currentPath === '/barangay') || 
                             (menu === 'Transaction' && currentPath === '/transaction') ||
                             (menu === 'Customers' && currentPath === '/customers') ||
                             (menu === 'Services' && currentPath === '/services');
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
                  placeholder="Search by Service Name or ID..." 
                  value={searchPhrase}
                  onChange={(e) => setSearchPhrase(e.target.value)}
                  style={styles.searchFieldInput}
                />
              </div>
            </div>

            <button onClick={() => setIsAddModalOpen(true)} style={styles.addPrimaryActionButton}>
              <Plus size={16} /> Add Service
            </button>
          </div>

          {selectedIdentifiers.length > 0 && (
            <div style={styles.batchActionAlertStrip}>
              <span style={styles.batchSelectionCountLabel}>{selectedIdentifiers.length} Selected</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBatchDelete} style={styles.batchDeleteActionButton}>Delete Selected</button>
                <button onClick={() => setSelectedIdentifiers([])} style={styles.batchCancelActionButton}>Cancel</button>
              </div>
            </div>
          )}

          <div style={styles.scrollableTableContainer}>
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" onChange={handleToggleAll} checked={selectedIdentifiers.length === servicesList.length && servicesList.length > 0} className="custom-checkbox" />
                  </th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '120px' }}>SERVICE ID</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '350px' }}>SERVICE NAME</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '150px' }}>PRICE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center', width: '120px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {servicesList.map((service) => (
                  <tr key={service.Serv_ID} style={styles.tableBodyDataRow}>
                    <td style={{ ...styles.tableBodyCellBlock, textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIdentifiers.includes(service.Serv_ID)} onChange={() => handleToggleSingle(service.Serv_ID)} className="custom-checkbox" />
                    </td>
                    <td style={styles.tableBodyCellBlock}><strong>{service.Serv_ID}</strong></td>
                    <td style={styles.tableBodyCellBlock}>{service.Serv_Name}</td>
                    <td style={{ ...styles.tableBodyCellBlock, fontWeight: '700' }}>₱{parseFloat(service.Price).toFixed(2)}</td>
                    <td style={styles.tableBodyCellBlock}>
                      <div style={styles.inlineActionButtonsFlexGroup}>
                        <button onClick={() => { setDraftServiceEdits({...service}); setIsEditModalOpen(true); }} style={styles.inlineRowEditButton}><Edit2 size={16} /></button>
                        <button onClick={() => handleRecordDelete(service.Serv_ID)} style={styles.inlineRowDeleteButton}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODAL: ADD SERVICE ================= */}
      {isAddModalOpen && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Plus size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>ADD SERVICE</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateSubmit} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>SERVICE ID <span style={{color: 'red'}}>*</span></label>
                <input type="number" min="0" required value={newServiceDetails.Serv_ID} onChange={(e) => setNewServiceDetails({...newServiceDetails, Serv_ID: e.target.value})} style={{...styles.modalActiveInputField, marginBottom: '20px'}} placeholder="e.g. 3" />
              </div>
              
              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>SERVICE NAME <span style={{color: 'red'}}>*</span></label>
                <input type="text" required value={newServiceDetails.Serv_Name} onChange={(e) => setNewServiceDetails({...newServiceDetails, Serv_Name: e.target.value})} style={{...styles.modalActiveInputField, marginBottom: '20px'}} placeholder="e.g. Express Delivery" />
              </div>

              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>PRICE (₱) <span style={{color: 'red'}}>*</span></label>
                <input type="number" step="0.01" min="0" required value={newServiceDetails.Price} onChange={(e) => setNewServiceDetails({...newServiceDetails, Price: e.target.value})} style={{...styles.modalActiveInputField, marginBottom: '32px'}} placeholder="e.g. 50.00" />
              </div>

              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={styles.modalDismissCancelButtonLink}>Cancel</button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>Add Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SERVICE ================= */}
      {isEditModalOpen && draftServiceEdits && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Edit2 size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>EDIT SERVICE</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdateSubmit} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>SERVICE ID</label>
                <input type="text" value={draftServiceEdits.Serv_ID} disabled style={{...styles.modalDisabledInputField, marginBottom: '20px'}} />
              </div>
              
              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>SERVICE NAME <span style={{color: 'red'}}>*</span></label>
                <input type="text" required value={draftServiceEdits.Serv_Name} onChange={(e) => setDraftServiceEdits({...draftServiceEdits, Serv_Name: e.target.value})} style={{...styles.modalActiveInputField, marginBottom: '20px'}} />
              </div>

              <div style={styles.modalFormInputGroupFieldUnit}>
                <label style={styles.modalFormFieldLabelHeader}>PRICE (₱) <span style={{color: 'red'}}>*</span></label>
                <input type="number" step="0.01" min="0" required value={draftServiceEdits.Price} onChange={(e) => setDraftServiceEdits({...draftServiceEdits, Price: e.target.value})} style={{...styles.modalActiveInputField, marginBottom: '32px'}} />
              </div>

              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={styles.modalDismissCancelButtonLink}>Cancel</button>
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
  brandLogo: {width: '60px', height: '60px', objectFit: 'contain'},
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
  tableBodyCheckboxInput: { width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px', accentColor: '#92cbea' },
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

export default Services;