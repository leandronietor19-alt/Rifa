"use client";

import { useState, useTransition } from "react";

export type RaffleFormValues = {
  title: string;
  description: string;
  prizeDescription: string;
  imageUrl: string;
  pricePerNumberEuros: string;
  totalNumbers: string;
  digits: string;
  drawDate: string;
  bizumPhone: string;
  bankAccount: string;
  bankHolder: string;
  paymentNotes: string;
  reservationMinutes: string;
  status?: "DRAFT" | "ACTIVE" | "CLOSED";
};

export const emptyRaffleForm: RaffleFormValues = {
  title: "",
  description: "",
  prizeDescription: "",
  imageUrl: "",
  pricePerNumberEuros: "2",
  totalNumbers: "100",
  digits: "2",
  drawDate: "",
  bizumPhone: "",
  bankAccount: "",
  bankHolder: "",
  paymentNotes: "",
  reservationMinutes: "60",
  status: "DRAFT",
};

export default function RaffleForm({
  initialValues,
  submitLabel,
  showStatus,
  numbersEditable = true,
  onSubmit,
}: {
  initialValues: RaffleFormValues;
  submitLabel: string;
  showStatus: boolean;
  numbersEditable?: boolean;
  onSubmit: (values: RaffleFormValues) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof RaffleFormValues>(key: K, value: RaffleFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(values);
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <Field label="Título">
        <input
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Descripción">
        <textarea
          required
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Descripción del premio">
        <textarea
          required
          rows={2}
          value={values.prizeDescription}
          onChange={(e) => set("prizeDescription", e.target.value)}
          className="input"
        />
      </Field>

      <Field label="URL de imagen (opcional)">
        <input
          value={values.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
          className="input"
          placeholder="https://…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio por número (€)">
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={values.pricePerNumberEuros}
            onChange={(e) => set("pricePerNumberEuros", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Fecha y hora del sorteo">
          <input
            required
            type="datetime-local"
            value={values.drawDate}
            onChange={(e) => set("drawDate", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Cantidad de números"
          hint={
            numbersEditable
              ? "No se puede cambiar una vez creada la rifa."
              : undefined
          }
        >
          <input
            required
            type="number"
            min={10}
            max={100000}
            disabled={!numbersEditable}
            value={values.totalNumbers}
            onChange={(e) => set("totalNumbers", e.target.value)}
            className="input disabled:bg-black/5"
          />
        </Field>
        <Field
          label="Dígitos por número"
          hint={numbersEditable ? "Ej: 2 → 00, 01… 99" : undefined}
        >
          <input
            required
            type="number"
            min={1}
            max={6}
            disabled={!numbersEditable}
            value={values.digits}
            onChange={(e) => set("digits", e.target.value)}
            className="input disabled:bg-black/5"
          />
        </Field>
      </div>

      <Field
        label="Minutos de reserva"
        hint="Tiempo que se bloquea un número mientras el comprador paga."
      >
        <input
          required
          type="number"
          min={5}
          max={10080}
          value={values.reservationMinutes}
          onChange={(e) => set("reservationMinutes", e.target.value)}
          className="input max-w-40"
        />
      </Field>

      <div className="border-t border-black/10 pt-4">
        <h3 className="font-semibold mb-3">Información de pago</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono Bizum">
            <input
              value={values.bizumPhone}
              onChange={(e) => set("bizumPhone", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Titular de la cuenta">
            <input
              value={values.bankHolder}
              onChange={(e) => set("bankHolder", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="Número de cuenta / IBAN">
          <input
            value={values.bankAccount}
            onChange={(e) => set("bankAccount", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Notas de pago adicionales">
          <textarea
            rows={2}
            value={values.paymentNotes}
            onChange={(e) => set("paymentNotes", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      {showStatus && (
        <Field label="Estado">
          <select
            value={values.status}
            onChange={(e) => set("status", e.target.value as RaffleFormValues["status"])}
            className="input max-w-48"
          >
            <option value="DRAFT">Borrador</option>
            <option value="ACTIVE">Activa</option>
            <option value="CLOSED">Cerrada</option>
          </select>
        </Field>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary rounded-md px-5 py-2.5 text-sm">
        {isPending ? "Guardando…" : submitLabel}
      </button>

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
