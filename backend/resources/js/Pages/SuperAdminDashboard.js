import React, { useEffect, useMemo, useState } from 'react';
import Header from './superadmin/components/Header/Header';
import OverviewStats from './superadmin/components/OverviewStats';
import PendingApprovalsPanel from './superadmin/components/PendingApprovalsPanel/PendingApprovalsPanel';
import AssignPanel from './superadmin/components/AssignPanel/AssignPanel';
import RegistrationPanel from './superadmin/components/RegistrationPanel/RegistrationPanel';
import Sidebar from './superadmin/components/Sidebar';
import UserManagementPanel from './superadmin/components/UserManagementPanel';
import { superAdminAPI } from '../services/api';
import { normalizeUser } from './superadmin/utils/userHelpers';
import './superadmin/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedCredentials, setGeneratedCredentials] = useState([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [activity, setActivity] = useState([
    { icon: '✅', message: 'User management connected to backend', time: 'Just now' },
  ]);

  const loadData = async () => {
    setError('');
    try {
      const [usersRes, departmentsRes, approvalsRes] = await Promise.all([
        superAdminAPI.getUsers(),
        superAdminAPI.getDepartments(),
        superAdminAPI.getApprovalsSummary(),
      ]);
      setUsers((usersRes.data || []).map(normalizeUser));
      setDepartments(departmentsRes.data || []);
      setPendingApprovalsCount(approvalsRes.data?.total_pending || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user management data.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await superAdminAPI.getApprovalsSummary();
        setPendingApprovalsCount(res.data?.total_pending || 0);
      } catch (e) {
        // keep silent; badge refresh shouldn't spam errors
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return {
      totalUsers: users.length,
      totalStudents: roleCounts.student || 0,
      totalExaminers: roleCounts.examiner || 0,
      totalCoordinators: roleCounts.coordinator || 0,
      totalCompanies: roleCounts.company || 0,
      totalAdvisors: roleCounts.advisor || 0,
    };
  }, [users]);

  const addActivity = (icon, message) => {
    setActivity((prev) => [{ icon, message, time: 'Just now' }, ...prev.slice(0, 7)]);
  };

  const handleRegister = async (formData, role) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      let res;
      if (role === 'student') res = await superAdminAPI.registerStudent({ ...formData, department_id: Number(formData.department_id), year: Number(formData.year), cgpa: Number(formData.cgpa) });
      if (role === 'company') res = await superAdminAPI.registerCompany(formData);
      if (role === 'examiner') res = await superAdminAPI.registerExaminer({ ...formData, department_id: Number(formData.department_id), years_of_experience: Number(formData.years_of_experience) });
      if (role === 'advisor') res = await superAdminAPI.registerAdvisor({ ...formData, department_id: Number(formData.department_id), years_of_experience: Number(formData.years_of_experience) });

      if (res?.data?.credentials) {
        setGeneratedCredentials((prev) => [res.data.credentials, ...prev].slice(0, 10));
      }
      setSuccess(`${role} registered successfully!`);
      addActivity('✅', `${role} registered successfully`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to register ${role}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkRegister = async (bulkData, role) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await superAdminAPI.registerStudentsBulk(bulkData);
      
      if (res?.data?.credentials) {
        setGeneratedCredentials((prev) => [...res.data.credentials, ...prev].slice(0, 10));
      }
      setSuccess(`${bulkData.length} ${role}s registered successfully!`);
      addActivity('✅', `${bulkData.length} ${role}s registered successfully`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to register ${role}s in bulk`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const payload = {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        status: updatedUser.status,
        student_id: updatedUser.studentId || null,
        employee_id: updatedUser.employeeId || null,
      };
      if (updatedUser.department && departments.length > 0) {
        const match = departments.find((d) => d.name === updatedUser.department);
        if (match) payload.department_id = match.id;
      }
      const res = await superAdminAPI.updateUser(updatedUser.id, payload);
      const normalized = normalizeUser(res.data.user);
      setUsers((prev) => prev.map((user) => (user.id === normalized.id ? normalized : user)));
      addActivity('✏️', `User updated: ${normalized.name}`);
      setSuccess('User updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const handleSuspendUser = async (user, duration, reason) => {
    try {
      const res = await superAdminAPI.suspendUser(user.id, { duration, reason });
      const normalized = normalizeUser(res.data.user);
      setUsers((prev) => prev.map((u) => (u.id === normalized.id ? normalized : u)));
      const suffix = duration === 'permanent' ? 'permanently' : `for ${duration} days`;
      addActivity('⏸️', `User suspended: ${user.name} ${suffix}`);
      setSuccess('User suspended successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to suspend user.');
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      await superAdminAPI.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      addActivity('🗑️', `User deleted: ${user.name}`);
      setSuccess('User deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleResetPassword = async (user) => {
    try {
      const res = await superAdminAPI.resetUserPassword(user.id);
      const password = res.data?.credentials?.password || '(hidden)';
      window.alert(`New password for ${user.name}: ${password}`);
      addActivity('🔑', `Password reset for: ${user.name}`);
      setSuccess('Password reset successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const renderContent = () => {
    if (activeSection === 'overview') return <OverviewStats stats={stats} />;
    if (activeSection === 'pending-approvals') {
      return (
        <PendingApprovalsPanel
          onSuccess={(msg) => {
            setSuccess(msg);
            setError('');
            loadData();
          }}
          onError={(msg) => {
            setError(msg);
            setSuccess('');
          }}
          onActivity={addActivity}
          onCredentialsGenerated={(cred) => {
            setGeneratedCredentials((prev) => [cred, ...prev].slice(0, 10));
          }}
        />
      );
    }
    if (activeSection === 'assign') {
      return (
        <AssignPanel
          onSuccess={(msg) => {
            setSuccess(msg);
            setError('');
          }}
          onError={(msg) => {
            setError(msg);
            setSuccess('');
          }}
          onActivity={addActivity}
        />
      );
    }
    if (['student', 'company', 'examiner', 'advisor'].includes(activeSection)) {
      return (
        <RegistrationPanel
          activeSection={activeSection}
          departments={departments}
          onRegister={handleRegister}
          onBulkRegister={handleBulkRegister}
          isSubmitting={isSubmitting}
        />
      );
    }
    if (['all-users', 'students', 'examiners', 'coordinators', 'companies', 'advisors'].includes(activeSection)) {
      return (
        <UserManagementPanel
          users={users}
          activeSection={activeSection}
          departments={departments.map((d) => d.name)}
          onUpdateUser={handleUpdateUser}
          onSuspendUser={handleSuspendUser}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
        />
      );
    }
    return (
      <div className="sa-empty-panel">
        <h3>Settings</h3>
        <p>Settings panel can be extended here.</p>
      </div>
    );
  };

  return (
    <div className="sa-dashboard-container">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      <div className={`sa-main-content ${sidebarOpen ? 'expanded' : 'collapsed'}`}>
        <Header activeSection={activeSection} currentTime={currentTime} />

        {error && <div className="sa-message error"><span>❌</span><span>{error}</span></div>}
        {success && <div className="sa-message success"><span>✅</span><span>{success}</span></div>}

        <div className="sa-content-layout">
          <div className="sa-content-area">
            {renderContent()}
          </div>

          <div className="sa-sidepanels">
            {generatedCredentials.length > 0 && ['student', 'company', 'examiner', 'advisor', 'pending-approvals'].includes(activeSection) && (
              <div className="sa-credentials-panel">
                <div className="credentials-header">
                  <h3>📋 Recently Generated Credentials</h3>
                  <button type="button" className="clear-credentials" onClick={() => setGeneratedCredentials([])}>Clear All</button>
                </div>
                <div className="credentials-list">
                  {generatedCredentials.slice(0, 3).map((cred, idx) => (
                    <div key={`${cred.email}-${idx}`} className="credential-item">
                      <div className="cred-user">
                        <strong>{cred.name || cred.email}</strong>
                        <span className="cred-role">{activeSection}</span>
                      </div>
                      <div className="cred-details">
                        <code>{cred.email}</code>
                        <code className="password">{cred.password}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <section className="activity-panel">
              <h3>Recent Activities</h3>
              {activity.map((item, idx) => (
                <div key={`${item.message}-${idx}`} className="activity-item">
                  <span>{item.icon}</span>
                  <p>{item.message}</p>
                  <small>{item.time}</small>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
