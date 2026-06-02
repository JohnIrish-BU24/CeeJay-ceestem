import CeeStemLogo from '../assets/CeeStem.png';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Plus, X, Eye, Archive, RotateCcw, CheckSquare, Info, Printer, Filter, LogOut } from 'lucide-react';

function Payroll() {
  const navigate = useNavigate();
  const location = useLocation();

  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchPhrase, setSearchPhrase] = useState('');
  const [viewMode, setViewMode] = useState('Active'); 
  const [roleFilter, setRoleFilter] = useState('All'); 

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // States
  const [activeRecord, setActiveRecord] = useState(null);
  const [newPayroll, setNewPayroll] = useState({ Emp_ID: '', Start_Date: '', End_Date: '', Loan: 0 });

  const fetchPayrolls = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/payroll?status=${viewMode}`);
      const rawData = await response.json();
      
      const filteredData = rawData.filter(item => {
        const matchesSearch = searchPhrase === '' || 
          item.Emp_LName.toLowerCase().includes(searchPhrase.toLowerCase()) || 
          item.Emp_FName.toLowerCase().includes(searchPhrase.toLowerCase()) || 
          item.Payroll_ID.toString().includes(searchPhrase);
        
        const isDriver = item.Role_ID === 'D';
        const matchesRole = roleFilter === 'All' || 
          (roleFilter === 'Driver' && isDriver) || 
          (roleFilter === 'Refiller' && !isDriver);

        return matchesSearch && matchesRole;
      });
        
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
  }, [searchPhrase, viewMode, roleFilter]); 

  useEffect(() => {
    fetchEmployees();
  }, []);

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
        setNewPayroll({ Emp_ID: employees[0]?.Emp_ID || '', Start_Date: '', End_Date: '', Loan: 0 });
        fetchPayrolls();
      } else {
        const err = await response.json(); 
        alert(err.error || "Failed to generate payroll");
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

  const formatDate = (dateString) => dateString ? dateString.split('T')[0] : '';

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('activeEmployee');
    window.location.href = '/login'; 
  };

  const handleRibbonNavigation = (menuName) => {
    if (menuName === 'Transaction') navigate('/transaction');
    else if (menuName === 'Barangay') navigate('/barangay');
    else if (menuName === 'Services') navigate('/services');
    else if (menuName === 'Customers') navigate('/customers');
    else if (menuName === 'Employees') navigate('/employees');
    else if (menuName === 'Payroll') navigate('/payroll');
    else if (menuName === 'Reports') navigate('/reports');
    else alert(`${menuName} page not yet implemented`);
  };

  return (
    <div style={styles.appContainer} className={isViewModalOpen ? "has-open-modal" : ""}>
      
      {/* ================= SMART PRINT LOGIC ================= */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; box-shadow: none; }
          
          .printable-table-container table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .printable-table-container th, .printable-table-container td { border: 1px solid #000 !important; padding: 10px !important; color: #000 !important; }
          .printable-table-container th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          
          /* Payslip Modal Print Mode */
          .has-open-modal .printable-area { display: none !important; } 
          .has-open-modal .printable-slip, .has-open-modal .printable-slip * { visibility: visible; }
          
          .printable-slip { 
             position: absolute !important; 
             left: 50% !important; 
             top: 0 !important; 
             transform: translateX(-50%) !important;
             width: 100% !important; 
             max-width: 600px !important;
             border: none !important; 
             box-shadow: none !important; 
             background: transparent !important;
             padding: 40px 20px !important;
             color: #000 !important;
          }
          
          .slip-print-header { display: block !important; margin-bottom: 30px !important; border-bottom: 2px solid #000 !important; padding-bottom: 15px !important; }
          .slip-print-header h1 { color: #000 !important; }
          .slip-print-header p { color: #333 !important; }
          
          .printable-slip h4 { color: #000 !important; border-bottom: 1px solid #ccc !important; }
          .printable-slip p { color: #000 !important; }
          
          .net-pay-box { 
             background-color: #f8fafc !important; 
             border: 2px solid #000 !important; 
             color: #000 !important; 
             -webkit-print-color-adjust: exact; 
             print-color-adjust: exact; 
             margin-top: 30px !important;
          }
          .net-pay-box span { color: #000 !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={styles.topNavbar} className="no-print">
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
          <div style={styles.navDivider}></div>
          <button onClick={handleLogout} style={styles.signOutButton}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      <div style={styles.workspaceBodyWrapper}>
        <div style={styles.dataLogTableCanvasCard} className="printable-area">
          
          <div style={styles.tableControlsGridRow} className="no-print">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
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

              <div style={styles.roleFilterBox}>
                <Filter size={16} color="#0077b6" />
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={styles.roleFilterSelect}
                >
                  <option value="All">All Roles</option>
                  <option value="Driver">Drivers Only</option>
                  <option value="Refiller">Refillers Only</option>
                </select>
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
                  <Plus size={16} /> Generate Payroll
                </button>
              )}
            </div>
          </div>

          <div style={styles.scrollableTableContainer} className="printable-table-container">
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '60px', paddingLeft: '20px', textAlign: 'left' }}>ID</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '180px', textAlign: 'left' }}>EMPLOYEE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '90px', textAlign: 'left' }}>ROLE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '110px' }}>DAYS WORKED</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>INCENTIVE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '100px' }}>LOAN</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '120px' }}>NET PAY</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center', width: '100px' }} className="no-print">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((record) => (
                  <tr key={record.Payroll_ID} style={styles.tableBodyDataRow}>
                    <td style={{...styles.tableBodyCellBlock, paddingLeft: '20px', textAlign: 'left'}}><strong>{record.Payroll_ID}</strong></td>
                    <td style={{...styles.tableBodyCellBlock, textAlign: 'left'}}>{record.Emp_FName} {record.Emp_LName}</td>
                    <td style={{...styles.tableBodyCellBlock, textAlign: 'left'}}>
                        <span style={{ 
                          ...styles.typeBadge, 
                          backgroundColor: record.Role_ID === 'D' ? '#e0e7ff' : '#fce7f3',
                          color: record.Role_ID === 'D' ? '#3730a3' : '#9d174d'
                        }}>
                          {record.Role_ID === 'D' ? 'Driver' : 'Refiller'}
                        </span>
                    </td>
                    <td style={{...styles.tableBodyCellBlock, fontWeight: '600'}}>{record.Days_Worked || 0}</td>
                    <td style={{...styles.tableBodyCellBlock, color: '#16a34a'}}>
                      ₱ {(parseFloat(record.Total_Incentive) || 0).toFixed(2)}
                    </td>
                    <td style={{...styles.tableBodyCellBlock, color: '#dc2626'}}>
                      ₱ {(parseFloat(record.Loan) || 0).toFixed(2)}
                    </td>
                    <td style={{...styles.tableBodyCellBlock, fontWeight: '800', color: '#012a4a'}}>
                      ₱ {(parseFloat(record.Net_Pay) || 0).toFixed(2)}
                    </td>
                    <td style={styles.tableBodyCellBlock} className="no-print">
                      <div style={styles.inlineActionButtonsFlexGroup}>
                        <button onClick={() => { setActiveRecord(record); setIsViewModalOpen(true); }} style={styles.inlineRowViewButton}><Eye size={16} /></button>
                        
                        {viewMode === 'Active' ? (
                            <button onClick={() => handleArchive(record.Payroll_ID)} style={styles.inlineRowArchiveButton} title="Archive"><Archive size={16} /></button>
                        ) : (
                          <button onClick={() => handleRestore(record.Payroll_ID)} style={styles.inlineRowRestoreButton}><RotateCcw size={16} /> Restore</button>
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

      {/* ================= MODAL: PAYROLL SLIP BREAKDOWN ================= */}
      {isViewModalOpen && activeRecord && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.modalWindowContainer}>
            
            <div style={{ ...styles.modalHeaderRow, marginBottom: '5px' }} className="no-print">
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><CheckSquare size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>PAYROLL RECORD</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setIsViewModalOpen(false)}><X size={20} /></button>
            </div>

            {/* Start of Professionally Sectioned Document */}
            <div style={styles.breakdownCard} className="printable-slip">
               
               {/* Print Only Header */}
               <div className="slip-print-header" style={{ display: 'none', textAlign: 'center' }}>
                 <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', textTransform: 'uppercase' }}>CeeStem Water Refilling</h1>
                 <p style={{ margin: '4px 0 0 0', fontWeight: '700', letterSpacing: '2px', fontSize: '1rem' }}>OFFICIAL PAYROLL SLIP</p>
                 <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Transaction ID: #{activeRecord.Payroll_ID}</p>
               </div>

               {/* Section 1: Employee Details */}
               <div style={styles.slipSection}>
                  <h4 style={styles.slipSectionTitle}>EMPLOYEE DETAILS</h4>
                  <div style={styles.breakdownGrid}>
                     <p style={styles.breakdownLabel}>Employee Name:</p> 
                     <p style={{...styles.breakdownValue, textTransform: 'uppercase'}}>{activeRecord.Emp_FName} {activeRecord.Emp_LName}</p>
                     
                     <p style={styles.breakdownLabel}>Position / Role:</p> 
                     <p style={styles.breakdownValue}>{activeRecord.Role_ID === 'D' ? 'Driver' : 'Refiller'}</p>
                     
                     <p style={styles.breakdownLabel}>Pay Period:</p> 
                     <p style={styles.breakdownValue}>{formatDate(activeRecord.Start_Date)} to {formatDate(activeRecord.End_Date)}</p>
                  </div>
               </div>

               {/* Section 2: Earnings */}
               <div style={styles.slipSection}>
                  <h4 style={styles.slipSectionTitle}>EARNINGS</h4>
                  <div style={styles.breakdownGrid}>
                     <p style={styles.breakdownLabel}>Base Daily Rate:</p> 
                     <p style={styles.breakdownValue}>₱ {activeRecord.Salary}</p>
                     
                     <p style={styles.breakdownLabel}>Days Worked:</p> 
                     <p style={styles.breakdownValue}>{activeRecord.Days_Worked || 0} Days</p>

                     <p style={styles.breakdownLabel}>Gross Income:</p> 
                     <p style={styles.breakdownValue}>₱ {(parseFloat(activeRecord.Gross_Income) || 0).toFixed(2)}</p>
                     
                     <p style={styles.breakdownLabel}>Earned Incentives:</p> 
                     <p style={{...styles.breakdownValue, color: '#16a34a'}}>+ ₱ {activeRecord.Total_Incentive}</p>
                  </div>
               </div>

               {/* Section 3: Deductions */}
               <div style={styles.slipSection}>
                  <h4 style={styles.slipSectionTitle}>DEDUCTIONS</h4>
                  <div style={styles.breakdownGrid}>
                     <p style={styles.breakdownLabel}>Cash Loan Advance:</p> 
                     <p style={{...styles.breakdownValue, color: '#dc2626'}}>- ₱ {activeRecord.Loan}</p>
                  </div>
               </div>
               
               {/* Section 4: Summary */}
               <div style={styles.netPayHighlightBox} className="net-pay-box">
                  <span>FINAL NET PAY</span>
                  <span>₱ {activeRecord.Net_Pay}</span>
               </div>
               
            </div>
            
            <div style={styles.modalFooterButtonsControlFlexRow} className="no-print">
                <button type="button" onClick={() => window.print()} style={styles.printActionButton}>
                  <Printer size={16} /> Print Slip
                </button>
                <button type="button" onClick={() => setIsViewModalOpen(false)} style={styles.modalPrimaryActionSaveButton}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GENERATE PAYROLL ================= */}
      {isAddModalOpen && (
         <div style={styles.modalOverlayMask} className="no-print">
         <div style={styles.modalWindowContainer}>
           <div style={styles.modalHeaderRow}>
             <div style={styles.modalHeaderTitleGroup}>
               <div style={{ ...styles.modalHeaderTitleIconBox, color: '#0077b6' }}><Plus size={20} /></div>
               <h2 style={styles.modalHeaderHeadingText}>GENERATE PAYROLL</h2>
             </div>
             <button style={styles.modalHeaderCloseXButton} onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
           </div>
           
           <form onSubmit={handleAddSubmit} style={styles.modalContentFormElement}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#eef2ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', color: '#3730a3' }}>
                <Info size={24} />
                <span style={{ fontSize: '0.85rem', fontWeight: '600', lineHeight: '1.4' }}>
                  Net Pay, Incentives, and Valid Days will be automatically calculated by the system based on the employee's transaction history for this period.
                </span>
              </div>

              <div style={styles.modalFormInputFieldsDoubleColumnGrid}>
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
                  <label style={styles.modalFormFieldLabelHeader}>LOAN ADVANCE (₱)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={newPayroll.Loan || ''} onChange={(e) => setNewPayroll({...newPayroll, Loan: e.target.value})} style={styles.modalActiveInputField} />
                 </div>

                 <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>START DATE <span style={{color: 'red'}}>*</span></label>
                  <input type="date" required value={newPayroll.Start_Date} onChange={(e) => setNewPayroll({...newPayroll, Start_Date: e.target.value})} style={styles.modalActiveInputField} />
                 </div>

                 <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>END DATE <span style={{color: 'red'}}>*</span></label>
                  <input type="date" required value={newPayroll.End_Date} onChange={(e) => setNewPayroll({...newPayroll, End_Date: e.target.value})} style={styles.modalActiveInputField} />
                 </div>
              </div>
              
              <div style={styles.modalFooterButtonsControlFlexRow}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={styles.modalDismissCancelButtonLink}>Cancel</button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>Generate Record</button>
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
  navDivider: { width: '2px', height: '24px', backgroundColor: '#00b4d8', margin: '0 10px', opacity: 0.5 },
  signOutButton: { backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', height: '36px', padding: '0 16px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' },
  workspaceBodyWrapper: { flex: 1, overflowY: 'auto', backgroundColor: '#e6f2fa', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  dataLogTableCanvasCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #bde0fe', padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0, 79, 134, 0.05)', height: 'calc(100vh - 110px)', width: '100%', overflow: 'hidden' },
  tableControlsGridRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', width: '100%', boxSizing: 'border-box' },
  
  searchBarBoxFrame: { position: 'relative', display: 'flex', alignItems: 'center', flex: '0 1 350px' },
  searchLeftIcon: { position: 'absolute', left: '16px', pointerEvents: 'none' },
  searchFieldInput: { width: '100%', padding: '12px 16px 12px 46px', borderRadius: '8px', border: '1px solid #bde0fe', backgroundColor: '#eaf4fc', color: '#012a4a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  
  roleFilterBox: { display: 'flex', alignItems: 'center', backgroundColor: '#eaf4fc', padding: '0 12px', borderRadius: '8px', border: '1px solid #bde0fe', gap: '8px', height: '44px', flexShrink: 0 },
  roleFilterSelect: { border: 'none', backgroundColor: 'transparent', color: '#012a4a', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', fontWeight: '600', width: '110px' },
  printActionButton: { backgroundColor: '#475569', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 16px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: '0 4px 12px rgba(71, 85, 105, 0.2)' },
  
  addPrimaryActionButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0, 119, 182, 0.2)' },
  archiveToggleBtn: { border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', padding: '12px 16px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  
  ledgerTableMarkup: { width: '100%', borderCollapse: 'collapse', textAlign: 'center', tableLayout: 'fixed' },
  tableHeadBorderRow: { borderBottom: '2px solid #bde0fe' },
  scrollableTableContainer: { overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 },
  tableHeaderColumnCell: { padding: '14px 10px', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10, borderBottom: '2px solid #bde0fe' },
  tableBodyDataRow: { borderBottom: '1px solid #e2e8f0', height: '52px' },
  tableBodyCellBlock: { padding: '12px 10px', fontSize: '0.9rem', color: '#475569' },
  
  typeBadge: { padding: '4px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700', display: 'inline-block' },
  inlineActionButtonsFlexGroup: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  inlineRowViewButton: { backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', color: '#4b5563', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowArchiveButton: { backgroundColor: '#fef3c7', border: 'none', borderRadius: '6px', color: '#f59e0b', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowRestoreButton: { backgroundColor: '#dcfce7', border: 'none', borderRadius: '6px', color: '#16a34a', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  
  modalOverlayMask: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, overflowY: 'hidden' },
  modalWindowContainer: { backgroundColor: '#ffffff', width: '90%', maxWidth: '450px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '12px', border: '1px solid #0077b6', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' },
  modalHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0', width: '100%' },
  modalHeaderTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  modalHeaderTitleIconBox: { fontSize: '1.5rem', display: 'flex' },
  modalHeaderHeadingText: { fontSize: '1.25rem', fontWeight: '700', color: '#011627', margin: 0 },
  modalHeaderCloseXButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
  
  modalContentFormElement: { display: 'flex', flexDirection: 'column', width: '100%' },
  modalFormInputFieldsDoubleColumnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: '24px', width: '100%' },
  modalFormInputGroupFieldUnit: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' },
  modalFormFieldLabelHeader: { fontSize: '0.85rem', fontWeight: '800', color: '#011627', marginBottom: '8px' },
  modalActiveInputField: { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box' },
  modalSelectFieldWrapperBox: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%' },
  modalNativeDropdownSelect: { appearance: 'none', width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.95rem', fontWeight: '700', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  modalSelectChevronOverlayIcon: { position: 'absolute', right: '14px', pointerEvents: 'none' },
  
  modalFooterButtonsControlFlexRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', width: '100%', marginTop: '5px' },
  modalDismissCancelButtonLink: { background: 'none', border: 'none', color: '#0077b6', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', padding: '10px 16px' },
  modalPrimaryActionSaveButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' },
  
  /* PROFESSIONALLY SECTIONED BREAKDOWN (PAYSLIP) STYLES */
  breakdownCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' },
  slipSection: { marginBottom: '12px' },
  slipSectionTitle: { fontSize: '0.85rem', fontWeight: '800', color: '#0369a1', borderBottom: '1px solid #bae6fd', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 0 },
  breakdownGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', alignItems: 'center' },
  breakdownLabel: { fontSize: '0.85rem', fontWeight: '600', color: '#64748b', margin: 0, textAlign: 'left' },
  breakdownValue: { fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', textAlign: 'right', margin: 0 },
  netPayHighlightBox: { backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '8px', padding: '12px 16px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: '900', color: '#0369a1' }
};

export default Payroll;