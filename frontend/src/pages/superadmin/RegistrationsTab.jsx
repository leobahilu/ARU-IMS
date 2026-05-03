import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';

const QUALIFICATION_OPTIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Senior Lecturer',
  'Lecturer',
  'Assistant Lecturer',
  'Instructor',
  'PhD Candidate (Teaching Assistant)',
  'Industry Professional (Adjunct)',
  'Guest Examiner',
];

const RegistrationsTab = ({ darkMode = false }) => {
  const [activeRegistration, setActiveRegistration] = useState('student');
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await superAdminAPI.getDepartments();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = {
      student: ['first_name', 'last_name', 'student_id', 'department_id', 'year', 'cgpa'],
      company: ['name', 'email', 'phone', 'address', 'industry'],
      examiner: ['first_name', 'last_name', 'email', 'phone', 'department_id', 'specialization'],
      advisor: ['first_name', 'last_name', 'email', 'phone', 'department_id', 'experience_years']
    };

    const fields = requiredFields[activeRegistration] || [];
    fields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = `${field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`;
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone && !/^(\+251|0)[0-9]{8,9}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid Ethiopian phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      let response;
      switch (activeRegistration) {
        case 'student':
          response = await superAdminAPI.registerStudent(formData);
          break;
        case 'company':
          response = await superAdminAPI.registerCompany(formData);
          break;
        case 'examiner':
          response = await superAdminAPI.registerExaminer(formData);
          break;
        case 'advisor':
          response = await superAdminAPI.registerAdvisor(formData);
          break;
        default:
          throw new Error('Invalid registration type');
      }

      setGeneratedCredentials(response.data);
      setShowCredentials(true);
      setSuccessMessage(`${activeRegistration.charAt(0).toUpperCase() + activeRegistration.slice(1)} registered successfully!`);
      setFormData({}); // Clear form

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (error) {
      console.error('Registration error:', error);
      setFormErrors({ general: error.response?.data?.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const registrationTypes = [
    { id: 'student', label: 'Student', icon: '🎓', description: 'Register new students' },
    { id: 'company', label: 'Company', icon: '🏢', description: 'Add partner companies' },
    { id: 'examiner', label: 'Examiner', icon: '👨‍🏫', description: 'Register internship examiners' },
    { id: 'advisor', label: 'Advisor', icon: '👨‍💼', description: 'Add academic advisors' }
  ];

  const renderFormFields = () => {
    const commonFields = (
      <>
        <div className="form-row">
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              value={formData.first_name || ''}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className={formErrors.first_name ? 'error' : ''}
              placeholder="Enter first name"
            />
            {formErrors.first_name && <span className="error-text">{formErrors.first_name}</span>}
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              value={formData.last_name || ''}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className={formErrors.last_name ? 'error' : ''}
              placeholder="Enter last name"
            />
            {formErrors.last_name && <span className="error-text">{formErrors.last_name}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={formErrors.email ? 'error' : ''}
              placeholder="Enter email address"
            />
            {formErrors.email && <span className="error-text">{formErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={formErrors.phone ? 'error' : ''}
              placeholder="+251XXXXXXXXX"
            />
            {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
          </div>
        </div>
      </>
    );

    switch (activeRegistration) {
      case 'student':
        return (
          <>
            {commonFields}
            <div className="form-row">
              <div className="form-group">
                <label>Student ID *</label>
                <input
                  type="text"
                  value={formData.student_id || ''}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  className={formErrors.student_id ? 'error' : ''}
                  placeholder="e.g., STU001"
                />
                {formErrors.student_id && <span className="error-text">{formErrors.student_id}</span>}
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={formData.department_id || ''}
                  onChange={(e) => handleInputChange('department_id', e.target.value)}
                  className={formErrors.department_id ? 'error' : ''}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {formErrors.department_id && <span className="error-text">{formErrors.department_id}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Year of Study *</label>
                <select
                  value={formData.year || ''}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className={formErrors.year ? 'error' : ''}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
                {formErrors.year && <span className="error-text">{formErrors.year}</span>}
              </div>
              <div className="form-group">
                <label>CGPA *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={formData.cgpa || ''}
                  onChange={(e) => handleInputChange('cgpa', e.target.value)}
                  className={formErrors.cgpa ? 'error' : ''}
                  placeholder="e.g., 3.5"
                />
                {formErrors.cgpa && <span className="error-text">{formErrors.cgpa}</span>}
              </div>
            </div>
          </>
        );

      case 'company':
        return (
          <>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={formErrors.name ? 'error' : ''}
                  placeholder="Enter company name"
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>
            </div>
            {commonFields}
            <div className="form-row">
              <div className="form-group">
                <label>Industry *</label>
                <select
                  value={formData.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className={formErrors.industry ? 'error' : ''}
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.industry && <span className="error-text">{formErrors.industry}</span>}
              </div>
              <div className="form-group">
                <label>Company Size</label>
                <select
                  value={formData.size || ''}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Address *</label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={formErrors.address ? 'error' : ''}
                  placeholder="Enter company address"
                  rows="3"
                />
                {formErrors.address && <span className="error-text">{formErrors.address}</span>}
              </div>
            </div>
          </>
        );

      case 'examiner':
      case 'advisor':
        return (
          <>
            {commonFields}
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={formData.department_id || ''}
                  onChange={(e) => handleInputChange('department_id', e.target.value)}
                  className={formErrors.department_id ? 'error' : ''}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {formErrors.department_id && <span className="error-text">{formErrors.department_id}</span>}
              </div>
              <div className="form-group">
                <label>Specialization *</label>
                <input
                  type="text"
                  value={formData.specialization || ''}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  className={formErrors.specialization ? 'error' : ''}
                  placeholder="e.g., Software Engineering"
                />
                {formErrors.specialization && <span className="error-text">{formErrors.specialization}</span>}
              </div>
            </div>
            {activeRegistration === 'advisor' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Experience (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience_years || ''}
                    onChange={(e) => handleInputChange('experience_years', e.target.value)}
                    className={formErrors.experience_years ? 'error' : ''}
                    placeholder="e.g., 5"
                  />
                  {formErrors.experience_years && <span className="error-text">{formErrors.experience_years}</span>}
                </div>
                <div className="form-group">
                  <label>Qualification</label>
                  <select
                    value={formData.qualification || ''}
                    onChange={(e) => handleInputChange('qualification', e.target.value)}
                  >
                    <option value="">Select Qualification</option>
                    <option value="PhD">PhD</option>
                    <option value="Masters">Masters</option>
                    <option value="Bachelors">Bachelors</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`registrations-tab ${darkMode ? 'dark' : ''}`}>
      {/* Registration Type Selector */}
      <div className="registration-cards">
        {registrationTypes.map(type => (
          <div
            key={type.id}
            className={`reg-card ${activeRegistration === type.id ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
            onClick={() => {
              setActiveRegistration(type.id);
              setFormData({});
              setFormErrors({});
              setSuccessMessage('');
            }}
          >
            <div className="reg-icon">{type.icon}</div>
            <h3>{type.label}</h3>
            <p>{type.description}</p>
          </div>
        ))}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* General Error Message */}
      {formErrors.general && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span>{formErrors.general}</span>
        </div>
      )}

      {/* Registration Form */}
      <div className={`registration-content ${darkMode ? 'dark' : ''}`}>
        <h2>Register New {registrationTypes.find(t => t.id === activeRegistration)?.label}</h2>
        <form className="registration-form" onSubmit={handleSubmit}>
          {renderFormFields()}

          <button
            type="submit"
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Registering...
              </>
            ) : (
              `Register ${registrationTypes.find(t => t.id === activeRegistration)?.label}`
            )}
          </button>
        </form>
      </div>

      {/* Credentials Modal */}
      {showCredentials && generatedCredentials && (
        <CredentialsModal
          credentials={generatedCredentials}
          onClose={() => setShowCredentials(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// Enhanced Credentials Modal Component
const CredentialsModal = ({ credentials, onClose, darkMode }) => {
  const [copiedField, setCopiedField] = useState('');

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadCredentials = () => {
    const content = `ARU IMS Account Credentials

Email: ${credentials.email}
Password: ${credentials.password}

Please change your password after first login.
Account expires in ${credentials.expires_in_days} days.

Generated on: ${new Date().toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${credentials.user?.first_name || 'user'}_credentials.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printCredentials = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>ARU IMS Credentials</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .credentials { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
            .value { font-family: monospace; background: #f5f5f5; padding: 5px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>ARU IMS Account Credentials</h1>
          <div class="credentials">
            <div class="field">
              <span class="label">Email:</span>
              <div class="value">${credentials.email}</div>
            </div>
            <div class="field">
              <span class="label">Password:</span>
              <div class="value">${credentials.password}</div>
            </div>
            <p><strong>Important:</strong> Please change your password after first login.</p>
            <p>Account expires in ${credentials.expires_in_days} days.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="credentials-modal-overlay">
      <div className={`credentials-modal ${darkMode ? 'dark' : ''}`}>
        <div className="modal-header">
          <h3>🎉 Registration Successful!</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="credentials-panel">
          <div className="credentials-info">
            <p><strong>Account created successfully!</strong> Please save these credentials securely.</p>
          </div>

          <div className="credentials-display">
            <h4>Account Credentials</h4>
            <div className="credentials-box">
              <div className="credential-item">
                <label>Email:</label>
                <div className="credential-value">
                  <span>{credentials.email}</span>
                  <button
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    title="Copy email"
                  >
                    {copiedField === 'email' ? '✅' : '📋'}
                  </button>
                </div>
              </div>
              <div className="credential-item">
                <label>Password:</label>
                <div className="credential-value">
                  <span>{credentials.password}</span>
                  <button
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    title="Copy password"
                  >
                    {copiedField === 'password' ? '✅' : '📋'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="credentials-warning">
            <p><strong>⚠️ Security Notice:</strong> Please change your password after first login. Keep these credentials secure and do not share them with others.</p>
          </div>

          <div className="credentials-actions">
            <button className="action-btn email" onClick={() => window.open(`mailto:${credentials.email}?subject=ARU IMS Account&body=Your account has been created.%0D%0AEmail: ${credentials.email}%0D%0APassword: ${credentials.password}%0D%0APlease change your password after login.`)}>
              📧 Email Credentials
            </button>
            <button className="action-btn download" onClick={downloadCredentials}>
              💾 Download
            </button>
            <button className="action-btn print" onClick={printCredentials}>
              🖨️ Print
            </button>
            <button className="action-btn copy-all" onClick={() => copyToClipboard(`Email: ${credentials.email}\nPassword: ${credentials.password}`, 'all')}>
              📋 Copy All
            </button>
          </div>

          <div className="modal-footer">
            <button className="secondary-btn" onClick={onClose}>Close</button>
            <button className="primary-btn" onClick={() => {
              copyToClipboard(`Email: ${credentials.email}\nPassword: ${credentials.password}`, 'all');
              onClose();
            }}>
              Copy & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationsTab;