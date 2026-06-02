import CeeStemLogo from '../assets/CeesTem.png';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Clock, Droplet, ArrowRight, FileText, CheckCircle, Truck, Users, Link, History, Wallet, UserCheck, PieChart, TrendingUp, Package, LogOut } from 'lucide-react';

function OwnerDashboard({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [metrics, setMetrics] = useState({
    todaySales: 0,
    deliverySales: 0,
    walkinSales: 0,
    todayOrders: 0,
    deliveryQty: 0,
    walkinQty: 0,
    unpaidCount: 0,
    unpaidValue: 0,
    activeDrivers: 0,
    activeRefillers: 0,
    recentTransactions: [],
    unpaidTransactions: [],
    employeeStats: [],
    hourlySales: [] 
  });

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock for the header
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data to populate the dashboard metrics dynamically
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/transaction/today');
        if (res.ok) {
          const todayTx = await res.json();
          
          let tSales = 0, dSales = 0, wSales = 0;
          let tQty = 0, dQty = 0, wQty = 0;
          let uCount = 0, uValue = 0;
          
          const drivers = new Set();
          const refillers = new Set();
          const staffTally = {};
          
          const unpaidList = [];
          const hourlyData = {};

          todayTx.forEach(tx => {
            // Apply descriptive variable names and multiply unit price by quantity
            const transactionUnitPrice = parseFloat(tx.Selling_Price || 0);
            const transactionQuantity = parseInt(tx.Quantity || 0);
            const totalTransactionValue = transactionUnitPrice * transactionQuantity;
            
            const isDelivery = tx.Serv_Name?.toLowerCase() === 'delivery';
            const isUnpaid = tx.Remarks?.toLowerCase() === 'unpaid';

            // 1. Sales & Quantity
            tSales += totalTransactionValue;
            tQty += transactionQuantity;
            if (isDelivery) { 
                dSales += totalTransactionValue; 
                dQty += transactionQuantity; 
            } else { 
                wSales += totalTransactionValue; 
                wQty += transactionQuantity; 
            }

            // 2. Unpaid Debts
            if (isUnpaid) {
              uCount++;
              uValue += totalTransactionValue;
              unpaidList.push(tx);
            }

            // 3. Detailed Employee Output
            if (tx.Refiller && tx.Refiller !== '—') {
              refillers.add(tx.Refiller);
              if (!staffTally[tx.Refiller]) staffTally[tx.Refiller] = { name: tx.Refiller, role: 'Refiller', count: 0, value: 0 };
              staffTally[tx.Refiller].count += transactionQuantity;
              staffTally[tx.Refiller].value += totalTransactionValue;
            }
            if (tx.Driver && tx.Driver !== '—') {
              drivers.add(tx.Driver);
              if (!staffTally[tx.Driver]) staffTally[tx.Driver] = { name: tx.Driver, role: 'Driver', count: 0, value: 0 };
              staffTally[tx.Driver].count += transactionQuantity;
              staffTally[tx.Driver].value += totalTransactionValue;
            }

            // 4. Build Graph Data
            if (tx.Trans_Date) {
              const hour = new Date(tx.Trans_Date).getHours();
              hourlyData[hour] = (hourlyData[hour] || 0) + totalTransactionValue;
            }
          });

          const sortedStaff = Object.values(staffTally).sort((a, b) => b.count - a.count);

          // 5. Format Hourly Data (7 AM to 6 PM)
          const formattedHourly = [];
          for (let i = 7; i <= 18; i++) {
            const ampm = i >= 12 ? 'PM' : 'AM';
            const hr12 = i > 12 ? i - 12 : (i === 0 ? 12 : i);
            formattedHourly.push({ label: `${hr12} ${ampm}`, sales: hourlyData[i] || 0 });
          }

          setMetrics({
            todaySales: tSales, deliverySales: dSales, walkinSales: wSales,
            todayOrders: tQty, deliveryQty: dQty, walkinQty: wQty,
            unpaidCount: uCount, unpaidValue: uValue,
            activeDrivers: drivers.size, activeRefillers: refillers.size,
            recentTransactions: todayTx.slice(0, 6),
            unpaidTransactions: unpaidList.slice(0, 5),
            employeeStats: sortedStaff,
            hourlySales: formattedHourly
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
    localStorage.removeItem('userRole');
    localStorage.removeItem('activeEmployee');
    window.location.href = '/login'; 
  };

  const handleRibbonNavigation = (menuName) => {
    const routes = {
      'Dashboard': '/dashboard',
      'Transaction': '/transaction',
      'Services': '/services',
      'Customers': '/customers',
      'Barangay': '/barangay',
      'Employees': '/employees',
      'Payroll': '/payroll',
      'Reports': '/reports'
    };
    if (routes[menuName]) navigate(routes[menuName]);
    else alert(`${menuName} page not yet implemented`);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, customIconText, color, bg }) => (
    <div style={{
      background: '#ffffff', borderRadius: '16px', border: '1px solid #eaf4fb', 
      padding: '24px', display: 'flex', alignItems: 'center', gap: '20px',
      boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)', transition: 'transform 0.2s ease',
      cursor: 'default', flex: 1
    }}
    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
    onMouseOut={e => e.currentTarget.style.transform = 'none'}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color,
        fontSize: customIconText ? '32px' : 'inherit', fontWeight: '800', flexShrink: 0
      }}>
        {Icon ? <Icon size={32} strokeWidth={2.5} /> : customIconText}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </div>
        <div style={{ color: '#011627', fontSize: '2rem', fontWeight: '800', lineHeight: '1.2' }}>
          {value}
        </div>
        
        {subtitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      
      {/* ── Top Navbar ── */}
      <nav style={styles.topNavbar}>
        <div style={styles.navBrandBlock}>
          <img src={CeeStemLogo} alt="CeeStem Logo" style={styles.brandLogo} />
          <div style={styles.brandTextGroup}>
            <span style={styles.brandMainTitle}>CeeStem</span>
            <span style={styles.brandSubTitle}>WATER REFILLING</span>
          </div>
        </div>

        <div style={styles.navMenuLinksRow}>
          {['Dashboard', 'Transaction', 'Services', 'Customers', 'Barangay', 'Employees', 'Payroll', 'Reports'].map((menu) => {
            const isActive = currentPath.includes(menu.toLowerCase());
            return (
              <button
                key={menu}
                onClick={() => handleRibbonNavigation(menu)}
                style={{
                  ...styles.navMenuButton,
                  color: isActive || (menu === 'Dashboard' && currentPath === '/dashboard') ? '#00b4d8' : '#ffffff',
                  borderBottom: isActive || (menu === 'Dashboard' && currentPath === '/dashboard') ? '3px solid #00b4d8' : '3px solid transparent'
                }}
              >
                {menu}
              </button>
            );
          })}
          
          <div style={styles.navDivider}></div>
          <button onClick={handleLogout} style={styles.signOutButton}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Main Workspace ── */}
      <div style={styles.workspaceBodyWrapper}>
        <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px', boxSizing: 'border-box' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <div>
              <h1 style={{ fontSize: '1.9rem', color: '#012a4a', margin: '0 0 8px 0', fontWeight: '800', letterSpacing: '-0.5px' }}>
                Welcome back!
              </h1>
              <p style={{ color: '#475569', margin: 0, fontSize: '0.95rem' }}>
                Here is a detailed snapshot of your refilling station today.
              </p>
            </div>
            
            {/* Live Ticking Clock Badge */}
            <div style={{ 
              background: '#f4f9fd', padding: '10px 18px', borderRadius: '30px', border: '1px solid #cbe4f4', 
              color: '#1a5c8a', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', 
              gap: '10px', boxShadow: '0 4px 12px rgba(16, 42, 67, 0.03)' 
            }}>
              <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)' }}></div>
              <Clock size={16} color="#6a9ab8" />
              {currentTime ? currentTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) : 'Loading...'}
            </div>
          </div>

          {/* ROW 1: Detailed Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            
            <StatCard 
              title="Today's Sales" 
              value={`₱${loading ? '0.00' : metrics.todaySales.toFixed(2)}`}
              subtitle={
                <>
                  <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #bae6fd' }}>
                    Walk-in: ₱{metrics.walkinSales.toFixed(0)}
                  </span>
                  <span style={{ background: '#faf5ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #e9d5ff' }}>
                    Delivery: ₱{metrics.deliverySales.toFixed(0)}
                  </span>
                </>
              }
              customIconText="₱" color="#10b981" bg="#dcfce7" 
            />

            <StatCard 
              title="Unpaid Value" 
              value={`₱${loading ? '0.00' : metrics.unpaidValue.toFixed(2)}`}
              subtitle={
                <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #fecaca' }}>
                  Awaiting {metrics.unpaidCount} {metrics.unpaidCount === 1 ? 'account' : 'accounts'}
                </span>
              }
              icon={Wallet} color="#ef4444" bg="#fee2e2" 
            />

            <StatCard 
              title="Containers Processed" 
              value={loading ? '...' : metrics.todayOrders}
              subtitle={
                <>
                  <span style={{ background: '#f0f9ff', color: '#0285c7', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #409ecd' }}>
                    {metrics.walkinQty} Walk-in
                  </span>
                  <span style={{ background: '#f3e8ff', color: ' #591c87b4', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #ae7de1' }}>
                    {metrics.deliveryQty} Delivery
                  </span>
                </>
              }
              icon={Package} color="#3b82f6" bg="#dbeafe" 
            />

            <StatCard 
              title="Active Staff" 
              value={loading ? '...' : (metrics.activeDrivers + metrics.activeRefillers)} 
              subtitle={
                <>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #7dd3fc' }}>
                    {metrics.activeRefillers} Refiller{metrics.activeRefillers !== 1 ? 's' : ''}
                  </span>
                  <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #d8b4fe' }}>
                    {metrics.activeDrivers} Driver{metrics.activeDrivers !== 1 ? 's' : ''}
                  </span>
                </>
              }
              icon={Users} color="#ffa200" bg="#fff0d7" 
            />

          </div>

          {/* ROW 2: Recent Activity & Quick Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
            
            {/* Detailed Recent Activity Table */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eaf4fb', padding: '28px', boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#012a4a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
                  <History size={22} color="#0284c7" /> Recent Transactions
                </h2>
                <button onClick={() => navigate('/transaction')} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.95rem', transition: '0.2s' }}>
                  View All <ArrowRight size={18} />
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading recent transactions...</div>
              ) : metrics.recentTransactions.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  No transactions yet today.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {metrics.recentTransactions.map((tx, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', transition: '0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.borderColor = '#bae6fd'} onMouseOut={e => e.currentTarget.style.borderColor = '#f1f5f9'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: tx.Serv_Name?.toLowerCase() === 'delivery' ? '#f3e8ff' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tx.Serv_Name?.toLowerCase() === 'delivery' ? '#581c87' : '#075985' }}>
                          {tx.Serv_Name?.toLowerCase() === 'delivery' ? <Truck size={22} /> : <Droplet size={22} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem' }}>
                            {tx.Cust_LName || tx.Cust_FName ? `${tx.Cust_LName}, ${tx.Cust_FName}` : 'Walk-in Customer'}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px', fontWeight: '500' }}>
                            {new Date(tx.Trans_Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.Quantity} Containers
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.15rem' }}>
                          ₱{(parseFloat(tx.Selling_Price || 0) * parseInt(tx.Quantity || 0)).toFixed(2)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', color: tx.Remarks?.toLowerCase() === 'paid' ? '#10b981' : '#ef4444', fontSize: '0.8rem', fontWeight: '700', marginTop: '2px' }}>
                          {tx.Remarks?.toLowerCase() === 'paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {tx.Remarks}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eaf4fb', padding: '28px', boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#012a4a', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
                <Link size={22} color="#0284c7" /> Quick Links
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <button onClick={() => navigate('/customers')} style={styles.quickLinkBtn}>
                  <div style={styles.quickLinkIcon}><Users size={20} /></div>
                  <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>Manage Customers</span>
                </button>
                <button onClick={() => navigate('/employees')} style={styles.quickLinkBtn}>
                  <div style={styles.quickLinkIcon}><UserCheck size={20} /></div>
                  <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>Manage Employees</span>
                </button>
                <button onClick={() => navigate('/reports')} style={styles.quickLinkBtn}>
                  <div style={styles.quickLinkIcon}><FileText size={20} /></div>
                  <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>View Sales Reports</span>
                </button>
              </div>
            </div>

          </div>

          {/* ROW 3: Detailed Analytics (Sales Breakdown, Incentive Tracker, Pending Collections) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '24px', paddingBottom: '40px' }}>
            
            {/* Widget 1: Visual Sales Breakdown */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eaf4fb', padding: '28px', boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)' }}>
              <h2 style={{ fontSize: '1.15rem', color: '#012a4a', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <PieChart size={20} color="#10b981" /> Sales Distribution
              </h2>
              {loading ? (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Calculating sales...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* PURPLE DELIVERY BLOCK */}
                  <div style={{ background: '#faf5ff', border: '1px solid #f3e8ff', borderLeft: '4px solid #934edd', padding: '18px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.9rem', color: '#581c87', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={16} color="#581c87"/> Delivery
                      </span>
                      <span style={{ fontSize: '1.1rem', color: '#581c87', fontWeight: '900' }}>₱{metrics.deliverySales.toFixed(2)}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e9d5ff', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${metrics.todaySales > 0 ? (metrics.deliverySales / metrics.todaySales) * 100 : 0}%`, height: '100%', background: '#934edd', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(131, 77, 172, 0.9)', marginTop: '8px', fontWeight: '700' }}>
                      {metrics.deliveryQty} Containers
                    </div>
                  </div>

                  {/* CYAN WALK-IN BLOCK */}
                  <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderLeft: '4px solid #0ea5e9', padding: '18px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.9rem', color: '#075985', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Droplet size={16} color="#075985"/> Walk-in
                      </span>
                      <span style={{ fontSize: '1.1rem', color: '#075985', fontWeight: '900' }}>₱{metrics.walkinSales.toFixed(2)}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#bae6fd', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${metrics.todaySales > 0 ? (metrics.walkinSales / metrics.todaySales) * 100 : 0}%`, height: '100%', background: '#0ea5e9', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#075985dc', marginTop: '8px', fontWeight: '700' }}>
                      {metrics.walkinQty} Containers
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Widget 2: Detailed Employee Output (Incentive Tracker) */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eaf4fb', padding: '28px', boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.15rem', color: '#012a4a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                  <TrendingUp size={20} color="#0369a1" /> Daily Output Tracker
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '4px 12px', borderRadius: '20px' }}>
                  Live Incentives
                </span>
              </div>
              
              {loading ? (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Tallying containers...</div>
              ) : metrics.employeeStats.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No employee output recorded yet today.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '220px', overflowY: 'auto', paddingRight: '8px' }}>
                  {metrics.employeeStats.map((staff, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        
                        {/* Distinct Icon Colors: Blue shade for Refiller, Purple shade for Driver */}
                        <div style={{ 
                          width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: staff.role === 'Driver' ? '#f3e8ff' : '#e0f2fe',
                          color: staff.role === 'Driver' ? '#6b21a8' : '#0369a1'
                        }}>
                          {staff.role === 'Driver' ? <Truck size={18} /> : <Droplet size={18} />}
                        </div>

                        <div>
                          <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: '800' }}>{staff.name}</div>
                          <div style={{ fontSize: '0.75rem', color: staff.role === 'Driver' ? '#6b21a8' : '#0369a1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                            {staff.role}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: '800' }}>{staff.count} <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>Qty</span></div>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>Handled: ₱{staff.value.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget 3: Detailed Pending Collections */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eaf4fb', padding: '28px', boxShadow: '0 4px 16px rgba(16, 42, 67, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.15rem', color: '#012a4a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                  <Wallet size={20} color="#ef4444" /> Pending Debtors
                </h2>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: '20px' }}>
                  ₱{metrics.unpaidValue.toFixed(0)}
                </span>
              </div>

              {loading ? (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Scanning records...</div>
              ) : metrics.unpaidTransactions.length === 0 ? (
                <div style={{ color: '#10b981', fontSize: '0.95rem', fontWeight: '700', background: '#dcfce7', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  All accounts settled for today!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {metrics.unpaidTransactions.map((tx, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px 16px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '0.95rem', color: '#991b1b', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {tx.Cust_LName || tx.Cust_FName ? `${tx.Cust_LName}, ${tx.Cust_FName}` : 'Walk-in'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: '600' }}>
                          {tx.Serv_Name} • {tx.Quantity} Qty
                        </div>
                      </div>
                      <div style={{ fontSize: '1.1rem', color: '#ef4444', fontWeight: '800' }}>
                        ₱{(parseFloat(tx.Selling_Price || 0) * parseInt(tx.Quantity || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ROW 4: Live Business Statistics Graph */}
            <div style={{ gridColumn: '1 / -1', background: '#ffffff', borderRadius: '16px', border: '1px solid #cbe4f4', padding: '28px', boxShadow: '0 6px 16px rgba(16, 42, 67, 0.03)', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#102a43', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
                    <Activity size={22} color="#1a7ab5" /> Today's Sales by Hour
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1a7ab5', background: '#eaf4fb', border: '1px solid #cbe4f4', padding: '6px 12px', borderRadius: '20px' }}>
                    Live Tracking
                </span>
                </div>
                
                {/* CSS Bar Chart */}
                {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading graph data...</div>
                ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '260px', padding: '10px 0', borderBottom: '1px solid #e2e8f0', gap: '8px' }}>
                    {metrics.hourlySales && metrics.hourlySales.map((data, idx) => {
                        const maxSales = Math.max(...metrics.hourlySales.map(d => d.sales), 1);
                        const heightPct = (data.sales / maxSales) * 100;
                        
                        return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontSize: '0.85rem', color: '#1a7ab5', fontWeight: '800', marginBottom: '8px', opacity: data.sales > 0 ? 1 : 0, transition: '0.2s' }}>
                            ₱{data.sales.toFixed(0)}
                            </div>
                            <div style={{ 
                            width: '100%', maxWidth: '50px', height: `${heightPct}%`, minHeight: data.sales > 0 ? '4px' : '0',
                            backgroundColor: heightPct === 100 ? '#1a7ab5' : '#cbe4f4', 
                            borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease-out'
                            }}></div>
                        </div>
                        );
                    })}
                    </div>
                    {/* X-Axis Labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '0' }}>
                    {metrics.hourlySales && metrics.hourlySales.map((data, idx) => (
                        <span key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>
                        {data.label}
                        </span>
                    ))}
                    </div>
                </>
                )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  brandLogo: {width: '60px', height: '60px', objectFit: 'contain'},
  appContainer: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#dceef8', overflow: 'hidden', position: 'fixed', top: 0, left: 0, boxSizing: 'border-box', fontFamily: 'sans-serif' },
  topNavbar: { height: '70px', backgroundColor: '#011627', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  navBrandBlock: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandIconContainer: { fontSize: '1.4rem' },
  brandTextGroup: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  brandMainTitle: { color: '#ffffff', fontSize: '1.15rem', fontWeight: 'bold', letterSpacing: '0.3px' },
  brandSubTitle: { color: '#00b4d8', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' },
  navMenuLinksRow: { display: 'flex', height: '100%', alignItems: 'center', gap: '4px' },
  navMenuButton: { background: 'none', border: 'none', height: '100%', padding: '0 16px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s ease' },
  navDivider: { width: '2px', height: '24px', backgroundColor: '#00b4d8', margin: '0 10px', opacity: 0.5 },
  signOutButton: { backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', height: '36px', padding: '0 16px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' },
  workspaceBodyWrapper: { flex: 1, overflowY: 'auto', padding: '36px 0', boxSizing: 'border-box', width: '100%' },
  quickLinkBtn: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left' },
  quickLinkIcon: { background: '#ffffff', padding: '10px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', color: '#0284c7', display: 'flex' }
};

export default OwnerDashboard;