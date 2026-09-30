'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw,
  Handshake,
  Sliders,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { createTool, updateTool, deleteTool } from '@/lib/api/tools';
import { useAuth } from '@/lib/context/AuthContext';

export default function ShelfTab({
  tools,
  setTools,
  toolsLoading,
  fetchTools,
  pendingRequests,
  saveRequestsState,
  borrowedTools,
  saveBorrowsState,
  onAddReputation,
  showToast,
}) {
  const { token } = useAuth();

  // Add Tool Form State
  const [newToolName, setNewToolName] = useState('');
  const [newToolCategory, setNewToolCategory] = useState('Power Tools');
  const [newToolPoints, setNewToolPoints] = useState(10);
  const [newToolDescription, setNewToolDescription] = useState('');
  const [addingTool, setAddingTool] = useState(false);

  // Edit Tool State
  const [editingToolId, setEditingToolId] = useState(null);
  const [editToolName, setEditToolName] = useState('');
  const [editToolCategory, setEditToolCategory] = useState('');
  const [editToolPoints, setEditToolPoints] = useState(10);
  const [editToolDescription, setEditToolDescription] = useState('');
  const [editToolStatus, setEditToolStatus] = useState('available');
  const [savingTool, setSavingTool] = useState(false);
  const [deletingToolId, setDeletingToolId] = useState(null);

  const handleAddTool = async (e) => {
    e.preventDefault();
    if (!newToolName.trim()) return;
    setAddingTool(true);
    try {
      const data = await createTool(token, {
        name: newToolName.trim(),
        category: newToolCategory,
        dailyPoints: Number(newToolPoints),
        description: newToolDescription.trim(),
      });
      setTools((prev) => [data.tool, ...prev]);
      setNewToolName('');
      setNewToolDescription('');
      showToast(`"${data.tool.name}" added to your sharing shelf!`);
    } catch (err) {
      showToast(err.message || 'Error adding tool.', 'error');
    } finally {
      setAddingTool(false);
    }
  };

  const startEditTool = (tool) => {
    setEditingToolId(tool.id);
    setEditToolName(tool.name);
    setEditToolCategory(tool.category);
    setEditToolPoints(tool.dailyPoints);
    setEditToolDescription(tool.description || '');
    setEditToolStatus(tool.status);
  };

  const cancelEditTool = () => {
    setEditingToolId(null);
  };

  const handleSaveTool = async (toolId) => {
    setSavingTool(true);
    try {
      const data = await updateTool(token, toolId, {
        name: editToolName,
        category: editToolCategory,
        dailyPoints: Number(editToolPoints),
        description: editToolDescription,
        status: editToolStatus,
      });
      setTools((prev) => prev.map((t) => (t.id === toolId ? data.tool : t)));
      setEditingToolId(null);
      showToast(`"${data.tool.name}" updated successfully!`);
    } catch (err) {
      showToast(err.message || 'Error updating tool.', 'error');
    } finally {
      setSavingTool(false);
    }
  };

  const handleDeleteTool = async (toolId, toolName) => {
    setDeletingToolId(toolId);
    try {
      await deleteTool(token, toolId);
      setTools((prev) => prev.filter((t) => t.id !== toolId));
      showToast(`"${toolName}" removed from your shelf.`);
    } catch (err) {
      showToast(err.message || 'Error deleting tool.', 'error');
    } finally {
      setDeletingToolId(null);
    }
  };

  const handleApproveRequest = async (reqId) => {
    const request = pendingRequests.find((r) => r.id === reqId);
    if (!request) return;
    await onAddReputation(`Lent "${request.toolName}" to ${request.requester}`, request.pointsReward);
    const updatedTools = tools.map((t) => {
      if (t.id === request.toolId) return { ...t, status: 'lent', renter: request.requester };
      return t;
    });
    setTools(updatedTools);
    saveRequestsState(pendingRequests.filter((r) => r.id !== reqId));
  };

  const handleDeclineRequest = (reqId) => {
    saveRequestsState(pendingRequests.filter((r) => r.id !== reqId));
    showToast('Borrow request declined.');
  };

  const handleReturnBorrowed = async (borrowId) => {
    const borrowed = borrowedTools.find((b) => b.id === borrowId);
    if (!borrowed) return;
    await onAddReputation(`Returned "${borrowed.toolName}" to ${borrowed.owner} on-time`, 10);
    saveBorrowsState(borrowedTools.filter((b) => b.id !== borrowId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Add Tool + Tool List */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Add Tool Form */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2.5">
            <Plus className="w-5 h-5 text-indigo-400" /> Add Tool to Shelf
          </h3>
          <form onSubmit={handleAddTool} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-7 space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tool Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bosch Mitre Saw"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 outline-none transition-all text-xs"
                />
              </div>
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={newToolCategory}
                  onChange={(e) => setNewToolCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pts/Day</label>
                <input
                  type="number"
                  min="1"
                  value={newToolPoints}
                  onChange={(e) => setNewToolPoints(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 text-center outline-none transition-all text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description (optional)</label>
              <input
                type="text"
                placeholder="Condition, model details, notes for borrowers..."
                value={newToolDescription}
                onChange={(e) => setNewToolDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 outline-none transition-all text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={addingTool}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {addingTool ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Register Tool
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tool Inventory */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 sm:p-8 flex-grow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Package className="w-5 h-5 text-indigo-400" /> My Tools Inventory
            </h3>
            <button
              type="button"
              onClick={fetchTools}
              className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
              title="Refresh tools"
            >
              <RefreshCw className={`w-4 h-4 ${toolsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {toolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : tools.length === 0 ? (
            <div className="text-center text-slate-500 py-8 text-sm">
              Your sharing shelf is empty. Register your first tool above!
            </div>
          ) : (
            <div className="space-y-3.5">
              <AnimatePresence>
                {tools.map((tool) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {editingToolId === tool.id ? (
                      /* Inline Edit Mode */
                      <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/30 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-5 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                            <input
                              value={editToolName}
                              onChange={(e) => setEditToolName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                            <select
                              value={editToolCategory}
                              onChange={(e) => setEditToolCategory(e.target.value)}
                              className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs outline-none focus:border-indigo-500"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pts/Day</label>
                            <input
                              type="number"
                              min="1"
                              value={editToolPoints}
                              onChange={(e) => setEditToolPoints(Number(e.target.value))}
                              className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-center text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                            <select
                              value={editToolStatus}
                              onChange={(e) => setEditToolStatus(e.target.value)}
                              className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs outline-none focus:border-indigo-500"
                            >
                              <option value="available">Available</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                          <input
                            value={editToolDescription}
                            onChange={(e) => setEditToolDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={cancelEditTool}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveTool(tool.id)}
                            disabled={savingTool}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            {savingTool ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" /> Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 hover:border-slate-700/60 transition-colors gap-4">
                        <div className="grow min-w-0">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{tool.category}</span>
                          <span className="text-sm font-semibold text-slate-200 block mt-0.5 truncate">{tool.name}</span>
                          {tool.description && (
                            <span className="text-[11px] text-slate-500 block mt-0.5 truncate">{tool.description}</span>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {tool.status === 'available' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">
                                ● Available
                              </span>
                            )}
                            {tool.status === 'lent' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/10">
                                ● Lent to {tool.renter}
                              </span>
                            )}
                            {tool.status === 'inactive' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-md border border-slate-500/10">
                                ● Inactive
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">{tool.dailyPoints} trust pts/day</span>
                          </div>
                        </div>
                        {tool.status !== 'lent' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditTool(tool)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-900/40 hover:text-indigo-400 text-slate-400 transition-all cursor-pointer"
                              title="Edit tool"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTool(tool.id, tool.name)}
                              disabled={deletingToolId === tool.id}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 hover:text-red-400 text-slate-400 transition-all cursor-pointer disabled:opacity-50"
                              title="Delete tool"
                            >
                              {deletingToolId === tool.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Lending Queues & Pending Requests */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5">
            <Handshake className="w-5 h-5 text-indigo-400" /> Lending Requests
          </h3>
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center text-slate-500 py-6 text-sm">No pending neighbor requests.</div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl space-y-3.5">
                  <div>
                    <span className="text-xs font-semibold text-indigo-400">{req.requester}</span>
                    <span className="text-xs text-slate-400"> wants to borrow:</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{req.toolName}</p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Duration: {req.duration} (+{req.pointsReward} reputation pts)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveRequest(req.id)}
                      className="grow py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(req.id)}
                      className="py-2 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-400" /> Tools I&apos;m Borrowing
          </h3>
          <div className="space-y-4">
            {borrowedTools.length === 0 ? (
              <div className="text-center text-slate-500 py-6 text-sm">You are not borrowing any tools.</div>
            ) : (
              borrowedTools.map((bor) => (
                <div key={bor.id} className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Borrowed from {bor.owner}</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{bor.toolName}</p>
                    <span className="text-[10px] text-amber-400 font-bold block mt-1.5">
                      ⏰ {bor.daysRemaining} days remaining
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReturnBorrowed(bor.id)}
                    className="py-2 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    Return
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
