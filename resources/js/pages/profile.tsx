import { useForm, router } from '@inertiajs/react';
import { Save, Camera, User as UserIcon } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import { useRef, useState } from 'react';
import PageHeader from '@/components/Pageheader';

interface User {
  id: number;
  name: string;
  email: string;
  profile_picture_url: string | null;
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profile_picture_url);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    const formData = new FormData();
    formData.append('name', profileForm.data.name);
    formData.append('email', profileForm.data.email);
    formData.append('_method', 'PUT');

    if (selectedFile) {
      formData.append('profile_picture', selectedFile);
    }

    router.post('/user/profile-information', formData, {
      preserveState: true,
      onSuccess: () => {
        setSelectedFile(null);
      },
      onError: (errors) => {
        profileForm.setError(errors);
      },
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <AppLayout>
      <PageMeta title="Profile" />
      <main className='max-w-4xl'>
        <PageHeader title="Profile" subtitle="Manage your account settings" />
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
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                      title="Change profile picture"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-default-900">Profile Picture</h4>
                    <p className="text-sm text-default-500 mt-1">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                    {selectedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        New image selected: {selectedFile.name}
                      </p>
                    )}
                    <InputError message={profileForm.errors.profile_picture} />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="space-y-4">
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
                  </div>
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
