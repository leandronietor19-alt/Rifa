"use client";

import { useState, useTransition } from "react";
import { updateStoreSettings } from "./actions";
import type { StoreSettingsInput } from "@/lib/validation";

export default function StoreSettingsForm({
  initialValues,
}: {
  initialValues: StoreSettingsInput;
}) {
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof StoreSettingsInput>(key: K, value: StoreSettingsInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateStoreSettings(values);
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar");
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <Field label="Nombre de la tienda">
        <input
          required
          value={values.storeName}
          onChange={(e) => set("storeName", e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Descripción (se muestra en la portada)">
        <textarea
          rows={3}
          value={values.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          className="input"
        />
      </Field>

      <Field label="URL del logo (opcional)">
        <input
          value={values.logoUrl ?? ""}
          onChange={(e) => set("logoUrl", e.target.value)}
          className="input"
          placeholder="https://…"
        />
      </Field>

      <Field
        label="Minutos de reserva"
        hint="Tiempo que se bloquea el stock de un pedido mientras el comprador paga."
      >
        <input
          required
          type="number"
          min={5}
          max={10080}
          value={values.reservationMinutes}
          onChange={(e) => set("reservationMinutes", Number(e.target.value))}
          className="input max-w-40"
        />
      </Field>

      <div className="border-t border-black/10 pt-4">
        <h3 className="font-semibold mb-3">Información de pago</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono Bizum">
            <input
              value={values.bizumPhone ?? ""}
              onChange={(e) => set("bizumPhone", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Titular de la cuenta">
            <input
              value={values.bankHolder ?? ""}
              onChange={(e) => set("bankHolder", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="Número de cuenta / IBAN">
          <input
            value={values.bankAccount ?? ""}
            onChange={(e) => set("bankAccount", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Notas de pago adicionales">
          <textarea
            rows={2}
            value={values.paymentNotes ?? ""}
            onChange={(e) => set("paymentNotes", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary rounded-md px-5 py-2.5 text-sm">
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
      {saved && <p className="text-sm text-green-700">Cambios guardados.</p>}

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        <span className="block mt-1 font-normal">{children}</span>
      </label>
      {hint && <p className="text-xs text-black/50 mt-1">{hint}</p>}
    </div>
  );
}
