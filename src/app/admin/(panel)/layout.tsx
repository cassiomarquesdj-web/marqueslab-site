import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/admin/actions";
import { getAdminSession } from "@/lib/admin/auth";
import { roleLabels, sections } from "@/lib/admin/resources";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const items = sections.filter((s) => s.roles.includes(session.role));

  return (
    <div className="md:grid md:grid-cols-[15rem_1fr]">
      <aside className="bg-ink-2 border-b border-white/10 p-4 md:sticky md:top-0 md:h-svh md:overflow-y-auto md:border-r md:border-b-0">
        <p className="font-display text-lg font-bold">
          MARQUES<span className="text-flame">LAB</span>
          <span className="text-steel ml-2 font-mono text-[10px] tracking-widest">CMS</span>
        </p>
        <nav aria-label="Painel" className="mt-6">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 md:block md:space-y-1">
            {items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="text-steel block py-1.5 font-mono text-xs tracking-widest uppercase hover:text-white"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4 text-xs">
          <p className="truncate">{session.name}</p>
          <p className="text-steel">{roleLabels[session.role]}</p>
          <form action={logout} className="mt-3">
            <button className="text-flame-soft font-mono tracking-widest uppercase hover:underline">
              Sair
            </button>
          </form>
          <Link href="/" className="text-steel mt-3 block hover:text-white">
            Ver site ↗
          </Link>
        </div>
      </aside>
      <div className="p-4 sm:p-8">{children}</div>
    </div>
  );
}
