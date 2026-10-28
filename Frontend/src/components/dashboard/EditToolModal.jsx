'use client';

import { useState, useEffect } from 'react';
import { X, Pencil, AlertCircle } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { updateTool } from '@/lib/api/tools';
import { useAuth } from '@/lib/context/AuthContext';

export default function EditToolModal({ tool, isOpen, onClose, onUpdated, hasActiveOrPendingBookings }) {
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Power Tools');
  const [pricePerDay, setPricePerDay] = useState('800');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (tool) {
      setTitle(tool.name || tool.title || '');
      setCategory(tool.category || 'Power Tools');
      setPricePerDay(String(tool.pricePerDay || tool.dailyPoints || 800));
      setDescription(tool.description || '');
      const feats = Array.isArray(tool.features)
        ? tool.features.join('\n')
        : (typeof tool.features === 'string' ? tool.features : '');
      setFeaturesText(feats);
      setImageUrl(tool.imageUrl || (tool.images && tool.images[0]) || '');
      setErrorMsg('');
    }
  }, [tool]);

  if (!isOpen || !tool) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasActiveOrPendingBookings) {
      setErrorMsg('Cannot update tool while there are active or pending bookings.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Tool title is required.');
      return;
    }
    const price = Number(pricePerDay);
    if (isNaN(price) || price < 1) {
      setErrorMsg('Price per day must be a valid positive amount.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      await updateTool(token, tool.id, {
        name: title.trim(),
        title: title.trim(),
        category,
        pricePerDay: price,
        dailyPoints: price,
        description: description.trim(),
        features,
        imageUrl: imageUrl.trim() || undefined,
      });

      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error updating tool listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0b1320] text-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base">Edit Tool Listing</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasActiveOrPendingBookings && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>This tool has active or pending rentals. Edits are locked until completed or returned.</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Tool Title *</label>
            <input
              type="text"
              required
              disabled={hasActiveOrPendingBookings}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cordless Drill 18V"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                disabled={hasActiveOrPendingBookings}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-white disabled:bg-slate-100 disabled:text-slate-500"
              >
                {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Daily Price (Rs.) *</label>
              <input
                type="number"
                required
                min="50"
                step="50"
                disabled={hasActiveOrPendingBookings}
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Image URL</label>
            <input
              type="url"
              disabled={hasActiveOrPendingBookings}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description</label>
            <textarea
              rows="2"
              disabled={hasActiveOrPendingBookings}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about the condition, accessories included, and usage..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Features (One per line)</label>
            <textarea
              rows="2"
              disabled={hasActiveOrPendingBookings}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="18V Lithium battery&#10;Includes 2 batteries + charger&#10;Variable speed"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono text-[11px] disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || hasActiveOrPendingBookings}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-700/20 transition-all"
            >
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
