const fs = require('fs');
const path = require('path');

// List of files that had errors
const problematicFiles = [
  'src/app/(dashboard)/calendar/page.tsx',
  'src/app/(dashboard)/journal/page.tsx',
  'src/app/api/ai/service/route.ts'
];

problematicFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix broken multi-line className with ${...} that got mangled
  // Pattern: className={'...${...}  becomes multi-line mess

  // Fix calendar.tsx - broken multi-line className
  if (file.includes('calendar')) {
    content = content.replace(
      /className=\{'[^']*\n[^']*\n[^']*' \+ \(day\.isCurrentMonth[^}]+\}\)/gs,
      `className={
                  day.isCurrentMonth
                    ? 'min-h-[100px] p-2 rounded-lg border transition-all duration-200 hover:border-[rgb(var(--page-primary))]/50 hover:bg-[rgb(var(--page-primary))]/5 hover:scale-105 bg-background'
                    : 'min-h-[100px] p-2 rounded-lg border transition-all duration-200 hover:border-[rgb(var(--page-primary))]/50 hover:bg-[rgb(var(--page-primary))]/5 hover:scale-105 bg-muted/30 opacity-50'
                }`
    );
  }

  // Fix journal.tsx - broken multi-line className
  if (file.includes('journal')) {
    content = content.replace(
      /className=\{'p-4 rounded-lg border-2 transition-all hover:scale-105 \$\{[^']+\n[^']+\n[^']+\}/gs,
      `className={
                      newEntry.mood === key
                        ? 'p-4 rounded-lg border-2 transition-all hover:scale-105 bg-gradient-to-br from-emerald-500 to-teal-500 border-transparent text-white shadow-lg'
                        : 'p-4 rounded-lg border-2 transition-all hover:scale-105 border-[rgb(var(--page-primary))]/20 hover:border-[rgb(var(--page-primary))]/50'
                    }`
    );
  }

  // Fix AI service - broken string concatenation
  if (file.includes('ai/service')) {
    content = content.replace(
      /message:\s*'You'[^']*' \+ \(completionRate\.toFixed\(0\)\) \+ '[^']*\n[^']*work!/g,
      `message: "You're completing " + (completionRate.toFixed(0)) + "% of your tasks. Keep up the great work!"`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Fixed: ${file}`);
});

console.log('\n✅ All broken multi-line templates fixed!');
