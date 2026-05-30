import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OwnerTransaction from './pages/OwnerTransaction';
import Barangay from './pages/Barangay'; 
import Customer from './pages/Customer';
import Services from './pages/Services'; 
import EmployeeDashboard from './pages/EmployeeDashboard';

const employeeCredentials = [
  { id: 'R1', password: 'ref1', role: 'refiller' },
  { id: 'R2', password: 'ref2', role: 'refiller' },
  { id: 'D1', password: 'dri1', role: 'driver' },
  { id: 'D2', password: 'dri2', role: 'driver' }
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // Track if owner or employee

  const handleLoginVerify = (username, password, userType) => {
      if (userType === 'owner') {
        if (username === 'ceestem@gmail.com' && password === 'ceestem123') {
          setIsAuthenticated(true);
          setUserRole('owner');
          // Optional: Save owner role to localStorage so they don't get logged out on refresh
          localStorage.setItem('userRole', 'owner'); 
          return { success: true };
        }
        return { success: false, message: "Invalid Owner credentials!" };
      } 
      
      // Employee logic
      const foundEmployee = employeeCredentials.find(
        (emp) => emp.id === username && emp.password === password
      );

      if (foundEmployee) {
        // ==========================================
        // INSERT THE LOCALSTORAGE SAVING LOGIC HERE
        // ==========================================
        const loggedInUser = {
          id: foundEmployee.id,
          role: foundEmployee.role === 'refiller' ? 'R' : 'D' 
        };
        
        // Save the specific employee ID and role for the database
        localStorage.setItem('activeEmployee', JSON.stringify(loggedInUser));
        
        // Save the generic user type so your protected routes work correctly!
        localStorage.setItem('userRole', 'employee'); 
        // ==========================================

        setIsAuthenticated(true);
        setUserRole('employee');
        return { success: true };
      }
      return { success: false, message: "Invalid Employee ID or Password!" };
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
          element={
            isAuthenticated ? (
              userRole === 'owner' ? <OwnerTransaction /> : <EmployeeDashboard />
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
        
        {/* Catch-all route MUST always be at the very bottom */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;