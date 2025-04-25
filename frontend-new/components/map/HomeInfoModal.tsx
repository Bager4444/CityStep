'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { HomeIcon } from '@heroicons/react/24/solid'

interface HomeInfoModalProps {
  title: string
  description: string
  onClose: () => void
}

export default function HomeInfoModal({ title, description, onClose }: HomeInfoModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <HomeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        
        <p className="text-gray-600 mb-6">{description}</p>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
