'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import AvailabilityCalendar from './AvailabilityCalendar';
import { createBooking } from '@/lib/api/bookings';
import { useAuth } from '@/lib/context/AuthContext';

export default function BookingModal({
  tool,
  isOpen,
  onClose,
  bookedRanges = [],
  initialStartDate = '',
  initialEndDate = '',
  onSuccess,
}) {
  const { user, token } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Dates, 2: Details, 3: Confirm
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !tool) return null;

  const pricePerDay = Number(tool.pricePerDay || tool.dailyPoints || 800);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    try {
      const [sY, sM, sD] = startDate.split('-').map(Number);
      const [eY, eM, eD] = endDate.split('-').map(Number);
      const startUtc = Date.UTC(sY, sM - 1, sD);
      const endUtc = Date.UTC(eY, eM - 1, eD);
      const days = Math.round((endUtc - startUtc) / 86400000);
      return Math.max(0, days);
    } catch {
      return 0;
    }
  };

  const totalDays = calculateDays();
  const totalPrice = pricePerDay * totalDays;

  const handleDateSelect = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setErrorMsg('');
  };

  const handleNextStep = () => {
    if (!startDate || !endDate) {
      setErrorMsg('Please select both a start date and an end date on the calendar.');
      return;
    }
    if (endDate <= startDate) {
      setErrorMsg('Rental end date must be after the start date (minimum 1 day rental).');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleSubmitBooking = async () => {
    if (!token) {
      router.push(`/login?redirect=/tools/${tool.id}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await createBooking(token, {
        toolId: tool.id,
        startDate,
        endDate,
      });

      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting rental request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0b1320] text-white">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Book: {tool.name || tool.title}
            </h3>
            <p className="text-xs text-emerald-400 font-medium">
              Rs. {pricePerDay} / day
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-center gap-4 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              1
            </span>
            <span>Dates</span>
          </div>
          <div className="w-8 h-px bg-slate-300" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              2
            </span>
            <span>Details</span>
          </div>
          <div className="w-8 h-px bg-slate-300" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              3
            </span>
            <span>Confirm</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Select Rental Dates */}
        {step === 1 && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                Select Rental Dates
              </h4>
              <AvailabilityCalendar
                bookedRanges={bookedRanges}
                startDate={startDate}
                endDate={endDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            <div className="flex flex-col justify-between space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Selected Dates
                </h4>

                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Start Date</label>
                  <div className="mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700">
                    {startDate || 'Click a date on the calendar'}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-medium">End Date</label>
                  <div className="mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700">
                    {endDate || 'Click the return date'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
                  <span className="text-slate-500">Total Duration:</span>
                  <span className="font-bold text-slate-800">{startDate && endDate ? `${totalDays} days` : '—'}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">Total Price:</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    Rs. {startDate && endDate ? totalPrice.toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!startDate || !endDate}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all"
              >
                <span>Next: Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review Booking Details */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Booking Summary
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Tool</span>
                  <span className="font-bold text-slate-800">{tool.name || tool.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Owner</span>
                  <span className="font-bold text-slate-800">{tool.owner?.name || tool.ownerName || 'Neighbor'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Rental Dates</span>
                  <span className="font-bold text-slate-800">{startDate} to {endDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Duration</span>
                  <span className="font-bold text-slate-800">{totalDays} Days</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs text-slate-600">Calculated Rate (Rs. {pricePerDay} × {totalDays} days):</span>
                <span className="text-lg font-bold text-emerald-600">Rs. {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Cash on Handover:</strong> As per ToolTrunk community policy, payment is made in cash directly to the tool owner upon physical handover.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={submitting}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Confirm & Request Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-6 h-6 stroke-3" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Booking Request Submitted!
            </h3>

            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your request for <strong>{tool.name || tool.title}</strong> has been sent to the owner ({tool.owner?.name || tool.ownerName || 'Neighbor'}). Once approved, the dates will be locked in the community calendar.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/dashboard');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                View in My Rentals
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
