import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OwnerTransaction from './pages/OwnerTransaction';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple backend-emulated validator
  const handleLoginVerify = (email, password, userType) => {
    if (userType === 'owner') {
      if (email === 'ceestem@gmail.com' && password === 'ceestem123') {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, message: "Invalid Owner credentials!" };
      }
    } else {
      // Direct bypass for employee UI sandbox testing
      setIsAuthenticated(true);
      return { success: true };
    }
  };

  return (
    <Router>
      <Routes>
        {/* Main Authentication Route gate */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/transaction" replace />
            ) : (
              <Login onLoginVerify={handleLoginVerify} />
            )
          } 
        />
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* Protected Owner Transaction Route */}
        <Route 
          path="/transaction" 
          element={
            isAuthenticated ? (
              <OwnerTransaction onLogout={() => setIsAuthenticated(false)} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Dynamic Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;