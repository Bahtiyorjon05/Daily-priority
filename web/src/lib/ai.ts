import { GoogleGenerativeAI } from '@google/generative-ai'

// Check for API key and provide helpful error
const apiKey = process.env.GOOGLE_AI_API_KEY

if (!apiKey) {
  console.warn('⚠️  GOOGLE_AI_API_KEY not configured!')
  console.warn('📝 AI features will use fallback mode with mock data.')
  console.warn('🔑 To enable real AI: Add GOOGLE_AI_API_KEY to your .env.local file')
  console.warn('💡 Get API key from: https://makersuite.google.com/app/apikey')
}

// Initialize Gemini AI with performance optimizations
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// Cache for AI suggestions to improve performance
const suggestionCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export async function generateTaskSuggestions(context: {
  completedTasks: string[]
  currentTime: string
  userGoals?: string
  energyLevel?: string
  userId?: string
}) {
  try {
    // If no API key, use fallback immediately
    if (!genAI) {
      console.info('🤖 Using fallback task suggestions (no API key)')
      return getFallbackTasks(context)
    }

    // Create cache key based on context
    const cacheKey = (context.userId || 'anonymous') + '-' + (context.completedTasks.join(',')) + '-' + (context.energyLevel) + '-' + (new Date().getHours())

    // Check cache first
    if (suggestionCache.has(cacheKey)) {
      const cached = suggestionCache.get(cacheKey)!
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return { ...cached.data, cached: true }
      }
      suggestionCache.delete(cacheKey)
    }

    // Using Gemini Flash 2.5 - BEST MODEL!
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000, // Limit output for faster response
      }
    })

    // Smart context analysis
    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    
    const prompt = `🚀 SMART PRODUCTIVITY AI: Generate 3-4 high-impact tasks for maximum productivity.

📊 CONTEXT ANALYSIS:
- Time: ${timeOfDay} (${context.currentTime})
- Day: ${dayOfWeek}
- Recent completions: ${context.completedTasks.length > 0 ? context.completedTasks.slice(0, 5).join(', ') : 'No recent tasks'}
- Energy: ${context.energyLevel || 'Medium'}
- Goals: ${context.userGoals || 'Personal productivity'}

🎯 RETURN ONLY VALID JSON:
{
  "tasks": [
    {
      "title": "Concise actionable title (max 50 chars)",
      "description": "Clear 2-sentence description",
      "reason": "Why this task boosts productivity now",
      "priority": "HIGH|MEDIUM|LOW",
      "urgent": true/false,
      "important": true/false,
      "estimatedTime": 15-120,
      "energyLevel": "HIGH|MEDIUM|LOW"
    }
  ]
}

🧠 SMART RULES:
- ${timeOfDay} tasks: ${timeOfDay === 'morning' ? 'Planning, important work' : timeOfDay === 'afternoon' ? 'Meetings, collaboration' : 'Review, light tasks'}
- Match energy: ${context.energyLevel === 'HIGH' ? 'Complex/creative work' : context.energyLevel === 'MEDIUM' ? 'Balanced mix' : 'Simple, routine tasks'}
- Build on: ${context.completedTasks.length > 0 ? 'Follow up on recent work' : 'Start fresh initiatives'}
- Islamic productivity: Include purposeful, value-driven tasks`

    // Generate with timeout for performance
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI timeout')), 15000) // 15 second timeout
    )
    
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]) as any

    const response = result.response.text()
    
    // Enhanced JSON parsing with better error recovery
    let parsedResponse
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.warn('AI JSON parse error, using fallback tasks')
      parsedResponse = getFallbackTasks(context)
    }

    // Cache successful response
    if (parsedResponse?.tasks?.length > 0) {
      suggestionCache.set(cacheKey, {
        data: parsedResponse,
        timestamp: Date.now()
      })
    }
    
    return parsedResponse
  } catch (error) {
    console.error('AI suggestion error:', error)
    return getFallbackTasks(context)
  }
}

// Smart fallback tasks based on context
function getFallbackTasks(context: any) {
  const hour = new Date().getHours()
  const isEarlyMorning = hour < 9
  const isEvening = hour > 18
  
  const fallbackTasks = [
    {
      title: isEarlyMorning ? "Plan your day priorities" : isEvening ? "Review today's progress" : "Focus on high-impact work",
      description: isEarlyMorning ? "Set clear goals and priorities for maximum productivity." : isEvening ? "Reflect on achievements and plan tomorrow." : "Tackle your most important task with full concentration.",
      reason: "Structured planning leads to better outcomes and reduced stress",
      priority: "HIGH",
      urgent: isEarlyMorning,
      important: true,
      estimatedTime: 30,
      energyLevel: context.energyLevel || "MEDIUM"
    },
    {
      title: "Complete a quick win task",
      description: "Choose something achievable to build momentum and confidence.",
      reason: "Quick wins boost motivation and create positive momentum",
      priority: "MEDIUM",
      urgent: false,
      important: false,
      estimatedTime: 15,
      energyLevel: "LOW"
    }
  ]
  
  return { tasks: fallbackTasks }
}

export async function analyzeProductivity(data: {
  completedTasks: number
  totalTasks: number
  focusTime: number
  completionRate: number
}) {
  try {
    if (!genAI) {
      return {
        analysis: 'Keep up the good work!',
        recommendations: ['Continue tracking your tasks', 'Set specific time blocks', 'Review your goals weekly'],
        score: 75
      }
    }

    // Using Gemini Flash 2.5 - BEST MODEL!
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Analyze this productivity data and provide actionable insights:

Stats:
- Completed: ${data.completedTasks}/${data.totalTasks} tasks
- Focus time: ${data.focusTime} minutes
- Completion rate: ${data.completionRate}%

Provide a brief analysis (2-3 sentences) and 2-3 specific recommendations to improve productivity.
Format as JSON:
{
  "analysis": "Brief analysis",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "score": number (0-100)
}`

    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return {
      analysis: 'Keep up the good work!',
      recommendations: ['Continue tracking your tasks', 'Set specific time blocks', 'Review your goals weekly'],
      score: 75
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      analysis: 'Unable to analyze at this time',
      recommendations: [],
      score: 0
    }
  }
}

export async function generateTaskBreakdown(taskTitle: string, description?: string) {
  try {
    if (!genAI) {
      return {
        subtasks: [
          `Research and plan ${taskTitle}`,
          `Execute main work for ${taskTitle}`,
          `Review and finalize ${taskTitle}`
        ]
      }
    }

    // Using Gemini Flash 2.5 - BEST MODEL!
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Break down this task into 3-5 actionable subtasks:

Task: ${taskTitle}
${description ? `Description: ${description}` : ''}

Return as JSON:
{
  "subtasks": [
    {
      "title": "Subtask title",
      "estimatedTime": number (minutes)
    }
  ]
}`

    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return { subtasks: [] }
  } catch (error) {
    console.error('AI breakdown error:', error)
    return { subtasks: [] }
  }
}
