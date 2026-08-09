'use client'

import { useT } from '@/lib/i18n/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'

interface FocusSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  enableMusic: boolean
  musicVolume: number
}

interface FocusSettingsPanelProps {
  show: boolean
  settings: FocusSettings
  onSettingsChange: (settings: FocusSettings) => void
  onSave: () => void
}

export function FocusSettingsPanel({ show, settings, onSettingsChange, onSave }: FocusSettingsPanelProps) {
  const { t } = useT()
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="accent-border mb-6 border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="accent-ink font-bold">{t('ui.focusSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Durations */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-gray-300 font-semibold">{t('ui.focusDurationMin')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.focusDuration}
                    onChange={(e) => onSettingsChange({ ...settings, focusDuration: parseInt(e.target.value) || 25 })}
                    className="text-slate-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-gray-300 font-semibold">{t('ui.shortBreakMin')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreakDuration}
                    onChange={(e) => onSettingsChange({ ...settings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                    className="text-slate-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-gray-300 font-semibold">{t('ui.longBreakMin')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) => onSettingsChange({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })}
                    className="text-slate-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Auto-start Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-slate-900 dark:text-gray-100 font-semibold">{t('ui.autoStartBreaks')}</Label>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {t('ui.automaticallyStartBreakTimerAfterFocusSessio')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoStartBreaks}
                    onCheckedChange={(checked) => onSettingsChange({ ...settings, autoStartBreaks: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-slate-900 dark:text-gray-100 font-semibold">{t('ui.autoStartFocus')}</Label>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {t('ui.automaticallyStartFocusTimerAfterBreak')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoStartFocus}
                    onCheckedChange={(checked) => onSettingsChange({ ...settings, autoStartFocus: checked })}
                  />
                </div>
              </div>

              {/* Music Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-slate-900 dark:text-gray-100 font-semibold">{t('ui.enableMusic')}</Label>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {t('ui.playBackgroundMusicDuringFocusSessions')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableMusic}
                    onCheckedChange={(checked) => onSettingsChange({ ...settings, enableMusic: checked })}
                  />
                </div>

                {settings.enableMusic && (
                  <div className="space-y-2 p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 shadow-sm">
                    <Label className="text-slate-700 dark:text-gray-300 font-semibold">{t('ui.volume')} {settings.musicVolume}%</Label>
                    <Slider
                      value={[settings.musicVolume]}
                      onValueChange={(value) => onSettingsChange({ ...settings, musicVolume: value[0] })}
                      max={100}
                      step={1}
                    />
                  </div>
                )}
              </div>

              <Button onClick={onSave} className="accent-solid h-12 w-full font-semibold shadow-sm">
                {t('ui.saveSettings')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
