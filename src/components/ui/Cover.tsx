import Image from "next/image";
import { ConceptCover } from "@/components/ui/ConceptCover";
import { cn } from "@/lib/utils/cn";

type Props = {
  url?: string;
  label: string;
  alt?: string;
  demo?: boolean;
  className?: string;
};

/** Mostra a mídia real quando existe; caso contrário, a capa conceitual identificada. */
export function Cover({ url, label, alt, demo = false, className }: Props) {
  if (!url) return <ConceptCover label={label} demo={demo} className={className} />;
  return (
    <div className={cn("bg-ink-3 relative aspect-[4/3] overflow-hidden", className)}>
      <Image
        src={url}
        alt={alt ?? label}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}
