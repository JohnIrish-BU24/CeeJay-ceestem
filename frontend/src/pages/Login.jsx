import React, { useState } from 'react';
import { Store, Droplet, Pipette, Truck, Contact, Lock, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import logoImg from '../assets/logo.png';

function Login({ onLoginVerify }) {
  const [userType, setUserType] = useState('owner');
  const [employeeRole, setEmployeeRole] = useState('refiller');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Custom Modal UI Routing States
  const [activeModal, setActiveModal] = useState(null); 
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (userType === 'owner') {
      setActiveModal('owner_verify');
    } else {
      setActiveModal('employee_alert');
    }
  };

  const handleOwnerVerificationSubmit = (e) => {
    e.preventDefault();
    alert(`A secure initialization token has been dispatched to: ${recoveryEmail}`);
    setActiveModal(null);
    setRecoveryEmail('');
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (onLoginVerify) {
      // 1. Call your existing verification logic
      const response = await onLoginVerify(username, password, userType);
      
      if (response && response.success) {
        // 2. Store the role in localStorage
        // If userType is employee, we store 'employee', otherwise 'owner'
        localStorage.setItem('userRole', userType);
        
        // 3. Optional: Store specific employee role if needed
        if (userType === 'employee') {
          localStorage.setItem('employeeType', employeeRole);
        }
        
        // Navigate or trigger app state change (depending on your App.jsx)
        alert("Login successful!");
      } else {
        alert(response ? response.message : "Login failed.");
      }
    }
  };

  return (
    <div style={styles.container}>
      
      {/* ================= LEFT SIDE PANEL ================= */}
      <div style={styles.leftPane}>
        <div style={styles.leftContentWrapper}>
          
          {/* Centered Logo Box */}
          <div style={styles.logoCenteringBox}>
            <img 
              src={logoImg} 
              alt="CeeStem Logo" 
              style={styles.logoImage} 
            />
          </div>
          
          {/* Left-Justified Single Sentence Branding Frame */}
          <div style={styles.brandingTextContainer}>
            <h3 style={styles.leftTagline}>Smart Management for Clean Water.</h3>
            
            <div style={styles.bulletGrid}>
              <div style={styles.bulletItem}>
                <div style={styles.bulletIcon}>💧</div>
                <span style={styles.bulletText}>
                  A centralized operational database system designed to manage customer profiles, transaction histories, delivery logs, and employee records for CeeJay's Water Refilling Station in Daraga, Albay.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ================= RIGHT SIDE PANEL ================= */}
      <div style={styles.rightPane}>
        <div style={styles.innerFormCanvas}>
          
          {/* Greeting Header */}
          <h2 style={styles.mainGreeting}>
            Welcome <span style={styles.accentText}>back</span>
          </h2>
          <p style={styles.subGreeting}>Sign in to your account</p>

          <form onSubmit={handleSubmit} style={styles.formContainer}>
            
            {/* Account Type Selector Toggles */}
            <div style={styles.inputGroup}>
              <label style={styles.fieldHeading}>Sign in as</label>
              <div style={styles.cardRow}>
                
                {/* --- OWNER BUTTON --- */}
                <button
                  type="button"
                  onClick={() => setUserType('owner')}
                  style={{
                    ...styles.selectorCard,
                    // Use dark blue (#014f86) for the active border
                    borderColor: userType === 'owner' ? '#014f86' : '#bde0fe',
                    backgroundColor: userType === 'owner' ? '#f0f8ff' : '#ffffff',
                    borderWidth: userType === 'owner' ? '2px' : '1px'
                  }}
                >
                  <div style={{ 
                    ...styles.iconCircle, 
                    backgroundColor: userType === 'owner' ? '#014f86' : '#eaf4fc' 
                  }}>
                    <Store size={18} color={userType === 'owner' ? '#ffffff' : '#014f86'} />
                  </div>
                  <div style={styles.cardTextContent}>
                    <span style={styles.cardMainLabel}>Owner</span>
                    <span style={styles.cardSubLabel}>Full access</span>
                  </div>
                  <div style={{ ...styles.radioCircle, borderColor: userType === 'owner' ? '#014f86' : '#cbd5e1' }}>
                    {userType === 'owner' && <div style={{ ...styles.radioDot, backgroundColor: '#014f86' }} />}
                  </div>
                </button>

                {/* --- EMPLOYEE BUTTON --- */}
                <button
                  type="button"
                  onClick={() => setUserType('employee')}
                  style={{
                    ...styles.selectorCard,
                    // Use dark blue (#014f86) for the active border
                    borderColor: userType === 'employee' ? '#014f86' : '#bde0fe',
                    backgroundColor: userType === 'employee' ? '#f0f8ff' : '#ffffff',
                    borderWidth: userType === 'employee' ? '2px' : '1px'
                  }}
                >
                  <div style={{ 
                    ...styles.iconCircle, 
                    backgroundColor: userType === 'employee' ? '#014f86' : '#eaf4fc' 
                  }}>
                    <Droplet size={18} color={userType === 'employee' ? '#ffffff' : '#014f86'} />
                  </div>
                  <div style={styles.cardTextContent}>
                    <span style={styles.cardMainLabel}>Employee</span>
                    <span style={styles.cardSubLabel}>Limited access</span>
                  </div>
                  <div style={{ ...styles.radioCircle, borderColor: userType === 'employee' ? '#014f86' : '#cbd5e1' }}>
                    {userType === 'employee' && <div style={{ ...styles.radioDot, backgroundColor: '#014f86' }} />}
                  </div>
                </button>
              </div>
            </div>

            {/* Sub-Role Section for Employees */}
            {userType === 'employee' && (
              <div style={styles.inputGroup}>
                <label style={styles.fieldHeading}>Role <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={styles.cardRow}>
                  {/* --- REFILLER BUTTON --- */}
                  <button
                    type="button"
                    onClick={() => setEmployeeRole('refiller')}
                    style={{
                      ...styles.selectorCardSmall,
                      // Changed cyan to dark blue (#014f86)
                      borderColor: employeeRole === 'refiller' ? '#014f86' : '#bde0fe',
                      backgroundColor: employeeRole === 'refiller' ? '#f0f8ff' : '#ffffff',
                      borderWidth: employeeRole === 'refiller' ? '2px' : '1px'
                    }}
                  >
                    {/* The icon in the image stays dark blue whether selected or not */}
                    <Pipette size={18} color="#014f86" style={{ marginRight: '8px' }} />
                    <span style={styles.smallCardText}>Refiller</span>
                    <div style={{ ...styles.radioCircleSmall, marginLeft: 'auto', borderColor: employeeRole === 'refiller' ? '#014f86' : '#cbd5e1' }}>
                      {employeeRole === 'refiller' && <div style={{ ...styles.radioDotSmall, backgroundColor: '#014f86' }} />}
                    </div>
                  </button>

                  {/* --- DRIVER BUTTON --- */}
                  <button
                    type="button"
                    onClick={() => setEmployeeRole('driver')}
                    style={{
                      ...styles.selectorCardSmall,
                      // Changed cyan to dark blue (#014f86)
                      borderColor: employeeRole === 'driver' ? '#014f86' : '#bde0fe',
                      backgroundColor: employeeRole === 'driver' ? '#f0f8ff' : '#ffffff',
                      borderWidth: employeeRole === 'driver' ? '2px' : '1px'
                    }}
                  >
                    <Truck size={18} color="#014f86" style={{ marginRight: '8px' }} />
                    <span style={styles.smallCardText}>Driver</span>
                    <div style={{ ...styles.radioCircleSmall, marginLeft: 'auto', borderColor: employeeRole === 'driver' ? '#014f86' : '#cbd5e1' }}>
                      {employeeRole === 'driver' && <div style={{ ...styles.radioDotSmall, backgroundColor: '#014f86' }} />}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Input Fields */}
            <div style={styles.inputGroup}>
              <label style={styles.fieldHeading}>Username / Email <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={styles.inputContainer}>
                <Contact size={18} color="#94a3b8" style={styles.inputIconLeft} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  style={styles.htmlInputElement}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.fieldHeading}>Password <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={styles.inputContainer}>
                <Lock size={18} color="#94a3b8" style={styles.inputIconLeft} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={styles.htmlInputElement}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.inputIconRightButton}
                >
                  {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
            </div>

            <button type="button" onClick={handleForgotPassword} style={styles.forgotPasswordLink}>
              Forget password?
            </button>

            <button type="submit" style={styles.primaryActionButton}>
              Sign In
            </button>

          </form>
        </div>
      </div>

      {/* ================= MODAL INJECTION INTERFACES ================= */}
      
      {/* 1. EMPLOYEE SECURITY MODAL */}
      {activeModal === 'employee_alert' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeaderRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#012a4a' }}>
                <Lock size={20} color="#014f86" />
                <strong style={{ fontSize: '1.1rem' }}>System Security Note</strong>
              </div>
              <button style={styles.closeModalX} onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={styles.modalBodyText}>
              Please contact the business owner directly to reset your account password credentials.
            </p>
            <button style={styles.modalConfirmButton} onClick={() => setActiveModal(null)}>
              Dismiss Notice
            </button>
          </div>
        </div>
      )}

      {/* 2. OWNER IDENTITY VERIFICATION MODAL */}
      {activeModal === 'owner_verify' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeaderRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#012a4a' }}>
                <ShieldCheck size={22} color="#2a9d8f" />
                <strong style={{ fontSize: '1.15rem', color: '#012a4a', letterSpacing: '-0.3px' }}>Identity Verification</strong>
              </div>
              <button style={styles.closeModalX} onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={styles.modalBodyText}>
              To confirm your authorization as system administrator, provide the recovery email mapped to this CeeStem node.
            </p>
            
            <form onSubmit={handleOwnerVerificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              <input 
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="name@example.com"
                style={styles.modalInput}
                required
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', width: '100%' }}>
                <button 
                  type="button" 
                  style={styles.modalCancelButtonLink} 
                  onClick={() => { setActiveModal(null); setRecoveryEmail(''); }}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.modalSubmitActionButton}>
                  Send Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ================= FULL STYLE CONFIG MATRIX =================
const styles = {
  container: {
    display: 'flex',
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
  leftPane: {
    flex: '1',
    background: 'linear-gradient(145deg, #e3f2fd 0%, #cde6f7 100%)', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '30px 40px', 
    boxSizing: 'border-box'
  },
  leftContentWrapper: {
    width: '100%',
    maxWidth: '480px', 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  logoCenteringBox: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center', 
    marginBottom: '24px' 
  },
  logoImage: {
    width: '100%',
    maxWidth: '420px', 
    height: 'auto',
    objectFit: 'contain',
    mixBlendMode: 'multiply'
  },
  brandingTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    padding: '0'
  },
  leftTagline: {
    fontSize: '1.45rem',
    fontWeight: 'bold',
    color: '#012a4a',
    margin: '0 0 14px 0',
    lineHeight: '1.3',
    textAlign: 'left',
    width: '100%'
  },
  bulletGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  bulletItem: {
    display: 'flex',
    alignItems: 'flex-start'
  },
  bulletIcon: {
    fontSize: '0.85rem',
    marginRight: '12px',
    marginTop: '2px',
    userSelect: 'none'
  },
  bulletText: {
    fontSize: '0.84rem', 
    color: '#475569',
    lineHeight: '1.6',
    textAlign: 'justify', 
    margin: 0
  },
  rightPane: {
    flex: '1.2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    padding: '20px'
  },
  innerFormCanvas: {
    width: '90%',
    maxWidth: '460px', 
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  mainGreeting: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0 0 6px 0',
    letterSpacing: '-1px',
    textAlign: 'left',
    backgroundImage: 'linear-gradient(to right, #014f86, #2cb2bf)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent'
  },
  accentText: {
    fontWeight: 'bold'
  },
  accentText: {
    color: '#2cb2bf',
    fontWeight: 'bold'
  },
  subGreeting: {
    fontSize: '1rem',
    color: '#64748b',
    margin: '0 0 28px 0',
    textAlign: 'left'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginBottom: '18px',
    textAlign: 'left'
  },
  fieldHeading: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#012a4a',
    marginBottom: '8px',
    textAlign: 'left',
    display: 'block'
  },
  cardRow: {
    display: 'flex',
    gap: '14px',
    width: '100%'
  },
  selectorCard: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #bde0fe',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    outline: 'none',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  iconCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0
  },
  cardTextContent: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  cardMainLabel: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#012a4a'
  },
  cardSubLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '1px'
  },
  radioCircle: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid #cbd5e1',
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  radioDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  selectorCardSmall: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #bde0fe',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
    boxSizing: 'border-box'
  },
  smallCardText: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#012a4a',
    textAlign: 'left'
  },
  radioCircleSmall: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  radioDotSmall: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },
  inputIconLeft: {
    position: 'absolute',
    left: '16px',
    pointerEvents: 'none'
  },
  inputIconRightButton: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0'
  },
  htmlInputElement: {
    width: '100%',
    padding: '14px 44px 14px 48px',
    borderRadius: '8px',
    border: '1px solid #bde0fe',
    backgroundColor: '#edf6f9',
    color: '#012a4a',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    textAlign: 'left'
  },
  forgotPasswordLink: {
    background: 'none',
    border: 'none',
    color: '#0077b6',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    marginBottom: '20px',
    padding: '0'
  },
  primaryActionButton: {
    backgroundColor: '#014f86',
    color: '#ffffff',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.15s ease'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.45)', 
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalBox: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxWidth: '420px',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  modalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    width: '100%'
  },
  closeModalX: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBodyText: {
    fontSize: '0.9rem',
    color: '#64748b',
    lineHeight: '1.55',
    margin: '0 0 20px 0',
    textAlign: 'left'
  },
  modalConfirmButton: {
    backgroundColor: '#014f86',
    color: '#ffffff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center'
  },
  modalInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '0.95rem',
    color: '#012a4a',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
  },
  modalCancelButtonLink: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '0.92rem',
    cursor: 'pointer',
    padding: '8px 12px',
    transition: 'color 0.15s ease'
  },
  modalSubmitActionButton: {
    backgroundColor: '#014f86',
    color: '#ffffff',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '8px',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(1, 79, 134, 0.12)',
    transition: 'background-color 0.15s ease'
  }
};

export default Login;