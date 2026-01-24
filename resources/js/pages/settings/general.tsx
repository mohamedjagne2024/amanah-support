import { useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import PageHeader from '@/components/Pageheader';
import { useLanguageContext } from '@/context/useLanguageContext';

type CurrencyOption = {
  label: string;
  value: string;
};

type EmailNotificationsType = {
  ticket_by_contact: boolean;
  ticket_from_dashboard: boolean;
  first_comment: boolean;
  user_assigned: boolean;
  status_priority_changes: boolean;
  ticket_resolved: boolean;
  new_user: boolean;
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
    email_notifications: EmailNotificationsType;
    gcs_project_id: string | null;
    gcs_key_file_path: string | null;
    gcs_bucket: string | null;
    gcs_path_prefix: string | null;
    gcs_api_uri: string | null;
    gemini_api_key: string | null;
    escalate_value: string | null;
    escalate_unit: string | null;
    autoclose_value: string | null;
    autoclose_unit: string | null;
  };
  currencies: CurrencyOption[];
  users: Array<{
    id: number;
    name: string;
    email: string;
  }>;
};

export default function General({ settings, currencies, users }: GeneralSettingsPageProps) {
  const { t } = useLanguageContext();

  const { data, setData, put, processing, errors } = useForm<{
    timezone: string;
    date_format: string;
    time_format: string;
    currency_position: string;
    currency: string;
    thousand_sep: string;
    decimal_sep: string;
    decimal_places: string;
    required_ticket_fields: string[];
    email_notifications: EmailNotificationsType;
    gcs_project_id: string;
    gcs_key_file_path: string;
    gcs_bucket: string;
    gcs_path_prefix: string;
    gcs_api_uri: string;
    gemini_api_key: string;
    escalate_value: string;
    escalate_unit: string;
    autoclose_value: string;
    autoclose_unit: string;
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
    email_notifications: settings.email_notifications ?? {
      ticket_by_contact: false,
      ticket_from_dashboard: false,
      first_comment: false,
      user_assigned: false,
      status_priority_changes: false,
      ticket_resolved: false,
      new_user: false,
    },
    gcs_project_id: settings.gcs_project_id ?? '',
    gcs_key_file_path: settings.gcs_key_file_path ?? '',
    gcs_bucket: settings.gcs_bucket ?? '',
    gcs_path_prefix: settings.gcs_path_prefix ?? '',
    gcs_api_uri: settings.gcs_api_uri ?? '',
    gemini_api_key: settings.gemini_api_key ?? '',
    escalate_value: settings.escalate_value ?? '',
    escalate_unit: settings.escalate_unit ?? 'hours',
    autoclose_value: settings.autoclose_value ?? '',
    autoclose_unit: settings.autoclose_unit ?? 'hours',
  });

  const handleEmailNotificationToggle = (key: keyof EmailNotificationsType) => {
    setData('email_notifications', {
      ...data.email_notifications,
      [key]: !data.email_notifications[key],
    });
  };

  const emailNotificationItems = [
    {
      key: 'ticket_by_contact' as keyof EmailNotificationsType,
      title: t('settings.general.ticketByContact'),
      description: t('settings.general.configureEmailSettings'),
    },
    {
      key: 'ticket_from_dashboard' as keyof EmailNotificationsType,
      title: t('settings.general.ticketFromDashboard'),
      description: t('settings.general.configureEmailSettings'),
    },
    {
      key: 'first_comment' as keyof EmailNotificationsType,
      title: t('settings.general.firstComment'),
      description: t('settings.general.configureEmailSettings'),
    },
    {
      key: 'user_assigned' as keyof EmailNotificationsType,
      title: t('settings.general.userAssigned'),
      description: t('settings.general.configureEmailSettings'),
    },
    {
      key: 'status_priority_changes' as keyof EmailNotificationsType,
      title: t('settings.general.statusPriorityChanges'),
      description: t('settings.general.configureEmailSettings'),
    },
    {
      key: 'ticket_resolved' as keyof EmailNotificationsType,
      title: t('settings.general.ticketResolved'),
      description: t('settings.general.sendEmailResolved'),
    },
    {
      key: 'new_user' as keyof EmailNotificationsType,
      title: t('settings.general.newUser'),
      description: t('settings.general.configureEmailSettings'),
    },
  ];

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

    put('/settings/general', {
      preserveScroll: true,
    });
  };

  return (
    <AppLayout>
      <PageMeta title={t('settings.general.title')} />
      <main className="max-w-4xl">
        <PageHeader title={t('settings.general.title')} />

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">{t('settings.general.regionalSettings')}</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Timezone - Half Width */}
                <div className="w-full md:w-1/2">
                  <input type="hidden" name="timezone" value={data.timezone} />
                  <Combobox
                    label={t('settings.general.timezone')}
                    options={timezoneOptions}
                    value={timezoneOptions.find(opt => String(opt.value) === data.timezone) || null}
                    onChange={(option) => setData('timezone', option?.value?.toString() || '')}
                    placeholder={t('settings.general.selectTimezone')}
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
                      label={t('settings.general.dateFormat')}
                      options={dateFormatOptions}
                      value={dateFormatOptions.find(opt => String(opt.value) === data.date_format) || null}
                      onChange={(option) => setData('date_format', option?.value?.toString() || '')}
                      placeholder={t('settings.general.selectDateFormat')}
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.date_format}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="time_format" value={data.time_format} />
                    <Combobox
                      label={t('settings.general.timeFormat')}
                      options={timeFormatOptions}
                      value={timeFormatOptions.find(opt => String(opt.value) === data.time_format) || null}
                      onChange={(option) => setData('time_format', option?.value?.toString() || '')}
                      placeholder={t('settings.general.selectTimeFormat')}
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
              <h6 className="card-title">{t('settings.general.currencySettings')}</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Currency Position & Currency - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input type="hidden" name="currency_position" value={data.currency_position} />
                    <Combobox
                      label={t('settings.general.currencyPosition')}
                      options={currencyPositionOptions}
                      value={currencyPositionOptions.find(opt => String(opt.value) === data.currency_position) || null}
                      onChange={(option) => setData('currency_position', option?.value?.toString() || '')}
                      placeholder={t('settings.general.selectCurrencyPosition')}
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.currency_position}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="currency" value={data.currency} />
                    <Combobox
                      label={t('settings.general.currency')}
                      options={currencyOptions}
                      value={currencyOptions.find(opt => String(opt.value) === data.currency) || null}
                      onChange={(option) => setData('currency', option?.value?.toString() || '')}
                      placeholder={t('settings.general.selectCurrency')}
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
                      {t('settings.general.thousandSeparator')}
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
                      {t('settings.general.decimalSeparator')}
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
                      {t('settings.general.decimalPlaces')}
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
              <h6 className="card-title">{t('settings.general.ticketFieldConfig')}</h6>
              <p className="text-sm text-default-600 mt-1">
                {t('settings.general.ticketFieldConfigDescription')}
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {/* Department */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="field_region"
                    checked={data.required_ticket_fields?.includes('region') || false}
                    onChange={() => handleTicketFieldToggle('region')}
                    disabled={processing}
                    className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="field_region"
                    className="ml-3 block text-sm font-medium text-default-900"
                  >
                    {t('settings.general.region')}
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
                    {t('settings.general.category')}
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
                    {t('settings.general.subCategory')}
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
                    {t('settings.general.ticketType')}
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
                    {t('settings.general.assignedTo')}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Email Notifications Section */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">{t('settings.general.emailNotifications')}</h6>
              <p className="text-sm text-default-600 mt-1">
                {t('settings.general.emailNotificationsDescription')}
              </p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emailNotificationItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-default-50 rounded-lg border border-default-200"
                  >
                    <div className="flex items-center gap-3">
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleEmailNotificationToggle(item.key)}
                        disabled={processing}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${data.email_notifications[item.key]
                          ? 'bg-primary'
                          : 'bg-default-200'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.email_notifications[item.key]
                            ? 'translate-x-5'
                            : 'translate-x-0'
                            }`}
                        />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-default-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-default-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {/* Status Indicator */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${data.email_notifications[item.key]
                          ? 'bg-green-500'
                          : 'bg-default-300'
                          }`}
                      />
                      <span
                        className={`text-xs font-medium ${data.email_notifications[item.key]
                          ? 'text-green-600'
                          : 'text-default-500'
                          }`}
                      >
                        {data.email_notifications[item.key] ? t('settings.general.enabled') : t('settings.general.disabled')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket Automation Settings */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">{t('settings.general.ticketAutomation')}</h6>
              <p className="text-sm text-default-600 mt-1">
                {t('settings.general.ticketAutomationDescription')}
              </p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Max Time to Escalate */}
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    {t('settings.general.maxTimeEscalate')}
                  </label>
                  <div className="flex items-center">
                    <span className="inline-block">
                      <select
                        value={data.escalate_unit}
                        onChange={(e) => setData('escalate_unit', e.target.value)}
                        disabled={processing}
                        className="form-input !rounded-s-none !border-s-0"
                      >
                        <option value="minutes">{t('settings.general.minutes')}</option>
                        <option value="hours">{t('settings.general.hours')}</option>
                        <option value="days">{t('settings.general.days')}</option>
                      </select>
                    </span>
                    <input
                      type="number"
                      value={data.escalate_value}
                      onChange={(e) => setData('escalate_value', e.target.value)}
                      placeholder="e.g., 24"
                      disabled={processing}
                      min={0}
                      className="form-input !rounded-e-none flex-1"
                    />
                  </div>
                  <InputError message={errors.escalate_value} />
                </div>

                {/* Max Time to Autoclose */}
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    {t('settings.general.maxTimeAutoclose')}
                  </label>
                  <div className="flex items-center">
                    <span className="inline-block">
                      <select
                        value={data.autoclose_unit}
                        onChange={(e) => setData('autoclose_unit', e.target.value)}
                        disabled={processing}
                        className="form-input !rounded-s-none !border-s-0"
                      >
                        <option value="minutes">{t('settings.general.minutes')}</option>
                        <option value="hours">{t('settings.general.hours')}</option>
                        <option value="days">{t('settings.general.days')}</option>
                      </select>
                    </span>
                    <input
                      type="number"
                      value={data.autoclose_value}
                      onChange={(e) => setData('autoclose_value', e.target.value)}
                      placeholder="e.g., 72"
                      disabled={processing}
                      min={0}
                      className="form-input !rounded-e-none flex-1"
                    />
                  </div>
                  <InputError message={errors.autoclose_value} />
                </div>
              </div>
            </div>
          </div>

          {/* Google Cloud Storage Configuration Section */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">{t('settings.general.gcsConfig')}</h6>
              <p className="text-sm text-default-600 mt-1">
                {t('settings.general.gcsConfigDescription')}
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* GCS Project ID & GCS Bucket - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      {t('settings.general.gcsProjectId')}
                    </label>
                    <input
                      type="text"
                      name="gcs_project_id"
                      value={data.gcs_project_id}
                      onChange={(e) => setData('gcs_project_id', e.target.value)}
                      placeholder={t('settings.general.enterGcsProjectId')}
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.gcs_project_id} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      {t('settings.general.gcsBucket')}
                    </label>
                    <input
                      type="text"
                      name="gcs_bucket"
                      value={data.gcs_bucket}
                      onChange={(e) => setData('gcs_bucket', e.target.value)}
                      placeholder={t('settings.general.enterGcsBucket')}
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.gcs_bucket} />
                  </div>
                </div>

                {/* GCS Key File Path - Full Width */}
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    {t('settings.general.gcsKeyFilePath')}
                  </label>
                  <input
                    type="text"
                    name="gcs_key_file_path"
                    value={data.gcs_key_file_path}
                    onChange={(e) => setData('gcs_key_file_path', e.target.value)}
                    placeholder={t('settings.general.enterGcsKeyFilePath')}
                    disabled={processing}
                    className="form-input"
                  />
                  <InputError message={errors.gcs_key_file_path} />
                </div>

                {/* GCS Path Prefix & GCS API URI - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      {t('settings.general.gcsPathPrefix')}
                    </label>
                    <input
                      type="text"
                      name="gcs_path_prefix"
                      value={data.gcs_path_prefix}
                      onChange={(e) => setData('gcs_path_prefix', e.target.value)}
                      placeholder={t('settings.general.enterGcsPathPrefix')}
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.gcs_path_prefix} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      {t('settings.general.gcsApiUri')}
                    </label>
                    <input
                      type="url"
                      name="gcs_api_uri"
                      value={data.gcs_api_uri}
                      onChange={(e) => setData('gcs_api_uri', e.target.value)}
                      placeholder={t('settings.general.enterGcsApiUri')}
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.gcs_api_uri} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gemini API Configuration Section */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">{t('settings.general.geminiConfig')}</h6>
              <p className="text-sm text-default-600 mt-1">
                {t('settings.general.geminiConfigDescription')}
              </p>
            </div>
            <div className="card-body">
              <div className="w-full md:w-1/2">
                <label className="block font-medium text-default-900 text-sm mb-2">
                  {t('settings.general.geminiApiKey')}
                </label>
                <input
                  type="password"
                  name="gemini_api_key"
                  value={data.gemini_api_key}
                  onChange={(e) => setData('gemini_api_key', e.target.value)}
                  placeholder={t('settings.general.enterGeminiApiKey')}
                  disabled={processing}
                  className="form-input"
                  autoComplete="off"
                />
                <InputError message={errors.gemini_api_key} />
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
                  {t('settings.general.saving')}
                </span>
              ) : (
                t('settings.general.saveSettings')
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}
