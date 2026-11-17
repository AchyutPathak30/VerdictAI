/**
 * VerdictAI Mobile Authentication & Session Service
 * Manages active cardholder identity, credentials verification,
 * and integration with FastAPI /auth/login & /auth/register endpoints.
 */

import apiClient, { setAuthToken } from './apiClient';

export interface AppUser {
  userId: string;
  fullName: string;
  email: string;
  password?: string;
  cardLast4: string;
  cardType: string;
  creditScore: string;
  memberSince: string;
}

export const DEFAULT_USER: AppUser = {
  userId: 'usr_pooja_01',
  fullName: 'Pooja Iyer',
  email: 'pooja.iyer@gmail.com',
  password: 'VerdictAI@2026',
  cardLast4: '4492',
  cardType: 'HDFC RuPay Platinum',
  creditScore: '812 (Excellent)',
  memberSince: 'March 2021',
};

const STORAGE_SESSION_KEY = 'verdictai_active_session_v1';
const STORAGE_USERS_KEY = 'verdictai_registered_users_v1';

let inMemoryCurrentUser: AppUser = DEFAULT_USER;

const getStorage = () => {
  return typeof globalThis !== 'undefined' ? (globalThis as any).localStorage : null;
};

export const getRegisteredUsers = (): AppUser[] => {
  const store = getStorage();
  if (store) {
    try {
      const raw = store.getItem(STORAGE_USERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return [DEFAULT_USER];
};

export const saveRegisteredUsers = (users: AppUser[]) => {
  const store = getStorage();
  if (store) {
    try {
      store.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch {}
  }
};

export const getCurrentUser = (): AppUser => {
  const store = getStorage();
  if (store) {
    try {
      const raw = store.getItem(STORAGE_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.userId) {
          inMemoryCurrentUser = parsed;
          return parsed;
        }
      }
    } catch {}
  }
  return inMemoryCurrentUser;
};

export const setCurrentUser = (user: AppUser) => {
  inMemoryCurrentUser = user;
  const store = getStorage();
  if (store) {
    try {
      store.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    } catch {}
  }
};

/** Authenticate user with email and password */
export const loginUser = async (emailInput: string, passwordInput: string): Promise<AppUser> => {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }

  // 1. Try Live Backend API authentication
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });

    if (response.data && response.data.user) {
      const backendUser = response.data.user;
      const registered = getRegisteredUsers();
      const localMatch = registered.find(u => u.email.toLowerCase() === email);

      const resolvedUser: AppUser = {
        userId: backendUser.user_id,
        fullName: backendUser.full_name || 'Cardholder',
        email: backendUser.email,
        password,
        cardLast4: localMatch?.cardLast4 || '4492',
        cardType: localMatch?.cardType || 'HDFC RuPay Platinum',
        creditScore: localMatch?.creditScore || '795 (Good)',
        memberSince: localMatch?.memberSince || 'Nov 2026',
      };

      if (response.data.access_token) {
        await setAuthToken(response.data.access_token);
      }

      setCurrentUser(resolvedUser);
      return resolvedUser;
    }
  } catch (err: any) {
    // If backend returned HTTP 401 Unauthorized or 400 Bad Request, respect rejection!
    if (err.response?.status === 401 || err.response?.status === 400 || err.response?.status === 422) {
      throw new Error(err.response?.data?.detail || 'Invalid email or password. Please verify your credentials.');
    }
    // If network was completely offline, check offline registered store
  }

  // 2. Offline / local fallback check
  const registered = getRegisteredUsers();
  const matched = registered.find(u => u.email.toLowerCase() === email);

  if (!matched) {
    throw new Error('Invalid email or password. Please verify your credentials.');
  }

  if (matched.password && matched.password !== password) {
    throw new Error('Invalid email or password. Please verify your credentials.');
  }

  setCurrentUser(matched);
  return matched;
};

/** Register a new consumer cardholder account */
export const registerUser = async (payload: {
  fullName: string;
  email: string;
  password: string;
  cardLast4?: string;
}): Promise<AppUser> => {
  const fullName = payload.fullName.trim();
  const email = payload.email.trim().toLowerCase();
  const password = payload.password.trim();
  const cardLast4 = payload.cardLast4?.trim() || '4492';

  if (!fullName || !email || !password) {
    throw new Error('Please fill in all required registration fields.');
  }

  const registered = getRegisteredUsers();
  if (registered.some(u => u.email.toLowerCase() === email)) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const generatedUserId = `usr_${email.split('@')[0]}_${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser: AppUser = {
    userId: generatedUserId,
    fullName,
    email,
    password,
    cardLast4,
    cardType: `RuPay Platinum •••• ${cardLast4}`,
    creditScore: '780 (Good)',
    memberSince: 'Nov 2026',
  };

  // Try to register on live backend
  try {
    const response = await apiClient.post('/auth/register/cardholder', {
      full_name: fullName,
      email,
      phone: '9876543210',
      password,
      card_network: 'RuPay Platinum',
    });
    if (response.data?.user?.user_id) {
      newUser.userId = response.data.user.user_id;
    }
    if (response.data?.access_token) {
      await setAuthToken(response.data.access_token);
    }
  } catch (err) {
    console.warn('[VerdictAI] Backend registration offline, saved to client database.');
  }

  // Save to registered store and set active session
  registered.push(newUser);
  saveRegisteredUsers(registered);
  setCurrentUser(newUser);

  return newUser;
};

export const logoutUser = async () => {
  await setAuthToken('');
  setCurrentUser(DEFAULT_USER);
  const store = getStorage();
  if (store) {
    try {
      store.removeItem(STORAGE_SESSION_KEY);
    } catch {}
  }
};
