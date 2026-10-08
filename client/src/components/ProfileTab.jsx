import React, { useState, useRef } from 'react';
import { Check, KeyRound, Lock, AlertCircle, ShieldCheck, Upload, Camera, RotateCcw, ImageIcon } from 'lucide-react';
import { authFetch } from '../utils/api.js';

export default function ProfileTab({ doctor, onUpdateDoctor }) {
  const [formData, setFormData] = useState({ ...doctor });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  // Security Credentials State
  const [credData, setCredData] = useState({
    currentPasswordOrPin: '',
    newUsername: '',
    newPin: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [credSaving, setCredSaving] = useState(false);
  const [credSuccess, setCredSuccess] = useState(null);
  const [credError, setCredError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await authFetch('/api/doctor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.doctor) {
        onUpdateDoctor(data.doctor);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeviceImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPEG, PNG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize and resize image in browser to max 500x500
        const canvas = document.createElement('canvas');
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to high quality JPEG data URL (~40-60KB)
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, avatar: optimizedDataUrl }));
        setUploadNotice('Photo uploaded from device! Click "Save Profile Changes" below to apply.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    setFormData(prev => ({
      ...prev,
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=350"
    }));
    setUploadNotice('Reset to default doctor photo. Click "Save Profile Changes" below to apply.');
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setCredError(null);
    setCredSuccess(null);

    if (!credData.currentPasswordOrPin.trim()) {
      setCredError('Please enter your current PIN or Password to authorize changes.');
      return;
    }

    if (credData.newPassword && credData.newPassword.length < 6) {
      setCredError('New password must be at least 6 characters long.');
      return;
    }

    if (credData.newPassword && credData.newPassword !== credData.confirmPassword) {
      setCredError('New password and confirmation do not match.');
      return;
    }

    if (credData.newPin && !/^\d{4,8}$/.test(credData.newPin.trim())) {
      setCredError('New Doctor PIN must be between 4 to 8 numeric digits.');
      return;
    }

    if (!credData.newUsername.trim() && !credData.newPin.trim() && !credData.newPassword) {
      setCredError('Please provide a new Username, PIN, or Password to update.');
      return;
    }

    setCredSaving(true);

    try {
      const res = await authFetch('/api/auth/doctor/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPasswordOrPin: credData.currentPasswordOrPin.trim(),
          newUsername: credData.newUsername.trim() || undefined,
          newPin: credData.newPin.trim() || undefined,
          newPassword: credData.newPassword || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update credentials.');
      }

      setCredSuccess(data.message || 'Credentials updated successfully.');
      setCredData({
        currentPasswordOrPin: '',
        newUsername: '',
        newPin: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setCredError(err.message);
    } finally {
      setCredSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* 1. Doctor & Clinic Public Credentials Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Doctor & Clinic Credentials</h2>
            <p className="text-xs text-slate-500">This information appears on your QR standee poster and patient booking portal.</p>
          </div>

          {saved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Saved Successfully!
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Name & Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medical Specialty *</label>
              <input
                type="text"
                required
                value={formData.specialty || ''}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Qualifications & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Degrees & Qualifications</label>
              <input
                type="text"
                value={formData.qualifications || ''}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                placeholder="e.g. MBBS, MD (General Medicine) - Reg No: KMC-74291"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Experience Summary</label>
              <input
                type="text"
                value={formData.experience || ''}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. 12+ Years Clinical Experience"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Clinic Name & Chamber */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinic Name *</label>
              <input
                type="text"
                required
                value={formData.clinicName || ''}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chamber / Room Number *</label>
              <input
                type="text"
                required
                value={formData.chamber || ''}
                onChange={(e) => setFormData({ ...formData, chamber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinic Full Address</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Contact Phone & Consultation Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinic Contact / Helpline Phone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Consultation Fee</label>
              <input
                type="text"
                value={formData.consultationFee || ''}
                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                placeholder="e.g. ₹500 / Consultation"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Doctor Profile Photo Upload from Device */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800">Doctor Profile Photo</label>
                <p className="text-[11px] text-slate-500">This photo appears on your patient booking page, header, and clinic QR posters.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
              {/* Photo Preview */}
              <div className="relative group shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-md bg-white border border-slate-200">
                <img
                  src={formData.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=350"}
                  alt="Doctor Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                  title="Click to choose a photo from device"
                >
                  <Camera className="w-5 h-5 mb-1 text-teal-300" />
                  <span>Change Photo</span>
                </button>
              </div>

              {/* Upload Controls & Actions */}
              <div className="space-y-2 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleDeviceImageUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Photo from Device</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPhoto}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-all cursor-pointer"
                    title="Reset to default placeholder image"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Default</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Select any photo from your phone or PC (JPG, PNG, WebP). It is automatically resized and optimized.
                </p>

                {uploadNotice && (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadNotice}</span>
                  </p>
                )}

                {/* Optional Web URL Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'Hide Web URL Option' : 'Or paste an Image Web URL instead'}</span>
                  </button>

                  {showUrlInput && (
                    <input
                      type="url"
                      value={formData.avatar || ''}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="https://example.com/doctor-photo.jpg"
                      className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Doctor Bio / Practice Note</label>
            <textarea
              rows={3}
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            ></textarea>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-all shadow-md shadow-teal-600/20 cursor-pointer"
            >
              {saving ? 'Updating...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Doctor Login Credentials & Security Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="mb-6 pb-4 border-b border-slate-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Security & Login Credentials</h2>
            <p className="text-xs text-slate-500">Change your Username & Password used to access this portal.</p>
          </div>
        </div>

        {credSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{credSuccess}</span>
          </div>
        )}

        {credError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{credError}</span>
          </div>
        )}

        <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
          {/* Current Password Required */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={credData.currentPasswordOrPin}
              onChange={(e) => setCredData({ ...credData, currentPasswordOrPin: e.target.value })}
              placeholder="Enter your current password to authorize changes"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enter your current password to authorize security updates.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {/* New Username */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Username (Optional)</label>
              <input
                type="text"
                value={credData.newUsername}
                onChange={(e) => setCredData({ ...credData, newUsername: e.target.value })}
                placeholder="Leave blank to keep current username"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* New Password & Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password (Min 6 Characters)</label>
              <input
                type="password"
                value={credData.newPassword}
                onChange={(e) => setCredData({ ...credData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={credData.confirmPassword}
                onChange={(e) => setCredData({ ...credData, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={credSaving}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-md shadow-slate-900/20 cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{credSaving ? 'Updating...' : 'Update Doctor Credentials'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
