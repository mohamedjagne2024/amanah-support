import { useForm, router } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import PageHeader from '@/components/Pageheader';
import { Mail } from 'lucide-react';

type SmtpSettingsPageProps = {
  settings: {
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_security: string | null;
    smtp_from_name: string | null;
    smtp_from_email: string | null;
    smtp_username: string | null;
    smtp_password: string | null;
  };
};

export default function Index({ settings }: SmtpSettingsPageProps) {
  const { data, setData, processing, errors } = useForm<{
    smtp_host: string;
    smtp_port: string;
    smtp_security: string;
    smtp_from_name: string;
    smtp_from_email: string;
    smtp_username: string;
    smtp_password: string;
  }>({
    smtp_host: settings.smtp_host ?? '',
    smtp_port: settings.smtp_port !== null ? String(settings.smtp_port) : '',
    smtp_security: settings.smtp_security ?? '',
    smtp_from_name: settings.smtp_from_name ?? '',
    smtp_from_email: settings.smtp_from_email ?? '',
    smtp_username: settings.smtp_username ?? '',
    smtp_password: settings.smtp_password ?? '',
  });

  const securityOptions = useMemo<SelectOption[]>(() => [
    { label: "TLS", value: "tls" },
    { label: "SSL", value: "ssl" },
    { label: "None", value: "none" },
  ], []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.put('/settings/smtp', {
      ...data,
    });
  };

  return (
    <AppLayout>
      <PageMeta title="SMTP Settings" />
      <main className="max-w-4xl">
        <PageHeader 
          title="SMTP Settings" 
          subtitle="Configure email server settings"
          icon={Mail}
        />

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          {/* Server Configuration */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Server Configuration</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* SMTP Host */}
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    SMTP Host <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="smtp_host"
                    value={data.smtp_host}
                    onChange={(e) => setData('smtp_host', e.target.value)}
                    placeholder="e.g., smtp.gmail.com"
                    disabled={processing}
                    className="form-input"
                  />
                  <InputError message={errors.smtp_host} />
                  <p className="text-default-500 text-xs mt-1">
                    The hostname of your SMTP server
                  </p>
                </div>

                {/* SMTP Port & Security - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      SMTP Port <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="smtp_port"
                      value={data.smtp_port}
                      onChange={(e) => setData('smtp_port', e.target.value)}
                      placeholder="e.g., 587"
                      disabled={processing}
                      min={1}
                      max={65535}
                      className="form-input"
                    />
                    <InputError message={errors.smtp_port} />
                    <p className="text-default-500 text-xs mt-1">
                      Common ports: 25, 465 (SSL), 587 (TLS)
                    </p>
                  </div>

                  <div>
                    <input type="hidden" name="smtp_security" value={data.smtp_security} />
                    <Combobox
                      label="Security"
                      options={securityOptions}
                      value={securityOptions.find(opt => String(opt.value) === data.smtp_security) || null}
                      onChange={(option) => setData('smtp_security', option?.value?.toString() || '')}
                      placeholder="Select security protocol"
                      disabled={processing}
                      isClearable
                      error={errors.smtp_security}
                    />
                    <p className="text-default-500 text-xs mt-1">
                      Encryption protocol for secure connection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Sender Information</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* From Name & From Email - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      From Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="smtp_from_name"
                      value={data.smtp_from_name}
                      onChange={(e) => setData('smtp_from_name', e.target.value)}
                      placeholder="e.g., Amanah Support"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.smtp_from_name} />
                    <p className="text-default-500 text-xs mt-1">
                      The name that appears in the "From" field
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      From Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      name="smtp_from_email"
                      value={data.smtp_from_email}
                      onChange={(e) => setData('smtp_from_email', e.target.value)}
                      placeholder="e.g., support@amanah.com"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.smtp_from_email} />
                    <p className="text-default-500 text-xs mt-1">
                      The email address that appears in the "From" field
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Authentication</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Username & Password - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="smtp_username"
                      value={data.smtp_username}
                      onChange={(e) => setData('smtp_username', e.target.value)}
                      placeholder="Enter SMTP username"
                      disabled={processing}
                      className="form-input"
                      autoComplete="off"
                    />
                    <InputError message={errors.smtp_username} />
                    <p className="text-default-500 text-xs mt-1">
                      Your SMTP account username
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      name="smtp_password"
                      value={data.smtp_password}
                      onChange={(e) => setData('smtp_password', e.target.value)}
                      placeholder="Enter SMTP password"
                      disabled={processing}
                      className="form-input"
                      autoComplete="new-password"
                    />
                    <InputError message={errors.smtp_password} />
                    <p className="text-default-500 text-xs mt-1">
                      Your SMTP account password
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Banner */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <h4 className="font-semibold text-info-900 mb-2">Common SMTP Providers</h4>
            <div className="text-info-700 text-sm space-y-2">
              <div>
                <strong>Gmail:</strong> smtp.gmail.com, Port 587 (TLS) or 465 (SSL)
              </div>
              <div>
                <strong>Outlook:</strong> smtp-mail.outlook.com, Port 587 (TLS)
              </div>
              <div>
                <strong>SendGrid:</strong> smtp.sendgrid.net, Port 587 (TLS)
              </div>
              <div>
                <strong>Mailgun:</strong> smtp.mailgun.org, Port 587 (TLS)
              </div>
              <p className="mt-2 text-xs">
                Note: For Gmail, you may need to use an App Password instead of your regular password.
              </p>
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
                'Save SMTP Settings'
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}
