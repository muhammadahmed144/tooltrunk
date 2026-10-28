'use client';

import { useState } from 'react';
import { X, Wrench, Upload, Plus } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { createTool } from '@/lib/api/tools';
import { useAuth } from '@/lib/context/AuthContext';

export default function AddToolModal({ isOpen, onClose, onCreated }) {
  const { token, user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Power Tools');
  const [pricePerDay, setPricePerDay] = useState('800');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '75000');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      await createTool(token, {
        name: title.trim(),
        title: title.trim(),
        category,
        pricePerDay: price,
        dailyPoints: price,
        postalCode: postalCode.trim() || '75000',
        location: `${postalCode.trim() || '75000'}`,
        description: description.trim(),
        features,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
      });

      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error creating tool listing.');
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
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base">Add New Tool to Listings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cordless Drill 18V"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
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
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Postal Code</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="75000"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about the condition, accessories included, and usage..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Features (One per line)</label>
            <textarea
              rows="2"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="18V Lithium battery&#10;Includes 2 batteries + charger&#10;Variable speed"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
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
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-700/20 transition-all"
            >
              {submitting ? 'Listing Tool...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
