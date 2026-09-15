import { getStoreSettings } from "@/lib/store";
import StoreSettingsForm from "./StoreSettingsForm";
import type { StoreSettingsInput } from "@/lib/validation";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  const initialValues: StoreSettingsInput = {
    storeName: settings.storeName,
    description: settings.description ?? "",
    logoUrl: settings.logoUrl ?? "",
    bizumPhone: settings.bizumPhone ?? "",
    bankAccount: settings.bankAccount ?? "",
    bankHolder: settings.bankHolder ?? "",
    paymentNotes: settings.paymentNotes ?? "",
    reservationMinutes: settings.reservationMinutes,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Ajustes de la tienda</h1>
      <StoreSettingsForm initialValues={initialValues} />
    </div>
  );
}
