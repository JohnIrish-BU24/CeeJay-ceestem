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
import OwnerDashboard from './pages/OwnerDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); 

  // Make this async to handle the backend fetch request
  const handleLoginVerify = async (username, password, userType) => {
      if (userType === 'owner') {
        if (username === 'ceestem@gmail.com' && password === 'ceestem123') {
          setIsAuthenticated(true);
          setUserRole('owner');
          localStorage.setItem('userRole', 'owner'); 
          return { success: true };
        }
        return { success: false, message: "Invalid Owner credentials!" };
      } 
      
      // ==========================================
      // REAL BACKEND AUTHENTICATION LOGIC
      // ==========================================
      try {
        const response = await fetch('https://ceejay-ceestem.onrender.com/api/employee/login',  {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
          // data.employeeData is returned from your backend controller
          const loggedInUser = {
            id: data.employeeData.Emp_ID,
            role: data.employeeData.Role_ID // Captures 'R' or 'D' directly from the DB
          };
          
          // Save the specific employee ID and role for the database
          localStorage.setItem('activeEmployee', JSON.stringify(loggedInUser));
          
          // Save the generic user type so protected routes work correctly
          localStorage.setItem('userRole', 'employee'); 

          setIsAuthenticated(true);
          setUserRole('employee');
          return { success: true };
        } else {
          // Displays the custom backend error (e.g., "Account restricted...")
          return { success: false, message: data.message || "Invalid Employee ID or Password!" };
        }
      } catch (error) {
        console.error("Backend login error:", error);
        return { success: false, message: "Server connection failed. Is the backend running?" };
      }
    };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={ 
            isAuthenticated ? (
              userRole === 'owner' ? <Navigate to="/dashboard" replace /> : <Navigate to="/employee" replace />
            ) : (
              <Login onLoginVerify={handleLoginVerify} /> 
            )
          } 
        />
        <Route path="/login" element={<Navigate to="/" replace />} />

        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              userRole === 'owner' ? <OwnerDashboard /> : <Navigate to="/employee" replace />
            ) : <Navigate to="/" replace /> 
          } 
        />

        {/* 2. Protected Transaction Route */}
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