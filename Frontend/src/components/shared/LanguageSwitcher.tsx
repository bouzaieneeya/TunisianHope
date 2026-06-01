import { useI18n } from "@/context/I18nContext";
import { LOCALES } from "@/i18n";
import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "" : "min-w-[140px]"}`}>
      {!compact && <Languages className="w-4 h-4 text-muted-foreground shrink-0" />}
      <Select value={locale} onValueChange={(v) => setLocale(v as typeof locale)}>
        <SelectTrigger className={`h-9 text-xs ${compact ? "w-[110px]" : "w-full"}`}>
          <SelectValue placeholder={t("language.label")} />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {t(l.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
