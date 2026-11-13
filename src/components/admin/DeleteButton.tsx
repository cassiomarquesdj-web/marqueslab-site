"use client";

import { useFormStatus } from "react-dom";

type Props = { action: () => Promise<void>; label?: string };

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-mono text-xs tracking-widest text-red-400 uppercase hover:underline disabled:opacity-60"
    >
      {pending ? "Excluindo…" : label}
    </button>
  );
}

export function DeleteButton({ action, label = "Excluir" }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Excluir este registro? Esta ação não pode ser desfeita."))
          e.preventDefault();
      }}
    >
      <Inner label={label} />
    </form>
  );
}
