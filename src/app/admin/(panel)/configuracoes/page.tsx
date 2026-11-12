import { saveSettings } from "@/app/admin/actions";
import { requireRole } from "@/lib/admin/auth";
import { Notice, PageTitle, inputCls, submitCls } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ erro?: string; salvo?: string }> };

const fields: { key: string; label: string; type?: "textarea" | "image"; help?: string }[] = [
  { key: "company_name", label: "Nome da empresa" },
  { key: "company_info", label: "Informações institucionais (endereço, CNPJ…)", type: "textarea" },
  { key: "instagram", label: "Instagram (URL)" },
  {
    key: "whatsapp",
    label: "WhatsApp (com DDI e DDD)",
    help: "Ex.: 5591999999999. Sem número, o botão flutuante não aparece.",
  },
  { key: "email", label: "E-mail comercial" },
  { key: "seo_title", label: "SEO: título padrão" },
  { key: "seo_description", label: "SEO: descrição padrão", type: "textarea" },
  {
    key: "analytics_id",
    label: "Google Analytics (ID G-XXXXXXXXXX)",
    help: "Apenas o ID de medição; o script oficial é inserido pelo site.",
  },
  { key: "logo_url", label: "Logo", type: "image" },
  { key: "favicon_url", label: "Favicon", type: "image" },
];

export default async function SettingsPage({ searchParams }: Props) {
  const s = await requireRole(["admin"]);
  const sp = await searchParams;
  const { data } = await s.supabase.from("site_settings").select("key,value");
  const values = Object.fromEntries(
    (data ?? []).map((r) => [r.key, typeof r.value === "string" ? r.value : ""]),
  );

  return (
    <>
      <PageTitle title="Configurações" />
      <Notice params={sp} />
      <form action={saveSettings} className="max-w-3xl space-y-5">
        {fields.map((f) => (
          <div key={f.key}>
            <label
              htmlFor={f.key}
              className="mb-1.5 block font-mono text-xs tracking-widest uppercase"
            >
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={f.key}
                name={f.key}
                rows={4}
                defaultValue={values[f.key] ?? ""}
                className={inputCls}
              />
            ) : f.type === "image" ? (
              <div className="space-y-2">
                {values[f.key] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={values[f.key]}
                    alt=""
                    className="bg-ink-3 h-16 w-auto border border-white/10"
                  />
                )}
                <input type="hidden" name={f.key} value={values[f.key] ?? ""} />
                <input
                  id={f.key}
                  type="file"
                  name={`${f.key}__file`}
                  accept="image/*"
                  className="text-steel file:bg-ink-3 file:mr-3 file:border-0 file:px-3 file:py-2 file:text-white"
                />
              </div>
            ) : (
              <input
                id={f.key}
                name={f.key}
                defaultValue={values[f.key] ?? ""}
                className={inputCls}
              />
            )}
            {f.help && <p className="text-steel mt-1 text-xs">{f.help}</p>}
          </div>
        ))}
        <button className={submitCls}>Salvar</button>
      </form>
    </>
  );
}
