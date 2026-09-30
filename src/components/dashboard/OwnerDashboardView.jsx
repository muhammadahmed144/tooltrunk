'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Wrench,
  Clock,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit2,
  User,
  AlertTriangle,
  Mail,
  MapPin,
  Lock,
} from 'lucide-react';
import { updateBookingStatus } from '@/lib/api/bookings';
import { deleteTool } from '@/lib/api/tools';
import AddToolModal from './AddToolModal';
import EditToolModal from './EditToolModal';

export default function OwnerDashboardView({
  tools = [],
  incomingBookings = [],
  token,
  onRefresh,
  showToast,
}) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const totalListings = tools.length;
  const activeRentals = incomingBookings.filter((b) => ['Borrowed', 'Approved'].includes(b.status)).length;
  const pendingRequests = incomingBookings.filter((b) => b.status === 'Pending').length;

  const isToolLocked = (toolId) => {
    return incomingBookings.some(
      (b) => b.toolId === toolId && ['Pending', 'Approved', 'Borrowed'].includes(b.status)
    );
  };

  const handleBookingAction = async (bookingId, newStatus) => {
    setActionLoadingId(bookingId);
    try {
      await updateBookingStatus(token, bookingId, newStatus);
      showToast(`Request successfully marked as ${newStatus}!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Error updating request.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTool = async (toolId, toolName) => {
    if (isToolLocked(toolId)) {
      showToast(`Cannot delete "${toolName}": It has active or pending bookings.`, 'error');
      return;
    }

    if (!confirm(`Are you sure you want to remove "${toolName}" from your listings?`)) {
      return;
    }

    try {
      await deleteTool(token, toolId);
      showToast(`"${toolName}" has been removed from your listings.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete tool.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Tool button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Owner Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your listings and rental requests
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-700/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Tool</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Listings</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalListings}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Rentals</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeRentals}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Requests</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pendingRequests}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Split View Grid: Left = My Tools, Right = Incoming Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: My Listings */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              My Tools ({tools.length})
            </h3>
          </div>

          {tools.length > 0 ? (
            <div className="space-y-3">
              {tools.map((t) => {
                const locked = isToolLocked(t.id);
                return (
                  <div
                    key={t.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <Image
                          src={t.imageUrl || (t.images && t.images[0]) || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80'}
                          alt={t.name || t.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{t.name || t.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Rs. {t.pricePerDay || t.dailyPoints} / day</p>
                        {locked ? (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Active / Pending Rental</span>
                          </span>
                        ) : (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/tools/${t.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="View tool page"
                      >
                        <Wrench className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditingTool(t)}
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title={locked ? "Cannot edit: active or pending bookings exist" : "Edit tool listing"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTool(t.id, t.name || t.title)}
                        className={`p-2 rounded-lg transition-colors ${
                          locked
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={locked ? "Cannot delete: active or pending bookings exist" : "Delete tool listing"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State Matching Bottom-Right Mockup */
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Wrench className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">No tools listed yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Start by listing your first tool and earn from your unused equipment.
              </p>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 transition-all mt-1"
              >
                <span>+ List a Tool</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Incoming Requests */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Incoming Requests ({incomingBookings.length})
            </h3>
          </div>

          {incomingBookings.length > 0 ? (
            <div className="space-y-3">
              {incomingBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <Image
                          src={b.toolImage || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80'}
                          alt={b.toolTitle}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{b.toolTitle}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{b.startDate} to {b.endDate}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700">Rs. {b.totalPrice} ({b.totalDays}d)</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-slate-100 text-slate-700 border-slate-200">
                      {b.status}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2">
                    {/* Borrower Handover Details */}
                    <div className="flex flex-col gap-0.5 text-slate-500 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Borrower: <strong>{b.borrowerName || 'Neighbor'}</strong></span>
                      </div>
                      {b.borrowerEmail && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{b.borrowerEmail}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons based on state machine */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {b.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === b.id}
                            onClick={() => handleBookingAction(b.id, 'Approved')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === b.id}
                            onClick={() => handleBookingAction(b.id, 'Rejected')}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {b.status === 'Approved' && (
                        <button
                          type="button"
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleBookingAction(b.id, 'Borrowed')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                        >
                          Confirm Handover
                        </button>
                      )}

                      {b.status === 'Borrowed' && (
                        <button
                          type="button"
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleBookingAction(b.id, 'Returned')}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Mark as Returned
                        </button>
                      )}

                      {['Returned', 'Rejected'].includes(b.status) && (
                        <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-xs text-slate-700">No incoming rental requests</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                When neighbors book your tools, their requests will appear here for your approval.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Tool Modal */}
      <AddToolModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={() => {
          showToast('Tool successfully listed on ToolTrunk!');
          if (onRefresh) onRefresh();
        }}
      />

      {/* Edit Tool Modal */}
      <EditToolModal
        tool={editingTool}
        isOpen={Boolean(editingTool)}
        onClose={() => setEditingTool(null)}
        hasActiveOrPendingBookings={editingTool ? isToolLocked(editingTool.id) : false}
        onUpdated={() => {
          showToast('Tool listing updated successfully!');
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
