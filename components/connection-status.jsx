"use client";

import { useState, useEffect } from 'react';
import { dbMonitor } from '@/lib/db-monitor';

export default function ConnectionStatus() {
  const [status, setStatus] = useState({ connected: true, error: null });

  useEffect(() => {
    const handleStatusChange = (newStatus) => {
      setStatus(newStatus);
    };

    dbMonitor.addListener(handleStatusChange);
    
    // Get initial status
    setStatus(dbMonitor.getStatus());

    return () => {
      dbMonitor.removeListener(handleStatusChange);
    };
  }, []);

  if (status.connected) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-300 rounded-lg p-3 shadow-lg max-w-sm">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-red-800 font-medium text-sm">
          Database Connection Issue
        </span>
      </div>
      {status.error && (
        <p className="text-red-600 text-xs mt-1 truncate" title={status.error}>
          {status.error}
        </p>
      )}
      {status.attempts > 0 && (
        <p className="text-red-500 text-xs mt-1">
          Retrying... (Attempt {status.attempts})
        </p>
      )}
    </div>
  );
}
