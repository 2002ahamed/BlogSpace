"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getTimelinePostsWithCategory, getAllUsers, getTrendingHashtags, getUser } from "../services/api"
import CreatePost from "../components/CreatePost"
import Post from "../components/Post"
import UserSuggestions from "../components/UserSuggestions"
import LoadingSpinner from "../components/LoadingSpinner"
import Footer from "../components/Footer"
import CategoryFilter from "../components/CategoryFilter"

const Home = ({ user }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [trendingHashtags, setTrendingHashtags] = useState([])
  const [sharedByUsers, setSharedByUsers] = useState({})
  const [activeFilter, setActiveFilter] = useState("all")
  const [activeCategory, setActiveCategory] = useState("all") // Add category state
  const navigate = useNavigate()

  // Category options for the header filter tabs
  const categoryTabs = [
    { value: "all", label: "All", icon: "📄" },
    { value: "Technology", label: "Tech", icon: "💻" },
    { value: "Fun", label: "Fun", icon: "🎉" },
    { value: "Academics", label: "Study", icon: "📚" },
    { value: "Projects", label: "Projects", icon: "🚀" },
    { value: "Journal", label: "Journal", icon: "📝" },
  ]

  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        const hashtags = await getTrendingHashtags()
        setTrendingHashtags(hashtags)
      } catch (err) {
        console.error("Failed to fetch trending hashtags:", err)
      }
    }

    fetchTrendingHashtags()
  }, [])

  useEffect(() => {
    const fetchTimelinePosts = async () => {
      try {
        setLoading(true)
        // Use the new API function that supports category filtering
        const timelinePosts = await getTimelinePostsWithCategory(user.user._id, activeCategory)

        // Process shared posts to get user info
        const sharedUsers = {}
        for (const post of timelinePosts) {
          if (post.sharedBy || (post.shares && post.shares.length > 0)) {
            if (post.sharedBy && !sharedUsers[post.sharedBy]) {
              try {
                const userData = await getUser(post.sharedBy)
                sharedUsers[post.sharedBy] = userData
              } catch (error) {
                console.error("Failed to fetch shared user data:", error)
              }
            }
            if (post.shares && post.shares.length > 0) {
              for (const userId of post.shares) {
                if (!sharedUsers[userId]) {
                  try {
                    const userData = await getUser(userId)
                    sharedUsers[userId] = userData
                  } catch (error) {
                    console.error("Failed to fetch shared user data:", error)
                  }
                }
              }
            }
          }
        }

        setSharedByUsers(sharedUsers)
        setPosts(timelinePosts)
        setLoading(false)
      } catch (err) {
        setError("Failed to load posts. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    const fetchSuggestedUsers = async () => {
      try {
        const users = await getAllUsers()

        if (!users || !Array.isArray(users) || users.length === 0) {
          setSuggestedUsers([])
          return
        }

        const filteredUsers = users.filter((u) => {
          const isNotCurrentUser = u._id !== user.user._id
          const isNotFollowing = !user.user.following?.includes(u._id)
          return isNotCurrentUser && isNotFollowing
        })

        const shuffled = filteredUsers.sort(() => 0.5 - Math.random())
        setSuggestedUsers(shuffled.slice(0, 5))
      } catch (err) {
        setSuggestedUsers([])
      }
    }

    fetchTimelinePosts()
    fetchSuggestedUsers()
  }, [user, activeCategory]) // Add activeCategory as dependency

  const handleNewPost = (newPost) => {
    setPosts([newPost, ...posts])
  }

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)))
  }

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId))
  }

  const getSharedByUser = (post) => {
    if (post.sharedBy && sharedByUsers[post.sharedBy]) {
      return sharedByUsers[post.sharedBy]
    }
    if (post.shares && post.shares.length > 0) {
      for (const userId of post.shares) {
        if (userId !== user.user._id && sharedByUsers[userId]) {
          return sharedByUsers[userId]
        }
      }
      if (post.shares.includes(user.user._id)) {
        return user.user
      }
    }
    return null
  }

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "all") return true
    if (activeFilter === "following") return user.user.following?.includes(post.userId._id)
    if (activeFilter === "trending") return post.likes?.length > 5
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white rounded-2xl">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 pb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent leading-[1.5]">
              Welcome to BlogSpace
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Discover amazing stories, share your thoughts, and connect with passionate writers from around the world.
            </p>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {categoryTabs.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setActiveCategory(category.value)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    activeCategory === category.value
                      ? "bg-white text-blue-700 shadow-lg transform scale-105"
                      : "bg-white/20 text-white hover:bg-white/30 hover:transform hover:scale-105"
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>

            {/* Filter Tabs */}
            
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content */}
          <div className="xl:w-2/3">
            {/* Create Post Section */}
            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-white font-semibold flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Share Your Story
                  </h2>
                </div>
                <div className="p-6">
                  <CreatePost user={user} onPostCreated={handleNewPost} />
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <LoadingSpinner />
                  <p className="text-gray-600 mt-4">Loading amazing stories...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-red-200">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Stories Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {activeCategory !== "all"
                    ? `No posts found in the ${activeCategory} category. Try selecting a different category or create the first post in this category!`
                    : activeFilter === "all"
                      ? "Be the first to share your story! Create a post or follow some amazing writers to see their content."
                      : activeFilter === "following"
                        ? "No posts from people you follow yet. Discover and follow more writers to see their stories here."
                        : "No trending posts at the moment. Check back later or help create some buzz with your own content!"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => document.querySelector("[data-create-post]")?.scrollIntoView({ behavior: "smooth" })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Create Your First Post
                  </button>
                  <button
                    onClick={() => navigate("/explore")}
                    className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Explore Writers
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredPosts.map((post, index) => {
                  const sharedBy = getSharedByUser(post)
                  const isShared = !!sharedBy

                  return (
                    <article
                      key={post._id}
                      className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 overflow-hidden group"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: "fadeInUp 0.6s ease-out forwards",
                      }}
                    >
                      {isShared && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-3">
                          <div className="flex items-center text-green-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                              />
                            </svg>
                            <span className="text-sm font-medium">
                              Shared by {sharedBy.firstname} {sharedBy.lastname}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <Post
                          post={post}
                          currentUser={user.user}
                          onPostUpdate={handlePostUpdate}
                          onPostDelete={handlePostDeleted}
                          isShared={isShared}
                          sharedBy={sharedBy}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:w-1/3">
            <div className="sticky top-4 space-y-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
              {/* Category Filter */}
              <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

              {/* Suggested Authors */}
              <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Discover Authors
                  </h3>
                </div>
                <div className="p-6">
                  <UserSuggestions users={suggestedUsers} currentUser={user.user} />
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    </svg>
                    Trending Topics
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {trendingHashtags.length > 0 ? (
                      trendingHashtags.slice(0, 8).map((hashtag, index) => (
                        <button
                          key={hashtag._id}
                          onClick={() => navigate(`/hashtag/${hashtag._id.substring(1)}`)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 group border border-transparent hover:border-orange-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">#{index + 1}</span>
                              <div>
                                <div className="font-medium text-gray-900 group-hover:text-orange-600">
                                  #{hashtag._id.substring(1)}
                                </div>
                                <div className="text-sm text-gray-500">{hashtag.count} posts</div>
                              </div>
                            </div>
                            <svg
                              className="w-4 h-4 text-gray-400 group-hover:text-orange-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-sm">No trending topics yet</p>
                        <p className="text-gray-500 text-xs mt-1">Start using hashtags in your posts!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Quick Actions
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <button
                    onClick={() => navigate("/explore")}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-teal-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-teal-200">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Explore</div>
                      <div className="text-sm text-gray-500">Discover new content</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate("/saved")}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Saved Posts</div>
                      <div className="text-sm text-gray-500">Your bookmarked articles</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${user.user._id}`)}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">My Profile</div>
                      <div className="text-sm text-gray-500">View your profile</div>
                    </div>
                  </button>
                </div>
              </div>
              <Footer />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default Home
