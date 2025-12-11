import { useForm, Link } from '@inertiajs/react';
import { useMemo, useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import DatePicker from '@/components/DatePicker';

type SubCategoryOption = {
  id: number;
  name: string;
  category_name: string | null;
};

type LocationOption = {
  id: number;
  name: string;
};

type StaffOption = {
  id: number;
  name: string;
};

type CreateAssetPageProps = {
  subCategories: SubCategoryOption[];
  locations: LocationOption[];
  staff: StaffOption[];
};

export default function Create({
  subCategories,
  locations,
  staff,
}: CreateAssetPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    sub_category_id: '',
    serial_number: '',
    location_id: '',
    staff_id: '',
    purchase_date: '',
    purchase_cost: '',
    image: null as File | null,
  });

  const subCategoryOptions = useMemo<SelectOption[]>(() =>
    subCategories.map((sc) => ({
      label: sc.category_name ? `${sc.category_name} - ${sc.name}` : sc.name,
      value: sc.id
    })), [subCategories]
  );

  const locationOptions = useMemo<SelectOption[]>(() =>
    locations.map((loc) => ({
      label: loc.name,
      value: loc.id
    })), [locations]
  );

  const staffOptions = useMemo<SelectOption[]>(() =>
    staff.map((s) => ({
      label: s.name,
      value: s.id
    })), [staff]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setData('image', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/asset-management', {
      forceFormData: true,
    });
  };

  return (
    <AppLayout>
      <PageMeta title="Create Asset" />
      <main className="max-w-4xl">
        <PageBreadcrumb title="Create Asset" subtitle="Asset Management" />

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Asset Information</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Name Field - Half Width */}
                <div className="w-full md:w-1/2">
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter asset name"
                    disabled={processing}
                    className="form-input"
                  />
                  <InputError message={errors.name} />
                </div>

                {/* Description Field - Half Width */}
                <div className="w-full md:w-1/2">
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Enter description"
                    disabled={processing}
                    rows={3}
                    className="form-input"
                  />
                  <InputError message={errors.description} />
                </div>

                {/* First 3-Column Grid: Category, Serial Number, Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <input type="hidden" name="sub_category_id" value={data.sub_category_id} />
                    <Combobox
                      label="Category"
                      options={subCategoryOptions}
                      value={subCategoryOptions.find(opt => String(opt.value) === data.sub_category_id) || null}
                      onChange={(option) => setData('sub_category_id', option?.value?.toString() || '')}
                      placeholder="Select category"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.sub_category_id}
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      name="serial_number"
                      value={data.serial_number}
                      onChange={(e) => setData('serial_number', e.target.value)}
                      placeholder="Enter serial number"
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.serial_number} />
                  </div>

                  <div>
                    <input type="hidden" name="location_id" value={data.location_id} />
                    <Combobox
                      label="Location"
                      options={locationOptions}
                      value={locationOptions.find(opt => String(opt.value) === data.location_id) || null}
                      onChange={(option) => setData('location_id', option?.value?.toString() || '')}
                      placeholder="Select location"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.location_id}
                    />
                  </div>
                </div>

                {/* Second 3-Column Grid: Assigned Staff, Purchase Date, Purchase Cost */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <input type="hidden" name="staff_id" value={data.staff_id} />
                    <Combobox
                      label="Assigned Staff"
                      options={staffOptions}
                      value={staffOptions.find(opt => String(opt.value) === data.staff_id) || null}
                      onChange={(option) => setData('staff_id', option?.value?.toString() || '')}
                      placeholder="Select staff"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.staff_id}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="purchase_date" value={data.purchase_date} />
                    <DatePicker
                      label="Purchase Date"
                      inputClassName="form-input"
                      value={data.purchase_date}
                      onChange={(dates, dateStr) => setData('purchase_date', dateStr)}
                      placeholder="Select purchase date"
                      disabled={processing}
                      error={errors.purchase_date}
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Purchase Cost
                    </label>
                    <input
                      type="number"
                      name="purchase_cost"
                      value={data.purchase_cost}
                      onChange={(e) => setData('purchase_cost', e.target.value)}
                      placeholder="Enter purchase cost"
                      disabled={processing}
                      step="0.01"
                      min="0"
                      className="form-input"
                    />
                    <InputError message={errors.purchase_cost} />
                  </div>
                </div>

                {/* Image Upload Field */}
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={processing}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="btn btn-sm border-default-200 text-default-700 hover:bg-default-50"
                  >
                    <Upload className="size-4 mr-2" />
                    Upload Image
                  </button>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 flex items-start gap-3">
                      <div 
                        className="rounded-lg border border-default-200 overflow-hidden bg-default-50 p-1 flex-shrink-0"
                        style={{ width: '80px', height: '80px' }}
                      >
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="size-6 bg-danger text-white rounded flex items-center justify-center hover:bg-danger/80 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                  <InputError message={errors.image} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/asset-management">
              <button
                type="button"
                className="btn border-default-200 text-default-900"
                disabled={processing}
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className="btn bg-primary text-white"
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <div className="inline-block border-2 border-white rounded-full size-4 animate-spin border-s-transparent" />
                  Creating...
                </span>
              ) : (
                'Create Asset'
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}
