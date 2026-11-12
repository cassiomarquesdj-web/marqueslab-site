"use client";

type Props = { action: () => Promise<void>; label?: string };

export function DeleteButton({ action, label = "Excluir" }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Excluir este registro? Esta ação não pode ser desfeita."))
          e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="font-mono text-xs tracking-widest text-red-400 uppercase hover:underline"
      >
        {label}
      </button>
    </form>
  );
}
