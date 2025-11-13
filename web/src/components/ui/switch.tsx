import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50",
      // Light mode checked: BLACK/Dark gradient
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-slate-800 data-[state=checked]:via-slate-900 data-[state=checked]:to-slate-800 data-[state=checked]:border-slate-700 data-[state=checked]:shadow-lg data-[state=checked]:shadow-slate-800/60",
      // Light mode unchecked: Medium gray for visibility
      "data-[state=unchecked]:bg-slate-300 data-[state=unchecked]:border-slate-400",
      "dark:focus-visible:ring-purple-500 dark:focus-visible:ring-offset-slate-950",
      // Dark mode checked: Purple gradient
      "dark:data-[state=checked]:from-purple-600 dark:data-[state=checked]:via-indigo-600 dark:data-[state=checked]:to-purple-600 dark:data-[state=checked]:border-purple-500/50 dark:data-[state=checked]:shadow-purple-500/60",
      // Dark mode unchecked
      "dark:data-[state=unchecked]:bg-slate-700 dark:data-[state=unchecked]:border-slate-600",
      // Hover effects
      "hover:data-[state=unchecked]:bg-slate-400 dark:hover:data-[state=unchecked]:bg-slate-600",
      "hover:data-[state=checked]:shadow-xl hover:data-[state=checked]:shadow-slate-900/70 dark:hover:data-[state=checked]:shadow-purple-500/70",
      "hover:data-[state=checked]:scale-105",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-all duration-300",
        // Light mode: DARK thumb when OFF, WHITE thumb with border when ON
        "bg-slate-700 data-[state=checked]:bg-white data-[state=checked]:border-2 data-[state=checked]:border-slate-800",
        // Dark mode: WHITE thumb always, no extra border needed
        "dark:bg-white dark:data-[state=checked]:border-0",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5",
        "data-[state=checked]:shadow-xl data-[state=checked]:scale-105",
        // Ring for extra visibility
        "data-[state=checked]:ring-2 data-[state=checked]:ring-white/40 dark:data-[state=checked]:ring-purple-300/30"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
