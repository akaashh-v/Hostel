import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, Admin } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  student: Student | null;
  admin: Admin | null;
  isLoading: boolean;
  activePortal: 'student' | 'admin';
  setActivePortal: (portal: 'student' | 'admin') => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  studentLogin: (phone: string, pass: string) => Promise<boolean>;
  studentRegister: (name: string, phone: string, pass: string, room?: string) => Promise<boolean>;
  adminLogin: (user: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem('mess_student_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [admin, setAdmin] = useState<Admin | null>(() => {
    try {
      const saved = localStorage.getItem('mess_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePortal, setActivePortal] = useState<'student' | 'admin'>('student');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { success, error } = useToast();

  const refreshSession = useCallback(async () => {
    try {
      // Check admin session first if path has admin or portal is admin
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        try {
          const res = await api.getAdminSession();
          if (res.authenticated && res.admin) {
            setAdmin(res.admin);
            localStorage.setItem('mess_admin_user', JSON.stringify(res.admin));
            setActivePortal('admin');
            setIsLoading(false);
            return;
          }
        } catch {
          // not logged in as admin
        }
      }

      // Check student session
      try {
        const studentRes = await api.getStudentSession();
        if (studentRes.authenticated && studentRes.student) {
          setStudent(studentRes.student);
          localStorage.setItem('mess_student_user', JSON.stringify(studentRes.student));
          setActivePortal('student');
          setIsLoading(false);
          return;
        } else if (studentRes && studentRes.authenticated === false) {
          localStorage.removeItem('mess_student_user');
          setStudent(null);
        }
      } catch (err: any) {
        if (err?.message?.includes('401') || err?.message?.includes('deactivated')) {
          localStorage.removeItem('mess_student_user');
          setStudent(null);
        }
      }

      // If student not found, try admin
      try {
        const adminRes = await api.getAdminSession();
        if (adminRes.authenticated && adminRes.admin) {
          setAdmin(adminRes.admin);
          localStorage.setItem('mess_admin_user', JSON.stringify(adminRes.admin));
          setActivePortal('admin');
          setIsLoading(false);
          return;
        }
      } catch {
        // not admin
      }
    } catch {
      // no session
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const studentLogin = async (phone: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.loginStudent(phone, pass);
      if (res.token) {
        localStorage.setItem('mess_session_token', res.token);
      }
      if (res.student) {
        localStorage.setItem('mess_student_user', JSON.stringify(res.student));
      }
      setStudent(res.student);
      setActivePortal('student');
      success(`Welcome back, ${res.student.full_name}!`);
      return true;
    } catch (err: any) {
      error(err.message || 'Login failed. Please check your credentials.');
      return false;
    }
  };

  const studentRegister = async (name: string, phone: string, pass: string, room?: string): Promise<boolean> => {
    try {
      const res = await api.registerStudent(name, phone, pass, room);
      if (res.token) {
        localStorage.setItem('mess_session_token', res.token);
      }
      if (res.student) {
        localStorage.setItem('mess_student_user', JSON.stringify(res.student));
      }
      setStudent(res.student);
      setActivePortal('student');
      success(`Welcome to TASTEBOX MEALS CO., ${res.student.full_name}! Account verified.`);
      return true;
    } catch (err: any) {
      error(err.message || 'Registration failed. Phone number may already be registered.');
      return false;
    }
  };

  const adminLogin = async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.loginAdmin(user, pass);
      if (res.token) {
        localStorage.setItem('mess_session_token', res.token);
      }
      if (res.admin) {
        localStorage.setItem('mess_admin_user', JSON.stringify(res.admin));
      }
      setAdmin(res.admin);
      setActivePortal('admin');
      success(`Logged in as Administrator (${res.admin.full_name})`);
      return true;
    } catch (err: any) {
      error(err.message || 'Admin login failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('mess_session_token');
      localStorage.removeItem('mess_student_user');
      localStorage.removeItem('mess_admin_user');
      setStudent(null);
      setAdmin(null);
      setActivePortal('student');
      success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        admin,
        isLoading,
        activePortal,
        setActivePortal,
        authMode,
        setAuthMode,
        studentLogin,
        studentRegister,
        adminLogin,
        logout,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
