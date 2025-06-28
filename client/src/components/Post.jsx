"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  likePost,
  addComment,
  getComments,
  getUser,
  deletePost,
  getPostLikes,
  savePost,
  isPostSaved,
  editComment,
  deleteComment,
} from "../services/api"
import { formatDistanceToNow } from "date-fns"
import EditPost from "./EditPost"
import DeleteConfirmation from "./DeleteConfirmation"

const Post = ({ post, currentUser, customDescription, onPostUpdate, onPostDelete, isShared, sharedBy }) => {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser._id))
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [postUser, setPostUser] = useState(post.user || null)
  const [loading, setLoading] = useState(false)
  const [commentUsers, setCommentUsers] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showLikersModal, setShowLikersModal] = useState(false)
  const [likers, setLikers] = useState([])
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editedCommentContent, setEditedCommentContent] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPostMenu, setShowPostMenu] = useState(false)

  const isOwnPost = (post.user?._id || post.userId) === currentUser._id
  const postContent = customDescription || post.desc || ""
  const shouldTruncate = postContent.length > 300
  const displayContent = shouldTruncate && !isExpanded ? postContent.substring(0, 300) + "..." : postContent

  // Calculate reading time (average 200 words per minute)
  const wordCount = postContent.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

  // Add this function near the top of the component, after the existing helper functions
  const renderFormattedContent = (text) => {
    if (!text) return text

    let formatted = text
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Headings
    formatted = formatted.replace(/^# (.*$)/gm, '<h3 class="text-xl font-bold text-gray-900 mb-3 mt-4">$1</h3>')
    // Bullet points
    formatted = formatted.replace(/^• (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
    // Wrap consecutive bullet points in ul
    formatted = formatted.replace(/(<li.*?<\/li>\s*)+/gs, '<ul class="list-disc list-inside space-y-1 mb-4">$&</ul>')
    // Hashtags
    formatted = formatted.replace(/#\w+/g, '<span class="text-blue-600 font-medium">$&</span>')
    // Line breaks
    formatted = formatted.replace(/\n/g, "<br>")

    return formatted
  }

  useEffect(() => {
    const fetchPostUser = async () => {
      if (!post.user && post.userId) {
        const userData = await getUser(post.userId)
        setPostUser(userData)
      }
    }

    const checkSavedStatus = async () => {
      const saved = await isPostSaved(post._id, currentUser._id)
      setIsSaved(saved)
    }

    if (!postUser) fetchPostUser()
    checkSavedStatus()

    const handleClickOutside = (event) => {
      if (showPostMenu && !event.target.closest(".relative")) {
        setShowPostMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [post.user, post.userId, post._id, currentUser._id, showPostMenu])

  const fetchCommentUserData = async (userId) => {
    if (!commentUsers[userId]) {
      const userData = await getUser(userId)
      setCommentUsers((prev) => ({ ...prev, [userId]: userData }))
    }
  }

  const handleLike = async () => {
    await likePost(post._id, currentUser._id)
    setLikesCount(liked ? likesCount - 1 : likesCount + 1)
    setLiked(!liked)
    const updatedLikes = liked ? post.likes.filter((id) => id !== currentUser._id) : [...post.likes, currentUser._id]
    onPostUpdate({ ...post, likes: updatedLikes })
  }

  const handleLoadComments = async () => {
    if (!showComments) {
      setLoading(true)
      const commentsData = await getComments(post._id)
      setComments(commentsData)
      commentsData.forEach((comment) => fetchCommentUserData(comment.userId))
      setShowComments(true)
      setLoading(false)
    } else {
      setShowComments(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const response = await addComment(post._id, currentUser._id, newComment)
    setComments([...comments, response.comment])
    setNewComment("")
    onPostUpdate({ ...post, comments: [...post.comments, response.comment._id] })
    fetchCommentUserData(currentUser._id)
  }

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id)
    setEditedCommentContent(comment.content)
  }

  const handleSaveEditComment = async (commentId) => {
    const response = await editComment(commentId, currentUser._id, editedCommentContent)
    setComments(comments.map((c) => (c._id === commentId ? response.comment : c)))
    setEditingCommentId(null)
    setEditedCommentContent("")
  }

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await deleteComment(commentId, currentUser._id)
      setComments(comments.filter((c) => c._id !== commentId))
      onPostUpdate({ ...post, comments: post.comments.filter((id) => id !== commentId) })
    }
  }

  const handleEditPost = () => setShowEditModal(true)

  const handleDeletePost = async () => {
    await deletePost(post._id, currentUser._id)
    if (onPostDelete) onPostDelete(post._id)
  }

  const handleShowLikers = async () => {
    const likersData = await getPostLikes(post._id)
    setLikers(likersData)
    setShowLikersModal(true)
  }

  const handleSavePost = async () => {
    setSaveLoading(true)
    await savePost(post._id, currentUser._id)
    setIsSaved(!isSaved)
    setSaveLoading(false)
  }

  if (!postUser) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-32"></div>
            <div className="h-3 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <article className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 overflow-hidden">
        {/* Shared Article Indicator */}
        {isShared && sharedBy && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center text-emerald-700">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </div>
              <div>
                <span className="font-medium">Shared by </span>
                <Link to={`/profile/${sharedBy._id}`} className="font-semibold hover:underline">
                  {sharedBy.firstname} {sharedBy.lastname}
                </Link>
              </div>
            </div>
          </div>
        )}
        {/* Article Header */}
        <header className="px-6 py-5 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to={`/profile/${postUser._id}`} className="group">
                <img
                  src={postUser.profilePicture || "https://via.placeholder.com/56"}
                  alt={`${postUser.firstname} ${postUser.lastname}`}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors duration-200"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/profile/${postUser._id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
                  >
                    {postUser.firstname} {postUser.lastname}
                  </Link>
                  {postUser.isVerified && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                  <time dateTime={post.createdAt} className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </time>
                  {readingTime > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        {readingTime} min read
                      </span>
                    </>
                  )}
                  {postUser.department && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {postUser.department}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Post Actions Menu */}
            {isOwnPost && !post.virtual && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPostMenu(!showPostMenu)
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                {showPostMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditPost()
                        setShowPostMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Article
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirmation(true)
                        setShowPostMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete Article
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        {/* Article Content */}
        <div className="px-6 py-6">
          {/* Featured Image */}
          {post.image && (
            <div className="mb-6 -mx-6">
              <img
                src={post.image || "/placeholder.svg"}
                alt="Article featured image"
                className="w-full h-64 md:h-80 object-cover"
                onError={(e) => (e.target.src = "https://via.placeholder.com/800x400")}
              />
            </div>
          )}

          {/* Article Text */}
          <div className="prose prose-lg max-w-none">
            <div
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed text-base md:text-lg"
              dangerouslySetInnerHTML={{ __html: renderFormattedContent(displayContent) }}
            />
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center transition-colors duration-200"
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Read more</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
              {post.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/hashtag/${tag.replace("#", "")}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
                >
                  <span className="mr-1">#</span>
                  {tag.replace("#", "")}
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* Engagement Bar */}
        <div className="px-6 py-4 border-t border-blue-100 bg-blue-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Like Button */}
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  liked
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-red-600"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${liked ? "fill-current" : ""}`}
                  fill={liked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span className="font-medium">{likesCount}</span>
                <span className="hidden sm:inline">{likesCount === 1 ? "Like" : "Likes"}</span>
              </button>

              {/* View Likes */}
              {likesCount > 0 && (
                <button
                  onClick={handleShowLikers}
                  className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200"
                >
                  View all
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Comments Button */}
              <button
                onClick={handleLoadComments}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="font-medium">{post.comments?.length || 0}</span>
                <span className="hidden sm:inline">{post.comments?.length === 1 ? "Comment" : "Comments"}</span>
              </button>

              {/* Save Button */}
              <button
                onClick={handleSavePost}
                disabled={saveLoading}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isSaved
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                } disabled:opacity-50`}
              >
                <svg
                  className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <span className="hidden sm:inline font-medium">{isSaved ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
        {/* Comments Section */}
        <div className="border-t border-blue-200 bg-white">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Discussion ({comments.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading comments...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-medium mb-2">No comments yet</p>
                <p className="text-gray-500">Be the first to share your thoughts on this article!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => {
                  const commentUser = commentUsers[comment.userId]
                  const isOwnComment = comment.userId === currentUser._id
                  const isPostOwner = post.userId === currentUser._id

                  return (
                    <div key={comment._id} className="flex space-x-4">
                      <Link to={`/profile/${commentUser?._id}`}>
                        <img
                          src={commentUser?.profilePicture || "https://via.placeholder.com/40"}
                          alt={commentUser?.firstname || "User"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors duration-200"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <Link
                              to={`/profile/${commentUser?._id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
                            >
                              {commentUser ? `${commentUser.firstname} ${commentUser.lastname}` : "User"}
                            </Link>
                            {(isOwnComment || isPostOwner) && (
                              <div className="flex items-center space-x-2">
                                {isOwnComment && editingCommentId !== comment._id && (
                                  <button
                                    onClick={() => handleEditComment(comment)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment._id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editedCommentContent}
                                onChange={(e) => setEditedCommentContent(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows="3"
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleSaveEditComment(comment._id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-800 leading-relaxed">{comment.content}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <time dateTime={comment.createdAt}>
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </time>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mt-6 pt-6 border-t border-blue-100">
              <div className="flex space-x-4">
                <img
                  src={currentUser.profilePicture || "https://via.placeholder.com/40"}
                  alt="Your avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                  <textarea
                    placeholder="Share your thoughts on this article..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="3"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </article>

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPost
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          currentUser={currentUser}
          onPostUpdate={onPostUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        show={showDeleteConfirmation}
        onHide={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeletePost}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone and will permanently remove your content."
      />

      {/* Likers Modal */}
      {showLikersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-96 overflow-hidden border-2 border-blue-200">
            <div className="flex items-center justify-between p-6 border-b border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Liked by {likesCount} {likesCount === 1 ? "person" : "people"}
              </h3>
              <button
                onClick={() => setShowLikersModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-80 overflow-y-auto">
              {likers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">No likes yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {likers.map((liker) => (
                    <div key={liker._id} className="flex items-center space-x-3">
                      <Link to={`/profile/${liker._id}`}>
                        <img
                          src={liker.profilePicture || "https://via.placeholder.com/40"}
                          alt={liker.firstname}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors duration-200"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link
                          to={`/profile/${liker._id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
                        >
                          {liker.firstname} {liker.lastname}
                        </Link>
                        {liker.department && <p className="text-sm text-gray-500">{liker.department}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Post
