import { workProcess } from "@/lib/process";
import { Reveal } from "@/components/animations/Reveal";

export function ProcessSteps() {
  return (
    <ol className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-4">
      {workProcess.map((s, i) => (
        <li key={s.title} className="bg-ink p-8">
          <Reveal delay={i * 0.06}>
            <span className="text-flame font-mono text-xs tracking-widest">0{i + 1}</span>
            <h3 className="font-display mt-4 text-xl font-bold uppercase">{s.title}</h3>
            <p className="text-steel mt-3 text-sm">{s.text}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
