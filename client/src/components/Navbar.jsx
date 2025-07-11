"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { logoutUser, getAllUsers, getUserNotifications, searchPosts, getSavedPosts, getUser } from "../services/api"

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [postSearchQuery, setPostSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [postSearchResults, setPostSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showPostResults, setShowPostResults] = useState(false)
  const searchRef = useRef(null)
  const postSearchRef = useRef(null)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [savedPostsCount, setSavedPostsCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showDesktopUserSearch, setShowDesktopUserSearch] = useState(false)
  const [showDesktopPostSearch, setShowDesktopPostSearch] = useState(false)
  const desktopUserSearchRef = useRef(null)
  const desktopPostSearchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Mobile search dropdowns
      if (showMobileMenu) {
        if (searchRef.current && !searchRef.current.contains(event.target)) setShowResults(false)
        if (postSearchRef.current && !postSearchRef.current.contains(event.target)) setShowPostResults(false)
      }

      // Desktop search dropdowns
      if (desktopUserSearchRef.current && !desktopUserSearchRef.current.contains(event.target))
        setShowDesktopUserSearch(false)
      if (desktopPostSearchRef.current && !desktopPostSearchRef.current.contains(event.target))
        setShowDesktopPostSearch(false)

      // User menu
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMobileMenu])

  useEffect(() => {
    if (!user || !user.user) return

    fetchNotifications()
    fetchSavedPostsCount()

    const interval = setInterval(() => {
      fetchNotifications()
      fetchSavedPostsCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications(user.user._id)
      const unread = data.filter((notification) => !notification.read).length
      setUnreadNotificationCount(unread)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const fetchSavedPostsCount = async () => {
    try {
      const savedPosts = await getSavedPosts(user.user._id)
      setSavedPostsCount(savedPosts.length)
    } catch (error) {
      console.error("Error fetching saved posts count:", error)
      setSavedPostsCount(0)
    }
  }

  const handleSearchChange = async (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim().length > 0) {
      setIsLoading(true)
      setShowResults(true)
      try {
        const allUsers = await getAllUsers()
        const filteredUsers = allUsers.filter((u) => {
          if (u._id === user.user._id) return false

          const fullName = `${u.firstname} ${u.lastname}`.toLowerCase()
          const email = u.email.toLowerCase()
          const searchTerm = query.toLowerCase()

          return fullName.includes(searchTerm) || email.includes(searchTerm)
        })
        setSearchResults(filteredUsers)
      } catch (error) {
        console.error("Error searching users:", error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    } else {
      setShowResults(false)
      setSearchResults([])
    }
  }

  const getUserById = async (userId) => {
    try {
      // First check if we already have this user in search results
      const foundUser = searchResults.find((user) => user._id === userId)
      if (foundUser) return foundUser

      // If not found in search results, fetch from API
      const userData = await getUser(userId)
      return userData
    } catch (error) {
      console.error("Error fetching user:", error)
      return null
    }
  }

  const handlePostSearchChange = async (e) => {
    const query = e.target.value
    setPostSearchQuery(query)
    if (query.trim().length > 1) {
      setIsLoading(true)
      setShowPostResults(true)
      try {
        const posts = await searchPosts(query)

        // Enhance posts with complete user data
        const enhancedPosts = await Promise.all(
          posts.slice(0, 5).map(async (post) => {
            if (!post.userId || typeof post.userId === "string") {
              // If userId is just an ID string, fetch full user data
              const userData = await getUserById(post.userId || post.user?._id)
              return { ...post, userId: userData || post.userId }
            }
            return post
          }),
        )

        setPostSearchResults(enhancedPosts)
      } catch (error) {
        console.error("Error searching posts:", error)
        setPostSearchResults([])
      } finally {
        setIsLoading(false)
      }
    } else {
      setShowPostResults(false)
      setPostSearchResults([])
    }
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    navigate("/login")
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setShowResults(false)
      setShowDesktopUserSearch(false)
    }
  }

  const handlePostSearch = (e) => {
    e.preventDefault()
    if (postSearchQuery.trim().length > 0) {
      navigate(`/search/posts?q=${encodeURIComponent(postSearchQuery)}`)
      setShowPostResults(false)
      setShowDesktopPostSearch(false)
    }
  }

  const goToProfile = (userId) => {
    navigate(`/profile/${userId}`)
    setSearchQuery("")
    setShowResults(false)
    setShowDesktopUserSearch(false)
  }

  const goToPost = (postId) => {
    navigate(`/post/${postId}`)
    setPostSearchQuery("")
    setShowPostResults(false)
    setShowDesktopPostSearch(false)
  }

  const goToNotifications = () => {
    navigate("/notifications")
  }

  const goToSavedPosts = () => {
    navigate("/saved")
    setSavedPostsCount(0)
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  const toggleDesktopUserSearch = () => {
    setShowDesktopUserSearch(!showDesktopUserSearch)
    setShowDesktopPostSearch(false)
    if (!showDesktopUserSearch) {
      setSearchQuery("")
      setSearchResults([])
    }
  }

  const toggleDesktopPostSearch = () => {
    setShowDesktopPostSearch(!showDesktopPostSearch)
    setShowDesktopUserSearch(false)
    if (!showDesktopPostSearch) {
      setPostSearchQuery("")
      setPostSearchResults([])
    }
  }

  if (!user) return null

  return (
    <nav className="bg-gradient-to-r from-blue-800 to-indigo-900 shadow-xl p-3 sm:p-4 sticky top-0 z-50 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        {/* Mobile and Desktop Header */}
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-white hover:text-blue-200 p-2 transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-200 ${showMobileMenu ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo/Brand */}
          <div className="flex justify-center md:justify-start">
            <Link to="/" className="flex items-center group">
              <div className="relative overflow-hidden rounded-lg p-1">
                <div className="absolute inset-0 transition-all duration-300 rounded-lg"></div>
                <div className="flex items-center space-x-2">
                  <div className="bg-dark p-2 rounded-lg transition-all duration-300 group-hover:bg-white/30">
                    <img
                      src="/10026257.png"
                      alt="Logo"
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-cover rounded-full"
                      />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Search Icons */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            {/* User Search Icon */}
            <div className="relative" ref={desktopUserSearchRef}>
              <button
                onClick={toggleDesktopUserSearch}
                className="flex flex-col items-center text-white hover:text-blue-200 p-2 transition-colors duration-200 group"
                aria-label="Search Authors"
              >
                <div
                  className={`bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-sm transition-all duration-300 ${showDesktopUserSearch ? "bg-white/30" : ""}`}
                >
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs mt-1 font-medium">Find Authors</span>
              </button>

              {/* Desktop User Search Dropdown */}
              {showDesktopUserSearch && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-80 bg-white rounded-lg shadow-xl z-50 p-3 animate-fadeIn">
                  <form onSubmit={handleSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="search"
                      placeholder="Search authors by name or email..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-10 p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                      autoFocus
                    />
                  </form>
                  {showResults && (
                    <ul className="mt-2 max-h-60 overflow-y-auto border-t border-gray-100 pt-2">
                      {isLoading ? (
                        <li className="p-3 text-center text-gray-500">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Searching...</span>
                          </div>
                        </li>
                      ) : searchResults.length === 0 ? (
                        <li className="p-3 text-center text-gray-500">No authors found</li>
                      ) : (
                        searchResults.map((result) => (
                          <li
                            key={result._id}
                            onClick={() => goToProfile(result._id)}
                            className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                          >
                            <img
                              src={result.profilePicture || "https://via.placeholder.com/40"}
                              alt={`${result.firstname} ${result.lastname}`}
                              className="w-10 h-10 rounded-full mr-3 object-cover border border-blue-200"
                            />
                            <div>
                              <p className="font-medium text-gray-800">{`${result.firstname} ${result.lastname}`}</p>
                              <p className="text-sm text-gray-500">
                                {result.email}
                                {result.worksAt && ` • Works at ${result.worksAt}`}
                              </p>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Post Search Icon */}
            <div className="relative" ref={desktopPostSearchRef}>
              <button
                onClick={toggleDesktopPostSearch}
                className="flex flex-col items-center text-white hover:text-blue-200 p-2 transition-colors duration-200 group"
                aria-label="Search Articles"
              >
                <div
                  className={`bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-sm transition-all duration-300 ${showDesktopPostSearch ? "bg-white/30" : ""}`}
                >
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-xs mt-1 font-medium">Search Articles</span>
              </button>

              {/* Desktop Post Search Dropdown */}
              {showDesktopPostSearch && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-80 bg-white rounded-lg shadow-xl z-50 p-3 animate-fadeIn">
                  <form onSubmit={handlePostSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <input
                      type="search"
                      placeholder="Search articles..."
                      value={postSearchQuery}
                      onChange={handlePostSearchChange}
                      className="w-full pl-10 p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                      autoFocus
                    />
                  </form>
                  {showPostResults && (
                    <ul className="mt-2 max-h-60 overflow-y-auto border-t border-gray-100 pt-2">
                      {isLoading ? (
                        <li className="p-3 text-center text-gray-500">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Searching...</span>
                          </div>
                        </li>
                      ) : postSearchResults.length === 0 ? (
                        <li className="p-3 text-center text-gray-500">No articles found</li>
                      ) : (
                        postSearchResults.map((post) => {
                          const postUser = post.userId || {}
                          return (
                            <li
                              key={post._id}
                              onClick={() => goToPost(post._id)}
                              className="p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                            >
                              <p className="font-medium text-gray-800">
                                {post.desc && post.desc.length > 50
                                  ? `${post.desc.substring(0, 50)}...`
                                  : post.desc || "No description"}
                              </p>
                              <div className="flex items-center mt-1">
                                {postUser.profilePicture && (
                                  <img
                                    src={postUser.profilePicture || "/placeholder.svg"}
                                    alt={`${postUser.firstname} ${postUser.lastname}`}
                                    className="w-6 h-6 rounded-full mr-2 object-cover"
                                    onError={(e) => (e.target.src = "https://via.placeholder.com/24")}
                                  />
                                )}
                                <p className="text-sm text-gray-500">
                                  By {postUser.firstname || "Unknown"} {postUser.lastname || "Author"}
                                  {postUser.department && (
                                    <span className="text-xs text-gray-400 ml-1">({postUser.department})</span>
                                  )}
                                </p>
                              </div>
                              {post.tags && post.tags.length > 0 && (
                                <p className="text-xs text-blue-600 mt-1 flex flex-wrap gap-1">
                                  {post.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="bg-blue-100 px-2 py-0.5 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                  {post.tags.length > 3 && (
                                    <span className="bg-blue-100 px-2 py-0.5 rounded-full">
                                      +{post.tags.length - 3} more
                                    </span>
                                  )}
                                </p>
                              )}
                            </li>
                          )
                        })
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Notification Button */}
            <button
              onClick={goToNotifications}
              className="relative text-white hover:text-blue-200 p-1.5 transition-colors duration-200 group"
              aria-label="Notifications"
            >
              <div className="bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-sm transition-all duration-300">
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H6"
                  />
                </svg>
              </div>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center p-1 focus:outline-none"
                aria-label="User menu"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                <div className="relative">
                  <img
                    src={user.user.profilePicture || "https://via.placeholder.com/40"}
                    alt={`${user.user.firstname} ${user.user.lastname}`}
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-white hover:border-blue-200 transition-all duration-200 object-cover shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <svg
                  className={`w-4 h-4 ml-1 text-white transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""} hidden sm:block`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Desktop User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 animate-fadeIn">
                  <div className="py-3 rounded-t-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <div className="px-4 py-2">
                      <div className="flex items-center">
                        <img
                          src={user.user.profilePicture || "https://via.placeholder.com/40"}
                          alt={`${user.user.firstname} ${user.user.lastname}`}
                          className="w-12 h-12 rounded-full border-2 border-white mr-3 object-cover"
                        />
                        <div>
                          <p className="font-semibold truncate">
                            {user.user.firstname} {user.user.lastname}
                          </p>
                          <p className="text-xs text-blue-200 truncate">{user.user.email}</p>
                          {user.user.department && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                              {user.user.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-1 border-b border-gray-100">
                    <Link
                      to={`/profile/${user.user._id}`}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="bg-blue-100 p-2 rounded-full mr-3  no-underline">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <span className="">My Profile</span>
                    </Link>

                    <button
                      onClick={() => {
                        goToSavedPosts()
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                      </div>
                      <span>Saved Articles</span>
                      {savedPostsCount > 0 && (
                        <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          {savedPostsCount}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      <div className="bg-red-100 p-2 rounded-full mr-3">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </div>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 animate-fadeIn">
            <div className="p-4 space-y-4">
              {/* Mobile Search Bars */}
              <div className="space-y-3">
                {/* User Search */}
                <div ref={searchRef} className="relative">
                  <form onSubmit={handleSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="search"
                      placeholder="Search authors by name or email..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-10 p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                    />
                  </form>
                  {showResults && (
                    <ul className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-100">
                      {isLoading ? (
                        <li className="p-3 text-center text-gray-500">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Searching...</span>
                          </div>
                        </li>
                      ) : searchResults.length === 0 ? (
                        <li className="p-3 text-center text-gray-500">No authors found</li>
                      ) : (
                        searchResults.map((result) => (
                          <li
                            key={result._id}
                            onClick={() => {
                              goToProfile(result._id)
                              setShowMobileMenu(false)
                            }}
                            className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                          >
                            <img
                              src={result.profilePicture || "https://via.placeholder.com/40"}
                              alt={`${result.firstname} ${result.lastname}`}
                              className="w-10 h-10 rounded-full mr-3 object-cover border border-blue-200"
                            />
                            <div>
                              <p className="font-medium text-gray-800">{`${result.firstname} ${result.lastname}`}</p>
                              <p className="text-sm text-gray-500">
                                {result.email}
                                {result.worksAt && ` • Works at ${result.worksAt}`}
                              </p>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>

                {/* Post Search */}
                <div ref={postSearchRef} className="relative">
                  <form onSubmit={handlePostSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <input
                      type="search"
                      placeholder="Search articles..."
                      value={postSearchQuery}
                      onChange={handlePostSearchChange}
                      className="w-full pl-10 p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                    />
                  </form>
                  {showPostResults && (
                    <ul className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-100">
                      {isLoading ? (
                        <li className="p-3 text-center text-gray-500">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Searching...</span>
                          </div>
                        </li>
                      ) : postSearchResults.length === 0 ? (
                        <li className="p-3 text-center text-gray-500">No articles found</li>
                      ) : (
                        postSearchResults.map((post) => {
                          const postUser = post.userId || {}
                          return (
                            <li
                              key={post._id}
                              onClick={() => {
                                goToPost(post._id)
                                setShowMobileMenu(false)
                              }}
                              className="p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                            >
                              <p className="font-medium text-gray-800">
                                {post.desc && post.desc.length > 50
                                  ? `${post.desc.substring(0, 50)}...`
                                  : post.desc || "No description"}
                              </p>
                              <div className="flex items-center mt-1">
                                {postUser.profilePicture && (
                                  <img
                                    src={postUser.profilePicture || "/placeholder.svg"}
                                    alt={`${postUser.firstname} ${postUser.lastname}`}
                                    className="w-6 h-6 rounded-full mr-2 object-cover"
                                    onError={(e) => (e.target.src = "https://via.placeholder.com/24")}
                                  />
                                )}
                                <p className="text-sm text-gray-500">
                                  By {postUser.firstname || "Unknown"} {postUser.lastname || "Author"}
                                  {postUser.department && (
                                    <span className="text-xs text-gray-400 ml-1">({postUser.department})</span>
                                  )}
                                </p>
                              </div>
                              {post.tags && post.tags.length > 0 && (
                                <p className="text-xs text-blue-600 mt-1 flex flex-wrap gap-1">
                                  {post.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="bg-blue-100 px-2 py-0.5 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                  {post.tags.length > 3 && (
                                    <span className="bg-blue-100 px-2 py-0.5 rounded-full">
                                      +{post.tags.length - 3} more
                                    </span>
                                  )}
                                </p>
                              )}
                            </li>
                          )
                        })
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
