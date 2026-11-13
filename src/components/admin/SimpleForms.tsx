"use client";

import { inputCls } from "@/components/admin/ui";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FieldError, FormError, invalidProps } from "@/components/admin/FormMessages";
import { pick, useFormAction } from "@/components/admin/useFormAction";
import type { FormState } from "@/lib/admin/form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
const invalidCls = inputCls.replace("border-white/15", "border-red-500");
const labelCls = "mb-1.5 block font-mono text-xs tracking-widest uppercase";

function cls(state: FormState, name: string) {
  return invalidProps(state, name).bad ? invalidCls : inputCls;
}
function a11y(state: FormState, name: string) {
  const p = invalidProps(state, name);
  return { "aria-invalid": p["aria-invalid"], "aria-describedby": p["aria-describedby"] };
}

// ───────────── login ─────────────
export function LoginForm({ action }: { action: Action }) {
  const { state, formAction } = useFormAction(action);
  return (
    <form action={formAction} className="mt-8 space-y-5">
      <FormError state={state} />
      <label className="block">
        <span className={labelCls}>E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className={inputCls}
          defaultValue={pick(state, "email", "")}
        />
      </label>
      <label className="block">
        <span className={labelCls}>Senha</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </label>
      <SubmitButton pendingLabel="Entrando…" className="w-full">
        Entrar
      </SubmitButton>
    </form>
  );
}

// ───────────── convite de usuário ─────────────
export function InviteForm({
  action,
  roles,
}: {
  action: Action;
  roles: { value: string; label: string }[];
}) {
  const { state, formAction } = useFormAction(action);
  return (
    <form action={formAction} className="mt-4 max-w-xl space-y-3">
      <FormError state={state} />
      <div className="flex flex-wrap gap-3">
        <div className="min-w-56 flex-1">
          <input
            name="email"
            type="email"
            required
            placeholder="E-mail"
            aria-label="E-mail"
            className={cls(state, "email")}
            defaultValue={pick(state, "email", "")}
            {...a11y(state, "email")}
          />
          <FieldError state={state} name="email" />
        </div>
        <select
          key={state.values?.role ?? "original"}
          name="role"
          aria-label="Papel"
          className={`${inputCls} w-auto`}
          defaultValue={pick(state, "role", "editor")}
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <SubmitButton pendingLabel="Enviando…">Enviar convite</SubmitButton>
      </div>
    </form>
  );
}

// ───────────── orçamento: status e observações ─────────────
export function LeadForm({
  action,
  statuses,
  status,
  notes,
}: {
  action: Action;
  statuses: readonly { value: string; label: string }[];
  status: string;
  notes: string;
}) {
  const { state, formAction } = useFormAction(action);
  return (
    <form action={formAction} className="space-y-4">
      <FormError state={state} />
      <label className="block">
        <span className={labelCls}>Status</span>
        <select
          key={state.values?.status ?? "original"}
          name="status"
          className={cls(state, "status")}
          defaultValue={pick(state, "status", status)}
          {...a11y(state, "status")}
        >
          {statuses.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <FieldError state={state} name="status" />
      </label>
      <label className="block">
        <span className={labelCls}>Observações internas</span>
        <textarea
          name="notes"
          rows={5}
          className={cls(state, "notes")}
          defaultValue={pick(state, "notes", notes)}
          {...a11y(state, "notes")}
        />
        <FieldError state={state} name="notes" />
      </label>
      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}

// ───────────── configurações ─────────────
type SettingField = { key: string; label: string; type?: "textarea" | "image"; help?: string };

export function SettingsForm({
  action,
  fields,
  values,
}: {
  action: Action;
  fields: SettingField[];
  values: Record<string, string>;
}) {
  const { state, formAction } = useFormAction(action);
  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <FormError state={state} />
      {fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className={labelCls}>
            {f.label}
          </label>
          {f.type === "textarea" ? (
            <textarea
              id={f.key}
              name={f.key}
              rows={4}
              className={cls(state, f.key)}
              defaultValue={pick(state, f.key, values[f.key] ?? "")}
              {...a11y(state, f.key)}
            />
          ) : f.type === "image" ? (
            <MediaUpload
              inputName={f.key}
              resourceKey="configuracoes"
              fieldName={f.key}
              current={state.values ? (state.values[f.key] ?? "") : (values[f.key] ?? "")}
              allowVideo={false}
              label={f.label}
            />
          ) : (
            <input
              id={f.key}
              name={f.key}
              className={cls(state, f.key)}
              defaultValue={pick(state, f.key, values[f.key] ?? "")}
              {...a11y(state, f.key)}
            />
          )}
          <FieldError state={state} name={f.key} />
          {f.help && <p className="text-steel mt-1 text-xs">{f.help}</p>}
        </div>
      ))}
      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}
