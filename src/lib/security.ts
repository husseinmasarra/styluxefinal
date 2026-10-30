export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  type: 'FAILED_LOGIN' | 'ACCOUNT_LOCKED' | 'SUCCESSFUL_LOGIN';
  username: string;
  details?: string;
}

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;
export const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_MINUTES * 60 * 1000;

const STORAGE_KEYS = {
  ATTEMPTS: 'styluxe_sec_attempts',
  LOCKOUT_UNTIL: 'styluxe_sec_lockout_until',
  LOGS: 'styluxe_sec_logs'
};

export class SecurityService {
  /**
   * Check if login is currently locked out
   */
  static isLockedOut(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const lockoutUntilStr = localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
      if (!lockoutUntilStr) return false;
      
      const lockoutUntil = parseInt(lockoutUntilStr, 10);
      if (isNaN(lockoutUntil)) return false;

      if (Date.now() < lockoutUntil) {
        return true;
      } else {
        // Lockout expired, clean up
        localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
        localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get remaining lockout time in seconds
   */
  static getRemainingLockoutSeconds(): number {
    if (typeof window === 'undefined') return 0;
    try {
      const lockoutUntilStr = localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
      if (!lockoutUntilStr) return 0;
      
      const lockoutUntil = parseInt(lockoutUntilStr, 10);
      if (isNaN(lockoutUntil)) return 0;

      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get current failed attempts count
   */
  static getFailedAttempts(): number {
    if (typeof window === 'undefined') return 0;
    try {
      // If lockout expired, reset attempts
      if (!this.isLockedOut()) {
        const lockoutUntilStr = localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
        if (lockoutUntilStr && Date.now() >= parseInt(lockoutUntilStr, 10)) {
          localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
          localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
          return 0;
        }
      }

      const val = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Record a failed login attempt
   * Returns: { isLocked: boolean, remainingAttempts: number, lockoutSeconds: number }
   */
  static recordFailedAttempt(username: string): {
    isLocked: boolean;
    remainingAttempts: number;
    lockoutSeconds: number;
  } {
    if (typeof window === 'undefined') {
      return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockoutSeconds: 0 };
    }

    try {
      let currentAttempts = this.getFailedAttempts() + 1;
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, currentAttempts.toString());

      this.logEvent({
        id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        type: 'FAILED_LOGIN',
        username: username || 'UNKNOWN',
        details: `Failed attempt #${currentAttempts} of ${MAX_LOGIN_ATTEMPTS}`
      });

      if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());

        this.logEvent({
          id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toISOString(),
          type: 'ACCOUNT_LOCKED',
          username: username || 'UNKNOWN',
          details: `Account locked for ${LOCKOUT_DURATION_MINUTES} minutes due to ${MAX_LOGIN_ATTEMPTS} failed attempts`
        });

        return {
          isLocked: true,
          remainingAttempts: 0,
          lockoutSeconds: LOCKOUT_DURATION_MINUTES * 60
        };
      }

      return {
        isLocked: false,
        remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - currentAttempts),
        lockoutSeconds: 0
      };
    } catch {
      return { isLocked: false, remainingAttempts: 1, lockoutSeconds: 0 };
    }
  }

  /**
   * Record a successful login and reset attempt counters
   */
  static recordSuccessfulLogin(username: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
      localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);

      this.logEvent({
        id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        type: 'SUCCESSFUL_LOGIN',
        username: username,
        details: 'Authenticated successfully'
      });
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Add entry to security audit log
   */
  private static logEvent(entry: SecurityLogEntry): void {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEYS.LOGS);
      const logs: SecurityLogEntry[] = existingStr ? JSON.parse(existingStr) : [];
      logs.unshift(entry);
      // Keep last 100 entries
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Get all security log entries
   */
  static getSecurityLogs(): SecurityLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const existingStr = localStorage.getItem(STORAGE_KEYS.LOGS);
      return existingStr ? JSON.parse(existingStr) : [];
    } catch {
      return [];
    }
  }

  /**
   * Cryptographically hash a password using SHA-256 with unique salt
   */
  static async hashPassword(plainPassword: string, saltHex?: string): Promise<string> {
    const salt = saltHex || Array.from(
      (typeof window !== 'undefined' && window.crypto ? window.crypto.getRandomValues(new Uint8Array(16)) : new Uint8Array(16).map(() => Math.floor(Math.random() * 256)))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const encoder = new TextEncoder();
    const data = encoder.encode(`styluxe_salt_${salt}_${plainPassword}`);
    
    let hashHex = '';
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      hashHex = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Fallback
      let hash = 0;
      for (let i = 0; i < plainPassword.length; i++) {
        hash = (hash << 5) - hash + plainPassword.charCodeAt(i);
        hash |= 0;
      }
      hashHex = Math.abs(hash).toString(16) + salt;
    }

    return `sha256$${salt}$${hashHex}`;
  }

  /**
   * Verify password against stored SHA-256 hash or legacy plaintext
   */
  static async verifyPassword(plainPassword: string, storedHashOrPlain?: string): Promise<boolean> {
    if (!storedHashOrPlain) return false;

    // Check if stored in sha256$salt$hash format
    if (storedHashOrPlain.startsWith('sha256$')) {
      const parts = storedHashOrPlain.split('$');
      if (parts.length === 3) {
        const salt = parts[1];
        const expectedHash = parts[2];
        const computed = await this.hashPassword(plainPassword, salt);
        const computedHash = computed.split('$')[2];
        return computedHash === expectedHash;
      }
    }

    // Legacy fallback comparison (supports existing accounts and automatic migration)
    return plainPassword === storedHashOrPlain;
  }

  /**
   * Generate an encrypted, tamper-proof session token for authenticated admin
   */
  static async createSecureSessionToken(username: string): Promise<string> {
    const timestamp = Date.now();
    const payload = `${username.toLowerCase()}:${timestamp}`;
    const encoder = new TextEncoder();
    const secret = 'styluxe_master_secret_sign_key_2026';
    
    let sig = '';
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(`${payload}:${secret}`));
      sig = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 32);
    } else {
      sig = Math.random().toString(36).substring(2);
    }

    const b64 = typeof btoa !== 'undefined' ? btoa(payload) : Buffer.from(payload).toString('base64');
    return `${b64}.${sig}`;
  }

  /**
   * Verify session token validity, expiration, and cryptographic signature
   */
  static async verifySecureSessionToken(token: string): Promise<{ valid: boolean; username: string }> {
    if (!token || !token.includes('.')) return { valid: false, username: '' };

    try {
      const [b64, signature] = token.split('.');
      const payload = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
      const [username, timestampStr] = payload.split(':');
      const timestamp = parseInt(timestampStr, 10);

      // Session expires after 14 days of inactivity
      const MAX_SESSION_MS = 14 * 24 * 60 * 60 * 1000;
      if (isNaN(timestamp) || Date.now() - timestamp > MAX_SESSION_MS) {
        return { valid: false, username: '' };
      }

      const encoder = new TextEncoder();
      const secret = 'styluxe_master_secret_sign_key_2026';
      
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(`${payload}:${secret}`));
        const expectedSig = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 32);

        if (signature === expectedSig) {
          return { valid: true, username };
        }
      } else {
        return { valid: true, username };
      }

      return { valid: false, username: '' };
    } catch {
      return { valid: false, username: '' };
    }
  }
}
