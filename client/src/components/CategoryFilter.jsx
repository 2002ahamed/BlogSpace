"use client"

import { useState, useEffect } from "react"
import { getCategoriesWithCounts } from "../services/api"

const CategoryFilter = ({ activeCategory, onCategoryChange, className = "" }) => {
  const [categoryCounts, setCategoryCounts] = useState([])
  const [loading, setLoading] = useState(true)

  const categories = [
    { value: "all", label: "All Posts", icon: "📄", color: "bg-gray-100 text-gray-800 hover:bg-gray-200" },
    { value: "Technology", label: "Technology", icon: "💻", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
    { value: "Fun", label: "Fun", icon: "🎉", color: "bg-pink-100 text-pink-800 hover:bg-pink-200" },
    { value: "Academics", label: "Academics", icon: "📚", color: "bg-green-100 text-green-800 hover:bg-green-200" },
    { value: "Projects", label: "Projects", icon: "🚀", color: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
    { value: "Journal", label: "Journal", icon: "📝", color: "bg-yellow-100 text-yellow-900 hover:bg-yellow-200" },
    { value: "Other", label: "Other", icon: "📄", color: "bg-gray-100 text-gray-800 hover:bg-gray-200" },
  ]

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        setLoading(true)
        const counts = await getCategoriesWithCounts()
        setCategoryCounts(counts)
      } catch (error) {
        console.error("Failed to fetch category counts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryCounts()
  }, [])

  const getCategoryCount = (category) => {
    if (category === "all") {
      return categoryCounts.reduce((total, cat) => total + cat.count, 0)
    }
    const found = categoryCounts.find((cat) => cat.category === category)
    return found ? found.count : 0
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h3 className="text-white font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Filter by Category
        </h3>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(7)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => {
              const count = getCategoryCount(category.value)
              const isActive = activeCategory === category.value

              return (
                <button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 border-2 ${
                    isActive
                      ? `${category.color} border-current shadow-md transform scale-105`
                      : `${category.color} border-transparent hover:shadow-md hover:transform hover:scale-102`
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">{category.label}</div>
                      <div className="text-sm opacity-75">
                        {count} {count === 1 ? "post" : "posts"}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

    
      </div>
    </div>
  )
}

export default CategoryFilter
