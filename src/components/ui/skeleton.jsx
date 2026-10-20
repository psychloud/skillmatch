import React from 'react'
import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton', className)}
      {...props}
    />
  )
}

// Preset skeletons for common patterns
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="pt-2 border-t border-slate-100 mt-2">
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonJobRow() {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 3 }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, rowIdx) => (
        <div key={rowIdx} className="px-4 py-4 border-b border-slate-50 flex gap-4 items-center">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  )
}
