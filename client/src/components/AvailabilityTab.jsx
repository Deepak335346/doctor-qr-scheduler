import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, Trash2 } from 'lucide-react';
import { authFetch } from '../utils/api.js';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AvailabilityTab() {
  const [config, setConfig] = useState(null);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New override form
  const [newOverride, setNewOverride] = useState(() => ({
    date: new Date().toISOString().split('T')[0],
    type: 'blocked_day',
    time: '11:00 AM',
    reason: ''
  }));

  // Fetch schedule config and overrides
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCfg, resOv] = await Promise.all([
        authFetch('/api/schedule/config'),
        authFetch('/api/overrides')
      ]);
      const cfgData = await resCfg.json();
      const ovData = await resOv.json();
      setConfig(cfgData);
      setOverrides(Array.isArray(ovData) ? ovData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save weekly configuration
  const handleSaveConfig = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await authFetch('/api/schedule/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle day
  const handleToggleDay = (day) => {
    setConfig(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          enabled: !prev.days[day]?.enabled,
          shifts: prev.days[day]?.shifts?.length ? prev.days[day].shifts : [{ start: "09:00", end: "13:00" }]
        }
      }
    }));
  };

  // Update shift times
  const handleUpdateShift = (day, shiftIndex, field, value) => {
    setConfig(prev => {
      const currentShifts = [...(prev.days[day]?.shifts || [])];
      currentShifts[shiftIndex] = {
        ...currentShifts[shiftIndex],
        [field]: value
      };
      return {
        ...prev,
        days: {
          ...prev.days,
          [day]: {
            ...prev.days[day],
            shifts: currentShifts
          }
        }
      };
    });
  };

  // Add shift to day
  const handleAddShift = (day) => {
    setConfig(prev => {
      const currentShifts = [...(prev.days[day]?.shifts || [])];
      currentShifts.push({ start: "16:00", end: "20:00" });
      return {
        ...prev,
        days: {
          ...prev.days,
          [day]: {
            ...prev.days[day],
            shifts: currentShifts
          }
        }
      };
    });
  };

  // Remove shift from day
  const handleRemoveShift = (day, shiftIndex) => {
    setConfig(prev => {
      const currentShifts = prev.days[day]?.shifts?.filter((_, i) => i !== shiftIndex) || [];
      return {
        ...prev,
        days: {
          ...prev.days,
          [day]: {
            ...prev.days[day],
            shifts: currentShifts
          }
        }
      };
    });
  };

  // Add new override (block day / slot)
  const handleAddOverride = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOverride)
      });
      if (res.ok) {
        setNewOverride({
          date: new Date().toISOString().split('T')[0],
          type: 'blocked_day',
          time: '11:00 AM',
          reason: ''
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove override
  const handleRemoveOverride = async (id) => {
    try {
      const res = await authFetch(`/api/overrides/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !config) {
    return <div className="text-center py-12 text-slate-400 text-sm">Loading availability settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Slot Duration & Settings */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Consultation Slot Settings</h2>
            <p className="text-xs text-slate-500">Configure appointment interval and patient capacity per slot.</p>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            {saving ? 'Saving...' : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <span>Save Schedule Changes</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Slot Duration (Minutes per Patient)
            </label>
            <select
              value={config.slotDuration || 20}
              onChange={(e) => setConfig({ ...config, slotDuration: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="15">15 Minutes (Fast Consultations)</option>
              <option value="20">20 Minutes (Standard Medical Practice)</option>
              <option value="30">30 Minutes (Comprehensive Checkups)</option>
              <option value="45">45 Minutes (Specialist / Surgery Consult)</option>
              <option value="60">60 Minutes (Long Form / Therapy)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Changes the duration and number of slots dynamically generated each day.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Patients Per Slot
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={config.maxPatientsPerSlot || 1}
              onChange={(e) => setConfig({ ...config, maxPatientsPerSlot: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              1 patient per slot guarantees exclusive 1-on-1 doctor consultation time.
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Days */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Weekly Operating Hours & Shifts</h2>
          <p className="text-xs text-slate-500">Enable days and specify morning/evening shift timings.</p>
        </div>

        <div className="space-y-3 pt-2">
          {DAYS_OF_WEEK.map((day) => {
            const dayData = config.days[day] || { enabled: false, shifts: [] };

            return (
              <div
                key={day}
                className={`p-4 rounded-2xl border transition-all ${
                  dayData.enabled
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200/60 bg-slate-50/70 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Day Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        dayData.enabled ? 'bg-teal-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          dayData.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{day}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {dayData.enabled ? `${dayData.shifts.length} Shift(s)` : 'Closed / Off'}
                      </span>
                    </div>
                  </div>

                  {/* Shift Inputs */}
                  {dayData.enabled && (
                    <div className="flex flex-wrap items-center gap-3">
                      {dayData.shifts.map((shift, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                          <span className="text-slate-500 font-medium">Shift {sIdx + 1}:</span>
                          <input
                            type="time"
                            value={shift.start}
                            onChange={(e) => handleUpdateShift(day, sIdx, 'start', e.target.value)}
                            className="bg-transparent font-semibold text-slate-800"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="time"
                            value={shift.end}
                            onChange={(e) => handleUpdateShift(day, sIdx, 'end', e.target.value)}
                            className="bg-transparent font-semibold text-slate-800"
                          />
                          {dayData.shifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveShift(day, sIdx)}
                              className="text-slate-400 hover:text-red-600 p-0.5 ml-1"
                              title="Remove shift"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {dayData.shifts.length < 3 && (
                        <button
                          type="button"
                          onClick={() => handleAddShift(day)}
                          className="px-2.5 py-1 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg font-medium cursor-pointer"
                        >
                          + Add Shift
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Blackouts / Doctor Leave / Slot Overrides */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Blackouts & Time-Off Overrides</h2>
          <p className="text-xs text-slate-500">Block full days (conferences, leave) or specific slots (hospital rounds, emergency breaks).</p>
        </div>

        {/* Add Override Form */}
        <form onSubmit={handleAddOverride} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Date *</label>
            <input
              type="date"
              required
              value={newOverride.date}
              onChange={(e) => setNewOverride({ ...newOverride, date: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Block Type *</label>
            <select
              value={newOverride.type}
              onChange={(e) => setNewOverride({ ...newOverride, type: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
            >
              <option value="blocked_day">Block Whole Day (Doctor Leave)</option>
              <option value="blocked_slot">Block Specific Slot Time</option>
            </select>
          </div>

          {newOverride.type === 'blocked_slot' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Slot Time (e.g. 11:20 AM)</label>
              <input
                type="text"
                value={newOverride.time}
                onChange={(e) => setNewOverride({ ...newOverride, time: e.target.value })}
                placeholder="11:20 AM"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          )}

          <div className={newOverride.type === 'blocked_slot' ? 'sm:col-span-1' : 'sm:col-span-2'}>
            <label className="block font-semibold text-slate-700 mb-1">Reason / Note</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOverride.reason}
                onChange={(e) => setNewOverride({ ...newOverride, reason: e.target.value })}
                placeholder="e.g. Medical Symposium / Surgery"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                + Add Block
              </button>
            </div>
          </div>
        </form>

        {/* Existing Overrides List */}
        <div className="space-y-2">
          {overrides.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No dates or slots currently blocked.</p>
          ) : (
            overrides.map((ov) => (
              <div
                key={ov.id}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-900">{ov.date}</span>
                    {ov.time && <span className="font-semibold text-amber-800 ml-2">[{ov.time}]</span>}
                    <span className="text-amber-700 ml-2">
                      ({ov.type === 'blocked_day' ? 'Entire Day Off' : 'Single Slot Blocked'})
                    </span>
                    <span className="text-slate-600 ml-2 italic">— {ov.reason}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveOverride(ov.id)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
