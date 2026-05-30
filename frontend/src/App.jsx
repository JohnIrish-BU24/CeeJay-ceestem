import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OwnerTransaction from './pages/OwnerTransaction';
import Barangay from './pages/Barangay'; 
import Customer from './pages/Customer';
import Services from './pages/Services'; 
import Reports from './pages/Reports';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginVerify = (email, password, userType) => {
    if (userType === 'owner') {
      if (email === 'ceestem@gmail.com' && password === 'ceestem123') {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, message: "Invalid Owner credentials!" };
      }
    } else {
      setIsAuthenticated(true);
      return { success: true };
    }
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={ isAuthenticated ? <Navigate to="/transaction" replace /> : <Login onLoginVerify={handleLoginVerify} /> } 
        />
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* Protected Owner Routes */}
        <Route 
          path="/transaction" 
          element={ isAuthenticated ? <OwnerTransaction /> : <Navigate to="/" replace /> } 
        />
        
        <Route 
          path="/barangay" 
          element={ isAuthenticated ? <Barangay /> : <Navigate to="/" replace /> } 
        />
        
        <Route 
          path="/customers" 
          element={ isAuthenticated ? <Customer /> : <Navigate to="/" replace /> } 
        />

        <Route 
          path="/services" 
          element={ isAuthenticated ? <Services /> : <Navigate to="/" replace /> } 
        />

        <Route 
          path="/reports" 
          element={ isAuthenticated ? <Reports /> : <Navigate to="/" replace /> } 
        />
        
        {/* Catch-all route MUST always be at the very bottom */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;