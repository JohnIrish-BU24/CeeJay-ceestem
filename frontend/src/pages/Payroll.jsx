import CeeStemLogo from '../assets/CeeStem.png';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Edit2, Trash2, Plus, X, Eye, Archive, RotateCcw, CheckSquare } from 'lucide-react';

function Payroll() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchPhrase, setSearchPhrase] = useState('');
  const [viewMode, setViewMode] = useState('Active'); // 'Active' or 'Archived'
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // States
  const [activeRecord, setActiveRecord] = useState(null);
  const [newPayroll, setNewPayroll] = useState({ Emp_ID: '', Start_Date: '', End_Date: '', Total_Incentive: 0, Loan: 0, Net_Pay: 0 });

  const fetchPayrolls = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/payroll?status=${viewMode}`);
      const rawData = await response.json();
      
      const filteredData = searchPhrase 
        ? rawData.filter(item => 
            item.Emp_LName.toLowerCase().includes(searchPhrase.toLowerCase()) || 
            item.Emp_FName.toLowerCase().includes(searchPhrase.toLowerCase()) || 
            item.Payroll_ID.toString().includes(searchPhrase)
          )
        : rawData;
        
      setPayrollData(filteredData);
    } catch (error) { console.error("Fetch error:", error); }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employee');
      const data = await response.json();
      setEmployees(data);
      if (data.length > 0) setNewPayroll(prev => ({ ...prev, Emp_ID: data[0].Emp_ID }));
    } catch (err) { console.error("Failed to load employees"); }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [searchPhrase, viewMode]); 

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- CALCULATOR UTILS ---
  const calculateDaysWorked = (start, end) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  };

  const calculateFinancials = (record) => {
    // 1. Calculate Calendar Days (Start Date to End Date)
    const days = calculateDaysWorked(record.Start_Date, record.End_Date);
    
    // 2. Base Pay is simply Days * Daily Wage (No longer dividing by 30)
    const dailyRate = parseFloat(record.Salary || 0); 
    const basePay = dailyRate * days;
    
    // 3. Gross Income = Base Pay + Incentive
    const grossIncome = basePay + parseFloat(record.Total_Incentive || 0);
    
    // 4. Net Pay = Gross Income - Loans
    const calculatedNet = grossIncome - parseFloat(record.Loan || 0);
    
    return { days, basePay, grossIncome, calculatedNet };
  };

  // Auto-update Net Pay in Edit Modal when values change
  useEffect(() => {
    if (activeRecord && isEditModalOpen) {
      const { calculatedNet } = calculateFinancials(activeRecord);
      setActiveRecord(prev => ({ ...prev, Net_Pay: calculatedNet.toFixed(2) }));
    }
  }, [activeRecord?.Start_Date, activeRecord?.End_Date, activeRecord?.Total_Incentive, activeRecord?.Loan]);

  // --- HANDLERS ---
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayroll)
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewPayroll({ Emp_ID: employees[0]?.Emp_ID || '', Start_Date: '', End_Date: '', Total_Incentive: 0, Loan: 0, Net_Pay: 0 });
        fetchPayrolls();
      } else {
        const err = await response.json(); alert(err.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/payroll/${activeRecord.Payroll_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeRecord)
      });
      if (response.ok) {
        setIsEditModalOpen(false);
        fetchPayrolls();
      } else {
        const err = await response.json(); alert(err.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this payroll record?")) return;
    try {
      await fetch(`http://localhost:5000/api/payroll/${id}/archive`, { method: 'PUT' });
      fetchPayrolls();
    } catch (err) { console.error(err); }
  };

  const handleRestore = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/payroll/${id}/restore`, { method: 'PUT' });
      fetchPayrolls();
    } catch (err) { console.error(err); }
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';

  const handleRibbonNavigation = (menuName) => {
    if (menuName === 'Transaction') navigate('/transaction');
    else if (menuName === 'Barangay') navigate('/barangay');
    else if (menuName === 'Customers') navigate('/customers');
    else if (menuName === 'Employees') navigate('/employees');
    else if (menuName === 'Payroll') navigate('/payroll');
    else alert(`${menuName} page not yet implemented`);
  };

  return (
    <div style={styles.appContainer}>
      {/* NAVBAR */}
      <nav style={styles.topNavbar}>
        <div style={styles.navBrandBlock}>
          <img src={CeeStemLogo} alt="CeeStem Logo" style={styles.brandLogo} />
          <div style={styles.brandTextGroup}>
            <span style={styles.brandMainTitle}>CeeStem</span>
            <span style={styles.brandSubTitle}>WATER REFILLING</span>
          </div>
        </div>
        <div style={styles.navMenuLinksRow}>
          {['Dashboard', 'Transaction', 'Services', 'Customers', 'Barangay', 'Employees', 'Payroll', 'Reports'].map((menu) => (
             <button
                key={menu}
                onClick={() => handleRibbonNavigation(menu)}
                style={{
                  ...styles.navMenuButton,
                  color: menu === 'Payroll' ? '#00b4d8' : '#ffffff',
                  borderBottom: menu === 'Payroll' ? '3px solid #00b4d8' : '3px solid transparent'
                }}
             >{menu}</button>
          ))}
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
                  placeholder="Search by Employee or ID..." 
                  value={searchPhrase}
                  onChange={(e) => setSearchPhrase(e.target.value)}
                  style={styles.searchFieldInput}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setViewMode(viewMode === 'Active' ? 'Archived' : 'Active')} 
                style={{...styles.archiveToggleBtn, backgroundColor: viewMode === 'Archived' ? '#f1f5f9' : '#ffffff'}}
              >
                <Archive size={16} /> {viewMode === 'Active' ? 'View Archived' : 'Back to Active'}
              </button>
              
              {viewMode === 'Active' && (
                <button onClick={() => setIsAddModalOpen(true)} style={styles.addPrimaryActionButton}>
                  <Plus size={16} /> Add Payroll
                </button>
              )}
            </div>
          </div>

          <div style={styles.scrollableTableContainer}>
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '40px', textAlign: 'center' }}><input type="checkbox" /></th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '60px' }}>ID</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '180px' }}>EMPLOYEE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '90px' }}>ROLE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>DAYS WORKED</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>INCENTIVE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>LOAN</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '120px' }}>NET PAY</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center', width: '140px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((record) => {
                  const days = calculateDaysWorked(record.Start_Date, record.End_Date);
                  return (
                    <tr key={record.Payroll_ID} style={styles.tableBodyDataRow}>
                      <td style={{ ...styles.tableBodyCellBlock, textAlign: 'center' }}><input type="checkbox" /></td>
                      <td style={styles.tableBodyCellBlock}><strong>{record.Payroll_ID}</strong></td>
                      <td style={styles.tableBodyCellBlock}>{record.Emp_FName} {record.Emp_LName}</td>
                      <td style={styles.tableBodyCellBlock}>
                         <span style={{ 
                           ...styles.typeBadge, 
                           backgroundColor: record.Role_ID === 'D' ? '#e0e7ff' : '#fce7f3',
                           color: record.Role_ID === 'D' ? '#3730a3' : '#9d174d'
                         }}>
                           {record.Role_ID === 'D' ? 'Driver' : 'Refiller'}
                         </span>
                      </td>
                      <td style={{...styles.tableBodyCellBlock, fontWeight: '600'}}>{days}</td>
                      <td style={{...styles.tableBodyCellBlock, color: '#16a34a'}}>₱ {record.Total_Incentive}</td>
                      <td style={{...styles.tableBodyCellBlock, color: '#dc2626'}}>₱ {record.Loan}</td>
                      <td style={{...styles.tableBodyCellBlock, fontWeight: '800', color: '#012a4a'}}>₱ {record.Net_Pay}</td>
                      <td style={styles.tableBodyCellBlock}>
                        <div style={styles.inlineActionButtonsFlexGroup}>
                          <button onClick={() => { setActiveRecord(record); setIsViewModalOpen(true); }} style={styles.inlineRowViewButton}><Eye size={16} /></button>
                          
                          {viewMode === 'Active' ? (
                            <>
                              <button onClick={() => { setActiveRecord({...record, Start_Date: formatDate(record.Start_Date), End_Date: formatDate(record.End_Date)}); setIsEditModalOpen(true); }} style={styles.inlineRowEditButton}><Edit2 size={16} /></button>
                              <button onClick={() => handleArchive(record.Payroll_ID)} style={styles.inlineRowDeleteButton}><Trash2 size={16} /></button>
                            </>
                          ) : (
                            <button onClick={() => handleRestore(record.Payroll_ID)} style={styles.inlineRowRestoreButton}><RotateCcw size={16} /> Restore</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODAL: SEE MORE (VIEW ONLY) ================= */}
      {isViewModalOpen && activeRecord && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={{ ...styles.modalHeaderRow, marginBottom: '10px' }}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><CheckSquare size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>PAYROLL BREAKDOWN</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsViewModalOpen(false)}><X size={20} /></button>
            </div>

            <div style={styles.breakdownCard}>
               <h3 style={styles.breakdownTitle}>{activeRecord.Emp_FName} {activeRecord.Emp_LName} <span style={{color: '#64748b', fontSize: '0.9rem', fontWeight: '500'}}>| ID: {activeRecord.Payroll_ID}</span></h3>
               <hr style={styles.breakdownDivider}/>
               
               <div style={styles.breakdownGrid}>
                  <p style={styles.breakdownLabel}>Pay Period:</p> 
                  <p style={styles.breakdownValue}>{formatDate(activeRecord.Start_Date)} to {formatDate(activeRecord.End_Date)}</p>
                  
                  <p style={styles.breakdownLabel}>Base Salary (Daily Rate):</p> 
                  <p style={styles.breakdownValue}>₱ {activeRecord.Salary}</p>

                  <p style={styles.breakdownLabel}>Calendar Days:</p> 
                  <p style={styles.breakdownValue}>{calculateFinancials(activeRecord).days} Days</p>
                  
                  <div style={{gridColumn: 'span 2'}}><hr style={styles.breakdownDivider}/></div>
                  
                  {/* BASE PAY + INCENTIVE FLOW */}
                  <p style={styles.breakdownLabel}>Base Pay (Rate × Days):</p> 
                  <p style={styles.breakdownValue}>₱ {calculateFinancials(activeRecord).basePay.toFixed(2)}</p>
                  
                  <p style={styles.breakdownLabel}>Total Incentive:</p> 
                  <p style={{...styles.breakdownValue, color: '#16a34a'}}>+ ₱ {activeRecord.Total_Incentive}</p>
                  
                  <div style={{gridColumn: 'span 2'}}><hr style={styles.breakdownDivider}/></div>
                  
                  {/* GROSS MINUS DEDUCTIONS FLOW */}
                  <p style={styles.breakdownLabel}>Total Gross Income:</p> 
                  <p style={{...styles.breakdownValue, color: '#0077b6'}}>₱ {calculateFinancials(activeRecord).grossIncome.toFixed(2)}</p>
                  
                  <p style={styles.breakdownLabel}>Cash Loan Deductions:</p> 
                  <p style={{...styles.breakdownValue, color: '#dc2626'}}>- ₱ {activeRecord.Loan}</p>
               </div>
               
               <div style={styles.netPayHighlightBox}>
                  <span>FINAL NET PAY</span>
                  <span>₱ {activeRecord.Net_Pay}</span>
               </div>
            </div>
            
            <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsViewModalOpen(false)} style={styles.modalPrimaryActionSaveButton}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PAYROLL ================= */}
      {isEditModalOpen && activeRecord && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Edit2 size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>EDIT PAYROLL</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleEditSubmit} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputFieldsDoubleColumnGrid}>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>EMPLOYEE</label>
                  <input type="text" value={`${activeRecord.Emp_FName} ${activeRecord.Emp_LName}`} disabled style={styles.modalDisabledInputField} />
                </div>
                
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>START DATE <span style={{color: 'red'}}>*</span></label>
                  <input type="date" required value={activeRecord.Start_Date} onChange={(e) => setActiveRecord({...activeRecord, Start_Date: e.target.value})} style={styles.modalActiveInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>END DATE <span style={{color: 'red'}}>*</span></label>
                  <input type="date" required value={activeRecord.End_Date} onChange={(e) => setActiveRecord({...activeRecord, End_Date: e.target.value})} style={styles.modalActiveInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>INCENTIVE (₱)</label>
                  <input type="number" step="0.01" value={activeRecord.Total_Incentive} onChange={(e) => setActiveRecord({...activeRecord, Total_Incentive: e.target.value})} style={styles.modalActiveInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>LOAN DEDUCTION (₱)</label>
                  <input type="number" step="0.01" value={activeRecord.Loan} onChange={(e) => setActiveRecord({...activeRecord, Loan: e.target.value})} style={styles.modalActiveInputField} />
                </div>

                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>AUTO-CALCULATED NET PAY</label>
                  <input type="number" step="0.01" value={activeRecord.Net_Pay} onChange={(e) => setActiveRecord({...activeRecord, Net_Pay: e.target.value})} style={{...styles.modalActiveInputField, backgroundColor: '#eaf4fc', color: '#0077b6', fontWeight: '800'}} />
                </div>
              </div>

              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={styles.modalDismissCancelButtonLink}>Cancel</button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PAYROLL (Simplified for brevity) ================= */}
      {isAddModalOpen && (
         <div style={styles.modalOverlayMask}>
         <div style={styles.modalWindowContainer}>
           <div style={styles.modalHeaderRow}>
             <div style={styles.modalHeaderTitleGroup}>
               <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Plus size={20} /></div>
               <h2 style={styles.modalHeaderHeadingText}>GENERATE PAYROLL</h2>
             </div>
             <button style={styles.modalHeaderCloseXButton} onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
           </div>
           
           <form onSubmit={handleAddSubmit} style={styles.modalContentFormElement}>
              <div style={styles.modalFormInputFieldsDoubleColumnGrid}>
                 {/* Inputs: Employee Select, Start, End, Incentive, Loan, Net Pay */}
                 <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>EMPLOYEE <span style={{color: 'red'}}>*</span></label>
                  <div style={styles.modalSelectFieldWrapperBox}>
                    <select required value={newPayroll.Emp_ID} onChange={(e) => setNewPayroll({...newPayroll, Emp_ID: e.target.value})} style={styles.modalNativeDropdownSelect}>
                      {employees.map(e => <option key={e.Emp_ID} value={e.Emp_ID}>{e.Emp_FName} {e.Emp_LName}</option>)}
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                  </div>
                 </div>
                 
                 <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>START DATE <span style={{color: 'red'}}>*</span></label>
                  <input type="date" required value={newPayroll.Start_Date} onChange={(e) => setNewPayroll({...newPayroll, Start_Date: e.target.value})} style={styles.modalActiveInputField} />
                 </div>

                 <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>END DATE <span style={{color: 'red'}}>*</span></label>
                  <input type="date" required value={newPayroll.End_Date} onChange={(e) => setNewPayroll({...newPayroll, End_Date: e.target.value})} style={styles.modalActiveInputField} />
                 </div>

                 <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>NET PAY <span style={{color: 'red'}}>*</span></label>
                  <input type="number" required step="0.01" value={newPayroll.Net_Pay} onChange={(e) => setNewPayroll({...newPayroll, Net_Pay: e.target.value})} style={styles.modalActiveInputField} />
                 </div>
              </div>
              
              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={styles.modalDismissCancelButtonLink}>Cancel</button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>Save Payroll</button>
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
  archiveToggleBtn: { border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', padding: '12px 16px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  ledgerTableMarkup: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' },
  tableHeadBorderRow: { borderBottom: '2px solid #bde0fe' },
  scrollableTableContainer: { overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 },
  tableHeaderColumnCell: { padding: '14px 10px', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10, borderBottom: '2px solid #bde0fe' },
  tableBodyDataRow: { borderBottom: '1px solid #e2e8f0', height: '52px' },
  tableBodyCellBlock: { padding: '12px 10px', fontSize: '0.9rem', color: '#475569' },
  typeBadge: { padding: '4px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700' },
  inlineActionButtonsFlexGroup: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  inlineRowViewButton: { backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', color: '#4b5563', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowEditButton: { backgroundColor: '#eaf4fc', border: 'none', borderRadius: '6px', color: '#0077b6', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowDeleteButton: { backgroundColor: '#ffe3e3', border: 'none', borderRadius: '6px', color: '#ef4444', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowRestoreButton: { backgroundColor: '#dcfce7', border: 'none', borderRadius: '6px', color: '#16a34a', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  
  modalOverlayMask: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalWindowContainer: { backgroundColor: '#ffffff', width: '90%', maxWidth: '600px', borderRadius: '12px', border: '1px solid #0077b6', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  modalHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', width: '100%' },
  modalHeaderTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #bde0fe', paddingBottom: '15px' },
  modalHeaderTitleIconBox: { fontSize: '1.5rem', display: 'flex' },
  modalHeaderHeadingText: { fontSize: '1.25rem', fontWeight: '700', color: '#011627', margin: 0 },
  modalHeaderCloseXButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
  modalContentFormElement: { display: 'flex', flexDirection: 'column', width: '100%' },
  modalFormInputFieldsDoubleColumnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px', marginBottom: '32px', width: '100%' },
  modalFormInputGroupFieldUnit: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' },
  modalFormFieldLabelHeader: { fontSize: '0.85rem', fontWeight: '800', color: '#011627', marginBottom: '10px' },
  modalDisabledInputField: { width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #bde0fe', backgroundColor: '#d0e4f2', color: '#64748b', fontSize: '0.98rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box' },
  modalActiveInputField: { width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.98rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box' },
  modalSelectFieldWrapperBox: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%' },
  modalNativeDropdownSelect: { appearance: 'none', width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.98rem', fontWeight: '700', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  modalSelectChevronOverlayIcon: { position: 'absolute', right: '16px', pointerEvents: 'none' },
  modalFooterButtonsControlFlexRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px', width: '100%' },
  modalDismissCancelButtonLink: { background: 'none', border: 'none', color: '#0077b6', fontWeight: '700', fontSize: '0.98rem', cursor: 'pointer', padding: '14px 20px' },
  modalPrimaryActionSaveButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '0.98rem', fontWeight: '700', cursor: 'pointer' },
  
  // Breakdown Modal specific styles
  breakdownCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  breakdownTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 },
  breakdownDivider: { border: 'none', borderTop: '1px solid #cbd5e1', width: '100%', margin: '4px 0' },
  breakdownGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', alignItems: 'center' },
  breakdownLabel: { fontSize: '0.9rem', fontWeight: '700', color: '#64748b', margin: 0 },
  breakdownValue: { fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', textAlign: 'right', margin: 0 },
  netPayHighlightBox: { backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '8px', padding: '16px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem', fontWeight: '900', color: '#0369a1' }
};

export default Payroll;