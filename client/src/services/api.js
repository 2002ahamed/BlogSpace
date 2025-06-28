import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL;

const createAxiosInstance = () => {
  const user = JSON.parse(localStorage.getItem("user"))

  return axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: user ? `Bearer ${user.token}` : "",
    },
  })
}

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password })

    // If user is verified, store in localStorage
    if (response.data && !response.data.requiresVerification) {
      localStorage.setItem("user", JSON.stringify(response.data))
    }

    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}



export const preRegisterUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/pre-register`, userData)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const verifyEmail = async (userId, verificationCode) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-email`, { userId, verificationCode })

    // Store user data in localStorage after successful verification
    if (response.data && response.data.user && response.data.token) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          user: response.data.user,
          token: response.data.token,
        }),
      )
    }

    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const resendVerificationCode = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/auth/resend-verification`, { userId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData)
    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data))
    }
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const logoutUser = () => {
  localStorage.removeItem("user")
}

export const getUser = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/user/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateUser = async (userId, userData) => {
  try {

    const api = createAxiosInstance()
    const response = await api.put(`/user/${userId}`, userData)

    return response.data
  } catch (error) {
    throw error.response?.data || { message: error.message }
  }
}

export const followUser = async (userId, currentUserId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/user/${userId}/follow`, { currentUserId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const unfollowUser = async (userId, currentUserId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/user/${userId}/unfollow`, { currentUserId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getAllUsers = async () => {
  try {
    const api = createAxiosInstance()
    const response = await api.get("/user")
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createPost = async (postData) => {
  try {

    const api = createAxiosInstance()
    const response = await api.post("/post", postData)

    return response.data
  } catch (error) {
    throw error.response?.data || { message: error.message }
  }
}

export const getTimelinePosts = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${userId}/timeline`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const likePost = async (postId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/post/${postId}/like`, { userId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const addComment = async (postId, userId, content) => {
  try {
    const api = createAxiosInstance()
    const response = await api.post(`/post/${postId}/comment`, { userId, content })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const editComment = async (commentId, userId, content) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/post/comment/${commentId}`, { userId, content })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteComment = async (commentId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/post/comment/${commentId}`, { data: { userId } })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteUser = async (userId, currentUserId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/user/${userId}`, { data: { currentUserId } })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getComments = async (postId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${postId}/comments`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getUserPosts = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/user/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updatePost = async (postId, postData) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/post/${postId}`, postData)

    return response.data
  } catch (error) {
    throw error.response?.data || { message: error.message }
  }
}

export const deletePost = async (postId, userId) => {
  try {

    const api = createAxiosInstance()
    const response = await api.delete(`/post/${postId}`, { data: { userId } })

    return response.data
  } catch (error) {
    throw error.response?.data || { message: error.message }
  }
}

export const getPostLikes = async (postId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${postId}/likes`)
    return response.data
  } catch (error) {
    throw error.response?.data || { message: error.message }
  }
}

export const savePost = async (postId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.post(`/post/${postId}/save`, { userId })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getSavedPosts = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/saved/${userId}`)
    return response.data
  } catch (error) {
    return []
  }
}

export const isPostSaved = async (postId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/saved/${postId}/${userId}`)
    return response.data.isSaved
  } catch (error) {
    return false
  }
}

export const getSavedPostsCount = async (userId) => {
  try {
    const savedPosts = await getSavedPosts(userId)
    return savedPosts.length
  } catch (error) {
    return 0
  }
}

export const getPostsByHashtag = async (tag) => {
  try {
    const api = createAxiosInstance()
    const cleanTag = encodeURIComponent(tag.trim())
    const response = await api.get(`/post/hashtag/${cleanTag}`)

    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getTrendingHashtags = async () => {
  try {
    const api = createAxiosInstance()
    const response = await api.get("/post/hashtags/trending")
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getUserNotifications = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/notifications/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const markNotificationAsRead = async (notificationId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/notifications/${notificationId}/read`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/notifications/${userId}/read-all`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteNotification = async (notificationId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.delete(`/notifications/${notificationId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getPost = async (postId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${postId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const searchPosts = async (query) => {
  try {
    const api = createAxiosInstance()
    // Changed to send the query in the request body instead of as a URL parameter
    const response = await api.post(`/post/search`, { query })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Add this to your existing api.js file if you need to fetch location data directly
// This is an alternative approach if you don't want to use the LocationAutocomplete component

export const searchLocations = async (query) => {
  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        query,
      )}&format=json&apiKey=YOUR_GEOAPIFY_API_KEY`,
    )
    const data = await response.json()
    return data.results || []
  } catch (error) {
    throw error
  }
}

// Chat-related API functions
export const getUserChats = async (userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/chat/${userId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getChatHistory = async (userId, recipientId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/chat/${userId}/${recipientId}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const sendMessage = async (senderId, recipientId, text) => {
  try {
    const api = createAxiosInstance()
    const response = await api.post("/chat", { senderId, recipientId, text })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/chat/${chatId}/${userId}/read`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}


export const editMessage = async (chatId, messageId, userId, text) => {
  try {
    const api = createAxiosInstance()
    const response = await api.put(`/chat/${chatId}/${messageId}/edit`, { userId, text })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteMessage = async (chatId, messageId, userId) => {
  try {
    const api = createAxiosInstance();
    console.log('Sending delete request:', { chatId, messageId, userId }); // Debug log
    const response = await api.delete(`/chat/${chatId}/${messageId}`, { 
      data: { userId },
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Delete response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Delete message error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      request: error.request,
      config: error.config
    });
    throw error.response?.data || error.message;
  }
}

export const deleteChat = async (chatId, userId) => {
  try {
    const api = createAxiosInstance()
    console.log('Deleting chat:', { chatId, userId }); // Debug log
    const response = await api.delete(`/chat/${chatId}/${userId}`)
    return response.data
  } catch (error) {
    console.error('Delete chat error:', error.response?.data || error.message);
    throw error.response?.data || error.message
  }
}

export const getPostsByCategory = async (category) => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/category/${category}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Get categories with post counts
export const getCategoriesWithCounts = async () => {
  try {
    const api = createAxiosInstance()
    const response = await api.get("/post/categories/counts")
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Get timeline posts with category filter
export const getTimelinePostsWithCategory = async (userId, category = "all") => {
  try {
    const api = createAxiosInstance()
    const response = await api.get(`/post/${userId}/timeline-category?category=${category}`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}


export default createAxiosInstance