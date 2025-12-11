import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';

interface User {
  id: number;
  name: string;
  email: string;
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const profileForm = useForm({
    name: user.name || '',
    email: user.email || '',
  });

  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileForm.put('/user/profile-information', {
      preserveState: true,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.put('/user/password', {
      preserveState: false,
      onSuccess: () => {
        passwordForm.reset();
      },
    });
  };

  return (
    <AppLayout>
      <PageMeta title="Profile" />
      <main className='max-w-4xl'>
        <PageBreadcrumb title="Profile" subtitle="Manage your account settings" />
        <div className="space-y-6">
          {/* Personal Information Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <h6 className="card-title">Personal Information</h6>
                <p className="text-sm text-default-700 mt-1">
                  Update your account profile information and email address
                </p>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block font-medium text-default-900 text-sm mb-2"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={profileForm.data.name}
                    onChange={(e) => profileForm.setData('name', e.target.value)}
                    className="form-input"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                  <InputError message={profileForm.errors.name} />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block font-medium text-default-900 text-sm mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={profileForm.data.email}
                    onChange={(e) => profileForm.setData('email', e.target.value)}
                    className="form-input"
                    placeholder="Your email"
                    autoComplete="email"
                  />
                  <InputError message={profileForm.errors.email} />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="btn bg-primary text-white"
                    disabled={profileForm.processing}
                  >
                    {profileForm.processing ? (
                      <span className="flex items-center gap-2">
                        <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Update Password Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <h6 className="card-title">Update Password</h6>
                <p className="text-sm text-default-700 mt-1">
                  Ensure your account is using a long, random password to stay secure
                </p>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="current_password"
                    className="block font-medium text-default-900 text-sm mb-2"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current_password"
                    name="current_password"
                    required
                    value={passwordForm.data.current_password}
                    onChange={(e) =>
                      passwordForm.setData('current_password', e.target.value)
                    }
                    className="form-input"
                    placeholder="Your current password"
                    autoComplete="current-password"
                  />
                  <InputError message={passwordForm.errors.current_password} />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block font-medium text-default-900 text-sm mb-2"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={passwordForm.data.password}
                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                    className="form-input"
                    placeholder="Your new password"
                    autoComplete="new-password"
                  />
                  <InputError message={passwordForm.errors.password} />
                </div>

                <div>
                  <label
                    htmlFor="password_confirmation"
                    className="block font-medium text-default-900 text-sm mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="password_confirmation"
                    name="password_confirmation"
                    required
                    value={passwordForm.data.password_confirmation}
                    onChange={(e) =>
                      passwordForm.setData('password_confirmation', e.target.value)
                    }
                    className="form-input"
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                  />
                  <InputError message={passwordForm.errors.password_confirmation} />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="btn bg-primary text-white"
                    disabled={passwordForm.processing}
                  >
                    {passwordForm.processing ? (
                      <span className="flex items-center gap-2">
                        <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
