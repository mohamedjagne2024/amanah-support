import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import { Eye, EyeOff } from 'lucide-react';

type CurrencyOption = {
  label: string;
  value: string;
};

type GeneralSettingsPageProps = {
  settings: {
    timezone: string | null;
    language: string | null;
    date_format: string | null;
    time_format: string | null;
    currency_position: string | null;
    thousand_sep: string | null;
    decimal_sep: string | null;
    decimal_places: number | null;
    currency: string | null;
    purchase_order_number: string | null;
    fcm_server_key: string | null;
    email_type: string | null;
    email_from: string | null;
    email_from_name: string | null;
    email_username: string | null;
    email_password: string | null;
    email_host: string | null;
    email_port: string | null;
    email_security: string | null;
  };
  currencies: CurrencyOption[];
};

export default function General({ settings, currencies }: GeneralSettingsPageProps) {
  const { data, setData, put, processing, errors } = useForm({
    timezone: settings.timezone ?? '',
    language: settings.language ?? '',
    date_format: settings.date_format ?? '',
    time_format: settings.time_format ?? '',
    currency_position: settings.currency_position ?? '',
    currency: settings.currency ?? '',
    thousand_sep: settings.thousand_sep ?? '',
    decimal_sep: settings.decimal_sep ?? '',
    decimal_places: settings.decimal_places !== null ? String(settings.decimal_places) : '',
    purchase_order_number: settings.purchase_order_number ?? '1',
    fcm_server_key: settings.fcm_server_key ?? '',
    email_type: settings.email_type ?? '',
    email_from: settings.email_from ?? '',
    email_from_name: settings.email_from_name ?? '',
    email_username: settings.email_username ?? '',
    email_password: settings.email_password ?? '',
    email_host: settings.email_host ?? '',
    email_port: settings.email_port ?? '',
    email_security: settings.email_security ?? '',
  });

  const [showFcmServerKey, setShowFcmServerKey] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

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

  const emailTypeOptions = useMemo<SelectOption[]>(() => [
    { label: "SMTP", value: "smtp" },
    { label: "Sendmail", value: "sendmail" },
    { label: "Mail", value: "mail" },
  ], []);

  const emailSecurityOptions = useMemo<SelectOption[]>(() => [
    { label: "None", value: "none" },
    { label: "SSL", value: "ssl" },
    { label: "TLS", value: "tls" },
  ], []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put('/settings/general');
  };

  return (
    <AppLayout>
      <PageMeta title="General Settings" />
      <main className="max-w-4xl">
        <PageBreadcrumb title="General Settings" subtitle="Settings" />

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

                {/* Language - Half Width */}
                <div className="w-full md:w-1/2">
                  <input type="hidden" name="language" value={data.language} />
                  <Combobox
                    label="Language"
                    options={languageOptions}
                    value={languageOptions.find(opt => String(opt.value) === data.language) || null}
                    onChange={(option) => setData('language', option?.value?.toString() || '')}
                    placeholder="Select language"
                    disabled={processing}
                    isClearable
                    isSearchable
                    error={errors.language}
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
              <h6 className="card-title">Purchase Order Settings</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Purchase Order Starting Number - Half Width */}
                <div className="w-full md:w-1/2">
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Purchase Order Starting Number
                  </label>
                  <input
                    type="number"
                    name="purchase_order_number"
                    value={data.purchase_order_number}
                    onChange={(e) => setData('purchase_order_number', e.target.value)}
                    placeholder="e.g., 1"
                    disabled={processing}
                    min={1}
                    className="form-input"
                  />
                  <p className="text-xs text-default-500 mt-1">
                    The starting number for auto-generated purchase order numbers
                  </p>
                  <InputError message={errors.purchase_order_number} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Firebase Cloud Messaging Settings</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* One Signal App ID - Half Width with Eye Icon */}
                <div className="w-full md:w-1/2">
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    FCM Server Key
                  </label>
                  <div className="relative">
                    <input
                      type={showFcmServerKey ? "text" : "password"}
                      name="fcm_server_key"
                      value={data.fcm_server_key}
                      onChange={(e) => setData('fcm_server_key', e.target.value)}
                      placeholder="Enter FCM Server Key"
                      disabled={processing}
                      className="form-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFcmServerKey(!showFcmServerKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-default-500 hover:text-default-700"
                    >
                      {showFcmServerKey ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-default-500 mt-1">
                    Your FCM Server Key
                  </p>
                  <InputError message={errors.fcm_server_key} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Email Settings</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Email Type & Security - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input type="hidden" name="email_type" value={data.email_type} />
                    <Combobox
                      label="Email Type"
                      options={emailTypeOptions}
                      value={emailTypeOptions.find(opt => String(opt.value) === data.email_type) || null}
                      onChange={(option) => setData('email_type', option?.value?.toString() || '')}
                      placeholder="Select email type"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.email_type}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="email_security" value={data.email_security} />
                    <Combobox
                      label="Security"
                      options={emailSecurityOptions}
                      value={emailSecurityOptions.find(opt => String(opt.value) === data.email_security) || null}
                      onChange={(option) => setData('email_security', option?.value?.toString() || '')}
                      placeholder="Select security type"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.email_security}
                    />
                  </div>
                </div>

                {/* From Email & From Name - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      name="email_from"
                      value={data.email_from}
                      onChange={(e) => setData('email_from', e.target.value)}
                      placeholder="e.g., noreply@example.com"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.email_from} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      name="email_from_name"
                      value={data.email_from_name}
                      onChange={(e) => setData('email_from_name', e.target.value)}
                      placeholder="e.g., Amanah Insurance"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.email_from_name} />
                  </div>
                </div>

                {/* Host & Port - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Host
                    </label>
                    <input
                      type="text"
                      name="email_host"
                      value={data.email_host}
                      onChange={(e) => setData('email_host', e.target.value)}
                      placeholder="e.g., smtp.gmail.com"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.email_host} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Port
                    </label>
                    <input
                      type="text"
                      name="email_port"
                      value={data.email_port}
                      onChange={(e) => setData('email_port', e.target.value)}
                      placeholder="e.g., 587"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.email_port} />
                  </div>
                </div>

                {/* Username & Password - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="email_username"
                      value={data.email_username}
                      onChange={(e) => setData('email_username', e.target.value)}
                      placeholder="Enter email username"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.email_username} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showEmailPassword ? "text" : "password"}
                        name="email_password"
                        value={data.email_password}
                        onChange={(e) => setData('email_password', e.target.value)}
                        placeholder="Enter email password"
                        disabled={processing}
                        className="form-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-default-500 hover:text-default-700"
                      >
                        {showEmailPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <InputError message={errors.email_password} />
                  </div>
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

