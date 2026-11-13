import type { FormState } from "@/lib/admin/form-state";

/** Mensagem geral do formulário (conexão, servidor ou resumo de campos inválidos). */
export function FormError({ state }: { state: FormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
      {state.error}
    </p>
  );
}

/** Mensagem junto ao campo correspondente. */
export function FieldError({ state, name }: { state: FormState; name: string }) {
  const msg = state.fieldErrors?.[name];
  if (!msg) return null;
  return (
    <p id={`${name}-erro`} role="alert" className="mt-1 text-sm text-red-400">
      {msg}
    </p>
  );
}

/** Atributos de acessibilidade e destaque visual para um campo inválido. */
export function invalidProps(state: FormState, name: string) {
  const bad = !!state.fieldErrors?.[name];
  return {
    "aria-invalid": bad ? (true as const) : undefined,
    "aria-describedby": bad ? `${name}-erro` : undefined,
    bad,
  };
}
