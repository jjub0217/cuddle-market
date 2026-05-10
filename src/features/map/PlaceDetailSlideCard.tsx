'use client'

import { useMapStore } from '@/store/mapStore'
import { FiPhone, FiClock, FiMapPin, FiStar, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlaceDetailSlideCard() {
  const selectedPlace = useMapStore((s) => s.selectedPlace)
  const setSelectedPlace = useMapStore((s) => s.setSelectedPlace)

  return (
    <AnimatePresence>
      {selectedPlace && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 z-[100] rounded-t-2xl border-b border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] md:hidden"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-300" />

          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold">{selectedPlace.name}</h3>
                {selectedPlace.isRecommended && (
                  <span className="bg-badge-yellow-container text-badge-yellow mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
                    추천
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {(selectedPlace.detail?.is24Hours || selectedPlace.detail?.isEmergencyAvailable) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedPlace.detail?.is24Hours && (
                  <span className="bg-badge-blue-container text-badge-blue rounded-full px-2 py-0.5 text-xs">
                    24시간
                  </span>
                )}
                {selectedPlace.detail?.isEmergencyAvailable && (
                  <span className="bg-badge-red-container text-badge-red rounded-full px-2 py-0.5 text-xs">
                    응급진료
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FiMapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate">{selectedPlace.address}</span>
              </div>
              {selectedPlace.phone && (
                <div className="flex items-center gap-2">
                  <FiPhone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <a
                    href={`tel:${selectedPlace.phone}`}
                    className="text-primary-container"
                  >
                    {selectedPlace.phone}
                  </a>
                </div>
              )}
              {selectedPlace.operatingHours && (
                <div className="flex items-center gap-2">
                  <FiClock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span>{selectedPlace.operatingHours}</span>
                </div>
              )}
            </div>

            {selectedPlace.reviewSummary && (
              <div className="mt-3 flex items-center gap-1.5">
                <FiStar className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-sm font-medium">
                  {selectedPlace.reviewSummary.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">
                  ({selectedPlace.reviewSummary.reviewCount})
                </span>
              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
