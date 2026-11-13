"use client";

import { inputCls } from "@/components/admin/ui";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FieldError, FormError, invalidProps } from "@/components/admin/FormMessages";
import { pick, pickBool, useFormAction } from "@/components/admin/useFormAction";
import type { FormState } from "@/lib/admin/form-state";
import type { Field, Resource } from "@/lib/admin/resources";

type Props = {
  resource: Resource;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  values: Record<string, unknown>;
  isCreate: boolean;
  relationOptions: Record<string, { value: string; label: string }[]>;
};

const invalidCls = inputCls.replace("border-white/15", "border-red-500");

function Input({
  resourceKey,
  field,
  original,
  state,
  options,
  disabled,
}: {
  resourceKey: string;
  field: Field;
  original: unknown;
  state: FormState;
  options: { value: string; label: string }[];
  disabled: boolean;
}) {
  const id = `f-${field.name}`;
  const inv = invalidProps(state, field.name);
  const common = {
    id,
    name: field.name,
    disabled,
    className: inv.bad ? invalidCls : inputCls,
    "aria-invalid": inv["aria-invalid"],
    "aria-describedby": inv["aria-describedby"],
  };
  const str = original == null ? "" : String(original);

  switch (field.type) {
    case "textarea":
      return <textarea {...common} rows={5} defaultValue={pick(state, field.name, str)} />;
    case "number":
      return <input {...common} type="number" defaultValue={pick(state, field.name, str || "0")} />;
    case "boolean":
      return (
        <input
          id={id}
          name={field.name}
          type="checkbox"
          defaultChecked={pickBool(state, field.name, original === true)}
          disabled={disabled}
          className="accent-flame size-5"
        />
      );
    case "select":
      return (
        <select
          key={state.values?.[field.name] ?? "original"}
          {...common}
          defaultValue={pick(state, field.name, str || field.options?.[0]?.value || "")}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "relation":
      return (
        <select
          key={state.values?.[field.name] ?? "original"}
          {...common}
          defaultValue={pick(state, field.name, str)}
        >
          <option value="">— nenhum —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "tags":
      return (
        <textarea
          {...common}
          rows={5}
          defaultValue={pick(
            state,
            field.name,
            Array.isArray(original) ? (original as string[]).join("\n") : "",
          )}
        />
      );
    case "json":
      return (
        <textarea
          {...common}
          rows={8}
          className={`${common.className} font-mono`}
          defaultValue={pick(
            state,
            field.name,
            original ? JSON.stringify(original, null, 2) : "[]",
          )}
        />
      );
    case "image":
      return (
        <MediaUpload
          inputName={`${field.name}__current`}
          resourceKey={resourceKey}
          fieldName={field.name}
          current={state.values ? (state.values[`${field.name}__current`] ?? "") : str}
          allowVideo={field.name === "url"}
          label={field.label}
        />
      );
    default:
      return (
        <input
          {...common}
          type={field.type === "url" ? "url" : "text"}
          defaultValue={pick(state, field.name, str)}
        />
      );
  }
}

export function ResourceForm({ resource, action, values, isCreate, relationOptions }: Props) {
  const { state, formAction } = useFormAction(action);

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <FormError state={state} />
      {resource.fields.map((f) => {
        const disabled = !!f.createOnly && !isCreate;
        const input = (
          <Input
            resourceKey={resource.key}
            field={f}
            original={values[f.name]}
            state={state}
            options={relationOptions[f.name] ?? f.options ?? []}
            disabled={disabled}
          />
        );
        return (
          <div key={f.name} className={f.type === "boolean" ? "flex items-center gap-3" : ""}>
            {f.type === "boolean" && input}
            <label
              htmlFor={`f-${f.name}`}
              className="mb-1.5 block font-mono text-xs tracking-widest uppercase"
            >
              {f.label}
              {f.required && <span className="text-flame"> *</span>}
            </label>
            {f.type !== "boolean" && input}
            <FieldError state={state} name={f.name} />
            {f.help && f.type !== "boolean" && <p className="text-steel mt-1 text-xs">{f.help}</p>}
          </div>
        );
      })}
      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}
