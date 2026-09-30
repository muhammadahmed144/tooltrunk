'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, MapPin } from 'lucide-react';

export default function ToolCard({ tool }) {
  const [isLiked, setIsLiked] = useState(false);

  const price = tool.pricePerDay || tool.dailyPoints || 800;
  const rating = tool.rating || 4.8;
  const reviewsCount = tool.reviewsCount || 24;
  const distance = tool.distanceKm || (tool.postalCode ? `${tool.postalCode}` : '2.4 km away');
  const imgUrl = tool.imageUrl || (tool.images && tool.images[0]) || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col">
      {/* Image Preview & Badges */}
      <div className="relative w-full aspect-4/3 bg-slate-100 overflow-hidden">
        <Link href={`/tools/${tool.id}`}>
          <Image
            src={imgUrl}
            alt={tool.name || tool.title || 'Tool'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </Link>

        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600/95 text-white shadow-sm backdrop-blur-xs">
            {tool.category || 'Power Tools'}
          </span>
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-xs transition-colors"
          title="Save to favorites"
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/tools/${tool.id}`} className="block group-hover:text-emerald-700 transition-colors">
            <h3 className="font-bold text-sm text-slate-800 line-clamp-1">
              {tool.name || tool.title}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">{rating}</span>
            <span className="text-slate-400 text-[11px]">({reviewsCount} reviews)</span>
          </div>
        </div>

        {/* Bottom row: Price & Distance */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900">
              Rs. {price}
            </span>
            <span className="text-[11px] text-slate-400 ml-1">/ day</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{typeof distance === 'number' ? `${distance} km away` : distance}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
