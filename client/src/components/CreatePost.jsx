"use client"

import { useState, useRef } from "react"
import { createPost } from "../services/api"
import { uploadToCloudinary } from "../utils/Cloudinary"

const CreatePost = ({ user, onPostCreated }) => {
  const [postText, setPostText] = useState("")
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hashtags, setHashtags] = useState([])
  const [showFormatting, setShowFormatting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("Other") // Add category state
  const textareaRef = useRef(null)

  // Category options
  const categories = [
    { value: "Technology", label: "Technology", icon: "💻" },
    { value: "Fun", label: "Fun", icon: "🎉" },
    { value: "Academics", label: "Academics", icon: "📚" },
    { value: "Projects", label: "Projects", icon: "🚀" },
    { value: "Fashion", label: "Fashion", icon: "👜" },
    { value: "Travel", label: "Travel", icon: "✈️" },
    { value: "Other", label: "Other", icon: "📄" },
  ]

  // Extract hashtags from text
  const extractHashtags = (text) => {
    const hashtagRegex = /#\w+/g
    const matches = text.match(hashtagRegex) || []
    return [...new Set(matches.map((tag) => tag.toLowerCase()))] // Remove duplicates and make lowercase
  }

  const handleTextChange = (e) => {
    const text = e.target.value
    setPostText(text)
    setHashtags(extractHashtags(text))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }
      if (!file.type.match("image.*")) {
        setError("Please select an image file")
        return
      }
      setImage(file)
      setError("")
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!postText.trim() && !image) return

    setLoading(true)
    setError("")

    try {
      let imageUrl = null
      if (image) {
        console.log("Uploading post image to Cloudinary...")
        imageUrl = await uploadToCloudinary(image, "post_images")
        console.log("Image uploaded successfully:", imageUrl)
      }

      const newPost = {
        userId: user.user._id,
        desc: postText,
        image: imageUrl,
        tags: hashtags,
        category: selectedCategory, // Include category in post data
      }

      console.log("Creating new post with data:", newPost)
      const createdPost = await createPost(newPost)
      console.log("Post created successfully:", createdPost)

      onPostCreated({
        ...newPost,
        _id: createdPost._id || Date.now().toString(),
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        user: {
          _id: user.user._id,
          firstname: user.user.firstname,
          lastname: user.user.lastname,
          profilePicture: user.user.profilePicture,
        },
      })

      setPostText("")
      setImage(null)
      setImagePreview(null)
      setHashtags([])
      setSelectedCategory("Other") // Reset category
      setShowFormatting(false)
    } catch (err) {
      console.error("Failed to create post:", err)
      setError(err.response?.data?.message || "Failed to create post. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    setError("")
  }

  // Text formatting functions (keeping existing ones)
  const insertFormatting = (prefix, suffix = "") => {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = postText.substring(start, end)

    let newText
    if (selectedText) {
      newText = postText.substring(0, start) + prefix + selectedText + suffix + postText.substring(end)
    } else {
      newText = postText.substring(0, start) + prefix + suffix + postText.substring(end)
    }

    setPostText(newText)
    setHashtags(extractHashtags(newText))

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = selectedText
        ? start + prefix.length + selectedText.length + suffix.length
        : start + prefix.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const formatBold = () => insertFormatting("**", "**")
  const formatItalic = () => insertFormatting("*", "*")
  const formatUnderline = () => insertFormatting("<u>", "</u>")
  const formatHeading = () => insertFormatting("# ")
  const formatBulletPoint = () => {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const lineStart = postText.lastIndexOf("\n", start - 1) + 1
    const newText = postText.substring(0, lineStart) + "• " + postText.substring(lineStart)
    setPostText(newText)
    setHashtags(extractHashtags(newText))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 2, start + 2)
    }, 0)
  }

  const renderPreview = (text) => {
    if (!text) return text

    let formatted = text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>")
    formatted = formatted.replace(/^# (.*$)/gm, '<h3 class="text-xl font-bold text-gray-900 mb-2">$1</h3>')
    formatted = formatted.replace(/^• (.*$)/gm, '<li class="ml-4">$1</li>')
    formatted = formatted.replace(/(<li.*<\/li>)/gs, '<ul class="list-disc list-inside space-y-1">$1</ul>')
    formatted = formatted.replace(/#\w+/g, '<span class="text-blue-600 font-medium">$&</span>')
    formatted = formatted.replace(/\n/g, "<br>")

    return formatted
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 overflow-hidden">
      {/* Header */}
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
          Create New Article
        </h2>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 flex items-start">
            <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <img
              src={user.user.profilePicture || "https://via.placeholder.com/48"}
              alt={`${user.user.firstname} ${user.user.lastname}`}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
            />
          </div>

          <form onSubmit={handleSubmit} className="flex-1">
            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 appearance-none cursor-pointer"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <span className="mr-2">Selected:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {categories.find((cat) => cat.value === selectedCategory)?.icon} {selectedCategory}
                </span>
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowFormatting(!showFormatting)}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 5l4 4"
                  />
                </svg>
                {showFormatting ? "Hide" : "Show"} Formatting Options
                <svg
                  className={`w-4 h-4 ml-1 transition-transform duration-200 ${showFormatting ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFormatting && (
                <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={formatBold}
                      className="flex items-center px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                      title="Bold"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                        />
                      </svg>
                      <strong>Bold</strong>
                    </button>

                    <button
                      type="button"
                      onClick={formatItalic}
                      className="flex items-center px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                      title="Italic"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4l4 16" />
                      </svg>
                      <em>Italic</em>
                    </button>

                    <button
                      type="button"
                      onClick={formatUnderline}
                      className="flex items-center px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                      title="Underline"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 21h14M9 3v12a3 3 0 006 0V3"
                        />
                      </svg>
                      <u>Underline</u>
                    </button>

                    <button
                      type="button"
                      onClick={formatHeading}
                      className="flex items-center px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                      title="Heading"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Heading
                    </button>

                    <button
                      type="button"
                      onClick={formatBulletPoint}
                      className="flex items-center px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                      title="Bullet Point"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      • Bullet
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    <strong>Tip:</strong> Select text and click formatting buttons, or use markdown: **bold**, *italic*,
                    # heading, • bullets
                  </div>
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="mb-4">
              <textarea
                ref={textareaRef}
                rows={6}
                placeholder={`What's on your mind, ${user.user.firstname}? Share your thoughts, stories, or insights...`}
                value={postText}
                onChange={handleTextChange}
                className="w-full p-4 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-500 resize-none transition-all duration-200"
              />

              {/* Live Preview */}
              {postText && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Preview:</span>
                    <span className="text-xs text-gray-500">{postText.length} characters</span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderPreview(postText) }}
                  />
                </div>
              )}

              {/* Hashtags Display */}
              {hashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-gray-700">Tags:</span>
                  {hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mb-4 group">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full max-h-80 object-cover rounded-lg border-2 border-blue-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200 opacity-90 hover:opacity-100"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  Featured Image
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-4 border-t border-blue-100">
              <div className="flex items-center space-x-4">
                {/* Image Upload */}
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center px-4 py-2 border-2 border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Add Photo
                </label>
                <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

                {/* Image Status */}
                {image && (
                  <span className="text-sm text-green-600 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Image ready
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center space-x-3">
                {postText.trim() && (
                  <span className="text-sm text-gray-500">
                    {Math.ceil(postText.trim().split(/\s+/).length / 200)} min read
                  </span>
                )}
                <button
                  type="submit"
                  disabled={loading || (!postText.trim() && !image)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center ${
                    loading || (!postText.trim() && !image)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Publish Article
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePost
