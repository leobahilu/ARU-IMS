import React, { useState, useEffect } from 'react';

const Sidebar = ({ 
  activeSection, 
  setActiveSection, 
  sidebarOpen, 
  setSidebarOpen, 
  pendingApprovalsCount = 0,
  pendingPartnerCount = 0,
  pendingInternshipCount = 0,
  unassignedStudentCount = 0,
  systemAlerts = 0
}) => {
  const [openMenus, setOpenMenus] = useState({ 
    registrations: false, 
    'user-management': false,
    'pending-approvals': false 
  });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [rippleEffect, setRippleEffect] = useState({});

  const totalPendingApprovals = pendingApprovalsCount || (pendingPartnerCount + pendingInternshipCount);

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      description: 'System Dashboard & Analytics',
    },
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      icon: '⏳',
      badge: totalPendingApprovals,
      badgeColor: '#ef4444',
      description: 'Review & approve requests',
      subItems: [
        { 
          id: 'partner-requests', 
          label: 'Partnership Requests', 
          icon: '🤝',
          badge: pendingPartnerCount,
          badgeColor: '#f59e0b'
        },
        { 
          id: 'internship-requests', 
          label: 'Internship Posts', 
          icon: '📋',
          badge: pendingInternshipCount,
          badgeColor: '#8b5cf6'
        },
      ],
    },
    {
      id: 'assign',
      label: 'Assign',
      icon: '🧩',
      description: 'Assign examiners & advisors',
      badge: unassignedStudentCount > 0 ? unassignedStudentCount : null,
      badgeColor: '#f59e0b',
    },
    {
      id: 'registrations',
      label: 'Registrations',
      icon: '➕',
      description: 'Register new users',
      subItems: [
        { id: 'student', label: 'Student Registration', icon: '🎓', shortcut: 'Alt+S' },
        { id: 'company', label: 'Company Registration', icon: '🏢', shortcut: 'Alt+C' },
        { id: 'examiner', label: 'Examiner Registration', icon: '👨‍🏫', shortcut: 'Alt+E' },
        { id: 'advisor', label: 'Advisor Registration', icon: '👨‍💼', shortcut: 'Alt+A' },
      ],
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: '👥',
      description: 'Manage all users',
      subItems: [
        { id: 'all-users', label: 'All Users', icon: '👥' },
        { id: 'students', label: 'Students', icon: '🎓', count: 120 },
        { id: 'examiners', label: 'Examiners', icon: '👨‍🏫', count: 15 },
        { id: 'coordinators', label: 'Coordinators', icon: '📋', count: 5 },
        { id: 'companies', label: 'Companies', icon: '🏢', count: 12 },
        { id: 'advisors', label: 'Advisors', icon: '👨‍💼', count: 4 },
      ],
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: '📈',
      description: 'Generate & view reports',
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: '🤖',
      description: 'AI-powered analytics',
      badge: 'NEW',
      badgeColor: '#10b981',
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: '📋',
      description: 'System activity logs',
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: '⚙️',
      description: 'Configure system',
    },
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey || e.metaKey)) {
        switch(e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            setActiveSection('student');
            break;
          case 'c':
            e.preventDefault();
            setActiveSection('company');
            break;
          case 'e':
            e.preventDefault();
            setActiveSection('examiner');
            break;
          case 'a':
            e.preventDefault();
            setActiveSection('advisor');
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setActiveSection]);

  const toggleMenu = (menuId, e) => {
    if (e) {
      e.stopPropagation();
      // Ripple effect
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRippleEffect({ [menuId]: { x, y } });
      setTimeout(() => setRippleEffect(prev => ({ ...prev, [menuId]: null })), 600);
    }
    
    setOpenMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleItemClick = (itemId, hasSubItems) => {
    if (!hasSubItems) {
      setActiveSection(itemId);
    }
  };

  const handleSubItemClick = (subId) => {
    setActiveSection(subId);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Handle logout logic
      console.log('Logging out...');
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sa-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sa-sidebar-header">
          <div className="sa-sidebar-logo">
            <div className="logo-icon-wrapper">
              <span className="logo-icon">👑</span>
              <span className="logo-glow"></span>
            </div>
            {sidebarOpen && (
              <div className="logo-text">
                <h2 className="logo-title">ARU IMS</h2>
                <p className="logo-subtitle">Super Admin Portal</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button 
              type="button" 
              className="sidebar-collapse-btn" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Collapse Sidebar"
              aria-label="Toggle sidebar"
            >
              <span className="collapse-icon">◀</span>
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {!sidebarOpen && (
          <button 
            className="sidebar-expand-btn"
            onClick={() => setSidebarOpen(true)}
            title="Expand Sidebar"
            aria-label="Expand sidebar"
          >
            <span>▶</span>
          </button>
        )}

        {/* User Profile */}
        <div className="sa-sidebar-user">
          <div className="user-avatar-wrapper">
            <div className="user-avatar">SA</div>
            <span className="user-status-dot"></span>
          </div>
          {sidebarOpen && (
            <div className="user-info">
              <h4 className="user-name">Super Admin</h4>
              <p className="user-role">System Administrator</p>
              <div className="user-actions">
                <button className="user-action-btn" title="Profile Settings">⚙️</button>
                <button className="user-action-btn" title="Notifications">🔔</button>
              </div>
            </div>
          )}
        </div>

        {/* System Alerts Bar */}
        {sidebarOpen && systemAlerts > 0 && (
          <div className="system-alerts-bar">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{systemAlerts} system alert{systemAlerts > 1 ? 's' : ''}</span>
            <span className="alert-arrow">→</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="sa-sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.id} className="sidebar-nav-item-group">
              {item.subItems ? (
                <>
                  <div
                    className={`nav-header ${openMenus[item.id] ? 'open' : ''} ${hoveredItem === item.id ? 'hovered' : ''}`}
                    onClick={(e) => toggleMenu(item.id, e)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    {rippleEffect[item.id] && (
                      <span 
                        className="ripple-effect"
                        style={{
                          left: rippleEffect[item.id].x,
                          top: rippleEffect[item.id].y,
                        }}
                      />
                    )}
                    <span className="nav-icon-wrapper">
                      <span className="nav-icon">{item.icon}</span>
                      {item.badge && !sidebarOpen && (
                        <span className="nav-badge-dot" style={{ background: item.badgeColor || '#ef4444' }}></span>
                      )}
                    </span>
                    {sidebarOpen && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        {typeof item.badge === 'number' && item.badge > 0 && (
                          <span className="nav-badge" style={{ background: item.badgeColor || '#ef4444' }}>
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {typeof item.badge === 'string' && (
                          <span className="nav-badge new-badge" style={{ background: item.badgeColor || '#10b981' }}>
                            {item.badge}
                          </span>
                        )}
                        <span className={`nav-arrow ${openMenus[item.id] ? 'open' : ''}`}>
                          ▼
                        </span>
                      </>
                    )}
                  </div>
                  {openMenus[item.id] && sidebarOpen && (
                    <div className="nav-submenu">
                      {item.subItems.map((sub) => (
                        <div
                          key={sub.id}
                          className={`nav-subitem ${activeSection === sub.id ? 'active' : ''} ${hoveredItem === sub.id ? 'hovered' : ''}`}
                          onClick={() => handleSubItemClick(sub.id)}
                          onMouseEnter={() => setHoveredItem(sub.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <span className="sub-icon">{sub.icon}</span>
                          <span className="sub-label">{sub.label}</span>
                          {sub.badge && (
                            <span className="sub-badge" style={{ background: sub.badgeColor || '#ef4444' }}>
                              {sub.badge}
                            </span>
                          )}
                          {sub.count && (
                            <span className="sub-count">{sub.count}</span>
                          )}
                          {sub.shortcut && (
                            <span className="sub-shortcut">{sub.shortcut}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className={`nav-item ${activeSection === item.id ? 'active' : ''} ${hoveredItem === item.id ? 'hovered' : ''}`}
                  onClick={() => handleItemClick(item.id, false)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={!sidebarOpen ? `${item.label}${item.description ? ` - ${item.description}` : ''}` : (item.description || '')}
                >
                  <span className="nav-icon-wrapper">
                    <span className="nav-icon">{item.icon}</span>
                    {(item.badge && !sidebarOpen) && (
                      <span className="nav-badge-dot" style={{ background: item.badgeColor || '#ef4444' }}></span>
                    )}
                  </span>
                  {sidebarOpen && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.description && (
                        <span className="nav-description">{item.description}</span>
                      )}
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className={`nav-badge ${item.badge > 9 ? '' : 'small'}`} style={{ background: item.badgeColor || '#ef4444' }}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      {typeof item.badge === 'string' && (
                        <span className="nav-badge new-badge pulse" style={{ background: item.badgeColor || '#10b981' }}>
                          {item.badge}
                        </span>
                      )}
                      {item.id === 'overview' && (
                        <span className="nav-shortcut-indicator">⌘1</span>
                      )}
                    </>
                  )}
                  {activeSection === item.id && <span className="active-indicator"></span>}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sa-sidebar-footer">
          {sidebarOpen && (
            <div className="sidebar-stats">
              <div className="stat-mini">
                <span className="stat-mini-icon">💾</span>
                <span className="stat-mini-text">Storage 67%</span>
              </div>
            </div>
          )}
          <div className="footer-item" onClick={handleLogout} title="Logout">
            <span className="footer-icon">🚪</span>
            {sidebarOpen && (
              <>
                <span className="footer-label">Logout</span>
                <span className="footer-shortcut">⌘Q</span>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;