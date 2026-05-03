import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef(0);
  const startTimeRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const target = value ?? 0;
    startRef.current = displayValue;
    startTimeRef.current = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startRef.current + (target - startRef.current) * easeOut);
      setDisplayValue(current);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return displayValue;
};

const OverviewPage = ({ stats, onNavigate }) => {
  const [animatedStats, setAnimatedStats] = useState({
    total_users: 0,
    students: 0,
    examiners: 0,
    companies: 0,
    advisors: 0,
    pending_approvals: 0
  });

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats(stats);
    }, 300);
    return () => clearTimeout(timer);
  }, [stats]);

  const statCards = [
    {
      id: 'users',
      icon: '👥',
      label: 'Total Users',
      value: animatedStats.total_users ?? 0,
      growth: '+12 this month',
      growthType: 'positive',
      color: '#2196f3',
      action: () => onNavigate('users')
    },
    {
      id: 'students',
      icon: '🎓',
      label: 'Total Students',
      value: animatedStats.students ?? 0,
      growth: '+8 this week',
      growthType: 'positive',
      color: '#4caf50',
      action: () => onNavigate('users')
    },
    {
      id: 'examiners',
      icon: '👨‍🏫',
      label: 'Total Examiners',
      value: animatedStats.examiners ?? 0,
      growth: 'Stable',
      growthType: 'neutral',
      color: '#ff9800',
      action: () => onNavigate('users')
    },
    {
      id: 'companies',
      icon: '🏢',
      label: 'Partner Companies',
      value: animatedStats.companies ?? 0,
      growth: '+3 pending',
      growthType: 'warning',
      color: '#3f51b5',
      action: () => onNavigate('users')
    },
    {
      id: 'advisors',
      icon: '👨‍💼',
      label: 'Total Advisors',
      value: animatedStats.advisors ?? 0,
      growth: 'Stable',
      growthType: 'neutral',
      color: '#e91e63',
      action: () => onNavigate('users')
    },
    {
      id: 'pending',
      icon: '⏳',
      label: 'Pending Approvals',
      value: animatedStats.pending_approvals ?? 0,
      growth: '⚠️ Needs attention',
      growthType: 'danger',
      color: '#ffc107',
      action: () => onNavigate('approvals')
    }
  ];

  const aiInsights = [
    { icon: '📊', type: 'info', message: 'Student registration up 15% this month' },
    { icon: '⚠️', type: 'warning', message: '3 partnership requests pending for 5+ days' },
    { icon: '⚠️', type: 'warning', message: '8 students unassigned to advisors' },
    { icon: '⚠️', type: 'warning', message: '2 internship posts need review' },
    { icon: '💡', type: 'success', message: 'Best posting time: Monday mornings' },
    { icon: '💡', type: 'success', message: 'Add examiners to College of Engineering' },
    { icon: '💡', type: 'success', message: 'Consider auto-approval for quality posts' },
    { icon: '🔮', type: 'info', message: '15 new registrations expected next week' },
    { icon: '🔮', type: 'info', message: '85% placement rate predicted' }
  ];

  const recentActivities = [
    { icon: '🎓', text: 'John Smith registered as Student', detail: 'Computer Science', time: '2 min ago' },
    { icon: '✅', text: 'Partnership approved: Tech Solutions Ltd', detail: 'By Super Admin', time: '15 min ago' },
    { icon: '📝', text: 'Internship post approved', detail: 'Software Developer - DHL Ethiopia', time: '1 hr ago' },
    { icon: '👨‍🏫', text: 'Dr. Bekele assigned as Examiner', detail: '5 students', time: '2 hrs ago' },
    { icon: '🔑', text: 'Credentials generated', detail: 'Sarah Johnson - Tech Solutions', time: '3 hrs ago' },
    { icon: '⚠️', text: 'System backup completed', detail: 'Successfully', time: '4 hrs ago' },
    { icon: '📢', text: 'Announcement sent', detail: 'System maintenance scheduled', time: '5 hrs ago' },
    { icon: '👥', text: 'New examiner joined', detail: 'Dr. Tadesse - AI Department', time: '6 hrs ago' },
    { icon: '🏢', text: 'Company registered', detail: 'Innovate Ethiopia', time: '8 hrs ago' },
    { icon: '⚡', text: 'Performance optimization', detail: 'Database indexed', time: '12 hrs ago' }
  ];

  const pendingItems = [
    { id: 1, icon: '🔴', title: 'Urgent Partnership Requests', count: 3, action: () => onNavigate('approvals') },
    { id: 2, icon: '🟡', title: 'Student Assignments', count: 5, action: () => onNavigate('assignments') },
    { id: 3, icon: '🟡', title: 'Internship Reviews', count: 2, action: () => onNavigate('approvals') },
    { id: 4, icon: '🟢', title: 'System Backup', status: 'Scheduled', action: () => onNavigate('settings') },
    { id: 5, icon: '🟢', title: 'Monthly Report', status: 'Due in 3 days', action: () => onNavigate('reports') }
  ];

  const systemHealth = [
    { label: 'API Server', value: '145ms', status: 'healthy', icon: '🟢' },
    { label: 'Database', value: 'Healthy', status: 'healthy', icon: '🟢' },
    { label: 'Storage', value: '67%', status: 'warning', icon: '🟡' },
    { label: 'Memory', value: '45%', status: 'healthy', icon: '🟢' },
    { label: 'Active Sessions', value: '12', status: 'neutral', icon: '💚' },
    { label: 'Last Backup', value: '2 hours ago', status: 'neutral', icon: '🕐' }
  ];

  const quickActions = [
    { icon: '➕', label: 'Register Student', action: () => onNavigate('registrations') },
    { icon: '🏢', label: 'Register Company', action: () => onNavigate('registrations') },
    { icon: '⏳', label: 'Review Approvals', action: () => onNavigate('approvals') },
    { icon: '🧩', label: 'Assign Examiners', action: () => onNavigate('assignments') },
    { icon: '📊', label: 'Generate Report', action: () => onNavigate('reports') },
    { icon: '🔔', label: 'Announcement', action: () => onNavigate('settings') }
  ];

  return (
    <div className="sa-content-layout">
      {/* Main Content Area */}
      <div className="sa-content-area">
        {/* Welcome Banner */}
        <div className="sa-welcome-banner">
          <div className="sa-welcome-content">
            <h1>👑 Welcome back, Super Admin!</h1>
            <p>Here's what's happening in your internship ecosystem today.</p>
            <div className="sa-status-indicator">
              <span className="sa-status-dot pulse"></span>
              <span>🟢 All Systems Operational</span>
            </div>
          </div>
          <div className="sa-current-time">
            <div className="sa-date">{formatDate()}</div>
            <div className="sa-time">{formatTime()}</div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="sa-stats-grid">
          {statCards.map((stat) => (
            <div
              key={stat.id}
              className="sa-stat-card"
              style={{ borderLeftColor: stat.color }}
              onClick={stat.action}
            >
              <div className="sa-stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="sa-stat-info">
                <h3><AnimatedCounter value={stat.value} /></h3>
                <p>{stat.label}</p>
                <span className={`sa-stat-growth sa-growth-${stat.growthType}`}>
                  {stat.growth}
                </span>
              </div>
              <div className="sa-stat-bar">
                <div className="sa-stat-bar-fill" style={{ width: `${Math.min(100, stat.value / (stat.id === 'pending' ? 20 : 200) * 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights Panel */}
        <div className="sa-insights-panel">
          <div className="sa-panel-header">
            <h2>🤖 AI System Insights</h2>
            <div className="sa-panel-actions">
              <button className="sa-btn sa-btn-secondary" onClick={() => window.location.reload()}>
                🔄 Refresh Insights
              </button>
              <button className="sa-btn sa-btn-primary">
                📊 View Detailed Report
              </button>
            </div>
          </div>
          <div className="sa-insights-grid">
            {aiInsights.map((insight, index) => (
              <div key={index} className={`sa-insight-card sa-insight-${insight.type}`}>
                <span className="sa-insight-icon">{insight.icon}</span>
                <p>{insight.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="sa-quick-actions">
          <h2>⚡ Quick Actions</h2>
          <div className="sa-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="sa-action-btn"
                onClick={action.action}
              >
                <span className="sa-btn-icon">{action.icon}</span>
                <span className="sa-btn-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="sa-activity-feed">
          <div className="sa-feed-header">
            <h2>📋 Recent Activity</h2>
            <a href="#" className="sa-view-all">View All Activity →</a>
          </div>
          <div className="sa-activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="sa-activity-item">
                <span className="sa-activity-icon">{activity.icon}</span>
                <div className="sa-activity-content">
                  <div className="sa-activity-text">{activity.text}</div>
                  <div className="sa-activity-detail">{activity.detail}</div>
                </div>
                <span className="sa-activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar Panels */}
      <div className="sa-sidepanels">
        {/* Pending Items Summary */}
        <div className="sa-pending-panel">
          <h3>⚡ Pending Items</h3>
          <div className="sa-pending-list">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="sa-pending-item"
                onClick={item.action}
              >
                <span className="sa-pending-icon">{item.icon}</span>
                <div className="sa-pending-content">
                  <span className="sa-pending-title">{item.title}</span>
                  <span className="sa-pending-count">
                    {item.count || item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Monitor */}
        <div className="sa-health-panel">
          <h3>💻 System Health</h3>
          <div className="sa-health-grid">
            {systemHealth.map((metric, index) => (
              <div key={index} className="sa-health-item">
                <div className="sa-health-header">
                  <span className="sa-health-icon">{metric.icon}</span>
                  <span className="sa-health-label">{metric.label}</span>
                </div>
                <div className={`sa-health-value sa-status-${metric.status}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
          <button className="sa-settings-link" onClick={() => onNavigate('settings')}>
            ⚙️ System Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
