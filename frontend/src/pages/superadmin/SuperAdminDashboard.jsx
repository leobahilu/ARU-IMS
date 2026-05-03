import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import RegistrationsTab from './RegistrationsTab';
import OverviewPage from './components/OverviewPage';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 67,
    disk: 32,
    network: 89
  });

  useEffect(() => {
    loadDashboardData();
    // Simulate real-time metrics update
    const interval = setInterval(updateSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, insightsResponse] = await Promise.all([
        superAdminAPI.getDashboardStats(),
        superAdminAPI.getAIInsights()
      ]);
      setStats(statsResponse.data);
      setInsights(insightsResponse.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      addNotification('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSystemMetrics = () => {
    setSystemMetrics(prev => ({
      cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 5)),
      disk: Math.max(15, Math.min(85, prev.disk + (Math.random() - 0.5) * 2)),
      network: Math.max(30, Math.min(100, prev.network + (Math.random() - 0.5) * 15))
    }));
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const navigationItems = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: '📊',
      description: 'System statistics and insights',
      badge: null
    },
    {
      id: 'registrations',
      label: 'User Registrations',
      icon: '👤',
      description: 'Register new users',
      badge: null
    },
    {
      id: 'approvals',
      label: 'Pending Approvals',
      icon: '⏳',
      description: 'Review and approve requests',
      badge: stats.pending_approvals || 0
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: '📋',
      description: 'Assign examiners and advisors',
      badge: null
    },
    {
      id: 'users',
      label: 'User Management',
      icon: '👥',
      description: 'Manage system users',
      badge: stats.total_users || 0
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: '📈',
      description: 'Generate system reports',
      badge: null
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: '⚙️',
      description: 'Configure system preferences',
      badge: null
    }
  ];

  // Helper components retained for other potential uses
  const StatCard = ({ title, value, icon, growth, color = 'primary', trend = 'up' }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 500);
      return () => clearTimeout(timer);
    }, [value]);

    return (
      <div className={`stat-card stat-card-${color} ${darkMode ? 'dark' : ''}`}>
        <div className="stat-icon-wrapper">
          <div className="stat-icon">{icon}</div>
          <div className="stat-sparkle"></div>
        </div>
        <div className="stat-content">
          <div className="stat-value">
            <span className="animated-number">{animatedValue}</span>
            {growth && (
              <span className={`stat-trend trend-${trend}`}>
                <span className="trend-arrow">{trend === 'up' ? '↗' : '↘'}</span>
                {Math.abs(growth)}%
              </span>
            )}
          </div>
          <p className="stat-title">{title}</p>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{ width: `${Math.min(100, (animatedValue / 100) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const AIInsightCard = ({ insight }) => (
    <div className={`insight-card insight-${insight.type} ${darkMode ? 'dark' : ''}`}>
      <div className="insight-icon">{insight.icon}</div>
      <div className="insight-content">
        <p>{insight.message}</p>
        <div className="insight-meta">
          <span className="insight-time">2 min ago</span>
          <span className="insight-confidence">95% confidence</span>
        </div>
      </div>
      <div className="insight-actions">
        <button className="insight-action-btn">View Details</button>
        <button className="insight-action-btn">Take Action</button>
      </div>
    </div>
  );

  const SystemMetricCard = ({ label, value, unit = '%', color = '#667eea' }) => (
    <div className={`metric-card ${darkMode ? 'dark' : ''}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-value" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="metric-bar">
        <div
          className="metric-bar-fill"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`
          }}
        ></div>
      </div>
    </div>
  );

  const NotificationToast = ({ notification, onClose }) => (
    <div className={`notification-toast toast-${notification.type}`}>
      <span className="toast-icon">
        {notification.type === 'success' ? '✅' :
         notification.type === 'error' ? '❌' :
         notification.type === 'warning' ? '⚠️' : 'ℹ️'}
      </span>
      <span className="toast-message">{notification.message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );

  if (loading) {
    return (
      <div className={`super-admin-dashboard ${darkMode ? 'dark' : ''}`}>
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
          <div className="skeleton-insights"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`super-admin-dashboard ${darkMode ? 'dark' : ''}`}>
      <div className="sa-dashboard-container">
        {/* Sidebar Navigation */}
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${darkMode ? 'dark' : ''} sa-sidebar ${sidebarCollapsed ? 'closed' : 'open'}`}>
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-icon">🎓</div>
              {!sidebarCollapsed && (
                <div className="logo-text">
                  <h2>ARU IMS</h2>
                  <span>Admin Panel</span>
                </div>
              )}
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* User Profile Section */}
          <div className="sidebar-profile">
            <div className="profile-avatar">
              <span>👑</span>
            </div>
            {!sidebarCollapsed && (
              <div className="profile-info">
                <h4>Super Admin</h4>
                <p>System Administrator</p>
                <div className="profile-status">
                  <span className="status-dot online"></span>
                  <span>Online</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {navigationItems.map(item => (
                <li key={item.id} className="nav-item">
                  <button
                    className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <div className="nav-content">
                        <span className="nav-label">{item.label}</span>
                        {item.badge && (
                          <span className={`nav-badge ${item.badge > 0 ? 'highlight' : ''}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {sidebarCollapsed && item.badge && (
                      <span className={`nav-badge-mini ${item.badge > 0 ? 'highlight' : ''}`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </button>
                  {!sidebarCollapsed && (
                    <div className="nav-description">{item.description}</div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            {!sidebarCollapsed && (
              <div className="sidebar-stats">
                <div className="stat-item">
                  <span className="stat-label">Active Users</span>
                  <span className="stat-value">{stats.total_users}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pending</span>
                  <span className="stat-value">{stats.pending_approvals}</span>
                </div>
              </div>
            )}
            <div className="sidebar-actions">
              <button className="sidebar-action-btn" title="Help & Support">
                ❓
              </button>
              <button className="sidebar-action-btn" title="Logout">
                🚪
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="sa-main-content">
          {/* Top Header Bar */}
          <div className={`top-header ${darkMode ? 'dark' : ''}`}>
            <div className="header-left">
              <h1 className="page-title">
                {navigationItems.find(item => item.id === activeTab)?.icon}{' '}
                {navigationItems.find(item => item.id === activeTab)?.label}
              </h1>
              <div className="breadcrumb">
                <span>Home</span>
                <span>›</span>
                <span>{navigationItems.find(item => item.id === activeTab)?.label}</span>
              </div>
            </div>

            <div className="header-right">
              {/* Theme Toggle */}
              <button
                className="header-btn theme-toggle-btn"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Notifications */}
              <div className="notifications-dropdown">
                <button className="header-btn notification-btn" title="Notifications">
                  🔔
                  {notifications.length > 0 && (
                    <span className="notification-count">{notifications.length}</span>
                  )}
                </button>
              </div>

              {/* Quick Actions */}
              <button className="header-btn" title="Quick Actions">
                ⚡
              </button>

              {/* User Menu */}
              <div className="user-menu">
                <button className="header-btn user-btn">
                  <span className="user-avatar">👑</span>
                  {!sidebarCollapsed && <span className="user-name">Super Admin</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="page-content">
            {/* Notifications */}
            <div className="notifications-container">
              {notifications.map(notification => (
                <NotificationToast
                  key={notification.id}
                  notification={notification}
                  onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                />
              ))}
            </div>

            {/* Dynamic Content Based on Active Tab */}
            {activeTab === 'overview' && (
              <OverviewPage stats={stats} onNavigate={setActiveTab} />
            )}

            {activeTab === 'registrations' && <RegistrationsTab darkMode={darkMode} />}
            {activeTab === 'approvals' && <ApprovalsTab />}
            {activeTab === 'assignments' && <AssignmentsTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Approvals Tab with Full UI
const ApprovalsTab = () => {
  const [approvals, setApprovals] = useState([
    {
      id: 1,
      type: 'partnership',
      companyName: 'Tech Solutions Ethiopia PLC',
      status: 'pending',
      submittedDate: '2025-05-01',
      daysPending: 5,
      description: 'Leading software company providing internship opportunities for CS students. Well-established with 50+ employees.',
      contactPerson: 'Abebe Kebede',
      contactEmail: 'hr@techsolutions.com',
      contactPhone: '+251 11 234 5678'
    },
    {
      id: 2,
      type: 'internship',
      companyName: 'DHL Ethiopia',
      title: 'Logistics Operations Intern',
      status: 'pending',
      submittedDate: '2025-05-02',
      daysPending: 4,
      positions: 3,
      description: 'Handling import/export documentation and warehouse operations.',
      duration: '6 months',
      stipend: 'Competitive',
      requirements: 'Business, Supply Chain, Logistics students'
    },
    {
      id: 3,
      type: 'partnership',
      companyName: 'Innovate Ethiopia',
      status: 'pending',
      submittedDate: '2025-05-02',
      daysPending: 3,
      description: 'Startup focused on AI and machine learning solutions seeking student interns.',
      contactPerson: 'Tigist Alemu',
      contactEmail: 'info@innovatet.com',
      contactPhone: '+251 91 123 4567'
    }
  ]);

  return (
    <div className="sa-tab-content">
      <div className="sa-page-header">
        <h2>⏳ Pending Approvals</h2>
        <p>Review and approve partnership requests and internship postings</p>
      </div>

      <div className="sa-approvals-header">
        <div className="sa-summary-cards">
          <div className="sa-summary-card urgent">
            <span className="sa-summary-number">{approvals.length}</span>
            <span className="sa-summary-label">Total Pending</span>
          </div>
          <div className="sa-summary-card warning">
            <span className="sa-summary-number">{approvals.filter(a => a.daysPending >= 3).length}</span>
            <span className="sa-summary-label">Urgent (3+ days)</span>
          </div>
          <div className="sa-summary-card info">
            <span className="sa-summary-number">{approvals.filter(a => a.type === 'partnership').length}</span>
            <span className="sa-summary-label">Partnerships</span>
          </div>
          <div className="sa-summary-card primary">
            <span className="sa-summary-number">{approvals.filter(a => a.type === 'internship').length}</span>
            <span className="sa-summary-label">Internships</span>
          </div>
        </div>

        <div className="sa-filter-tabs">
          <button className="sa-filter-tab active">All</button>
          <button className="sa-filter-tab">Partnerships</button>
          <button className="sa-filter-tab">Internships</button>
        </div>
      </div>

      <div className="sa-approvals-list">
        {approvals.length === 0 ? (
          <div className="sa-empty-state">
            <div className="sa-empty-icon">✅</div>
            <h3>All Caught Up!</h3>
            <p>No pending approvals at the moment.</p>
          </div>
        ) : (
          approvals.map(approval => (
            <div key={approval.id} className="sa-approval-card">
              <div className="sa-card-header">
                <div className="sa-card-icon">{approval.type === 'partnership' ? '🏢' : '💼'}</div>
                <div className="sa-card-content">
                  <div className="sa-card-title">
                    {approval.type === 'partnership' ? approval.companyName : approval.title}
                  </div>
                  <div className="sa-card-subtitle">
                    {approval.type === 'partnership'
                      ? `Partnership Request - ${approval.companyName}`
                      : `${approval.companyName} - ${approval.positions} position${approval.positions > 1 ? 's' : ''}`
                    }
                  </div>
                </div>
                <div className="sa-card-badge" style={{ background: approval.daysPending >= 3 ? '#ffc107' : '#28a745', color: '#fff' }}>
                  {approval.daysPending} day{approval.daysPending !== 1 ? 's' : ''} pending
                </div>
              </div>

              <div className="sa-card-body">
                <div className="sa-detail-grid">
                  <div className="sa-detail-item">
                    <span className="sa-detail-label">Submitted</span>
                    <span className="sa-detail-value">{new Date(approval.submittedDate).toLocaleDateString()}</span>
                  </div>
                  {approval.type === 'internship' && (
                    <div className="sa-detail-item">
                      <span className="sa-detail-label">Duration</span>
                      <span className="sa-detail-value">{approval.duration}</span>
                    </div>
                  )}
                  {approval.type === 'internship' && (
                    <div className="sa-detail-item">
                      <span className="sa-detail-label">Stipend</span>
                      <span className="sa-detail-value">{approval.stipend}</span>
                    </div>
                  )}
                  <div className="sa-detail-item">
                    <span className="sa-detail-label">Description</span>
                    <span className="sa-detail-value">{approval.description}</span>
                  </div>
                </div>
              </div>

              <div className="sa-card-actions">
                <button className="sa-btn-success" onClick={() => {/* TODO: Implement approve */}}>
                  ✅ Approve
                </button>
                <button className="sa-btn-danger" onClick={() => {/* TODO: Implement reject */}}>
                  ❌ Reject
                </button>
                <button className="sa-btn-secondary" onClick={() => {/* TODO: View details modal */}}>
                  👁️ View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Enhanced Assignments Tab with Full UI
const AssignmentsTab = () => {
  const [activeSection, setActiveSection] = useState('examiners');
  const [students, setStudents] = useState([]);
  const [examiners, setExaminers] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Mock data - replace with API calls
  useEffect(() => {
    // TODO: Load data from API
    setStudents([
      { id: 1, name: 'John Smith', studentId: 'UGR/13960/15', department: 'Computer Science' },
      { id: 2, name: 'Aisha Mohammed', studentId: 'UGR/13961/15', department: 'Information Systems' }
    ]);
    setExaminers([
      { id: 1, name: 'Dr. Bekele Tadesse', department: 'Computer Science', workload: 3 },
      { id: 2, name: 'Prof. Worku Alemu', department: 'Information Systems', workload: 2 }
    ]);
    setAdvisors([
      { id: 1, name: 'Dr. Sarah Johnson', department: 'Computer Science', capacity: 5 },
      { id: 2, name: 'Mr. Daniel Haile', department: 'Information Systems', capacity: 4 }
    ]);
  }, []);

  const getWorkloadColor = (current, max) => {
    const ratio = current / max;
    if (ratio >= 0.8) return 'danger';
    if (ratio >= 0.5) return 'warning';
    return 'ok';
  };

  return (
    <div className="sa-tab-content">
      <div className="sa-page-header">
        <h2>📋 Assignments</h2>
        <p>Assign examiners and advisors to students and internships</p>
      </div>

      <div className="sa-assign-tabs">
        <button
          className={`sa-tab-btn ${activeSection === 'examiners' ? 'active' : ''}`}
          onClick={() => setActiveSection('examiners')}
        >
          👨‍🏫 Assign Examiners
        </button>
        <button
          className={`sa-tab-btn ${activeSection === 'advisors' ? 'active' : ''}`}
          onClick={() => setActiveSection('advisors')}
        >
          👨‍💼 Assign Advisors
        </button>
        <button
          className={`sa-tab-btn ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          📜 Assignment History
        </button>
      </div>

      {activeSection === 'examiners' && (
        <div className="sa-assign-grid">
          <div className="sa-students-panel">
            <div className="sa-panel-header">
              <h3>🎓 Students without Examiner</h3>
              <span className="sa-badge">{students.length} total</span>
            </div>
            <div className="sa-list">
              {students.map(student => (
                <div key={student.id} className="sa-list-item">
                  <div className="sa-user-info">
                    <div className="sa-avatar">{student.name.charAt(0)}</div>
                    <div>
                      <div className="sa-user-name">{student.name}</div>
                      <div className="sa-user-meta">{student.studentId} • {student.department}</div>
                    </div>
                  </div>
                  <button className="sa-btn-small">Assign</button>
                </div>
              ))}
            </div>
          </div>

          <div className="sa-examiners-panel">
            <div className="sa-panel-header">
              <h3>👨‍🏫 Available Examiners</h3>
              <span className="sa-badge">{examiners.length} total</span>
            </div>
            <div className="sa-list">
              {examiners.map(examiner => (
                <div key={examiner.id} className="sa-list-item">
                  <div className="sa-user-info">
                    <div className="sa-avatar">{examiner.name.charAt(0)}</div>
                    <div>
                      <div className="sa-user-name">{examiner.name}</div>
                      <div className="sa-user-meta">{examiner.department}</div>
                    </div>
                  </div>
                  <div className={`sa-workload-badge ${getWorkloadColor(0, 10)}`}>
                    0/10
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'advisors' && (
        <div className="sa-assign-grid">
          <div className="sa-students-panel">
            <div className="sa-panel-header">
              <h3>🎓 Students without Advisor</h3>
              <span className="sa-badge">{students.length} total</span>
            </div>
            <div className="sa-list">
              {students.map(student => (
                <div key={student.id} className="sa-list-item">
                  <div className="sa-user-info">
                    <div className="sa-avatar">{student.name.charAt(0)}</div>
                    <div>
                      <div className="sa-user-name">{student.name}</div>
                      <div className="sa-user-meta">{student.studentId} • {student.department}</div>
                    </div>
                  </div>
                  <button className="sa-btn-small">Assign</button>
                </div>
              ))}
            </div>
          </div>

          <div className="sa-advisors-panel">
            <div className="sa-panel-header">
              <h3>👨‍💼 Available Advisors</h3>
              <span className="sa-badge">{advisors.length} total</span>
            </div>
            <div className="sa-list">
              {advisors.map(advisor => (
                <div key={advisor.id} className="sa-list-item">
                  <div className="sa-user-info">
                    <div className="sa-avatar">{advisor.name.charAt(0)}</div>
                    <div>
                      <div className="sa-user-name">{advisor.name}</div>
                      <div className="sa-user-meta">{advisor.department}</div>
                    </div>
                  </div>
                  <div className={`sa-workload-badge ${getWorkloadColor(0, advisor.capacity)}`}>
                    0/{advisor.capacity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'history' && (
        <div className="sa-history-panel">
          <div className="sa-panel-header">
            <h3>📜 Assignment History</h3>
            <button className="sa-btn-primary">Export Logs</button>
          </div>
          <div className="sa-table-responsive">
            <table className="sa-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Assigned To</th>
                  <th>Assigned By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2025-05-01</td>
                  <td>John Smith</td>
                  <td>Examiner</td>
                  <td>Dr. Bekele Tadesse</td>
                  <td>Super Admin</td>
                  <td><span className="sa-badge success">Active</span></td>
                </tr>
                <tr>
                  <td>2025-04-28</td>
                  <td>Aisha Mohammed</td>
                  <td>Advisor</td>
                  <td>Dr. Sarah Johnson</td>
                  <td>Super Admin</td>
                  <td><span className="sa-badge success">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder components for other tabs
const UsersTab = () => (
  <div className="sa-tab-content">
    <div className="sa-page-header">
      <h2>👥 User Management</h2>
      <p>Manage all system users, roles, and permissions</p>
    </div>
    <div className="sa-empty-state">
      <div className="sa-empty-icon">👥</div>
      <h3>User Management</h3>
      <p>This section is under development</p>
      <button className="sa-btn-primary">View All Users</button>
    </div>
  </div>
);

const ReportsTab = () => (
  <div className="sa-tab-content">
    <div className="sa-page-header">
      <h2>📈 Reports & Analytics</h2>
      <p>Generate comprehensive reports and view system analytics</p>
    </div>
    <div className="sa-empty-state">
      <div className="sa-empty-icon">📊</div>
      <h3>Reports Dashboard</h3>
      <p>Generate and analyze system reports</p>
      <div className="sa-quick-reports">
        <button className="sa-report-card">📊 System Overview</button>
        <button className="sa-report-card">👥 User Analytics</button>
        <button className="sa-report-card">📚 Department Stats</button>
        <button className="sa-report-card">💼 Placement Report</button>
      </div>
    </div>
  </div>
);

const SettingsTab = () => (
  <div className="sa-tab-content">
    <div className="sa-page-header">
      <h2>⚙️ System Settings</h2>
      <p>Configure system preferences and settings</p>
    </div>
    <div className="sa-settings-grid">
      <div className="sa-setting-card">
        <h4>🔐 Security</h4>
        <p>Password policies, 2FA, session management</p>
        <button className="sa-link-btn">Configure</button>
      </div>
      <div className="sa-setting-card">
        <h4>📧 Notifications</h4>
        <p>Email templates, alerts, digests</p>
        <button className="sa-link-btn">Configure</button>
      </div>
      <div className="sa-setting-card">
        <h4>🎨 appearance</h4>
        <p>Themes, logos, branding</p>
        <button className="sa-link-btn">Configure</button>
      </div>
      <div className="sa-setting-card">
        <h4>💾 Backup</h4>
        <p>Automated backups, retention policy</p>
        <button className="sa-link-btn">Configure</button>
      </div>
    </div>
  </div>
);

export default SuperAdminDashboard;
