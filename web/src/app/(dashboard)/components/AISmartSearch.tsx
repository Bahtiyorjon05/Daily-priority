'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Target,
  Calendar,
  BookOpen,
  Timer,
  Sparkles,
  Lightbulb,
  Clock,
  CheckCircle2,
  Circle,
  Flag,
  Tag,
  User,
  Settings,
  Activity,
  Zap,
  Brain,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateTaskSuggestions } from '@/lib/ai'

interface SearchItem {
  id: string
  type: 'task' | 'goal' | 'prayer' | 'journal' | 'ai-suggestion'
  title: string
  description?: string
  category?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  dueDate?: string
  createdAt: string
  score?: number
  aiReason?: string
  tags?: string[]
}

interface AISearchSuggestion {
  id: string
  query: string
  description: string
  category: string
}

export default function AISmartSearch({ 
  isOpen, 
  onClose, 
  onNavigate,
  session
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onNavigate: (path: string) => void;
  session: any;
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<AISearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem('search-history')
      if (history) {
        setSearchHistory(JSON.parse(history))
      }
    }
  }, [])

  // Save search history to localStorage
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('search-history', JSON.stringify(searchHistory))
    }
  }, [searchHistory])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        handleResultClick(searchResults[activeIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeIndex, searchResults, onClose])

  // Generate AI search suggestions
  const generateAISuggestions = async (query: string) => {
    if (!query.trim()) {
      setAiSuggestions([])
      return
    }

    try {
      // Get user context for AI suggestions
      const userContext = {
        completedTasks: [], // In a real app, this would come from user data
        currentTime: new Date().toLocaleTimeString(),
        userGoals: 'Improve productivity and spiritual growth',
        energyLevel: 'MEDIUM',
        userId: session?.user?.id
      }
      
      const suggestions = await generateTaskSuggestions(userContext)
      
      // Transform suggestions into search suggestions
      const searchSuggestions: AISearchSuggestion[] = [
        {
          id: 'suggestion-1',
          query: `Tasks due today`,
          description: 'Find all tasks scheduled for today',
          category: 'Tasks'
        },
        {
          id: 'suggestion-2',
          query: `High priority tasks`,
          description: 'View your most important tasks',
          category: 'Tasks'
        },
        {
          id: 'suggestion-3',
          query: `Completed tasks this week`,
          description: 'Review your recent accomplishments',
          category: 'Tasks'
        }
      ]
      
      // Add AI-generated suggestions
      if (suggestions.tasks?.length > 0) {
        const aiSearchSuggestions = suggestions.tasks.slice(0, 3).map((task: any, index: number) => ({
          id: 'ai-search-' + (index),
          query: task.title,
          description: task.description.substring(0, 60) + '...',
          category: 'AI Suggestion'
        }))
        
        searchSuggestions.push(...aiSearchSuggestions)
      }
      
      setAiSuggestions(searchSuggestions)
    } catch (error) {
      console.error('Failed to generate AI search suggestions:', error)
      // Fallback suggestions
      setAiSuggestions([
        {
          id: 'fallback-1',
          query: 'Prayer times',
          description: 'Find prayer schedules and tracking',
          category: 'Prayers'
        },
        {
          id: 'fallback-2',
          query: 'Focus sessions',
          description: 'View your deep work sessions',
          category: 'Focus'
        },
        {
          id: 'fallback-3',
          query: 'Weekly goals',
          description: 'Track your progress on weekly objectives',
          category: 'Goals'
        }
      ])
    }
  }

  // Perform search
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    
    // Simulate search results
    setTimeout(() => {
      const mockResults: SearchItem[] = [
        {
          id: 'task-1',
          type: 'task' as const,
          title: 'Complete project proposal',
          description: 'Finish the quarterly project proposal document',
          category: 'Work',
          priority: 'HIGH' as const,
          status: 'TODO' as const,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          score: 95
        },
        {
          id: 'task-2',
          type: 'task' as const,
          title: 'Morning prayer',
          description: 'Perform Fajr prayer on time',
          category: 'Spiritual',
          priority: 'HIGH' as const,
          status: 'COMPLETED' as const,
          createdAt: new Date().toISOString(),
          score: 90
        },
        {
          id: 'goal-1',
          type: 'goal' as const,
          title: 'Read 30 pages of Quran daily',
          description: 'Complete daily Quran reading goal',
          category: 'Spiritual',
          priority: 'HIGH' as const,
          status: 'IN_PROGRESS' as const,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          score: 85
        },
        {
          id: 'prayer-1',
          type: 'prayer' as const,
          title: 'Dhuhr Prayer',
          description: 'Noon prayer time tracking',
          category: 'Prayers',
          createdAt: new Date().toISOString(),
          score: 80
        },
        {
          id: 'journal-1',
          type: 'journal' as const,
          title: 'Reflection on productivity',
          description: 'Daily journal entry about focus and goals',
          category: 'Journal',
          createdAt: new Date().toISOString(),
          score: 75
        },
        {
          id: 'ai-1',
          type: 'ai-suggestion' as const,
          title: 'Review team progress',
          description: 'Check in with team members on their tasks',
          category: 'Management',
          priority: 'MEDIUM' as const,
          status: 'TODO' as const,
          createdAt: new Date().toISOString(),
          score: 70,
          aiReason: 'Based on your management responsibilities'
        }
      ].filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.category?.toLowerCase().includes(query.toLowerCase()) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
      ).sort((a, b) => (b.score || 0) - (a.score || 0))

      setSearchResults(mockResults)
      setIsLoading(false)
      setActiveIndex(-1)
      
      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 4)])
      }
    }, 300)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (query.trim()) {
      performSearch(query)
      generateAISuggestions(query)
    } else {
      setSearchResults([])
      setAiSuggestions([])
    }
  }

  // Handle result click
  const handleResultClick = (item: SearchItem) => {
    // Add to search history
    if (!searchHistory.includes(searchQuery)) {
      setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)])
    }
    
    // Navigate based on item type
    switch (item.type) {
      case 'task':
        onNavigate('/dashboard')
        break
      case 'goal':
        onNavigate('/goals')
        break
      case 'prayer':
        onNavigate('/prayers')
        break
      case 'journal':
        onNavigate('/journal')
        break
      case 'ai-suggestion':
        onNavigate('/dashboard')
        break
      default:
        onNavigate('/dashboard')
    }
    
    onClose()
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: AISearchSuggestion) => {
    setSearchQuery(suggestion.query)
    performSearch(suggestion.query)
  }

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('search-history')
  }

  // Get icon for item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'task': return Target
      case 'goal': return Flag
      case 'prayer': return Activity
      case 'journal': return BookOpen
      case 'ai-suggestion': return Sparkles
      default: return Search
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search tasks, goals, prayers, or ask AI for suggestions..."
              className="pl-10 pr-10 bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-emerald-500"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Results */}
        <div 
          ref={resultsRef}
          className="max-h-[60vh] overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Search Results
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {searchResults.length} found
                </span>
              </div>
              
              <div className="space-y-1">
                {searchResults.map((item, index) => {
                  const Icon = getItemIcon(item.type)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        className={'w-full justify-start px-3 py-3 h-auto rounded-lg ' + (activeIndex === index 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700')}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleResultClick(item)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {item.title}
                              </p>
                              {item.type === 'ai-suggestion' && (
                                <div className="flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-purple-500" />
                                  <span className="text-xs text-purple-600 dark:text-purple-400">AI</span>
                                </div>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {item.category && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  {item.category}
                                </span>
                              )}
                              {item.priority && (
                                <span className={'text-xs px-2 py-0.5 rounded-full ' + (getPriorityColor(item.priority))}>
                                  {item.priority}
                                </span>
                              )}
                              {item.status && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  {item.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.score}%
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : searchQuery ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try different keywords or ask AI for suggestions
              </p>
            </div>
          ) : null}

          {/* AI Suggestions */}
          {!searchQuery && aiSuggestions.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-2 py-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Suggestions
                </h3>
              </div>
              
              <div className="space-y-1">
                {aiSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {suggestion.query}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {suggestion.description}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mt-1 inline-block">
                            {suggestion.category}
                          </span>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && !searchQuery && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-2 py-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Recent Searches
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearchHistory}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </Button>
              </div>
              
              <div className="space-y-1">
                {searchHistory.map((query, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setSearchQuery(query)
                      performSearch(query)
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 text-sm">
                        {query}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && aiSuggestions.length === 0 && searchHistory.length === 0 && (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Smart Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Search for tasks, goals, prayers, or ask AI for suggestions
              </p>
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <div className="flex items-center gap-1">
              <Brain className="h-3 w-3 text-purple-500" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}