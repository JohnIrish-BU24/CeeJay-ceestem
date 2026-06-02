import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Transaction from './pages/Transaction';
import Barangay from './pages/Barangay'; 
import Customer from './pages/Customer';
import Services from './pages/Services'; 
import EmployeeDashboard from './pages/EmployeeDashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // Track if owner or employee

  const handleLoginVerify = async (username, password, userType) => {
    if (userType === 'owner') {
      // Owner login stays hardcoded as requested
      if (username === 'ceestem@gmail.com' && password === 'ceestem123') {
        setIsAuthenticated(true);
        setUserRole('owner');
        localStorage.setItem('userRole', 'owner');
        return { success: true };
      } else {
        return { success: false, message: "Invalid owner credentials." };
      }
    } 
    
    else if (userType === 'employee') {
      try {
        // 📍 NEW: Actually call the CeeStem backend API!
        const response = await fetch('http://localhost:5000/api/employee/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setIsAuthenticated(true);
          setUserRole('employee');
          localStorage.setItem('userRole', 'employee');
          // Optional: Store the specific employee data if your dashboard needs it
          localStorage.setItem('activeEmployee', JSON.stringify(data.employeeData));
          
          return { success: true };
        } else {
          // This will display the "Account restricted" or "Invalid Password" message from the backend
          return { success: false, message: data.message || "Login failed." };
        }
      } catch (error) {
        console.error("Login fetch error:", error);
        return { success: false, message: "Server connection failed. Is the backend running?" };
      }
    }
  };

  return (
    <Router>
      <Routes>
        {/* 1. Dynamic Root Route: Send owners to transaction, employees to dashboard */}
        <Route 
          path="/" 
          element={ 
            isAuthenticated ? (
              userRole === 'owner' ? <Navigate to="/transaction" replace /> : <Navigate to="/employee" replace />
            ) : (
              <Login onLoginVerify={handleLoginVerify} /> 
            )
          } 
        />
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* 2. Protected Transaction Route: Ensure only owners can stay here */}
        <Route 
          path="/transaction" 
          element={
            isAuthenticated ? (
              userRole === 'owner' ? <Transaction /> : <Navigate to="/employee" replace />
            ) : <Navigate to="/" replace /> 
          } 
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
          path="/employee" 
          element={
            localStorage.getItem('userRole') === 'employee' 
            ? <EmployeeDashboard /> 
            : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/employees" 
          element={ isAuthenticated ? <Employees /> : <Navigate to="/" replace /> } 
        />

        <Route 
          path="/payroll" 
          element={ isAuthenticated ? <Payroll /> : <Navigate to="/" replace /> } 
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