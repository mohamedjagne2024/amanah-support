import { useForm, router } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import PageHeader from '@/components/Pageheader';

type CurrencyOption = {
  label: string;
  value: string;
};

type GeneralSettingsPageProps = {
  settings: {
    timezone: string | null;
    date_format: string | null;
    time_format: string | null;
    currency_position: string | null;
    thousand_sep: string | null;
    decimal_sep: string | null;
    decimal_places: number | null;
    currency: string | null;
    required_ticket_fields: string[];
  };
  currencies: CurrencyOption[];
  users: Array<{
    id: number;
    name: string;
    email: string;
  }>;
};

export default function General({ settings, currencies, users }: GeneralSettingsPageProps) {
  const { data, setData, processing, errors } = useForm<{
    timezone: string;
    date_format: string;
    time_format: string;
    currency_position: string;
    currency: string;
    thousand_sep: string;
    decimal_sep: string;
    decimal_places: string;
    required_ticket_fields: string[];
  }>({
    timezone: settings.timezone ?? '',
    date_format: settings.date_format ?? '',
    time_format: settings.time_format ?? '',
    currency_position: settings.currency_position ?? '',
    currency: settings.currency ?? '',
    thousand_sep: settings.thousand_sep ?? '',
    decimal_sep: settings.decimal_sep ?? '',
    decimal_places: settings.decimal_places !== null ? String(settings.decimal_places) : '',
    required_ticket_fields: settings.required_ticket_fields ?? [],
  });

  const timezoneOptions = useMemo<SelectOption[]>(() => [
    { label: "UTC", value: "UTC" },
    { label: "America/New_York", value: "America/New_York" },
    { label: "America/Chicago", value: "America/Chicago" },
    { label: "America/Denver", value: "America/Denver" },
    { label: "America/Los_Angeles", value: "America/Los_Angeles" },
    { label: "Europe/London", value: "Europe/London" },
    { label: "Europe/Paris", value: "Europe/Paris" },
    { label: "Asia/Dubai", value: "Asia/Dubai" },
    { label: "Asia/Kuala_Lumpur", value: "Asia/Kuala_Lumpur" },
    { label: "Asia/Singapore", value: "Asia/Singapore" },
    { label: "Asia/Tokyo", value: "Asia/Tokyo" },
    { label: "Australia/Sydney", value: "Australia/Sydney" },
  ], []);

  const languageOptions = useMemo<SelectOption[]>(() => [
    { label: "English", value: "en" },
    { label: "Arabic", value: "ar" },
    { label: "French", value: "fr" },
    { label: "Spanish", value: "es" },
    { label: "German", value: "de" },
    { label: "Chinese", value: "zh" },
    { label: "Japanese", value: "ja" },
  ], []);

  const dateFormatOptions = useMemo<SelectOption[]>(() => [
    { label: "d M Y (01 Jan 2024)", value: "d M Y" },
    { label: "d/m/Y (01/01/2024)", value: "d/m/Y" },
    { label: "m/d/Y (01/01/2024)", value: "m/d/Y" },
    { label: "Y-m-d (2024-01-01)", value: "Y-m-d" },
    { label: "M d, Y (Jan 01, 2024)", value: "M d, Y" },
    { label: "d-m-Y (01-01-2024)", value: "d-m-Y" },
  ], []);

  const timeFormatOptions = useMemo<SelectOption[]>(() => [
    { label: "H:i (24-hour)", value: "H:i" },
    { label: "h:i A (12-hour)", value: "h:i A" },
    { label: "H:i:s (24-hour with seconds)", value: "H:i:s" },
    { label: "h:i:s A (12-hour with seconds)", value: "h:i:s A" },
  ], []);

  const currencyPositionOptions = useMemo<SelectOption[]>(() => [
    { label: "Before (e.g., $100)", value: "before" },
    { label: "After (e.g., 100$)", value: "after" },
  ], []);

  const currencyOptions = useMemo<SelectOption[]>(() => {
    const seen = new Set<string>();
    return (currencies || []).filter((currency) => {
      if (seen.has(currency.value)) {
        return false;
      }
      seen.add(currency.value);
      return true;
    }).map((currency) => ({
      label: currency.label,
      value: currency.value
    }));
  }, [currencies]);

  const handleTicketFieldToggle = (fieldName: string) => {
    const currentFields = data.required_ticket_fields || [];
    const isCurrentlyRequired = currentFields.includes(fieldName);
    
    if (isCurrentlyRequired) {
      // Remove the field from required fields
      setData('required_ticket_fields', currentFields.filter(f => f !== fieldName));
    } else {
      // Add the field to required fields
      setData('required_ticket_fields', [...currentFields, fieldName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use router.put to send serialized approval users
    router.put('/settings/general', {
      ...data,
    });
  };

  return (
    <AppLayout>
      <PageMeta title="General Settings" />
      <main className="max-w-4xl">
        <PageHeader title="General Settings" />

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Regional Settings</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Timezone - Half Width */}
                <div className="w-full md:w-1/2">
                  <input type="hidden" name="timezone" value={data.timezone} />
                  <Combobox
                    label="Timezone"
                    options={timezoneOptions}
                    value={timezoneOptions.find(opt => String(opt.value) === data.timezone) || null}
                    onChange={(option) => setData('timezone', option?.value?.toString() || '')}
                    placeholder="Select timezone"
                    disabled={processing}
                    isClearable
                    isSearchable
                    error={errors.timezone}
                  />
                </div>

                {/* Date Format & Time Format - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input type="hidden" name="date_format" value={data.date_format} />
                    <Combobox
                      label="Date Format"
                      options={dateFormatOptions}
                      value={dateFormatOptions.find(opt => String(opt.value) === data.date_format) || null}
                      onChange={(option) => setData('date_format', option?.value?.toString() || '')}
                      placeholder="Select date format"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.date_format}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="time_format" value={data.time_format} />
                    <Combobox
                      label="Time Format"
                      options={timeFormatOptions}
                      value={timeFormatOptions.find(opt => String(opt.value) === data.time_format) || null}
                      onChange={(option) => setData('time_format', option?.value?.toString() || '')}
                      placeholder="Select time format"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.time_format}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Currency Settings</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Currency Position & Currency - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input type="hidden" name="currency_position" value={data.currency_position} />
                    <Combobox
                      label="Currency Position"
                      options={currencyPositionOptions}
                      value={currencyPositionOptions.find(opt => String(opt.value) === data.currency_position) || null}
                      onChange={(option) => setData('currency_position', option?.value?.toString() || '')}
                      placeholder="Select currency position"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.currency_position}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="currency" value={data.currency} />
                    <Combobox
                      label="Currency"
                      options={currencyOptions}
                      value={currencyOptions.find(opt => String(opt.value) === data.currency) || null}
                      onChange={(option) => setData('currency', option?.value?.toString() || '')}
                      placeholder="Select currency"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.currency}
                    />
                  </div>
                </div>

                {/* Thousand Separator, Decimal Separator, Decimal Places - 3 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Thousand Separator
                    </label>
                    <input
                      type="text"
                      name="thousand_sep"
                      value={data.thousand_sep}
                      onChange={(e) => setData('thousand_sep', e.target.value)}
                      placeholder="e.g., ,"
                      disabled={processing}
                      maxLength={10}
                      className="form-input"
                    />
                    <InputError message={errors.thousand_sep} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Decimal Separator
                    </label>
                    <input
                      type="text"
                      name="decimal_sep"
                      value={data.decimal_sep}
                      onChange={(e) => setData('decimal_sep', e.target.value)}
                      placeholder="e.g., ."
                      disabled={processing}
                      maxLength={10}
                      className="form-input"
                    />
                    <InputError message={errors.decimal_sep} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Decimal Places
                    </label>
                    <input
                      type="number"
                      name="decimal_places"
                      value={data.decimal_places}
                      onChange={(e) => setData('decimal_places', e.target.value)}
                      placeholder="e.g., 2"
                      disabled={processing}
                      min={0}
                      max={10}
                      className="form-input"
                    />
                    <InputError message={errors.decimal_places} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Ticket Field Configuration</h6>
              <p className="text-sm text-default-600 mt-1">
                Select which fields should be required when creating a new ticket
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {/* Department */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field_department"
                    checked={data.required_ticket_fields?.includes('department') || false}
                    onChange={() => handleTicketFieldToggle('department')}
                    disabled={processing}
                    className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="field_department"
                    className="ml-3 block text-sm font-medium text-default-900"
                  >
                    Department
                  </label>
                </div>

                {/* Category */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field_category"
                    checked={data.required_ticket_fields?.includes('category') || false}
                    onChange={() => handleTicketFieldToggle('category')}
                    disabled={processing}
                    className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="field_category"
                    className="ml-3 block text-sm font-medium text-default-900"
                  >
                    Category
                  </label>
                </div>

                {/* Sub Category */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field_sub_category"
                    checked={data.required_ticket_fields?.includes('sub_category') || false}
                    onChange={() => handleTicketFieldToggle('sub_category')}
                    disabled={processing}
                    className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="field_sub_category"
                    className="ml-3 block text-sm font-medium text-default-900"
                  >
                    Sub Category
                  </label>
                </div>

                {/* Ticket Type */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field_ticket_type"
                    checked={data.required_ticket_fields?.includes('ticket_type') || false}
                    onChange={() => handleTicketFieldToggle('ticket_type')}
                    disabled={processing}
                    className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="field_ticket_type"
                    className="ml-3 block text-sm font-medium text-default-900"
                  >
                    Ticket Type
                  </label>
                </div>

                {/* Assigned To */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field_assigned_to"
                    checked={data.required_ticket_fields?.includes('assigned_to') || false}
                    onChange={() => handleTicketFieldToggle('assigned_to')}
                    disabled={processing}
                    className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="field_assigned_to"
                    className="ml-3 block text-sm font-medium text-default-900"
                  >
                    Assigned To
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="submit"
              className="btn bg-primary text-white"
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                  Saving...
                </span>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}

