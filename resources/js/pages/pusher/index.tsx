import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import PageHeader from '@/components/Pageheader';
import { MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

type PusherSettingsPageProps = {
  settings: {
    pusher_app_id: string | null;
    pusher_app_key: string | null;
    pusher_app_secret: string | null;
    pusher_app_cluster: string | null;
  };
};

export default function Index({ settings }: PusherSettingsPageProps) {
  const { data, setData, processing, errors } = useForm<{
    pusher_app_id: string;
    pusher_app_key: string;
    pusher_app_secret: string;
    pusher_app_cluster: string;
  }>({
    pusher_app_id: settings.pusher_app_id ?? '',
    pusher_app_key: settings.pusher_app_key ?? '',
    pusher_app_secret: settings.pusher_app_secret ?? '',
    pusher_app_cluster: settings.pusher_app_cluster ?? '',
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.put('/settings/pusher', {
      ...data,
    });
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const response = await axios.post('/settings/pusher/test');
      
      if (response.data.success) {
        setTestStatus('success');
        setTestMessage(response.data.message);
      } else {
        setTestStatus('error');
        setTestMessage(response.data.message);
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error.response?.data?.message || 'Connection test failed. Please check your credentials.');
    }
  };

  return (
    <AppLayout>
      <PageMeta title="Pusher Settings" />
      <main className="max-w-4xl">
        <PageHeader 
          title="Pusher Chat Settings" 
          subtitle="Configure Pusher for real-time chat functionality"
          icon={MessageSquare}
        />

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          {/* Pusher Configuration */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Pusher Credentials</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* App ID & App Key - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Pusher App ID <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="pusher_app_id"
                      value={data.pusher_app_id}
                      onChange={(e) => setData('pusher_app_id', e.target.value)}
                      placeholder="e.g., 1234567"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.pusher_app_id} />
                    <p className="text-default-500 text-xs mt-1">
                      Your Pusher application ID
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Pusher App Key <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="pusher_app_key"
                      value={data.pusher_app_key}
                      onChange={(e) => setData('pusher_app_key', e.target.value)}
                      placeholder="e.g., a1b2c3d4e5f6g7h8i9j0"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.pusher_app_key} />
                    <p className="text-default-500 text-xs mt-1">
                      Your Pusher application key
                    </p>
                  </div>
                </div>

                {/* App Secret & Cluster - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Pusher App Secret <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      name="pusher_app_secret"
                      value={data.pusher_app_secret}
                      onChange={(e) => setData('pusher_app_secret', e.target.value)}
                      placeholder="Enter your app secret"
                      disabled={processing}
                      className="form-input font-mono"
                      autoComplete="off"
                    />
                    <InputError message={errors.pusher_app_secret} />
                    <p className="text-default-500 text-xs mt-1">
                      Your Pusher application secret (kept private)
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Pusher App Cluster <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="pusher_app_cluster"
                      value={data.pusher_app_cluster}
                      onChange={(e) => setData('pusher_app_cluster', e.target.value)}
                      placeholder="e.g., us2, eu, ap1"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.pusher_app_cluster} />
                    <p className="text-default-500 text-xs mt-1">
                      The cluster where your app is hosted
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Connection */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Test Connection</h6>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <p className="text-default-600 text-sm">
                  Test your Pusher credentials to ensure they are configured correctly before saving.
                </p>

                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing' || processing}
                    className="btn bg-default-200 text-default-700 hover:bg-default-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {testStatus === 'testing' ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="size-4" />
                        Test Connection
                      </>
                    )}
                  </button>

                  {testStatus === 'success' && (
                    <div className="flex-1 bg-success-50 border border-success-200 rounded-lg p-3 flex items-start gap-2">
                      <CheckCircle className="size-5 text-success-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-success-900 font-medium text-sm">Connection Successful</p>
                        <p className="text-success-700 text-sm">{testMessage}</p>
                      </div>
                    </div>
                  )}

                  {testStatus === 'error' && (
                    <div className="flex-1 bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
                      <XCircle className="size-5 text-danger-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-danger-900 font-medium text-sm">Connection Failed</p>
                        <p className="text-danger-700 text-sm">{testMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Information Banner */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <h4 className="font-semibold text-info-900 mb-2">How to get your Pusher credentials</h4>
            <div className="text-info-700 text-sm space-y-2">
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://pusher.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-info-900">pusher.com</a> and sign in or create an account</li>
                <li>Create a new Channels app or select an existing one</li>
                <li>Navigate to "App Keys" in your app dashboard</li>
                <li>Copy your App ID, Key, Secret, and Cluster</li>
                <li>Paste them into the fields above</li>
              </ol>
              <div className="mt-3 pt-3 border-t border-info-200">
                <p className="font-medium mb-1">Common Clusters:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><strong>us2:</strong> US East (Ohio)</div>
                  <div><strong>us3:</strong> US West (Oregon)</div>
                  <div><strong>eu:</strong> EU (Ireland)</div>
                  <div><strong>ap1:</strong> Asia Pacific (Singapore)</div>
                  <div><strong>ap2:</strong> Asia Pacific (Mumbai)</div>
                  <div><strong>ap3:</strong> Asia Pacific (Tokyo)</div>
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
                'Save Pusher Settings'
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}
