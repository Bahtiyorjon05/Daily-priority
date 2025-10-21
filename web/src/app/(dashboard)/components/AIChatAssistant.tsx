'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Sparkles, 
  Lightbulb, 
  Target, 
  Clock,
  Zap,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { generateTaskSuggestions } from '@/lib/ai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'suggestion' | 'insight' | 'task' | 'general'
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI productivity assistant. How can I help you today?',
      timestamp: new Date(),
      type: 'general'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sample AI responses based on common queries
  const getAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Task suggestions
    if (lowerMessage.includes('suggest') || lowerMessage.includes('recommend') || lowerMessage.includes('task')) {
      try {
        const suggestions = await generateTaskSuggestions({
          completedTasks: [],
          currentTime: new Date().toLocaleTimeString(),
          userGoals: 'Improve productivity',
          energyLevel: 'MEDIUM'
        })
        
        if (suggestions.tasks?.length > 0) {
          const task = suggestions.tasks[0]
          return 'I suggest: **' + (task.title) + '** - ' + (task.description) + '. ' + (task.reason)
        }
      } catch (error) {
        console.error('AI suggestion error:', error)
      }
      
      return "Here's a task suggestion: **Review your daily priorities** - Start your day by organizing your tasks. This helps increase productivity by 25%."
    }
    
    // Focus/Time management
    if (lowerMessage.includes('focus') || lowerMessage.includes('time') || lowerMessage.includes('productive')) {
      return "For better focus, try the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-30 minute break."
    }
    
    // Goal setting
    if (lowerMessage.includes('goal') || lowerMessage.includes('achieve') || lowerMessage.includes('target')) {
      return "SMART goals are effective: **Specific**, **Measurable**, **Achievable**, **Relevant**, and **Time-bound**. Break big goals into smaller milestones."
    }
    
    // Motivation
    if (lowerMessage.includes('motivate') || lowerMessage.includes('inspire') || lowerMessage.includes('energy')) {
      return "Remember: 'The best time to plant a tree was 20 years ago. The second best time is now.' Start with one small task today to build momentum."
    }
    
    // Prayer/Spiritual
    if (lowerMessage.includes('pray') || lowerMessage.includes('spiritual') || lowerMessage.includes('allah')) {
      return "Regular prayer and remembrance of Allah (Dhikr) can bring peace and focus to your day. Try setting reminders for the five daily prayers."
    }
    
    // Default response
    return "I'm here to help boost your productivity! You can ask me for task suggestions, time management tips, goal setting advice, or spiritual guidance. What would you like to focus on today?"
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Get AI response
      const response = await getAIResponse(inputValue)
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'general'
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      // Add error response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date(),
        type: 'general'
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    let message = ''
    
    switch (action) {
      case 'tasks':
        message = "Can you suggest some productive tasks for me?"
        break
      case 'focus':
        message = "How can I improve my focus and concentration?"
        break
      case 'goals':
        message = "Help me set effective goals for this week"
        break
      case 'motivation':
        message = "I need some motivation to get started"
        break
      default:
        message = "What productivity tips do you have for me?"
    }
    
    setInputValue(message)
  }

  const formatMessage = (content: string) => {
    // Convert markdown-like bold to HTML
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setIsOpen(true)}
              aria-label="Open AI chat assistant"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 w-full max-w-md h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col z-50 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Productivity Assistant</h3>
                    <p className="text-xs text-emerald-100">Always here to help</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={'flex ' + (message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={'max-w-[80%] rounded-2xl px-4 py-3 ' + (message.role === 'user'
                        ? 'bg-emerald-500 text-white rounded-br-none'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none')}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-medium">AI Assistant</span>
                      </div>
                    )}
                    {message.role === 'user' && (
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs font-medium">You</span>
                      </div>
                    )}
                    <div 
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-medium">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-8 text-xs"
                  onClick={() => handleQuickAction('tasks')}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Suggest Tasks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-8 text-xs"
                  onClick={() => handleQuickAction('focus')}
                >
                  <Target className="h-3 w-3 mr-1" />
                  Focus Tips
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-8 text-xs"
                  onClick={() => handleQuickAction('goals')}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Set Goals
                </Button>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
              <div className="flex gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask for productivity tips, task suggestions, or spiritual guidance..."
                  className="flex-1 min-h-[40px] max-h-[100px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                AI assistant powered by Gemini. Responses may vary.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}