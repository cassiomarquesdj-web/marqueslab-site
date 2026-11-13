import { inputCls } from "@/components/admin/ui";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SubmitButton } from "@/components/admin/SubmitButton";
import type { Field, Resource } from "@/lib/admin/resources";

type Props = {
  resource: Resource;
  action: (formData: FormData) => Promise<void>;
  values: Record<string, unknown>;
  isCreate: boolean;
  relationOptions: Record<string, { value: string; label: string }[]>;
};

function Input({
  resourceKey,
  field,
  value,
  options,
  disabled,
}: {
  resourceKey: string;
  field: Field;
  value: unknown;
  options: { value: string; label: string }[];
  disabled: boolean;
}) {
  const id = `f-${field.name}`;
  const common = { id, name: field.name, disabled, className: inputCls };
  const str = value == null ? "" : String(value);

  switch (field.type) {
    case "textarea":
      return <textarea {...common} rows={5} defaultValue={str} />;
    case "number":
      return <input {...common} type="number" defaultValue={str || "0"} />;
    case "boolean":
      return (
        <input
          id={id}
          name={field.name}
          type="checkbox"
          defaultChecked={value === true}
          disabled={disabled}
          className="accent-flame size-5"
        />
      );
    case "select":
      return (
        <select {...common} defaultValue={str || field.options?.[0]?.value}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "relation":
      return (
        <select {...common} defaultValue={str}>
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
          defaultValue={Array.isArray(value) ? (value as string[]).join("\n") : ""}
        />
      );
    case "json":
      return (
        <textarea
          {...common}
          rows={8}
          className={`${inputCls} font-mono`}
          defaultValue={value ? JSON.stringify(value, null, 2) : "[]"}
        />
      );
    case "image":
      return (
        <MediaUpload
          inputName={`${field.name}__current`}
          resourceKey={resourceKey}
          fieldName={field.name}
          current={str}
          allowVideo={field.name === "url"}
          label={field.label}
        />
      );
    default:
      return <input {...common} type={field.type === "url" ? "url" : "text"} defaultValue={str} />;
  }
}

export function ResourceForm({ resource, action, values, isCreate, relationOptions }: Props) {
  return (
    <form action={action} className="max-w-3xl space-y-5">
      {resource.fields.map((f) => (
        <div key={f.name} className={f.type === "boolean" ? "flex items-center gap-3" : ""}>
          {f.type === "boolean" && (
            <Input
              resourceKey={resource.key}
              field={f}
              value={values[f.name]}
              options={[]}
              disabled={false}
            />
          )}
          <label
            htmlFor={`f-${f.name}`}
            className="mb-1.5 block font-mono text-xs tracking-widest uppercase"
          >
            {f.label}
            {f.required && <span className="text-flame"> *</span>}
          </label>
          {f.type !== "boolean" && (
            <Input
              resourceKey={resource.key}
              field={f}
              value={values[f.name]}
              options={relationOptions[f.name] ?? f.options ?? []}
              disabled={!!f.createOnly && !isCreate}
            />
          )}
          {f.help && f.type !== "boolean" && <p className="text-steel mt-1 text-xs">{f.help}</p>}
        </div>
      ))}
      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}
