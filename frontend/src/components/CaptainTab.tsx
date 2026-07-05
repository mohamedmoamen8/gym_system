import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Clock, LogIn, LogOut, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface Captain {
  id: string;
  name: string;
  photoPath: string | null;
  status: string;
}

interface CaptainLog {
  id: string;
  captain: Captain;
  clockInTime: string;
  clockOutTime: string | null;
  hoursWorked: number | null;
}

interface ClockEvent {
  status: 'IN' | 'OUT';
  message: string;
  captain: Captain;
  hours?: number;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CaptainTab() {
  const [accessCode, setAccessCode] = useState('');
  const [clockEvent, setClockEvent] = useState<ClockEvent | null>(null);
  const [clockError, setClockError] = useState<string | null>(null);
  const [clockLoading, setClockLoading] = useState(false);

  const [logs, setLogs] = useState<CaptainLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetch('/api/staff/logs/today');
      if (!res.ok) throw new Error('Failed to load roster');
      const data: CaptainLog[] = await res.json();
      setLogs(data);
    } catch (err: any) {
      setLogsError(err.message ?? 'Could not load roster');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClockTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setClockLoading(true);
    setClockError(null);
    setClockEvent(null);

    try {
      const res = await fetch('/api/staff/clock-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setClockError(body.message ?? 'Clock trigger failed');
        return;
      }

      setClockEvent(body as ClockEvent);
      setAccessCode('');
      // Refresh the roster after a successful clock event
      fetchLogs();
    } catch {
      setClockError('Could not reach the server. Check your connection.');
    } finally {
      setClockLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-stone-100">
          Captain Station
        </h1>
        <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">
          Staff clock-in / clock-out and today's duty roster.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock trigger panel */}
        <div className="lg:col-span-1 space-y-4">
          <form
            onSubmit={handleClockTrigger}
            className="bg-stone-900 border border-stone-800 rounded p-5 space-y-4"
          >
            <div>
              <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-stone-400">
                Access Code
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setClockError(null);
                }}
                placeholder="Enter access code..."
                className="w-full bg-black border border-stone-800 rounded font-mono p-3 text-xs tracking-widest focus:outline-none focus:border-red-600 text-stone-100 placeholder-stone-700"
              />
            </div>

            {clockError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded p-3">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-[10px] font-bold">{clockError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={clockLoading || !accessCode.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-3 rounded text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2"
            >
              {clockLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Clock size={14} />
              )}
              {clockLoading ? 'Processing...' : 'Trigger Shift'}
            </button>
          </form>

          {/* Clock event result */}
          {clockEvent && (
            <div className="bg-stone-900 border border-red-600/30 rounded p-4 text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-red-600 text-black font-black text-[9px] px-2 py-0.5 uppercase tracking-widest">
                Shift Event
              </div>

              {clockEvent.captain.photoPath ? (
                <img
                  src={`/uploads/${clockEvent.captain.photoPath}`}
                  alt="Staff"
                  className="w-24 h-24 object-cover rounded-full mx-auto border-2 border-red-600 shadow-md shadow-red-600/20 mt-3"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto border-2 border-stone-700 bg-stone-800 flex items-center justify-center mt-3">
                  <Shield size={28} className="text-stone-600" />
                </div>
              )}

              <div>
                <h3 className="text-sm font-black tracking-tight uppercase text-stone-100">
                  {clockEvent.captain.name}
                </h3>
                <p className="text-stone-500 text-[10px] font-mono mt-0.5">
                  {new Date().toLocaleTimeString()}
                </p>
                {clockEvent.hours !== undefined && (
                  <p className="text-stone-400 text-[10px] mt-1">
                    Shift duration: <span className="text-white font-bold">{clockEvent.hours}h</span>
                  </p>
                )}
              </div>

              <div
                className={`py-2 rounded border flex items-center justify-center gap-1.5 text-xs font-bold ${
                  clockEvent.status === 'IN'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-stone-800 border-stone-700 text-stone-300'
                }`}
              >
                {clockEvent.status === 'IN' ? <LogIn size={14} /> : <LogOut size={14} />}
                {clockEvent.status === 'IN' ? 'Clocked In' : 'Clocked Out'}
              </div>
            </div>
          )}
        </div>

        {/* Today's roster */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black tracking-widest text-red-500 uppercase">
                Today's Duty Roster
              </h2>
              <p className="text-[11px] text-stone-500 uppercase tracking-wider mt-0.5">
                All shift events for today.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="text-stone-500 hover:text-stone-300 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw size={14} className={logsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {logsError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded p-3">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-[10px] font-bold">{logsError}</p>
            </div>
          )}

          {logsLoading ? (
            <div className="flex items-center justify-center py-12 text-stone-600">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-xs uppercase tracking-widest">Loading roster...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-stone-700">
              <Shield className="mx-auto mb-3 text-stone-800" size={36} />
              <p className="text-xs uppercase tracking-widest font-bold">No shifts recorded today</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-black border border-stone-800 rounded p-3 flex items-center justify-between hover:border-stone-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {log.captain.photoPath ? (
                      <img
                        src={`/uploads/${log.captain.photoPath}`}
                        alt="Captain"
                        className="w-10 h-10 object-cover rounded border border-stone-800 grayscale shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded border border-stone-800 bg-stone-900 flex items-center justify-center shrink-0">
                        <Shield size={14} className="text-stone-600" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-black text-stone-200 uppercase tracking-wider">
                        {log.captain.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-mono">
                        IN: {formatTime(log.clockInTime)}
                        {' // '}
                        OUT: {log.clockOutTime ? formatTime(log.clockOutTime) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase text-stone-500 block font-bold tracking-widest">
                      Duration
                    </span>
                    <span
                      className={`text-sm font-black font-mono ${
                        log.clockOutTime ? 'text-stone-300' : 'text-red-500 animate-pulse'
                      }`}
                    >
                      {log.hoursWorked !== null ? `${log.hoursWorked}h` : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
