/**
 * Data Backup API
 * Export and import full user data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for import
const BackupSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  user: z.object({
    name: z.string().optional(),
    email: z.string().email(),
    location: z.string().optional(),
    timezone: z.string().optional(),
  }),
  tasks: z.array(z.any()).optional(),
  goals: z.array(z.any()).optional(),
  habits: z.array(z.any()).optional(),
  journal: z.array(z.any()).optional(),
  focusSessions: z.array(z.any()).optional(),
  categories: z.array(z.any()).optional(),
  preferences: z.any().optional(),
  settings: z.any().optional(),
})

/**
 * POST /api/user/backup/import
 * Import user data from backup
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate backup data
    const validation = BackupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid backup file format', details: validation.error },
        { status: 400 }
      )
    }

    const backup = validation.data

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      const stats = {
        tasks: 0,
        goals: 0,
        habits: 0,
        journal: 0,
        focusSessions: 0,
        categories: 0,
      }

      // Import Categories first (tasks depend on them)
      if (backup.categories) {
        for (const category of backup.categories) {
          await tx.category.create({
            data: {
              name: category.name,
              color: category.color,
              icon: category.icon,
              userId: user.id,
            },
          })
          stats.categories++
        }
      }

      // Import Tasks
      if (backup.tasks) {
        for (const task of backup.tasks) {
          await tx.task.create({
            data: {
              title: task.title,
              description: task.description,
              status: task.status || 'TODO',
              priority: task.priority || 'MEDIUM',
              urgent: task.urgent || false,
              important: task.important || false,
              estimatedTime: task.estimatedTime,
              energyLevel: task.energyLevel,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              completedAt: task.completedAt ? new Date(task.completedAt) : null,
              userId: user.id,
            },
          })
          stats.tasks++
        }
      }

      // Import Goals
      if (backup.goals) {
        for (const goal of backup.goals) {
          await tx.goal.create({
            data: {
              title: goal.title,
              description: goal.description,
              category: goal.category || 'PERSONAL',
              target: goal.target,
              progress: goal.progress || 0,
              deadline: goal.deadline ? new Date(goal.deadline) : null,
              completed: goal.completed || false,
              goalType: goal.goalType || 'DUNYA',
              status: goal.status || 'IN_PROGRESS',
              userId: user.id,
            },
          })
          stats.goals++
        }
      }

      // Import Habits
      if (backup.habits) {
        for (const habit of backup.habits) {
          await tx.habit.create({
            data: {
              title: habit.title,
              description: habit.description,
              frequency: habit.frequency || 'DAILY',
              targetDays: habit.targetDays || 7,
              streak: habit.streak || 0,
              longestStreak: habit.longestStreak || 0,
              userId: user.id,
            },
          })
          stats.habits++
        }
      }

      // Import Journal Entries
      if (backup.journal) {
        for (const entry of backup.journal) {
          await tx.journalEntry.create({
            data: {
              date: new Date(entry.date),
              gratitude1: entry.gratitude1,
              gratitude2: entry.gratitude2,
              gratitude3: entry.gratitude3,
              reflection: entry.reflection,
              mood: entry.mood,
              duas: entry.duas,
              goodDeeds: entry.goodDeeds,
              hijriDate: entry.hijriDate,
              lessons: entry.lessons,
              userId: user.id,
            },
          })
          stats.journal++
        }
      }

      // Import Focus Sessions
      if (backup.focusSessions) {
        for (const session of backup.focusSessions) {
          await tx.focusSession.create({
            data: {
              duration: session.duration,
              taskTitle: session.taskTitle,
              sessionType: session.sessionType || 'work',
              completed: session.completed !== false,
              date: new Date(session.date),
              userId: user.id,
            },
          })
          stats.focusSessions++
        }
      }

      // Update Preferences
      if (backup.preferences) {
        await tx.userPreference.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            showHijriDate: backup.preferences.showHijriDate ?? true,
            prayerReminderMinutes: backup.preferences.prayerReminderMinutes ?? 10,
            ramadanMode: backup.preferences.ramadanMode ?? false,
            language: backup.preferences.language ?? 'en',
          },
          update: {
            showHijriDate: backup.preferences.showHijriDate ?? true,
            prayerReminderMinutes: backup.preferences.prayerReminderMinutes ?? 10,
            ramadanMode: backup.preferences.ramadanMode ?? false,
            language: backup.preferences.language ?? 'en',
          },
        })
      }

      // Update Settings
      if (backup.settings) {
        await tx.userSettings.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            focusDuration: backup.settings.focusDuration ?? 25,
            shortBreakDuration: backup.settings.shortBreakDuration ?? 5,
            longBreakDuration: backup.settings.longBreakDuration ?? 15,
            autoStartBreaks: backup.settings.autoStartBreaks ?? false,
            autoStartFocus: backup.settings.autoStartFocus ?? false,
            enableMusic: backup.settings.enableMusic ?? true,
            musicVolume: backup.settings.musicVolume ?? 50,
          },
          update: {
            focusDuration: backup.settings.focusDuration ?? 25,
            shortBreakDuration: backup.settings.shortBreakDuration ?? 5,
            longBreakDuration: backup.settings.longBreakDuration ?? 15,
            autoStartBreaks: backup.settings.autoStartBreaks ?? false,
            autoStartFocus: backup.settings.autoStartFocus ?? false,
            enableMusic: backup.settings.enableMusic ?? true,
            musicVolume: backup.settings.musicVolume ?? 50,
          },
        })
      }

      return stats
    })

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      stats: result,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import data', details: error.message },
      { status: 500 }
    )
  }
}
