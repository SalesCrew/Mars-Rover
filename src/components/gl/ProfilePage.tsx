import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Envelope, 
  User,
  Storefront,
  TrendUp,
  Clock,
  CheckCircle,
  Receipt,
  ClipboardText,
  PencilSimple,
  FloppyDisk,
  Lock,
  Eye,
  EyeSlash,
  Check,
  X
} from '@phosphor-icons/react';
import Aurora from './Aurora';
import type { GLProfile } from '../../types/gl-types';
import { API_BASE_URL } from '../../config/database';
import styles from './ProfilePage.module.css';

interface ProfilePageProps {
  profile: GLProfile;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    address: profile.address,
    postalCode: profile.postalCode,
    city: profile.city,
    phone: profile.phone,
    email: profile.email,
  });

  // Password change state
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'current' | 'new'>('current');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Format creation date
  const createdDate = new Date(profile.createdAt);
  const formattedDate = createdDate.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });

  // Format month/year comparison - now from real data
  const monthChange = profile.monthChangePercent !== undefined 
    ? `${profile.monthChangePercent >= 0 ? '+' : ''}${profile.monthChangePercent}%` 
    : '+0%';
  
  const sellInChange = profile.sellInChangePercent !== undefined
    ? `${profile.sellInChangePercent >= 0 ? '+' : ''}${profile.sellInChangePercent}%`
    : '+0%';

  // Helper to get chain gradient color
  const getChainGradient = (chain: string) => {
    const chainColors: Record<string, string> = {
      'BILLA': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      'Spar': 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      'Merkur': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      'Hofer': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    };
    return chainColors[chain] || 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)';
  };

  // Format visit percentage - reserved for future stats display
  const _visitPercentage = Math.round((profile.monthlyVisits / profile.totalMarkets) * 100);
  void _visitPercentage;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // TODO: Save to backend/state management
    console.log('Saving profile data:', editedData);
    // Update the profile object (in real app, call API)
    Object.assign(profile, editedData);
    setIsEditing(false);
  };

  const handleChange = (field: keyof typeof editedData, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/gebietsleiter/${profile.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setPasswordError(data.error || 'Fehler beim Ändern des Passworts');
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Reset after 2 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
        setIsPasswordSectionOpen(false);
        setPasswordStep('current');
      }, 2000);
    } catch (error) {
      setPasswordError('Verbindungsfehler');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsPasswordSectionOpen(false);
    setPasswordStep('current');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
  };

  const handleCurrentPasswordSubmit = () => {
    if (currentPassword.length > 0) {
      setPasswordStep('new');
      setPasswordError('');
    }
  };

  return (
    <div className={styles.profileWrapper}>
      {/* Aurora Background */}
      <div className={styles.auroraBackground}>
        <Aurora
          colorStops={["#60A5FA", "#3B82F6", "#1E40AF"]}
          blend={0.6}
          amplitude={0.8}
          speed={0.3}
        />
      </div>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Profile Header Section */}
          <section className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              {profile.profilePictureUrl ? (
                <img 
                  src={profile.profilePictureUrl} 
                  alt={profile.name}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <User size={48} weight="regular" />
                </div>
              )}
            </div>
            <h1 className={styles.profileName}>{profile.name}</h1>
            <div className={styles.seitBadge}>
              Seit {formattedDate}
            </div>
          </section>

          {/* Contact Information Card */}
          <section className={styles.contactCard}>
            <button 
              className={styles.editButton} 
              aria-label="Profil bearbeiten"
              onClick={handleEdit}
              style={{ display: isEditing ? 'none' : 'flex' }}
            >
              <PencilSimple size={18} weight="regular" />
            </button>
            
            <div className={styles.contactRow}>
              <MapPin size={20} weight="regular" className={styles.contactIcon} />
              {isEditing ? (
                <div className={styles.editInputGroup}>
                  <input
                    type="text"
                    value={editedData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={styles.editInput}
                    placeholder="Straße und Hausnummer"
                  />
                  <div className={styles.editInputRow}>
                    <input
                      type="text"
                      value={editedData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      className={styles.editInputSmall}
                      placeholder="PLZ"
                    />
                    <input
                      type="text"
                      value={editedData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={styles.editInput}
                      placeholder="Stadt"
                    />
                  </div>
                </div>
              ) : (
                <span className={styles.contactText}>
                  {profile.address}, {profile.postalCode} {profile.city}
                </span>
              )}
            </div>
            
            <div className={styles.contactRow}>
              <Phone size={20} weight="regular" className={styles.contactIcon} />
              {isEditing ? (
                <input
                  type="tel"
                  value={editedData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={styles.editInput}
                  placeholder="Telefonnummer"
                />
              ) : (
                <a href={`tel:${profile.phone}`} className={styles.contactText}>
                  {profile.phone}
                </a>
              )}
            </div>
            
            <div className={styles.contactRow}>
              <Envelope size={20} weight="regular" className={styles.contactIcon} />
              {isEditing ? (
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={styles.editInput}
                  placeholder="E-Mail"
                />
              ) : (
                <a href={`mailto:${profile.email}`} className={styles.contactText}>
                  {profile.email}
                </a>
              )}
            </div>

            {isEditing && (
              <button 
                className={styles.saveButton}
                onClick={handleSave}
              >
                <FloppyDisk size={18} weight="bold" />
                <span>Speichern</span>
              </button>
            )}

            {/* Password Change Section */}
            <div className={styles.passwordSection}>
              {!isPasswordSectionOpen ? (
                <button 
                  className={styles.passwordTrigger}
                  onClick={() => setIsPasswordSectionOpen(true)}
                >
                  <Lock size={16} weight="regular" />
                  <span>Passwort ändern</span>
                </button>
              ) : passwordSuccess ? (
                <div className={styles.passwordSuccess}>
                  <Check size={20} weight="bold" />
                  <span>Passwort erfolgreich geändert</span>
                </div>
              ) : (
                <div className={styles.passwordForm}>
                  <div className={styles.passwordHeader}>
                    <Lock size={16} weight="regular" />
                    <span>Passwort ändern</span>
                    <button 
                      className={styles.passwordClose}
                      onClick={handleCancelPasswordChange}
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>

                  {passwordStep === 'current' ? (
                    <div className={styles.passwordInputGroup}>
                      <label className={styles.passwordLabel}>Aktuelles Passwort</label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={styles.passwordInput}
                          placeholder="••••••••"
                          onKeyDown={(e) => e.key === 'Enter' && handleCurrentPasswordSubmit()}
                        />
                        <button 
                          className={styles.passwordToggle}
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          type="button"
                        >
                          {showCurrentPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <button 
                        className={styles.passwordNext}
                        onClick={handleCurrentPasswordSubmit}
                        disabled={!currentPassword}
                      >
                        Weiter
                      </button>
                    </div>
                  ) : (
                    <div className={styles.passwordInputGroup}>
                      <div className={styles.passwordFieldGroup}>
                        <label className={styles.passwordLabel}>Neues Passwort</label>
                        <div className={styles.passwordInputWrapper}>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={styles.passwordInput}
                            placeholder="••••••••"
                          />
                          <button 
                            className={styles.passwordToggle}
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            type="button"
                          >
                            {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className={styles.passwordFieldGroup}>
                        <label className={styles.passwordLabel}>Passwort bestätigen</label>
                        <div className={styles.passwordInputWrapper}>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={styles.passwordInput}
                            placeholder="••••••••"
                          />
                          <button 
                            className={styles.passwordToggle}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            type="button"
                          >
                            {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {passwordError && (
                        <div className={styles.passwordError}>{passwordError}</div>
                      )}

                      <div className={styles.passwordActions}>
                        <button 
                          className={styles.passwordBack}
                          onClick={() => setPasswordStep('current')}
                        >
                          Zurück
                        </button>
                        <button 
                          className={styles.passwordSubmit}
                          onClick={handlePasswordChange}
                          disabled={!newPassword || !confirmPassword || isChangingPassword}
                        >
                          {isChangingPassword ? 'Wird geändert...' : 'Passwort ändern'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Statistics Grid */}
          <section className={styles.statsGrid}>
            {/* Card 1: Marktbesuche */}
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                <Storefront size={24} weight="fill" />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{profile.monthlyVisits}</div>
                <div className={styles.statLabel}>von {profile.totalMarkets} Märkten besucht</div>
                <div className={styles.statBadge}>
                  {monthChange} vs. Vormonat
                </div>
              </div>
            </div>

            {/* Card 2: Meist besuchter Markt */}
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)' }}>
                <TrendUp size={24} weight="fill" />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{profile.mostVisitedMarket.name}</div>
                <div className={styles.statLabel}>{profile.mostVisitedMarket.visitCount} Besuche</div>
                <div 
                  className={styles.chainBadge}
                  style={{ background: getChainGradient(profile.mostVisitedMarket.chain) }}
                >
                  {profile.mostVisitedMarket.chain}
                </div>
              </div>
            </div>

            {/* Card 3: Durchschnittliche Besuchsdauer */}
            <div className={`${styles.statCard} ${styles.statCardDisabled}`} style={{ position: 'relative' }}>
              <div className={styles.comingSoonLabel}>Coming Soon</div>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)' }}>
                <Clock size={24} weight="fill" />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{profile.averageVisitDuration} Min</div>
                <div className={styles.statLabel}>pro Marktbesuch</div>
              </div>
            </div>

            {/* Card 4: Sell-In Erfolgsquote */}
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}>
                <CheckCircle size={24} weight="fill" />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{profile.sellInSuccessRate}%</div>
                <div className={styles.statLabel}>erfolgreiche Vorbesteller</div>
                <div className={styles.statBadge}>
                  {sellInChange} vs. Vormonat
                </div>
              </div>
            </div>
          </section>

          {/* Performance Highlights */}
          <section className={styles.performanceHighlights}>
            <h2 className={styles.sectionTitle}>Dieser Monat</h2>
            <div className={styles.highlightPills}>
              <div className={styles.highlightPill} style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                <Receipt size={20} weight="fill" />
                <div className={styles.pillContent}>
                  <span className={styles.pillValue}>{profile.vorverkaufeCount ?? 0}</span>
                  <span className={styles.pillLabel}>Vorverkäufe</span>
                </div>
              </div>
              <div className={styles.highlightPill} style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}>
                <ClipboardText size={20} weight="fill" />
                <div className={styles.pillContent}>
                  <span className={styles.pillValue}>{profile.vorbestellerCount ?? 0}</span>
                  <span className={styles.pillLabel}>Vorbesteller</span>
                </div>
              </div>
              <div className={styles.highlightPill} style={{ background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)' }}>
                <ClipboardText size={20} weight="fill" />
                <div className={styles.pillContent}>
                  <span className={styles.pillValue}>{profile.produkttauschCount ?? 0}</span>
                  <span className={styles.pillLabel}>Produkttausch</span>
                </div>
              </div>
            </div>
          </section>

          {/* Top Markets */}
          <section className={styles.topMarkets}>
            <h2 className={styles.sectionTitle}>Meine Top 3 Märkte</h2>
            <div className={styles.marketsList}>
              {(!profile.topMarkets || profile.topMarkets.length === 0) ? (
                <div className={styles.emptyState}>
                  <span>Noch keine Marktbesuche</span>
                </div>
              ) : profile.topMarkets.map((market, index) => {
                const maxVisits = profile.topMarkets[0].visitCount;
                const barWidth = (market.visitCount / maxVisits) * 100;
                const lastVisitDate = new Date(market.lastVisit);
                const formattedLastVisit = lastVisitDate.toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });

                return (
                  <div key={market.id} className={styles.marketItem}>
                    <div className={styles.marketRank}>#{index + 1}</div>
                    <div className={styles.marketInfo}>
                      <div className={styles.marketHeader}>
                        <div 
                          className={styles.marketChainBadge}
                          style={{ background: getChainGradient(market.chain) }}
                        >
                          {market.chain}
                        </div>
                        <h3 className={styles.marketName}>{market.name}</h3>
                      </div>
                      <p className={styles.marketAddress}>{market.address}</p>
                      <div className={styles.marketStats}>
                        <div className={styles.visitCountContainer}>
                          <span className={styles.visitCount}>{market.visitCount} Besuche</span>
                          <div className={styles.visitBar}>
                            <div 
                              className={styles.visitBarFill} 
                              style={{ 
                                width: `${barWidth}%`,
                                background: getChainGradient(market.chain)
                              }}
                            />
                          </div>
                        </div>
                        <span className={styles.lastVisit}>Letzter Besuch: {formattedLastVisit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

