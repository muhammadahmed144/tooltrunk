'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  User as UserIcon,
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  MessageSquare,
  Save,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { updateProfile, deleteAccount } from '@/lib/api/auth';
import { useAuth } from '@/lib/context/AuthContext';

export default function ProfileTab({ user, tierInfo, showToast }) {
  const { token, updateUser, logout } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(user.fullName || '');
  const [postalCode, setPostalCode] = useState(user.postalCode || '75000');
  const [homeAddress, setHomeAddress] = useState(user.locationSettings?.homeAddress || '');
  const [maxDistance, setMaxDistance] = useState(user.locationSettings?.maxDistance || 10);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fileInputRef = useRef(null);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file size must be less than 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;

      if (file.type === 'image/svg+xml') {
        setAvatarUrl(result);
        showToast('Profile photo ready! Click "Save Profile & Apply" to apply.');
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 512;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(compressed);
        } else {
          setAvatarUrl(result);
        }
        showToast('Profile photo ready! Click "Save Profile & Apply" to apply.');
      };
      img.onerror = () => {
        setAvatarUrl(result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSavingSettings(true);
    try {
      const body = {
        fullName,
        postalCode,
        avatarUrl,
        locationSettings: {
          homeAddress,
          maxDistance: Number(maxDistance),
          publicLocation: true,
        },
      };
      if (newPassword) body.newPassword = newPassword;

      const data = await updateProfile(token, body);
      updateUser(data.user);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Profile & location settings updated successfully!');
    } catch (err) {
      showToast(err.message || 'Error updating profile.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      await deleteAccount(token);
      showToast('Account permanently removed.');
      logout();
      router.push('/');
    } catch (err) {
      showToast(err.message || 'Failed to delete account.', 'error');
      setDeletingAccount(false);
    }
  };

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Apr 2024';

  const userRating = user.reputation
    ? Math.min(5, (4 + user.reputation / 200)).toFixed(1)
    : '4.8';
  const reviewsCount = user.reputationHistory?.length || 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          My Profile
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account information and neighborhood settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Summary Card + Badges */}
        <div className="lg:col-span-5 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-emerald-500 shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName || 'Avatar'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-black text-emerald-600">
                  {fullName ? fullName[0].toUpperCase() : 'U'}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                title="Change Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <div>
              <h3 className="font-extrabold text-base text-slate-900">{fullName || 'Neighbor User'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Member since {memberSince}</p>

              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-700">
                <span className="text-slate-400 font-medium">Reputation</span>
                <span className="flex items-center gap-1 font-bold text-slate-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {userRating}
                </span>
                <span className="text-slate-400 text-[11px]">({reviewsCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Reputation & Badges Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Reputation & Badges
            </h4>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex flex-col items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-900">Trusted User</span>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200/60 flex flex-col items-center gap-1.5">
                <Clock className="w-5 h-5 text-teal-600" />
                <span className="text-[11px] font-bold text-teal-900">On Time</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200/60 flex flex-col items-center gap-1.5">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-bold text-blue-900">Good Comm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Info & Location Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Information Form */}
          <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
              Personal Information
            </h4>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password (Optional)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-700/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving...' : 'Save Profile & Apply'}</span>
              </button>
            </div>
          </form>

          {/* Location Settings Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Location Settings
            </h4>
            <p className="text-slate-500 text-xs">
              Update your postal code to get better local tool listings near your neighborhood.
            </p>

            <div className="flex gap-3 items-center max-w-sm">
              <div className="relative flex-1">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="75000"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-semibold"
                />
              </div>

              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={savingSettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors shadow-sm"
              >
                Update
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Once you delete your account, all your data including reputation history, tool listings, and bookings will be permanently removed.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Delete Account Permanently
            </h3>
            <p className="text-slate-600 leading-relaxed">
              This action cannot be undone. Type <strong>DELETE</strong> below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 font-bold"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl"
              >
                {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
