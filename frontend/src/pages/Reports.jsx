import CeeStemLogo from '../assets/CeeStem.png';
import React, { useState, useEffect } from 'react';
import { ChevronDown, Printer, Briefcase, Users, FileWarning, Calendar, TrendingUp, BarChart2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const BUSINESS_REPORTS = [
  { id: 'daily-revenue', name: 'Revenue Summary' },
  { id: 'service-sales', name: 'Service Sales Report' }
];

const EMPLOYEE_REPORTS = [
  { id: 'employee-performance', name: 'Employee Performance Summary' }
];

const INVOICE_REPORTS = [
  { id: 'unpaid-collections', name: 'Unpaid Collections List' },
  { id: 'active-inventory', name: 'Active Inventory Tracking' }
];

const getReportName = (id) => {
  const allReports = [...BUSINESS_REPORTS, ...EMPLOYEE_REPORTS, ...INVOICE_REPORTS];
  return allReports.find(r => r.id === id)?.name || 'Report';
};

// HELPER: Get local date string YYYY-MM-DD safely
const getLocalDateString = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// HELPER: Calculate Sunday-Saturday boundaries from a given date string safely
const getWeekBoundaries = (dateStr) => {
  try {
    if (!dateStr) throw new Error("Empty date");
    const [year, month, day] = dateStr.split('-');
    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const sunday = new Date(selectedDate);
    sunday.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    
    return { 
      start: getLocalDateString(sunday), 
      end: getLocalDateString(saturday) 
    };
  } catch (e) {
    const fallback = new Date();
    return { start: getLocalDateString(fallback), end: getLocalDateString(fallback) };
  }
};

// HELPER: Calculate Start and End of the Month
const getMonthBoundaries = (monthStr) => {
  const [year, month] = monthStr.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);
  return {
      start: getLocalDateString(startDate),
      end: getLocalDateString(endDate)
  };
};

function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [activeCategory, setActiveCategory] = useState('business'); 
  const [selectedReport, setSelectedReport] = useState('daily-revenue');
  
  const [reportDataList, setReportDataList] = useState([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  
  const todayStr = getLocalDateString(new Date()) || '2026-05-30';
  const initialWeekBounds = getWeekBoundaries(todayStr);

  const [reportDate, setReportDate] = useState(todayStr); 
  const [filterMode, setFilterMode] = useState('day'); // 'day', 'week', 'month'
  
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [weeklyAnchorDate, setWeeklyAnchorDate] = useState(todayStr);
  const [weekStart, setWeekStart] = useState(initialWeekBounds.start);
  const [weekEnd, setWeekEnd] = useState(initialWeekBounds.end);
  
  const [showGraph, setShowGraph] = useState(false);
  const [selectedEmployeeForChart, setSelectedEmployeeForChart] = useState(null);

  const handleWeekChange = (e) => {
    if (!e.target.value) return;
    setWeeklyAnchorDate(e.target.value); 
    const bounds = getWeekBoundaries(e.target.value);
    setWeekStart(bounds.start);
    setWeekEnd(bounds.end);
  };

  const fetchReport = async () => {
    setIsReportLoading(true);
    try {
      let activeFetchUrl = `http://localhost:5000/api/report/${selectedReport}`;
      let queryParams = [];

      // Append appropriate date parameters based on selected view mode
      if (['daily-revenue', 'service-sales', 'employee-performance'].includes(selectedReport)) {
          if (filterMode === 'day') {
              queryParams.push(`date=${reportDate}`);
          } else if (filterMode === 'week') {
              queryParams.push(`startDate=${weekStart}&endDate=${weekEnd}`);
          } else if (filterMode === 'month') {
              const monthBounds = getMonthBoundaries(reportMonth);
              queryParams.push(`startDate=${monthBounds.start}&endDate=${monthBounds.end}`);
          }
      }

      if (queryParams.length > 0) {
          activeFetchUrl += `?${queryParams.join('&')}`;
      }

      const reportNetworkResponse = await fetch(activeFetchUrl);
      if (!reportNetworkResponse.ok) throw new Error("Failed to fetch report from database");
      
      let rawReportPayload = await reportNetworkResponse.json();
      let formattedReportArray = Array.isArray(rawReportPayload) ? rawReportPayload : (rawReportPayload ? [rawReportPayload] : []);

      // Force the Revenue array to ALWAYS have complete padded days for line graphs
      if (selectedReport === 'daily-revenue' && (filterMode === 'week' || filterMode === 'month')) {
          const template = [];
          let currentDate = filterMode === 'week' ? new Date(weekStart) : new Date(getMonthBoundaries(reportMonth).start);
          const endBoundary = filterMode === 'week' ? new Date(weekEnd) : new Date(getMonthBoundaries(reportMonth).end);
          
          let loopFailsafe = 0;
          while (currentDate <= endBoundary && loopFailsafe < 35) {
              const safeDateStr = getLocalDateString(currentDate);
              if (safeDateStr) template.push(safeDateStr);
              currentDate.setDate(currentDate.getDate() + 1);
              loopFailsafe++;
          }

          formattedReportArray = template.map(dateString => {
              const dbRecord = formattedReportArray.find(record => {
                  if (!record || !record.Date) return false;
                  const recordDate = new Date(record.Date);
                  if (isNaN(recordDate.getTime())) return false;
                  return getLocalDateString(recordDate) === dateString;
              });

              let cleanDisplayDate = dateString;
              try {
                  const [y, m, d] = dateString.split('-');
                  cleanDisplayDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                  });
              } catch (e) {}

              if (dbRecord) return { ...dbRecord, Date: cleanDisplayDate };

              return {
                  Date: cleanDisplayDate,
                  Total_Customers_Served: 0,
                  Total_Gallons_Sold: 0,
                  Gross_Revenue: '0.00',
                  Cash_Collected: '0.00',
                  Outstanding_Credit: '0.00'
              };
          });
      }

      // Existing Employee Performance logic
      if (selectedReport === 'employee-performance') {
        formattedReportArray = formattedReportArray.map(employeeItem => {
          const safeItem = employeeItem || {};
          const { Emp_FName, Emp_LName, EMPLOYEE_FNAME, EMPLOYEE_LNAME, ...remainingEmployeeDetails } = safeItem;
          const extractedFirstName = Emp_FName || EMPLOYEE_FNAME || '';
          const extractedLastName = Emp_LName || EMPLOYEE_LNAME || '';
          
          return {
            'EMPLOYEE NAME': `${extractedFirstName} ${extractedLastName}`.trim(),
            ...remainingEmployeeDetails
          };
        });
      }

      setReportDataList(formattedReportArray);
    } catch (err) {
      console.error(err);
      setReportDataList([]);
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport, reportDate, filterMode, weekStart, weekEnd, reportMonth]);

  const handleDropdownChange = (category, reportId) => {
    if (reportId) {
      setActiveCategory(category);
      setSelectedReport(reportId);
    }
  };

  const handleRibbonNavigation = (menuName) => {
    if (menuName === 'Transaction') navigate('/transaction');
    else if (menuName === 'Barangay') navigate('/barangay');
    else if (menuName === 'Customers') navigate('/customers');
    else if (menuName === 'Services') navigate('/services');
    else if (menuName === 'Reports') navigate('/reports');
    else alert(`${menuName} page not yet implemented`);
  };

  const formatHeader = (key) => {
    if (!key || typeof key !== 'string') return '';
    let formattedKeyTitle = key.replace(/_/g, ' ').toUpperCase();
    
    const targetHeaderMappings = {
      'CUST LNAME': 'CUSTOMER LAST NAME',
      'CUST FNAME': 'CUSTOMER FIRST NAME',
      'CUST TYPE': 'CUSTOMER TYPE',
      'SERV NAME': 'SERVICE NAME',
      'TRANS DATE': 'TRANSACTION DATE',
      'TRANS ID': 'TRANSACTION ID',
      'BORROWED CONT': 'BORROWED CONTAINERS',
      'ROLE ID': 'JOB ROLE'
    };

    return targetHeaderMappings[formattedKeyTitle] || formattedKeyTitle;
  };

  const formatCellValue = (val, key) => {
    if (val === null || val === undefined || val === '') return '—';



    // UPDATED: Converts Role ID to full names AND applies badge colors
    if (key && key.toUpperCase() === 'ROLE_ID') {
        const badgeStyle = {
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.80rem',
            fontWeight: '700',
            display: 'inline-block'
        };
        
        if (val === 'D') {
            return <span style={{ ...badgeStyle, backgroundColor: '#e0f2fe', color: '#0369a1' }}>Driver</span>;
        }
        if (val === 'R') {
            return <span style={{ ...badgeStyle, backgroundColor: '#dcfce7', color: '#15803d' }}>Refiller</span>;
        }
        return val; 
    }

    // UPDATED: Dynamic Currency Formatter
    if (key) {
        const upKey = key.toUpperCase();
        if (['GROSS_REVENUE', 'CASH_COLLECTED', 'PRICE', 'TOTAL_SALES', 'OUTSTANDING_CREDIT'].includes(upKey)) {
            return `₱${Number(val).toFixed(2)}`;
        }
    }

    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
      const parsedDateObject = new Date(val);
      if (!isNaN(parsedDateObject.getTime())) {
          if (val.endsWith('T00:00:00.000Z')) {
            return parsedDateObject.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          }
          return parsedDateObject.toLocaleString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true 
          });
      }
    }

    return String(val);
  };

  const renderTableHeaders = () => {
    if (!reportDataList || reportDataList.length === 0) return null;
    
    const firstRowItem = reportDataList[0] || {};
    const headerKeysArray = Object.keys(firstRowItem);
    
    return (
      <tr>
        {headerKeysArray.map((key) => (
          <th key={key} style={styles.tableHeaderColumnCell}>
            {formatHeader(key)}
          </th>
        ))}
        {selectedReport === 'employee-performance' && (
          <th style={{...styles.tableHeaderColumnCell, textAlign: 'center'}}>
            ACTIONS
          </th>
        )}
      </tr>
    );
  };

  const renderTableRows = () => {
    if (!reportDataList || reportDataList.length === 0) {
      return (
        <tr style={styles.tableBodyDataRow}>
          <td colSpan="100%" style={{ ...styles.tableBodyCellBlock, textAlign: 'center', padding: '40px', borderBottom: 'none' }}>
            No records found for this report.
          </td>
        </tr>
      );
    }

    return reportDataList.map((rowItem, index) => {
      const safeRowItem = rowItem || {};
      return (
        <tr key={index} style={styles.tableBodyDataRow}>
          {/* Note: the key is dynamically sent to the formatter to trigger the Peso symbol */}
          {Object.entries(safeRowItem).map(([key, cellValue], colIndex) => (
            <td key={colIndex} style={styles.tableBodyCellBlock}>
              {formatCellValue(cellValue, key)}
            </td>
          ))}
          {selectedReport === 'employee-performance' && (
            <td style={{...styles.tableBodyCellBlock, textAlign: 'center'}}>
               <button 
                  onClick={() => setSelectedEmployeeForChart(safeRowItem)}
                  style={styles.actionStatsButton}
                  title="View Performance Stats"
               >
                  <BarChart2 size={16} /> View Stats
               </button>
            </td>
          )}
        </tr>
      );
    });
  };

  const renderCharts = () => {
    if (!reportDataList || reportDataList.length === 0) return null;

    if (selectedReport === 'daily-revenue' && showGraph) {
      const lineChartDataPoints = reportDataList.map((item, idx) => {
        let displayDate = `Day ${idx + 1}`;
        if (item && item.Date) {
          try {
             const d = new Date(item.Date);
             if (!isNaN(d.getTime())) {
                displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
             } else {
                displayDate = String(item.Date);
             }
          } catch(e) { displayDate = String(item.Date); }
        }

        return {
          name: displayDate,
          Revenue: Number((item && (item.Gross_Revenue || item.Total_Sales)) || 0)
        };
      });

      return (
        <div style={{...styles.chartWrapperCard, minHeight: '260px', marginBottom: '24px' }}>
          <h3 style={styles.chartTitle}>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineChartDataPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `₱${value}`}/>
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={styles.chartTooltip} formatter={(value) => `₱${value.toFixed(2)}`} />
              <Legend wrapperStyle={{fontSize: '12px', color: '#475569', paddingTop: '5px'}}/>
              <Line type="monotone" dataKey="Revenue" stroke="#00b4d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Gross Revenue (₱)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (selectedReport === 'service-sales' && showGraph) {
      const chartDataPoints = reportDataList.map(item => ({
        name: (item && item.Serv_Name) || 'Service',
        Sales: Number((item && item.Total_Sales) || 0)
      }));
      return (
        <div style={{...styles.chartWrapperCard, minHeight: '260px', marginBottom: '24px' }}>
          <h3 style={styles.chartTitle}>Revenue by Service</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartDataPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `₱${value}`}/>
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={styles.chartTooltip} formatter={(value) => `₱${value.toFixed(2)}`} />
              <Legend wrapperStyle={{fontSize: '12px', color: '#475569', paddingTop: '5px'}}/>
              <Bar dataKey="Sales" fill="#0077b6" radius={[4, 4, 0, 0]} name="Total Sales (₱)" barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  const renderEmployeeModal = () => {
    if (!selectedEmployeeForChart) return null;
    
    const employeeStatsChartData = [{
      name: selectedEmployeeForChart['EMPLOYEE NAME'] || 'Employee',
      Gallons: Number(selectedEmployeeForChart.Total_Gallons || 0), 
      Target: Number(selectedEmployeeForChart.Target || 0)
    }];

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContentCard}>
          <div style={styles.modalHeader}>
            <h3 style={styles.chartTitle}>{selectedEmployeeForChart['EMPLOYEE NAME']} - Stats</h3>
            <button onClick={() => setSelectedEmployeeForChart(null)} style={styles.modalCloseBtn}>
              <X size={20} />
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={employeeStatsChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false}/>
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={styles.chartTooltip} />
              <Legend wrapperStyle={{fontSize: '12px', color: '#475569', paddingTop: '10px'}}/>
              <Bar dataKey="Gallons" fill="#00b4d8" radius={[4, 4, 0, 0]} name="Total Gallons" barSize={50} />
              <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Target Quota" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const reportGenerationTimestamp = new Date().toLocaleString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: 'numeric', minute: '2-digit', hour12: true 
  });

  return (
    <div style={styles.appContainer}>
      
      <nav style={styles.topNavbar} className="no-print">
        <div style={styles.navBrandBlock}>
          <img src={CeeStemLogo} alt="CeeStem Logo" style={styles.brandLogo} />
          
          <div style={styles.brandTextGroup}>
            <span style={styles.brandMainTitle}>CeeStem</span>
            <span style={styles.brandSubTitle}>WATER REFILLING</span>
          </div>
        </div>

        <div style={styles.navMenuLinksRow}>
          {['Dashboard', 'Transaction', 'Services', 'Customers', 'Barangay', 'Employees', 'Payroll', 'Reports'].map((menuItem) => {
            const isTabActive = (menuItem === 'Reports' && currentPath === '/reports');
            return (
              <button
                key={menuItem}
                onClick={() => handleRibbonNavigation(menuItem)}
                style={{
                  ...styles.navMenuButton,
                  color: isTabActive ? '#00b4d8' : '#ffffff',
                  borderBottom: isTabActive ? '3px solid #00b4d8' : '3px solid transparent'
                }}
              >
                {menuItem}
              </button>
            );
          })}
        </div>
      </nav>

      <div style={styles.workspaceBodyWrapper}>
        <div style={styles.dataLogTableCanvasCard}>
          
          <div style={styles.tableControlsGridRow} className="no-print">
            
            <div style={styles.dropdownsGroup}>
              
              <div style={styles.dropdownSelectContainer}>
                <div style={styles.dropdownIconBox}><Briefcase size={16} /></div>
                <select 
                  value={activeCategory === 'business' ? selectedReport : ''} 
                  onChange={(e) => handleDropdownChange('business', e.target.value)}
                  style={{ ...styles.nativeCustomSelect, paddingLeft: '38px' }}
                >
                  <option value="" disabled>Business Performance</option>
                  {BUSINESS_REPORTS.map(reportType => (
                    <option key={reportType.id} value={reportType.id}>{reportType.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} color="#0077b6" style={styles.dropdownChevronOverlay} />
              </div>

              <div style={styles.dropdownSelectContainer}>
                <div style={styles.dropdownIconBox}><Users size={16} /></div>
                <select 
                  value={activeCategory === 'employee' ? selectedReport : ''} 
                  onChange={(e) => handleDropdownChange('employee', e.target.value)}
                  style={{ ...styles.nativeCustomSelect, paddingLeft: '38px' }}
                >
                  <option value="" disabled>Employee Performance</option>
                  {EMPLOYEE_REPORTS.map(reportType => (
                    <option key={reportType.id} value={reportType.id}>{reportType.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} color="#0077b6" style={styles.dropdownChevronOverlay} />
              </div>

              <div style={styles.dropdownSelectContainer}>
                <div style={styles.dropdownIconBox}><FileWarning size={16} /></div>
                <select 
                  value={activeCategory === 'invoice' ? selectedReport : ''} 
                  onChange={(e) => handleDropdownChange('invoice', e.target.value)}
                  style={{ ...styles.nativeCustomSelect, paddingLeft: '38px' }}
                >
                  <option value="" disabled>Pending Customer Invoices</option>
                  {INVOICE_REPORTS.map(reportType => (
                    <option key={reportType.id} value={reportType.id}>{reportType.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} color="#0077b6" style={styles.dropdownChevronOverlay} />
              </div>

              {/* UPDATED: Date Filter Menu is now active for all 3 views */}
              {['daily-revenue', 'service-sales', 'employee-performance'].includes(selectedReport) && (
                <>
                  <div style={styles.dropdownSelectContainer}>
                    <select 
                      value={filterMode} 
                      onChange={(e) => {
                        setFilterMode(e.target.value);
                        setShowGraph(true); 
                      }}
                      style={styles.nativeCustomSelect}
                    >
                      <option value="day">By Day</option>
                      <option value="week">By Week</option>
                      <option value="month">By Month</option>
                    </select>
                    <ChevronDown size={16} color="#0077b6" style={styles.dropdownChevronOverlay} />
                  </div>

                  <div style={styles.dropdownSelectContainer}>
                    <div style={{ ...styles.dropdownIconBox, left: '16px', color: '#014f86', zIndex: 1 }}><Calendar size={16} /></div>
                    
                    {filterMode === 'week' && (
                      <div style={{
                         ...styles.nativeCustomSelect, 
                         paddingLeft: '42px', display: 'flex', alignItems: 'center', position: 'relative'
                      }}>
                         <input 
                           type="date" 
                           className="custom-date-icon"
                           value={weeklyAnchorDate}
                           onChange={handleWeekChange}
                           style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}
                         />
                         <span style={{ fontSize: '0.85rem', pointerEvents: 'none' }}>
                           {weekStart ? `${weekStart} to ${weekEnd}` : 'Select a week...'}
                         </span>
                      </div>
                    )}
                    {filterMode === 'day' && (
                      <input 
                        type="date" 
                        className="custom-date-icon"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        style={{ ...styles.nativeCustomSelect, paddingLeft: '42px', accentColor: '#0077b6' }}
                      />
                    )}
                    {filterMode === 'month' && (
                      <input 
                        type="month" 
                        className="custom-date-icon"
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        style={{ ...styles.nativeCustomSelect, paddingLeft: '42px', accentColor: '#0077b6' }}
                      />
                    )}
                  </div>
                  
                  {/* Graph toggles exclusively for Revenue and Service Reports */}
                  {['daily-revenue', 'service-sales'].includes(selectedReport) && (
                      <button 
                        onClick={() => setShowGraph(!showGraph)} 
                        style={styles.secondaryOutlineButton}
                      >
                        <TrendingUp size={16} /> {showGraph ? 'Hide Graph' : 'Show Graph'}
                      </button>
                  )}
                </>
              )}
            </div>

            <button onClick={window.print} style={styles.addTransactionPrimaryActionButton}>
              <Printer size={16} /> Print Report
            </button>
          </div>

          <div className="print-only" style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #0077b6' }}>
             <h1 style={{ color: '#012a4a', margin: '0 0 5px 0', fontSize: '24px' }}>CeeJay's Water Refilling Station</h1>
             <h2 style={{ color: '#0077b6', margin: '0 0 10px 0', fontSize: '18px' }}>
                {getReportName(selectedReport)}
             </h2>
             <div style={{ display: 'flex', justifyContent: 'space-between', color: '#012a4a', fontSize: '12px' }}>
                <span>Generated on: {reportGenerationTimestamp}</span>
                {['daily-revenue', 'service-sales', 'employee-performance'].includes(selectedReport) && (
                  <span>
                    For: {filterMode === 'week' ? `${weekStart} to ${weekEnd}` : (filterMode === 'month' ? reportMonth : reportDate)}
                  </span>
                )}
             </div>
          </div>

         <div style={styles.scrollableTableContainer}>
            {isReportLoading ? (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: '#64748b' }}>
                  Loading report data...
               </div>
            ) : (
                <>
                  <div style={{ height: '20px', flexShrink: 0 }}></div>
                  {renderCharts()}
                  <table style={styles.ledgerTableMarkup} className="print-table">
                    <thead>
                        {renderTableHeaders()}
                    </thead>
                    <tbody>
                        {renderTableRows()}
                    </tbody>
                  </table>
                </>
            )}
          </div>
        </div>
      </div>
      
      {renderEmployeeModal()}

      <style>
        {`
          @media print {
            @page { size: landscape; margin: 10mm; }
            body, html { background-color: white !important; margin: 0; padding: 0; color: black !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            div[style*="appContainer"] { position: static !important; overflow: visible !important; height: auto !important; width: 100% !important; }
            div[style*="workspaceBodyWrapper"] { padding: 0 !important; background-color: white !important; overflow: visible !important; }
            div[style*="dataLogTableCanvasCard"] { border: none !important; box-shadow: none !important; height: auto !important; padding: 0 !important; overflow: visible !important; }
            div[style*="scrollableTableContainer"] { overflow: visible !important; border: none !important; margin: 0 !important; }
            table.print-table { border-collapse: collapse !important; width: 100% !important; border: 1px solid #cbd5e1 !important; }
            table.print-table th, table.print-table td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; white-space: normal !important; word-wrap: break-word !important; }
            table.print-table th { background-color: #f1f5f9 !important; color: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          
          @media screen {
           .custom-date-icon::-webkit-calendar-picker-indicator { opacity: 0; cursor: pointer; width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
           .print-only { display: none !important; }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  brandLogo: {width: '60px', height: '60px', objectFit: 'contain'},
  appContainer: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#ffffff', overflow: 'hidden', position: 'fixed', top: 0, left: 0, boxSizing: 'border-box', fontFamily: 'sans-serif' },
  topNavbar: { height: '70px', backgroundColor: '#011627', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box', flexShrink: 0 },
  navBrandBlock: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandIconContainer: { fontSize: '1.4rem' },
  brandTextGroup: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  brandMainTitle: { color: '#ffffff', fontSize: '1.15rem', fontWeight: 'bold', letterSpacing: '0.3px' },
  brandSubTitle: { color: '#00b4d8', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' },
  navMenuLinksRow: { display: 'flex', height: '100%', alignItems: 'center', gap: '4px' },
  navMenuButton: { background: 'none', border: 'none', height: '100%', padding: '0 16px', fontSize: '0.92rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s ease' },
  workspaceBodyWrapper: { flex: 1, overflowY: 'auto', backgroundColor: '#e6f2fa', padding: '20px ', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  dataLogTableCanvasCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #bde0fe', padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0, 79, 134, 0.05)', height: 'calc(100vh - 110px)', width: '100%', overflow: 'hidden' },
  tableControlsGridRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', width: '100%', boxSizing: 'border-box', flexWrap: 'wrap' },
  dropdownsGroup: { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 },
  dropdownSelectContainer: { position: 'relative', display: 'flex', alignItems: 'center', minWidth: '180px' },
  dropdownIconBox: { position: 'absolute', left: '12px', pointerEvents: 'none', display: 'flex', alignItems: 'center', color: '#0077b6' },
  nativeCustomSelect: { appearance: 'none', backgroundColor: '#eaf4fc', border: '1px solid #bde0fe', borderRadius: '8px', padding: '10px 32px 10px 14px', fontSize: '0.90rem', fontWeight: '600', color: '#014f86', outline: 'none', cursor: 'pointer', width: '100%', textOverflow: 'ellipsis' },
  dropdownChevronOverlay: { position: 'absolute', right: '12px', pointerEvents: 'none' },
  addTransactionPrimaryActionButton: { backgroundColor: '#ffffff', color: '#0077b6', border: '1px solid #0077b6', borderRadius: '8px', padding: '10px 20px', fontSize: '0.90rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s ease', whiteSpace: 'nowrap' },
  secondaryOutlineButton: { backgroundColor: 'transparent', color: '#00b4d8', border: '1px solid #00b4d8', borderRadius: '8px', padding: '10px 16px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' },
  actionStatsButton: { backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: '0.2s' },
  
  ledgerTableMarkup: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', tableLayout: 'auto' },
  scrollableTableContainer: { overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', padding: '0 20px 20px 20px', minHeight: 0, flex: 1, marginTop: '10px', backgroundColor: '#f8fafc' },
  tableHeaderColumnCell: { padding: '14px 16px', fontSize: '0.82rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 100, borderBottom: '2px solid #bde0fe' },
  tableBodyDataRow: { backgroundColor: '#ffffff' },
  tableBodyCellBlock: { padding: '12px 16px', fontSize: '0.9rem', color: '#475569', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' },
  
  chartWrapperCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  chartTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#011627', marginTop: 0, marginBottom: '12px' },
  chartTooltip: { borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(1, 22, 39, 0.4)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalContentCard: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  modalCloseBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }
};

export default Reports;