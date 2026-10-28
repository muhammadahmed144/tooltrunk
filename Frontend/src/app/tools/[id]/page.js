'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Star,
  MapPin,
  CheckCircle,
  ShieldCheck,
  Calendar,
  Share2,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AvailabilityCalendar from '@/components/booking/AvailabilityCalendar';
import BookingModal from '@/components/booking/BookingModal';
import { getToolById } from '@/lib/api/tools';
import { getToolAvailability } from '@/lib/api/bookings';
import { DEMO_POPULAR_TOOLS } from '@/lib/constants';
import { useAuth } from '@/lib/context/AuthContext';

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const toolId = params?.id;

  const [tool, setTool] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [bookedRanges, setBookedRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  // Booking widget states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    if (!toolId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getToolById(toolId, token);
        if (data && data.tool) {
          const normalizedTool = data.tool;
          setTool(normalizedTool);

          const firstImg = normalizedTool.imageUrl ||
            (Array.isArray(normalizedTool.images) ? normalizedTool.images[0] : null) ||
            'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80';

          setSelectedImage(firstImg);
        } else {
          // Fallback to demo tool
          const fallback = DEMO_POPULAR_TOOLS.find((t) => t.id === toolId) || DEMO_POPULAR_TOOLS[0];
          setTool(fallback);
          setSelectedImage(fallback.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80');
        }
      } catch {
        const fallback = DEMO_POPULAR_TOOLS.find((t) => t.id === toolId) || DEMO_POPULAR_TOOLS[0];
        setTool(fallback);
        setSelectedImage(fallback.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80');
      }

      // Fetch booked calendar ranges
      try {
        const availData = await getToolAvailability(toolId);
        if (availData && availData.bookedRanges) {
          setBookedRanges(availData.bookedRanges);
        }
      } catch {
        // Fallback demo booked dates (Sep 24-26)
        setBookedRanges([
          { startDate: '2026-09-24', endDate: '2026-09-26', status: 'Approved' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toolId, token]);

  if (loading || !tool) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading tool details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const imagesList = tool.images && tool.images.length > 0 ? tool.images : [
    tool.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80',
  ];

  const pricePerDay = Number(tool.pricePerDay || tool.dailyPoints || 800);
  const owner = tool.owner || {
    name: tool.ownerName || 'Ahmed Khan',
    memberSince: tool.ownerMemberSince || 'Apr 2024',
    rating: tool.ownerRating || 4.8,
    reviewsCount: tool.ownerReviewsCount || 12,
    avatarUrl: tool.ownerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  };

  const features = tool.features && tool.features.length > 0 ? tool.features : [
    '18V Lithium-ion battery',
    '2 speed settings',
    'Includes 2 batteries + charger',
    'Lightweight & portable',
  ];

  const description = tool.description || 'High-performance cordless drill with variable speed and 2 batteries. Perfect for home improvement and DIY projects.';

  const handleDateSelect = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Link Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to listings</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Gallery & Description */}
          <div className="lg:col-span-7 space-y-8">
            {/* Main Image */}
            <div className="relative w-full aspect-4/3 overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
              <Image
                src={selectedImage || imagesList[0]}
                alt={tool.name || tool.title}
                fill
                sizes="(max-width: 1024px) 100vw, 650px"
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Thumbnails */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900">Description</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-bold text-xs text-slate-900 mb-3 uppercase tracking-wider">Features</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Price, Owner, Interactive Availability Calendar */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header info card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 mb-2">
                    {tool.category || 'Power Tools'}
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {tool.name || tool.title}
                  </h1>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-900">{tool.rating || 4.8}</span>
                    </div>
                    <span className="text-slate-400">({tool.reviewsCount || 24} reviews)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-2.5 rounded-full border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Price */}
              <div className="pt-4 border-t border-slate-100 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  Rs. {pricePerDay}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ day</span>
              </div>

              {/* Availability & Location pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tool.distanceKm ? `${tool.distanceKm} km away` : '2.4 km away'}, {tool.postalCode || '75000'}</span>
                </div>
              </div>

              {/* Owner card: Only visible to authenticated registered members, hidden from guests */}
              {user && tool.owner ? (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 relative border border-slate-200">
                      <Image
                        src={tool.owner.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                        alt={tool.owner.name || 'Owner'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Owner</p>
                      <p className="text-xs font-bold text-slate-900">{tool.owner.name}</p>
                      <p className="text-[11px] text-slate-500">Member since {tool.owner.memberSince}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/profile')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 text-xs font-semibold transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Owner Details Protected</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Owner identity and direct handover communication details are restricted to registered ToolTrunk community members.
                  </p>
                  <Link
                    href={`/login?redirect=/tools/${tool.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Sign in to view owner & book tool</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Interactive Availability Calendar Widget */}
            <div className="space-y-4">
              <AvailabilityCalendar
                bookedRanges={bookedRanges}
                startDate={startDate}
                endDate={endDate}
                onDateSelect={handleDateSelect}
              />

              {/* Date selection boxes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <span className="text-slate-400 text-[11px] block font-medium">Start Date</span>
                  <span className="font-bold text-slate-800 mt-1 block">
                    {startDate || 'Select on calendar'}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <span className="text-slate-400 text-[11px] block font-medium">End Date</span>
                  <span className="font-bold text-slate-800 mt-1 block">
                    {endDate || 'Select on calendar'}
                  </span>
                </div>
              </div>

              {/* Request Booking Action Button or Guest Sign In Callout */}
              {user ? (
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(true)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-700/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Request Booking</span>
                </button>
              ) : (
                <Link
                  href={`/login?redirect=/tools/${tool.id}`}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In to Request Tool</span>
                </Link>
              )}

              <p className="text-center text-[11px] text-slate-400">
                Owner contact details are provided upon booking approval for physical handover coordination.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Booking Modal */}
      <BookingModal
        tool={tool}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        bookedRanges={bookedRanges}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onSuccess={() => {
          // Re-fetch availability
          getToolAvailability(toolId).then((res) => {
            if (res && res.bookedRanges) setBookedRanges(res.bookedRanges);
          });
        }}
      />
    </div>
  );
}
