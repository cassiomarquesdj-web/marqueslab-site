import { saveSettings } from "@/app/admin/actions";
import { requireRole } from "@/lib/admin/auth";
import { Notice, PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SimpleForms";

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
      <SettingsForm action={saveSettings} fields={fields} values={values} />
    </>
  );
}
