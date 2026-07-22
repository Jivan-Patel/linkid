"use client";

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        router.refresh();
    });
  };

  return (
    <Select defaultValue={locale} onValueChange={handleLocaleChange} disabled={isPending}>
        <SelectTrigger className="w-[70px] border-none bg-transparent shadow-none focus:ring-0 px-2 h-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-violet-700 dark:hover:text-violet-300">
            <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span className="text-xs font-medium uppercase">{locale}</span>
            </div>
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="en">English (EN)</SelectItem>
            <SelectItem value="es">Español (ES)</SelectItem>
        </SelectContent>
    </Select>
  );
}
