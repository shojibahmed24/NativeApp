import { registerForPushNotificationsAsync } from '../services/pushService';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  const initApp = async () => {
    try {
      await api.init();
      
      let devId = await AsyncStorage.getItem('unicom_dev_id');
      if (!devId) {
        devId = 'mobile_primary_session_' + Math.random().toString(36).substring(7);
        await AsyncStorage.setItem('unicom_dev_id', devId);
      }
      setDeviceId(devId);

      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await api.getProfile();
      setUser(res.user);
      const seen = await AsyncStorage.getItem('has_seen_onboarding');
      if (seen === 'true') setHasSeenOnboarding(true);
    registerForPushNotificationsAsync();
    } catch (err: any) {
      if (err.code === 'DEVICE_SESSION_TERMINATED') {
        setSessionError('Your account was logged in on another device. UNICOM allows 1 primary active device for security.');
      }
      api.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const checkUser = async (phone: string) => {
    return await api.checkUser(phone);
  };

  const loginWithPhone = async (phone: string, mode: string) => {
    return await api.requestOtp(phone, mode);
  };

  const verifyOtp = async (phone: string, code: string, isRecovery: boolean = false) => {
    let currentDeviceId = deviceId;
    if (!currentDeviceId) {
      currentDeviceId = 'mobile_primary_session_' + Math.random().toString(36).substring(7);
      await AsyncStorage.setItem('unicom_dev_id', currentDeviceId);
      setDeviceId(currentDeviceId);
    }
    const res = await api.verifyOtp(phone, code, currentDeviceId);
    if (!res.isNewUser) {
      // Existing user: set token and user
      if (res.token) {
        await api.setToken(res.token);
      }
      if (res.user) {
        setUser(res.user);
        setSessionError(null);
      }
    }
    // New user: don't set anything, let setup-profile handle it
    return res;
  };

  const registerWithPassword = async (phone: string, name: string, password: string, registrationToken: string) => {
    let currentDeviceId = deviceId;
    if (!currentDeviceId) {
      currentDeviceId = 'mobile_primary_session_' + Math.random().toString(36).substring(7);
      await AsyncStorage.setItem('unicom_dev_id', currentDeviceId);
      setDeviceId(currentDeviceId);
    }
    const res = await api.registerWithPassword(phone, name, password, registrationToken, currentDeviceId);
    await api.setToken(res.token);
    setUser(res.user);
    setSessionError(null);
    return res;
  };

  const loginWithPassword = async (phone: string, password: string) => {
    let currentDeviceId = deviceId;
    if (!currentDeviceId) {
      currentDeviceId = 'mobile_primary_session_' + Math.random().toString(36).substring(7);
      await AsyncStorage.setItem('unicom_dev_id', currentDeviceId);
      setDeviceId(currentDeviceId);
    }
    const res = await api.loginWithPassword(phone, password, currentDeviceId);
    await api.setToken(res.token);
    setUser(res.user);
    setSessionError(null);
    return res;
  };

  const loginWithFirebase = async (idToken: string) => {
    let currentDeviceId = deviceId;
    if (!currentDeviceId) {
      currentDeviceId = 'mobile_primary_session_' + Math.random().toString(36).substring(7);
      await AsyncStorage.setItem('unicom_dev_id', currentDeviceId);
      setDeviceId(currentDeviceId);
    }
    const res = await api.verifyFirebaseToken(idToken, currentDeviceId);
    await api.setToken(res.token);
    setUser(res.user);
    setSessionError(null);
    return res;
  };


  const updateUserProfile = async (profileData: any) => {
    const res = await api.updateProfile(profileData);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await api.clearToken();
    setUser(null);
  };

  const deleteAccount = async () => {
    await api.deleteAccount();
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        deviceId,
        checkUser,
        loginWithPhone,
        verifyOtp,
        registerWithPassword,
        loginWithPassword,
        loginWithFirebase,
        updateUserProfile,
        logout,
        deleteAccount,
        refreshUser: initApp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
