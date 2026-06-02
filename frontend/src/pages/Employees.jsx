import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Trash2, Edit2, Plus, X, Eye, User, Phone, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

function Employees() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [employees, setEmployees] = useState([]);
  const [roleDataMap, setRoleDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All'); 
  
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  // Local cache for photos since backend doesn't support file storage yet
  const [localPhotos, setLocalPhotos] = useState({});
  const addPhotoInputRef = useRef(null);
  const editPhotoInputRef = useRef(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);

  // Add Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Emp_ID: '', Emp_FName: '', Emp_LName: '', Role_ID: 'R', Contact_Num: '', License_Num: '', License_Exp: '', Password: ''
  });

  // Edit Employee Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [draftEmployeeEdits, setDraftEmployeeEdits] = useState(null);

  // View Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Contact Sub-Modal
  const [contactListModalOpen, setContactListModalOpen] = useState(false);
  const [contactModalTarget, setContactModalTarget] = useState('view'); 
  const [currentContacts, setCurrentContacts] = useState([]);
  const [newContactNum, setNewContactNum] = useState('');
  
  // Password Sub-Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordStage, setPasswordStage] = useState('verify');
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');

  const fetchData = async () => {
    try {
      const [empRes, roleRes] = await Promise.all([
        fetch('http://localhost:5000/api/employee'),
        fetch('http://localhost:5000/api/employee/roles')
      ]);

      if (empRes.ok && roleRes.ok) {
        const empData = await empRes.json();
        const roleData = await roleRes.json();
        
        setEmployees(empData);
        
        const rMap = {};
        roleData.forEach(r => { rMap[r.Role_ID] = r; });
        setRoleDataMap(rMap);
      }
    } catch (error) {
      console.error('Error connecting to server:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return ''; 
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAddPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setAddPhotoPreview(URL.createObjectURL(file));
  };

  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setEditPhotoPreview(URL.createObjectURL(file));
  };

  const openEditModal = (emp) => {
    setDraftEmployeeEdits({ ...emp, License_Exp: formatDate(emp.License_Exp) });
    setEditPhotoPreview(localPhotos[emp.Emp_ID] || null);
    setIsEditModalOpen(true);
  };

  // NEW: Clean parser that simply splits by commas without chopping digits
  // NEW: Parses contacts and restores leading zero if stripped by the database
  const parseContacts = (contactData) => {
    if (!contactData) return [];
    return String(contactData).split(',').map(c => {
      let numStr = c.trim();
      // If the number is exactly 10 digits and starts with '9', restore the '0'
      if (numStr.length === 10 && numStr.startsWith('9')) {
        numStr = '0' + numStr;
      }
      return numStr;
    }).filter(Boolean);
  };

  const openContactModal = (targetMode) => {
    setContactModalTarget(targetMode);
    let contactsArray = [];

    if (targetMode === 'add') {
      contactsArray = parseContacts(formData.Contact_Num);
    } else if (targetMode === 'edit') {
      contactsArray = parseContacts(draftEmployeeEdits.Contact_Num);
    } else if (targetMode === 'view') {
      contactsArray = parseContacts(selectedEmp?.Contact_Num);
    }
    
    setCurrentContacts(contactsArray);
    setNewContactNum('');
    setContactListModalOpen(true);
  };

  // NEW: Strict Contact Validations
  const handleAddContact = () => {
    const num = newContactNum.trim();
    if (!num) return;

    if (!/^\d+$/.test(num)) {
      alert('Contact number must contain only numbers.');
      return;
    }
    if (num.length !== 11) {
      alert('Contact number must be exactly 11 digits long.');
      return;
    }
    if (!num.startsWith('09')) {
      alert('Contact number must start with "09".');
      return;
    }
    if (currentContacts.includes(num)) {
      alert('This contact number has already been added.');
      return;
    }

    setCurrentContacts([...currentContacts, num]);
    setNewContactNum('');
  };

  const saveContactsAndClose = () => {
    const joinedContacts = currentContacts.join(', ');
    if (contactModalTarget === 'add') {
      setFormData({ ...formData, Contact_Num: joinedContacts });
    } else if (contactModalTarget === 'edit') {
      setDraftEmployeeEdits({ ...draftEmployeeEdits, Contact_Num: joinedContacts });
    }
    setContactListModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validate Contacts
    if (!formData.Contact_Num) {
      alert('Please add at least one valid 11-digit contact number starting with "09".');
      return;
    }

    // 2. Validate Driver-Specific Fields
    if (formData.Role_ID === 'D') {
      if (!formData.License_Num || formData.License_Num.trim() === '') {
        alert('Validation Error: Drivers must have a valid License Number.');
        return;
      }
      if (!formData.License_Exp || formData.License_Exp.trim() === '') {
        alert('Validation Error: Drivers must have a valid License Expiry Date.');
        return;
      }
    }

    try {
      const response = await fetch('http://localhost:5000/api/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        if (addPhotoPreview) {
          setLocalPhotos({ ...localPhotos, [formData.Emp_ID]: addPhotoPreview });
        }
        fetchData(); 
        setIsModalOpen(false); 
        // Reset form completely
        setFormData({ Emp_ID: '', Emp_FName: '', Emp_LName: '', Role_ID: 'R', Contact_Num: '', License_Num: '', License_Exp: '', Password: '' }); 
        setAddPhotoPreview(null);
      } else {
        const errorData = await response.json();
        alert(`Failed: ${errorData.error}\n\nSystem Details: ${errorData.details || ''}`);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Network error while trying to add employee.');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validate Contacts
    if (!draftEmployeeEdits.Contact_Num) {
      alert('Please ensure the employee has at least one valid 11-digit contact number starting with "09".');
      return;
    }

    // 2. Validate Driver-Specific Fields
    if (draftEmployeeEdits.Role_ID === 'D') {
      if (!draftEmployeeEdits.License_Num || draftEmployeeEdits.License_Num.trim() === '') {
        alert('Validation Error: Drivers must have a valid License Number.');
        return;
      }
      if (!draftEmployeeEdits.License_Exp || draftEmployeeEdits.License_Exp.trim() === '') {
        alert('Validation Error: Drivers must have a valid License Expiry Date.');
        return;
      }
    }

    try {
      const response = await fetch(`http://localhost:5000/api/employee/${draftEmployeeEdits.Emp_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftEmployeeEdits)
      });
      if (response.ok) {
        if (editPhotoPreview) {
          setLocalPhotos({ ...localPhotos, [draftEmployeeEdits.Emp_ID]: editPhotoPreview });
        }
        setIsEditModalOpen(false);
        setEditPhotoPreview(null);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Update Failed: ${errorData.error}\n\nSystem Details: ${errorData.details || 'No additional details provided'}`);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Network error while trying to update employee.');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm('Are you sure you want to remove this employee?');
    if (!isConfirmed) return;
    try {
      const response = await fetch(`http://localhost:5000/api/employee/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
        setSelectedEmployeeIds(selectedEmployeeIds.filter(empId => empId !== id));
      } else {
        const err = await response.json();
        alert(`Delete failed: ${err.error || err.details}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Delete ${selectedEmployeeIds.length} employees?`)) return;
    for (const id of selectedEmployeeIds) {
      try {
        await fetch(`http://localhost:5000/api/employee/${id}`, { method: 'DELETE' });
      } catch (error) {
        console.error(`Error deleting ${id}:`, error);
      }
    }
    setSelectedEmployeeIds([]);
    fetchData();
  };

  const handleToggleAll = (e) => {
    if (e.target.checked) setSelectedEmployeeIds(filteredEmployees.map(emp => emp.Emp_ID));
    else setSelectedEmployeeIds([]);
  };

  const handleToggleSingle = (id) => {
    if (selectedEmployeeIds.includes(id)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(item => item !== id));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, id]);
    }
  };

  const handleViewDetails = (emp) => {
    setSelectedEmp(emp);
    setDetailsModalOpen(true);
  };

  const openPasswordChangeFlow = (e) => {
    e.preventDefault(); e.stopPropagation();
    setOwnerPasswordInput(''); setNewEmployeePassword('');
    setPasswordStage('verify'); setPasswordModalOpen(true);
  };

  const handleVerifyOwner = (e) => {
    e.preventDefault();
    if (ownerPasswordInput === 'ceestem123') setPasswordStage('new_password');
    else alert('Incorrect Owner Password!');
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (newEmployeePassword.trim() === '') return alert('Password cannot be empty');
    
    try {
      const response = await fetch(`http://localhost:5000/api/employee/${selectedEmp.Emp_ID}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Password: newEmployeePassword })
      });

      if (response.ok) {
        setSelectedEmp({ ...selectedEmp, Password: newEmployeePassword });
        setEmployees(employees.map(emp => emp.Emp_ID === selectedEmp.Emp_ID ? { ...emp, Password: newEmployeePassword } : emp));
        alert('Employee password successfully updated in database!');
        setPasswordModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to update password: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Network error while trying to save password.');
    }
  };

  const handleRibbonNavigation = (menuName) => {
    if (menuName === 'Transaction') navigate('/transaction');
    else if (menuName === 'Barangay') navigate('/barangay');
    else if (menuName === 'Customers') navigate('/customers');
    else if (menuName === 'Services') navigate('/services');
    else if (menuName === 'Employees') navigate('/employees');
    else if (menuName === 'Payroll') navigate('/payroll');
    else if (menuName === 'Reports') navigate('/reports');
    else alert(`${menuName} page not yet implemented`);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.Emp_FName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.Emp_LName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.Emp_ID.toString().includes(searchQuery);
    const matchesRole = roleFilter === 'All' || emp.Role_ID === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div style={styles.appContainer}>
      
      {/* NAVIGATION BAR */}
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
            const isActive = menu === 'Employees';
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

      {/* WORKSPACE BODY */}
      <div style={styles.workspaceBodyWrapper}>
        <div style={styles.dataLogTableCanvasCard}>

          <div style={styles.tableControlsGridRow}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
              <div style={styles.searchBarBoxFrame}>
                <Search size={18} color="#0077b6" style={styles.searchLeftIcon} />
                <input 
                  type="text" 
                  placeholder="Search by name or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchFieldInput}
                />
              </div>

              {/* Styled Role Filter Dropdown */}
              <div style={styles.dropdownSelectContainer}>
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)} 
                  style={styles.nativeCustomSelect}
                >
                  <option value="All">All Roles</option>
                  <option value="R">Refiller (R)</option>
                  <option value="D">Driver (D)</option>
                </select>
                <ChevronDown size={16} color="#0077b6" style={styles.dropdownChevronOverlay} />
              </div>
            </div>

            <button onClick={() => setIsModalOpen(true)} style={styles.addPrimaryActionButton}>
              <Plus size={16} /> Add Employee
            </button>
          </div>

          {selectedEmployeeIds.length > 0 && (
            <div style={styles.batchActionAlertStrip}>
              <span style={styles.batchSelectionCountLabel}>{selectedEmployeeIds.length} Selected</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBatchDelete} style={styles.batchDeleteActionButton}>Delete Selected</button>
                <button onClick={() => setSelectedEmployeeIds([])} style={styles.batchCancelActionButton}>Cancel</button>
              </div>
            </div>
          )}

          {/* DATA TABLE */}
          <div style={styles.scrollableTableContainer}>
            <table style={styles.ledgerTableMarkup}>
              <thead>
                <tr style={styles.tableHeadBorderRow}>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" onChange={handleToggleAll} checked={selectedEmployeeIds.length === filteredEmployees.length && filteredEmployees.length > 0} style={styles.tableBodyCheckboxInput} />
                  </th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '80px' }}>ID</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '220px' }}>NAME</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '130px' }}>ROLE</th>
                  <th style={{ ...styles.tableHeaderColumnCell, width: '130px' }}>CONTACT</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center', width: '110px' }}>DETAILS</th>
                  <th style={{ ...styles.tableHeaderColumnCell, textAlign: 'center', width: '100px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.Emp_ID} style={styles.tableBodyDataRow}>
                      <td style={{ ...styles.tableBodyCellBlock, textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedEmployeeIds.includes(emp.Emp_ID)} onChange={() => handleToggleSingle(emp.Emp_ID)} style={styles.tableBodyCheckboxInput} />
                      </td>
                      <td style={styles.tableBodyCellBlock}><strong>{emp.Emp_ID}</strong></td>
                      <td style={styles.tableBodyCellBlock}>{emp.Emp_FName} {emp.Emp_LName}</td>
                      <td style={styles.tableBodyCellBlock}>
                         <span style={{ ...styles.typeBadge, backgroundColor: emp.Role_ID === 'D' ? '#e0e7ff' : '#dcfce7', color: emp.Role_ID === 'D' ? '#3730a3' : '#166534' }}>
                           {emp.Role_ID === 'D' ? 'Driver' : 'Refiller'}
                         </span>
                      </td>
                      {/* Uses the safe parseContacts array to display the first item only */}
                      <td style={{ ...styles.tableBodyCellBlock, fontWeight: '700' }}>
                         {parseContacts(emp.Contact_Num)[0] || 'N/A'}
                      </td>
                      <td style={{ ...styles.tableBodyCellBlock, textAlign: 'center' }}>
                         <button onClick={() => handleViewDetails(emp)} style={styles.seeMoreButton}>See More</button>
                      </td>
                      <td style={styles.tableBodyCellBlock}>
                        <div style={styles.inlineActionButtonsFlexGroup}>
                          <button onClick={() => openEditModal(emp)} style={styles.inlineRowEditButton}><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(emp.Emp_ID)} style={styles.inlineRowDeleteButton}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {detailsModalOpen && selectedEmp && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.profileModalContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, width: '30px', display: 'flex', alignItems: 'center', color: '#0077b6' }}><Eye size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>EMPLOYEE PROFILE</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => setDetailsModalOpen(false)}><X size={20} /></button>
            </div>

            <div style={styles.profileLayoutGrid}>
              
              <div style={styles.detailsLeftMiniBox}>
                <div style={styles.avatarCircleLarge}>
                   {localPhotos[selectedEmp.Emp_ID] ? (
                     <img src={localPhotos[selectedEmp.Emp_ID]} alt="Profile" style={styles.avatarImage} />
                   ) : (
                     <User size={70} color="#94a3b8" />
                   )}
                </div>
                
                <div style={styles.miniBoxHeader}>
                  <h3 style={styles.miniBoxName}>{selectedEmp.Emp_FName} {selectedEmp.Emp_LName}</h3>
                  <span style={styles.miniBoxId}>ID: {selectedEmp.Emp_ID}</span>
                </div>

                <div style={styles.miniBoxActionsList}>
                  <div style={styles.miniBoxActionRow}>
                    <span style={styles.miniBoxLabel}>Contact</span> 
                    <button type="button" onClick={() => openContactModal('view')} style={styles.contactTriggerButtonMini}>
                       <Phone size={12} style={{ marginRight: '6px' }} /> View
                    </button>
                  </div>
                  <div style={styles.miniBoxActionRow}>
                    <span style={styles.miniBoxLabel}>Password</span> 
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={styles.passwordUnmaskedTextMini}>{selectedEmp.Password || 'ceestem123'}</span>
                       <button type="button" onClick={openPasswordChangeFlow} style={styles.changePasswordButtonMini}>Edit</button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.detailsRightBox}>
                <div style={styles.detailItem}><span style={styles.detailLabel}>Role:</span> <span style={styles.detailValue}>{selectedEmp.Role_ID === 'D' ? 'Driver' : 'Refiller'}</span></div>
                
                {selectedEmp.Role_ID === 'D' && (
                  <>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>License No:</span> <span style={styles.detailValue}>{selectedEmp.License_Num || 'N/A'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>Expiry Date:</span> <span style={styles.detailValue}>{selectedEmp.License_Exp ? new Date(selectedEmp.License_Exp).toLocaleDateString() : 'N/A'}</span></div>
                  </>
                )}
                
                <div style={styles.dividerLine}></div>

                <div style={styles.detailItem}><span style={styles.detailLabel}>Base Salary:</span> <span style={styles.detailValue}>₱{selectedEmp.Salary || 0}</span></div>
                <div style={styles.detailItem}><span style={styles.detailLabel}>Daily Quota:</span> <span style={styles.detailValue}>{selectedEmp.Quota || 0}</span></div>
                <div style={styles.detailItem}><span style={styles.detailLabel}>Incentive Rate:</span> <span style={styles.detailValue}>₱{selectedEmp.Incentive_Rate || 0}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => setDetailsModalOpen(false)} style={styles.modalPrimaryActionSaveButton}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC CONTACT LIST MODAL */}
      {contactListModalOpen && (
        <div style={{...styles.modalOverlayMask, zIndex: 2010}}>
          <div style={styles.miniModalContainer}>
            <div style={styles.modalHeaderRow}>
               <h3 style={styles.modalHeaderHeadingText}>
                 {contactModalTarget === 'view' ? 'Contact Numbers' : 'Manage Contacts'}
               </h3>
               <button style={styles.modalHeaderCloseXButton} onClick={() => setContactListModalOpen(false)}><X size={20} /></button>
            </div>
            
            <ul style={styles.contactListUl}>
               {currentContacts.length > 0 ? (
                  currentContacts.map((contact, index) => (
                    <li key={index} style={styles.contactListLi}>
                      {contact}
                      {contactModalTarget !== 'view' && (
                        <button type="button" onClick={() => setCurrentContacts(currentContacts.filter((_, i) => i !== index))} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}><X size={14}/></button>
                      )}
                    </li>
                  ))
               ) : (
                  <li style={styles.contactListLi}>No contacts registered.</li>
               )}
            </ul>

            {contactModalTarget !== 'view' && (
              <div style={styles.addContactRow}>
                 {/* STRIPPED INPUT: Enforces maximum length and strips letters/symbols as you type */}
                 <input 
                    type="text" 
                    maxLength="11"
                    placeholder="e.g. 09123456789" 
                    value={newContactNum} 
                    onChange={(e) => {
                       const digitsOnly = e.target.value.replace(/\D/g, '');
                       setNewContactNum(digitsOnly);
                    }} 
                    style={styles.miniInputField} 
                 />
                 <button type="button" onClick={handleAddContact} style={styles.addContactButton}>Add</button>
              </div>
            )}

            <button onClick={contactModalTarget === 'view' ? () => setContactListModalOpen(false) : saveContactsAndClose} style={{...styles.modalPrimaryActionSaveButton, width: '100%', marginTop: '15px'}}>
              {contactModalTarget === 'view' ? 'Close' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD SUB-MODAL */}
      {passwordModalOpen && (
        <div style={{...styles.modalOverlayMask, zIndex: 2010}}>
          <div style={styles.miniModalContainer}>
            <div style={styles.modalHeaderRow}>
               <h3 style={styles.modalHeaderHeadingText}>
                 {passwordStage === 'verify' ? 'Owner Verification' : 'Update Password'}
               </h3>
               <button type="button" style={styles.modalHeaderCloseXButton} onClick={() => setPasswordModalOpen(false)}><X size={20} /></button>
            </div>

            {passwordStage === 'verify' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>Please enter the Owner Password to authorize this change.</p>
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>OWNER PASSWORD</label>
                  <input type="text" value={ownerPasswordInput} onChange={(e) => setOwnerPasswordInput(e.target.value)} style={{ ...styles.modalActiveInputField, WebkitTextSecurity: 'disc' }} name="admin-secret-verify" autoComplete="off" placeholder="Enter owner password" readOnly onFocus={(e) => e.target.removeAttribute('readOnly')} />
                </div>
                <button type="button" onClick={handleVerifyOwner} style={{...styles.modalPrimaryActionSaveButton, width: '100%'}}>Verify</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>Set a new UI access password for {selectedEmp?.Emp_FName}.</p>
                <div style={styles.modalFormInputGroupFieldUnit}>
                  <label style={styles.modalFormFieldLabelHeader}>NEW PASSWORD</label>
                  <input type="text" value={newEmployeePassword} onChange={(e) => setNewEmployeePassword(e.target.value)} style={{ ...styles.modalActiveInputField, WebkitTextSecurity: 'disc' }} name="new-emp-pass" autoComplete="off" placeholder="Enter new password" readOnly onFocus={(e) => e.target.removeAttribute('readOnly')} />
                </div>
                <button type="button" onClick={handleSaveNewPassword} style={{...styles.modalPrimaryActionSaveButton, width: '100%'}}>Save Password</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.addEditModalContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, width: '30px', display: 'flex', alignItems: 'center', color: '#0077b6' }}><Plus size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>ADD EMPLOYEE</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => { setIsModalOpen(false); setAddPhotoPreview(null); }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={styles.modalContentFormElement}>
              <div style={styles.addEditLayoutGrid}>
                
                <div style={styles.addEditLeftColumn}>
                  <div style={styles.avatarCircle}>
                    {addPhotoPreview ? (
                      <img src={addPhotoPreview} alt="Preview" style={styles.avatarImage} />
                    ) : (
                      <User size={80} color="#94a3b8" />
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={addPhotoInputRef} style={{ display: 'none' }} onChange={handleAddPhotoChange} />
                  <button type="button" onClick={() => addPhotoInputRef.current.click()} style={styles.uploadPhotoButton}>Upload Photo</button>
                </div>

                <div style={styles.addEditRightColumn}>
                  <div style={styles.modalFormInputFieldsDoubleColumnGrid}>
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>EMPLOYEE ID <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="Emp_ID" value={formData.Emp_ID} onChange={handleInputChange} required style={styles.modalActiveInputField} />
                    </div>
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>ROLE <span style={{color: 'red'}}>*</span></label>
                      <div style={styles.modalSelectFieldWrapperBox}>
                        <select name="Role_ID" value={formData.Role_ID} onChange={handleInputChange} style={styles.modalNativeDropdownSelect}>
                          <option value="R">Refiller (R)</option>
                          <option value="D">Driver (D)</option>
                        </select>
                        <ChevronDown size={14} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                      </div>
                    </div>
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>FIRST NAME <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="Emp_FName" value={formData.Emp_FName} onChange={handleInputChange} required style={styles.modalActiveInputField} />
                    </div>
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>LAST NAME <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="Emp_LName" value={formData.Emp_LName} onChange={handleInputChange} required style={styles.modalActiveInputField} />
                    </div>
                    
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>CONTACT NUMBERS <span style={{color: 'red'}}>*</span></label>
                      <button type="button" onClick={() => openContactModal('add')} style={styles.manageContactsButton}>
                         <Phone size={14} style={{ marginRight: '8px' }} /> 
                         {formData.Contact_Num ? `${parseContacts(formData.Contact_Num).length} Contacts Added` : 'Manage Contacts'}
                      </button>
                    </div>

                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>SYSTEM PASSWORD <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="Password" value={formData.Password} onChange={handleInputChange} required style={{...styles.modalActiveInputField, WebkitTextSecurity: 'disc'}} placeholder="Assign Initial Password" />
                    </div>
                    
                    {formData.Role_ID === 'D' && (
                      <>
                        <div style={styles.modalFormInputGroupFieldUnit}>
                          <label style={styles.modalFormFieldLabelHeader}>LICENSE NO. <span style={{color: 'red'}}>*</span></label>
                          <input type="text" name="License_Num" value={formData.License_Num} onChange={handleInputChange} required style={styles.modalActiveInputField} />
                        </div>
                        <div style={styles.modalFormInputGroupFieldUnit}>
                          <label style={styles.modalFormFieldLabelHeader}>EXPIRY DATE <span style={{color: 'red'}}>*</span></label>
                          <input type="date" name="License_Exp" value={formData.License_Exp} onChange={handleInputChange} required style={styles.modalActiveInputField} />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {roleDataMap[formData.Role_ID] && (
                    <div style={styles.dynamicRoleSummaryCard}>
                      <div style={styles.dynamicRoleHeader}><Info size={14} color="#0077b6" /><span style={styles.dynamicRoleTitle}>Role Details</span></div>
                      <div style={styles.dynamicRoleGrid}>
                        <div style={styles.dynamicRoleItem}><span style={styles.dynamicRoleLabel}>Base Salary</span><span style={styles.dynamicRoleValue}>₱{roleDataMap[formData.Role_ID].Salary}</span></div>
                        <div style={styles.dynamicRoleItem}><span style={styles.dynamicRoleLabel}>Daily Quota</span><span style={styles.dynamicRoleValue}>{roleDataMap[formData.Role_ID].Quota}</span></div>
                        <div style={styles.dynamicRoleItem}><span style={styles.dynamicRoleLabel}>Incentive</span><span style={styles.dynamicRoleValue}>₱{roleDataMap[formData.Role_ID].Incentive_Rate}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{...styles.modalFooterButtonsControlFlexRow, marginTop: '20px'}}>
                <button type="button" onClick={() => { setIsModalOpen(false); setAddPhotoPreview(null); }} style={styles.modalDismissCancelButtonLink}>Cancel</button>
                <button type="submit" style={styles.modalPrimaryActionSaveButton}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {isEditModalOpen && draftEmployeeEdits && (
        <div style={styles.modalOverlayMask}>
          <div style={styles.addEditModalContainer}>
            <div style={styles.modalHeaderRow}>
              <div style={styles.modalHeaderTitleGroup}>
                <div style={{ ...styles.modalHeaderTitleIconBox, width: '30px', display: 'flex', alignItems: 'center', color: '#0077b6' }}><Edit2 size={20} /></div>
                <h2 style={styles.modalHeaderHeadingText}>EDIT EMPLOYEE</h2>
              </div>
              <button style={styles.modalHeaderCloseXButton} onClick={() => { setIsEditModalOpen(false); setEditPhotoPreview(null); }}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdateSubmit} style={styles.modalContentFormElement}>
              <div style={styles.addEditLayoutGrid}>
                
                <div style={styles.addEditLeftColumn}>
                  <div style={styles.avatarCircle}>
                    {editPhotoPreview ? (
                      <img src={editPhotoPreview} alt="Preview" style={styles.avatarImage} />
                    ) : (
                      <User size={80} color="#94a3b8" />
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={editPhotoInputRef} style={{ display: 'none' }} onChange={handleEditPhotoChange} />
                  <button type="button" onClick={() => editPhotoInputRef.current.click()} style={styles.uploadPhotoButton}>Upload Photo</button>
                </div>

                <div style={styles.addEditRightColumn}>
                  <div style={styles.modalFormInputFieldsDoubleColumnGrid}>
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>EMPLOYEE ID</label>
                      <input type="text" value={draftEmployeeEdits.Emp_ID} disabled style={styles.modalDisabledInputField} />
                    </div>
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>ROLE <span style={{color: 'red'}}>*</span></label>
                      <div style={styles.modalSelectFieldWrapperBox}>
                        <select value={draftEmployeeEdits.Role_ID} onChange={(e) => setDraftEmployeeEdits({...draftEmployeeEdits, Role_ID: e.target.value})} style={styles.modalNativeDropdownSelect}>
                          <option value="R">Refiller (R)</option>
                          <option value="D">Driver (D)</option>
                        </select>
                        <ChevronDown size={14} color="#0077b6" style={styles.modalSelectChevronOverlayIcon} />
                      </div>
                    </div>
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>FIRST NAME <span style={{color: 'red'}}>*</span></label>
                      <input type="text" value={draftEmployeeEdits.Emp_FName} onChange={(e) => setDraftEmployeeEdits({...draftEmployeeEdits, Emp_FName: e.target.value})} required style={styles.modalActiveInputField} />
                    </div>
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>LAST NAME <span style={{color: 'red'}}>*</span></label>
                      <input type="text" value={draftEmployeeEdits.Emp_LName} onChange={(e) => setDraftEmployeeEdits({...draftEmployeeEdits, Emp_LName: e.target.value})} required style={styles.modalActiveInputField} />
                    </div>
                    
                    <div style={styles.modalFormInputGroupFieldUnit}>
                      <label style={styles.modalFormFieldLabelHeader}>CONTACT NUMBERS <span style={{color: 'red'}}>*</span></label>
                      <button type="button" onClick={() => openContactModal('edit')} style={styles.manageContactsButton}>
                         <Phone size={14} style={{ marginRight: '8px' }} /> 
                         {draftEmployeeEdits.Contact_Num ? `${parseContacts(draftEmployeeEdits.Contact_Num).length} Contacts Added` : 'Manage Contacts'}
                      </button>
                    </div>
                    <div style={styles.modalFormInputGroupFieldUnit}></div>
                    
                    {draftEmployeeEdits.Role_ID === 'D' && (
                      <>
                        <div style={styles.modalFormInputGroupFieldUnit}>
                          <label style={styles.modalFormFieldLabelHeader}>LICENSE NO. <span style={{color: 'red'}}>*</span></label>
                          <input type="text" value={draftEmployeeEdits.License_Num || ''} onChange={(e) => setDraftEmployeeEdits({...draftEmployeeEdits, License_Num: e.target.value})} required style={styles.modalActiveInputField} />
                        </div>
                        <div style={styles.modalFormInputGroupFieldUnit}>
                          <label style={styles.modalFormFieldLabelHeader}>EXPIRY DATE <span style={{color: 'red'}}>*</span></label>
                          <input type="date" value={draftEmployeeEdits.License_Exp || ''} onChange={(e) => setDraftEmployeeEdits({...draftEmployeeEdits, License_Exp: e.target.value})} required style={styles.modalActiveInputField} />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {roleDataMap[draftEmployeeEdits.Role_ID] && (
                    <div style={styles.dynamicRoleSummaryCard}>
                      <div style={styles.dynamicRoleHeader}><Info size={14} color="#0077b6" /><span style={styles.dynamicRoleTitle}>Role Details</span></div>
                      <div style={styles.dynamicRoleGrid}>
                        <div style={styles.dynamicRoleItem}><span style={styles.dynamicRoleLabel}>Base Salary</span><span style={styles.dynamicRoleValue}>₱{roleDataMap[draftEmployeeEdits.Role_ID].Salary}</span></div>
                        <div style={styles.dynamicRoleItem}><span style={styles.dynamicRoleLabel}>Daily Quota</span><span style={styles.dynamicRoleValue}>{roleDataMap[draftEmployeeEdits.Role_ID].Quota}</span></div>
                        <div style={styles.dynamicRoleItem}><span style={styles.dynamicRoleLabel}>Incentive</span><span style={styles.dynamicRoleValue}>₱{roleDataMap[draftEmployeeEdits.Role_ID].Incentive_Rate}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{...styles.modalFooterButtonsControlFlexRow, marginTop: '20px'}}>
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditPhotoPreview(null); }} style={styles.modalDismissCancelButtonLink}>Cancel</button>
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
  
  dropdownSelectContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  nativeCustomSelect: { appearance: 'none', backgroundColor: '#eaf4fc', border: '1px solid #bde0fe', borderRadius: '8px', padding: '12px 40px 12px 18px', fontSize: '0.92rem', fontWeight: '600', color: '#014f86', outline: 'none', cursor: 'pointer' },
  dropdownChevronOverlay: { position: 'absolute', right: '14px', pointerEvents: 'none' },

  addPrimaryActionButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0, 119, 182, 0.2)' },
  batchActionAlertStrip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffe3e3', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 20px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' },
  batchSelectionCountLabel: { color: '#b91c1c', fontWeight: '700', fontSize: '0.95rem' },
  batchDeleteActionButton: { backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer' },
  batchCancelActionButton: { backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 16px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' },
  ledgerTableMarkup: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' },
  tableHeadBorderRow: { borderBottom: '2px solid #bde0fe' },
  scrollableTableContainer: { overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 },
  tableHeaderColumnCell: { padding: '14px 10px', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10, borderBottom: '2px solid #bde0fe' },
  tableBodyDataRow: { borderBottom: '1px solid #e2e8f0', height: '52px' },
  tableBodyCellBlock: { padding: '12px 10px', fontSize: '0.9rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tableBodyCheckboxInput: { width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' },
  typeBadge: { padding: '4px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700' },
  
  seeMoreButton: { backgroundColor: 'transparent', color: '#0077b6', border: '1px solid #0077b6', borderRadius: '6px', padding: '6px 12px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' },
  inlineActionButtonsFlexGroup: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  inlineRowEditButton: { backgroundColor: '#eaf4fc', border: 'none', borderRadius: '6px', color: '#0077b6', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  inlineRowDeleteButton: { backgroundColor: '#ffe3e3', border: 'none', borderRadius: '6px', color: '#ef4444', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  
  modalOverlayMask: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  
  profileModalContainer: { backgroundColor: '#ffffff', width: '90%', maxWidth: '880px', borderRadius: '12px', border: '1px solid #0077b6', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  
  addEditModalContainer: { backgroundColor: '#ffffff', width: '90%', maxWidth: '750px', borderRadius: '12px', border: '1px solid #0077b6', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  
  miniModalContainer: { backgroundColor: '#ffffff', width: '90%', maxWidth: '380px', borderRadius: '12px', border: '1px solid #0077b6', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  
  modalHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', width: '100%' },
  modalHeaderTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #bde0fe', paddingBottom: '12px', flex: 1 },
  modalHeaderTitleIconBox: { fontSize: '1.5rem', display: 'flex' },
  modalHeaderHeadingText: { fontSize: '1.25rem', fontWeight: '800', color: '#011627', margin: 0 },
  modalHeaderCloseXButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
  
  profileLayoutGrid: { display: 'flex', gap: '24px', alignItems: 'stretch', marginTop: '10px' },
  
  detailsLeftMiniBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '350px', flexShrink: 0, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxSizing: 'border-box' },
  
  miniBoxHeader: { textAlign: 'center', marginBottom: '16px', width: '100%', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' },
  miniBoxName: { margin: '12px 0 4px 0', color: '#012a4a', fontSize: '1.15rem', fontWeight: '800' },
  miniBoxId: { color: '#64748b', fontSize: '0.85rem', fontWeight: '700' },
  
  miniBoxActionsList: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
  miniBoxActionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  miniBoxLabel: { fontWeight: '800', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' },

  contactTriggerButtonMini: { backgroundColor: '#eaf4fc', color: '#0077b6', border: '1px solid #bde0fe', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  passwordUnmaskedTextMini: { fontWeight: '800', color: '#012a4a', fontSize: '0.9rem', letterSpacing: '1px' },
  changePasswordButtonMini: { backgroundColor: '#ffe3e3', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' },

  detailsRightBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxSizing: 'border-box', justifyContent: 'center' },
  
  avatarCircleLarge: { width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#ffffff', border: '3px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  
  detailItem: { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '10px 0' },
  detailLabel: { fontWeight: '800', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', width: '150px', flexShrink: 0, textAlign: 'left' },
  detailValue: { fontWeight: '800', color: '#012a4a', fontSize: '1.05rem', flex: 1, textAlign: 'left' },
  
  addEditLayoutGrid: { display: 'flex', gap: '40px', alignItems: 'flex-start', marginTop: '10px' },
  addEditLeftColumn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '180px', flexShrink: 0 },
  addEditRightColumn: { flex: 1, display: 'flex', flexDirection: 'column' },

  avatarCircle: { width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '3px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', objectFit: 'cover' },
  uploadPhotoButton: { backgroundColor: '#eaf4fc', color: '#0077b6', border: '1px solid #bde0fe', borderRadius: '6px', padding: '8px 14px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', width: '100%' },
  
  dividerLine: { height: '1px', backgroundColor: '#cbd5e1', margin: '14px 0' },
  
  manageContactsButton: { backgroundColor: '#eaf4fc', color: '#0077b6', border: '1px solid #0077b6', borderRadius: '6px', padding: '10px 14px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', boxSizing: 'border-box' },
  
  contactListUl: { listStyle: 'none', padding: 0, margin: 0, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxHeight: '150px', overflowY: 'auto' },
  contactListLi: { padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#012a4a', fontWeight: '600', fontSize: '0.95rem', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between' },
  addContactRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' },
  miniInputField: { flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #bde0fe', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.9rem', outline: 'none' },
  addContactButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer' },
  
  modalContentFormElement: { display: 'flex', flexDirection: 'column', width: '100%' },
  modalFormInputFieldsDoubleColumnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: '16px', width: '100%' },
  modalFormInputGroupFieldUnit: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' },
  modalFormFieldLabelHeader: { fontSize: '0.75rem', fontWeight: '800', color: '#011627', marginBottom: '4px', letterSpacing: '0.3px' },
  modalActiveInputField: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' },
  modalDisabledInputField: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' },
  modalSelectFieldWrapperBox: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%' },
  modalNativeDropdownSelect: { appearance: 'none', width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #0077b6', backgroundColor: '#ffffff', color: '#012a4a', fontSize: '0.85rem', fontWeight: '700', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  modalSelectChevronOverlayIcon: { position: 'absolute', right: '12px', pointerEvents: 'none' },
  
  dynamicRoleSummaryCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
  dynamicRoleHeader: { display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' },
  dynamicRoleTitle: { fontSize: '0.85rem', fontWeight: '800', color: '#012a4a' },
  dynamicRoleGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '2px' },
  dynamicRoleItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  dynamicRoleLabel: { fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  dynamicRoleValue: { fontSize: '0.9rem', fontWeight: '800', color: '#0077b6' },

  modalFooterButtonsControlFlexRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px', width: '100%' },
  modalDismissCancelButtonLink: { background: 'none', border: 'none', color: '#0077b6', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', padding: '10px 16px' },
  modalPrimaryActionSaveButton: { backgroundColor: '#0077b6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 119, 182, 0.25)' }
};

export default Employees;