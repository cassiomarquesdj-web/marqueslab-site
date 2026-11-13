"use client";

import { useActionState } from "react";
import { collectValues, type FormState } from "@/lib/admin/form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState | void>;

const isNextRedirect = (e: unknown) =>
  typeof e === "object" &&
  e !== null &&
  String((e as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT");

/**
 * Liga um formulário a uma Server Action que devolve `FormState`. Em caso de erro de validação, de
 * servidor ou de conexão, o estado devolvido traz os valores digitados e o formulário continua preenchido.
 */
export function useFormAction(action: Action) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      try {
        return (await action(prev, formData)) ?? {};
      } catch (e) {
        if (isNextRedirect(e)) throw e; // sucesso: a ação redireciona
        return {
          error:
            "Falha de conexão com o servidor. Seus dados foram mantidos; confira a internet e tente novamente.",
          values: collectValues(formData),
        };
      }
    },
    {},
  );
  return { state, formAction, pending };
}

/** Valor a exibir: o que o usuário digitou (se houve erro) ou o valor original do registro. */
export function pick(state: FormState, name: string, original: string): string {
  return state.values ? (state.values[name] ?? "") : original;
}
export function pickBool(state: FormState, name: string, original: boolean): boolean {
  return state.values ? state.values[name] === "on" : original;
}
