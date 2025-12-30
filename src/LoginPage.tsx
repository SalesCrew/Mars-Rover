import React, { useState } from 'react';
import { Lock, User, ShieldCheck, X } from '@phosphor-icons/react';
import Aurora from './components/gl/Aurora';
import { useAuth } from './contexts/AuthContext';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Admin login state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (email && password) {
      setIsLoading(true);
      try {
        await login({ username: email, password });
        // Success - AuthContext will handle routing
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    
    if (adminEmail && adminPassword) {
      setIsAdminLoading(true);
      try {
        await login({ username: adminEmail, password: adminPassword });
        // AuthContext will check role and route accordingly
      } catch (err) {
        setAdminError(err instanceof Error ? err.message : 'Admin-Anmeldung fehlgeschlagen');
      } finally {
        setIsAdminLoading(false);
      }
    }
  };

  const handleRoverClick = () => {
    setShowAdminLogin(true);
    setAdminEmail('');
    setAdminPassword('');
    setAdminError(null);
  };

  return (
    <div className={styles.loginPage}>
      {/* Aurora Background */}
      <div className={styles.auroraBackground}>
        <Aurora 
          colorStops={["#3B82F6", "#7cff67", "#3B82F6"]}
          blend={0.6}
          amplitude={0.8}
          speed={0.3}
        />
      </div>

      {/* Content Container */}
      <div className={styles.contentContainer}>
        {/* Branding */}
        <div className={styles.brandingSection}>
          <h1 className={styles.appName}>
            Mars <span className={styles.roverLink} onClick={handleRoverClick}>Rover</span>
          </h1>
          <p className={styles.tagline}>
            Ihr digitaler Begleiter für effizientes<br/>
            Gebietsmanagement und Marktbetreuung
          </p>
        </div>

        {/* Login Panel */}
        <div className={styles.loginPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Willkommen zurück</h2>
            <p className={styles.panelSubtitle}>Melden Sie sich an, um fortzufahren</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>E-Mail</label>
              <div className={styles.inputWrapper}>
                <User size={20} weight="regular" className={styles.inputIcon} />
                <input
                  type="email"
                  className={styles.input}
                  placeholder="ihre.email@beispiel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Passwort</label>
              <div className={styles.inputWrapper}>
                <Lock size={20} weight="regular" className={styles.inputIcon} />
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Ihr Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <span className={styles.loadingSpinner}></span>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Hidden Admin Login Modal */}
      {showAdminLogin && (
        <div className={styles.adminOverlay} onClick={() => setShowAdminLogin(false)}>
          <div className={styles.adminPanel} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.adminCloseButton}
              onClick={() => setShowAdminLogin(false)}
              aria-label="Schließen"
            >
              <X size={20} weight="bold" />
            </button>
            
            <div className={styles.adminHeader}>
              <ShieldCheck size={40} weight="duotone" className={styles.adminIcon} />
              <h2 className={styles.adminTitle}>Admin Zugang</h2>
              <p className={styles.adminSubtitle}>Nur für autorisiertes Personal</p>
            </div>

            <form onSubmit={handleAdminSubmit} className={styles.adminForm}>
              {adminError && (
                <div className={styles.errorMessage}>
                  {adminError}
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Admin E-Mail</label>
                <div className={styles.inputWrapper}>
                  <ShieldCheck size={20} weight="regular" className={styles.inputIcon} />
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="admin@mars-rover.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    disabled={isAdminLoading}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Admin Passwort</label>
                <div className={styles.inputWrapper}>
                  <Lock size={20} weight="regular" className={styles.inputIcon} />
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    disabled={isAdminLoading}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.adminSubmitButton}
                disabled={isAdminLoading || !adminEmail || !adminPassword}
              >
                {isAdminLoading ? (
                  <span className={styles.loadingSpinner}></span>
                ) : (
                  'Admin Login'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
