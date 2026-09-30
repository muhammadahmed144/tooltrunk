"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  MapPin,
  ChevronDown,
  ArrowRight,
  Wrench,
  Shield,
  Users,
  Clock,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/tools/ToolCard";
import { CATEGORIES, DEMO_POPULAR_TOOLS } from "@/lib/constants";
import { getPublicTools } from "@/lib/api/tools";
import { useAuth } from "@/lib/context/AuthContext";

export default function HomePage() {
  const { user, token } = useAuth();
  const [tools, setTools] = useState(DEMO_POPULAR_TOOLS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [postalCode, setPostalCode] = useState(user?.postalCode || "75000");

  // Automatically update postal code when user logs in or profile changes
  useEffect(() => {
    if (user?.postalCode) {
      setPostalCode(user.postalCode);
    }
  }, [user?.postalCode]);

  const fetchTools = useCallback(
    async (
      search = searchQuery,
      category = selectedCategory,
      pc = postalCode,
    ) => {
      setLoading(true);
      try {
        const data = await getPublicTools(
          {
            search,
            category: category === "All Categories" ? undefined : category,
            postalCode: pc,
          },
          token
        );

        if (data && data.tools && data.tools.length > 0) {
          setTools(data.tools);
        } else {
          // Fallback filter over demo tools if backend returns empty during offline or dev
          const filtered = DEMO_POPULAR_TOOLS.filter((t) => {
            const matchCat =
              category === "All Categories" ||
              t.category.toLowerCase() === category.toLowerCase();
            const matchQuery =
              !search ||
              t.name.toLowerCase().includes(search.toLowerCase()) ||
              t.category.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchQuery;
          });
          setTools(filtered);
        }
      } catch {
        // Offline fallback
        const filtered = DEMO_POPULAR_TOOLS.filter((t) => {
          const matchCat =
            category === "All Categories" ||
            t.category.toLowerCase() === category.toLowerCase();
          const matchQuery =
            !search || t.name.toLowerCase().includes(search.toLowerCase());
          return matchCat && matchQuery;
        });
        setTools(filtered.length > 0 ? filtered : DEMO_POPULAR_TOOLS);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedCategory, postalCode, token],
  );

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTools(searchQuery, selectedCategory, postalCode);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-[#0b1320] text-white overflow-hidden py-16 lg:py-24 border-b border-slate-800">
          {/* Subtle workshop background texture */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] bg-[size:20px]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Heading, Subhead, Search Box */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                    Borrow Tools. <br />
                    <span className="text-white">Build Better.</span>
                  </h1>
                  <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                    Rent or lend tools in your local community.{" "}
                    <br className="hidden sm:inline" />
                    Save money, reduce waste, get the job done.
                  </p>
                </div>

                {/* Search Bar Widget (Clean White Card on Dark Background) */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl text-slate-800"
                >
                  {/* Search Term */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tools..."
                      className="w-full pl-10 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="hidden sm:block w-px h-7 bg-slate-200" />

                  {/* Category Dropdown */}
                  <div className="relative sm:w-40">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full py-2.5 px-3 text-xs text-slate-700 bg-transparent focus:outline-none appearance-none cursor-pointer pr-8 font-medium"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="hidden sm:block w-px h-7 bg-slate-200" />

                  {/* Postal Code Input */}
                  <div className="relative sm:w-36">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Your Postal Code"
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Green Search Action Button */}
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-700/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Search</span>
                  </button>
                </form>

                {/* Popular Search tags */}
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                  <span className="font-medium text-slate-300">Popular:</span>
                  {[
                    "Cordless Drill",
                    "Ladder",
                    "Circular Saw",
                    "Pressure Washer",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                        fetchTools(tag, selectedCategory, postalCode);
                      }}
                      className="px-2.5 py-1 rounded-full bg-[#162032] border border-slate-700 hover:border-emerald-500 hover:text-white transition-colors text-[11px]"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Hero Featured Tool Visual matching the screenshot */}
              <div className="lg:col-span-5 relative hidden lg:flex justify-center">
                <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-[#111a2e]">
                  <Image
                    src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900&auto=format&fit=crop&q=80"
                    alt="Featured Cordless Drill"
                    fill
                    sizes="(max-width: 1200px) 100vw, 500px"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0b1320] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[#0b1320]/80 backdrop-blur-md border border-slate-700 text-white flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-400">
                        Featured Listing
                      </p>
                      <p className="text-sm font-bold text-white">
                        Cordless Drill 18V
                      </p>
                      <p className="text-xs text-slate-300">
                        Available in Karachi (75000)
                      </p>
                    </div>
                    <Link
                      href="/tools/tool-cordless-drill-1"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      View Tool
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Near You Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Popular Near You
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Verified high-quality tools available for rent right in your
                neighborhood.
              </p>
            </div>

            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Categories");
                fetchTools("", "All Categories", postalCode);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tools Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          ) : tools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No tools found matching your criteria
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching for other tools or clearing category filters to
                explore all community listings.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                  fetchTools("", "All Categories", "");
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </section>

        {/* Community Value Props Banner */}
        <section className="bg-white border-y border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Safe Physical Handovers
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Verify tools in person upon handover with clear return
                    scheduling and community reputation scores.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Zero Overlap Booking Engine
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Our strict scheduling engine locks dates in real-time,
                    eliminating double bookings completely.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Earn from Unused Tools
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    List tools in under 2 minutes, set your daily rental price,
                    and monetize equipment sitting in your garage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
