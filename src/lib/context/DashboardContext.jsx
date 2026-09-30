'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getTools } from '../api/tools';
import { addReputation } from '../api/auth';
import { getTierInfo, DEFAULT_REQUESTS, DEFAULT_BORROWS } from '../constants';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { user, token, updateUser } = useAuth();

  const [tools, setTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [borrowedTools, setBorrowedTools] = useState([]);
  const [updatingReputation, setUpdatingReputation] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchTools = useCallback(async () => {
    if (!token || !user) return;
    setToolsLoading(true);
    try {
      const data = await getTools(token);
      if (data && data.tools) {
        setTools(data.tools);
      } else {
        const saved = localStorage.getItem(`tooltrunk_tools_${user.id}`);
        if (saved) setTools(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem(`tooltrunk_tools_${user.id}`);
      if (saved) setTools(JSON.parse(saved));
    } finally {
      setToolsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  useEffect(() => {
    if (!user) return;
    const storageKeyReqs = `tooltrunk_reqs_${user.id}`;
    const storageKeyBorrows = `tooltrunk_borrows_${user.id}`;

    const savedReqs = localStorage.getItem(storageKeyReqs);
    const savedBorrows = localStorage.getItem(storageKeyBorrows);

    if (savedReqs) {
      setPendingRequests(JSON.parse(savedReqs));
    } else {
      setPendingRequests(DEFAULT_REQUESTS);
      localStorage.setItem(storageKeyReqs, JSON.stringify(DEFAULT_REQUESTS));
    }

    if (savedBorrows) {
      setBorrowedTools(JSON.parse(savedBorrows));
    } else {
      setBorrowedTools(DEFAULT_BORROWS);
      localStorage.setItem(storageKeyBorrows, JSON.stringify(DEFAULT_BORROWS));
    }
  }, [user]);

  const saveRequestsState = useCallback((updatedReqs) => {
    if (!user) return;
    setPendingRequests(updatedReqs);
    localStorage.setItem(`tooltrunk_reqs_${user.id}`, JSON.stringify(updatedReqs));
  }, [user]);

  const saveBorrowsState = useCallback((updatedBorrows) => {
    if (!user) return;
    setBorrowedTools(updatedBorrows);
    localStorage.setItem(`tooltrunk_borrows_${user.id}`, JSON.stringify(updatedBorrows));
  }, [user]);

  const handleAddReputation = useCallback(async (desc, pts) => {
    if (!token) return;
    setUpdatingReputation(true);
    try {
      const data = await addReputation(token, desc, pts);
      if (data && data.user) {
        updateUser(data.user);
        showToast(`Reputation ledger updated: ${pts >= 0 ? '+' : ''}${pts} pts!`);
      }
    } catch (err) {
      showToast(err.message || 'Error writing to reputation ledger.', 'error');
    } finally {
      setUpdatingReputation(false);
    }
  }, [token, updateUser, showToast]);

  const tierInfo = useMemo(() => {
    return getTierInfo(user?.reputation || 0);
  }, [user?.reputation]);

  const stats = useMemo(() => ({
    totalTools: tools.length,
    activeLends: tools.filter((t) => t.status === 'lent').length,
    itemsBorrowed: borrowedTools.length,
  }), [tools, borrowedTools]);

  return (
    <DashboardContext.Provider
      value={{
        tools,
        setTools,
        toolsLoading,
        fetchTools,
        pendingRequests,
        saveRequestsState,
        borrowedTools,
        saveBorrowsState,
        handleAddReputation,
        updatingReputation,
        toast,
        showToast,
        tierInfo,
        stats,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
