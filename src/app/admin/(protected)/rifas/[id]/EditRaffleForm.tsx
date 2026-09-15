"use client";

import { useState } from "react";
import RaffleForm, { type RaffleFormValues } from "@/components/RaffleForm";
import { updateRaffle } from "./actions";

export default function EditRaffleForm({
  raffleId,
  initialValues,
}: {
  raffleId: string;
  initialValues: RaffleFormValues;
}) {
  const [saved, setSaved] = useState(false);

  async function handleSubmit(values: RaffleFormValues) {
    setSaved(false);
    const result = await updateRaffle(raffleId, values);
    if (result.ok) setSaved(true);
    return result;
  }

  return (
    <div>
      <RaffleForm
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        showStatus
        numbersEditable={false}
        onSubmit={handleSubmit}
      />
      {saved && <p className="text-sm text-green-700 mt-3">Cambios guardados.</p>}
    </div>
  );
}
