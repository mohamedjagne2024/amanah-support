import { useForm, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChevronRight, Plus, Save, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import InputError from '@/components/input-error';
import Combobox, { SelectOption } from '@/components/Combobox';
import DatePicker from '@/components/DatePicker';

type Staff = {
  id: number;
  name: string;
};

type Location = {
  id: number;
  name: string;
};

type Department = {
  id: number;
  name: string;
};

type SubCategory = {
  id: number;
  name: string;
  category_id: number;
};

type PurchaseOrderItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  amount: number;
  subtotal: number;
  subcategory_id: string;
  location_id: string;
  department_id: string;
};

type PurchaseOrder = {
  id: number;
  po_number: string;
  title: string;
  purchase_date: string;
  staff_id: number | null;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  grand_total: number;
  notes: string | null;
  status: number;
  items: Array<{
    id: number;
    name: string;
    description: string | null;
    quantity: number;
    amount: number;
    subtotal: number;
    subcategory_id: number | null;
    location_id: number | null;
    department_id: number | null;
  }>;
};

type EditPurchaseOrderPageProps = {
  purchaseOrder: PurchaseOrder;
  staffList: Staff[];
  locations: Location[];
  departments: Department[];
  subcategories: SubCategory[];
};

// Component for individual item row
type PurchaseOrderItemRowProps = {
  item: PurchaseOrderItem;
  index: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdate: (field: keyof PurchaseOrderItem, value: string | number) => void;
  onRemove: () => void;
  disabled: boolean;
  subcategoryOptions: SelectOption[];
  locationOptions: SelectOption[];
  departmentOptions: SelectOption[];
};

function PurchaseOrderItemRow({
  item,
  index,
  isExpanded,
  onToggleExpansion,
  onUpdate,
  onRemove,
  disabled,
  subcategoryOptions,
  locationOptions,
  departmentOptions
}: PurchaseOrderItemRowProps) {
  return (
    <div className="border border-default-200 rounded-lg overflow-hidden hover:border-default-300 transition-colors">
      {/* Compact Summary Row */}
      <div
        className="flex items-center justify-between p-4 gap-4 cursor-pointer hover:bg-default-50 transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            type="button"
            className="text-default-500 transition-transform"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-default-900 overflow-hidden text-ellipsis whitespace-nowrap" title={item.name || 'Untitled Item'}>
              {item.name || 'Untitled Item'}
            </div>
            {item.description && (
              <div className="text-xs text-default-600 mt-1 overflow-hidden text-ellipsis whitespace-nowrap" title={item.description}>
                {item.description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <div className="text-xs text-default-600">Qty</div>
            <div className="font-medium text-sm">{item.quantity}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-default-600">Amount</div>
            <div className="font-medium text-sm">${Number(item.amount).toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-default-600">Subtotal</div>
            <div className="font-semibold text-sm text-primary">${Number(item.subtotal).toFixed(2)}</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={disabled}
            className="text-danger hover:bg-danger/10 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Remove item"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Expanded Form Content */}
      {isExpanded && (
        <div className="p-6 bg-default-50 border-t border-default-200">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">
                  Item Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdate('name', e.target.value)}
                  placeholder="Enter item name"
                  disabled={disabled}
                  className="form-input"
                />
                <input type="hidden" name={`items[${index}][name]`} value={item.name} />
              </div>

              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">
                  Quantity <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdate('quantity', parseInt(e.target.value) || 1)}
                  disabled={disabled}
                  className="form-input"
                />
                <input type="hidden" name={`items[${index}][quantity]`} value={item.quantity} />
              </div>
            </div>

            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                Description
              </label>
              <textarea
                value={item.description}
                onChange={(e) => onUpdate('description', e.target.value)}
                placeholder="Enter item description"
                disabled={disabled}
                rows={3}
                className="form-input"
              />
              <input type="hidden" name={`items[${index}][description]`} value={item.description} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">
                  Unit Amount <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.amount}
                  onChange={(e) => onUpdate('amount', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  placeholder="0.00"
                  className="form-input"
                />
                <input type="hidden" name={`items[${index}][amount]`} value={item.amount} />
              </div>

              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">
                  Subtotal
                </label>
                <input
                  type="text"
                  value={`$${Number(item.subtotal).toFixed(2)}`}
                  disabled
                  readOnly
                  className="form-input bg-default-100"
                />
                <input type="hidden" name={`items[${index}][subtotal]`} value={Number(item.subtotal).toFixed(2)} />
                <p className="mt-1 text-xs text-default-600">Calculated automatically</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input type="hidden" name={`items[${index}][subcategory_id]`} value={item.subcategory_id} />
                <Combobox
                  label="Subcategory"
                  options={subcategoryOptions}
                  value={subcategoryOptions.find(opt => String(opt.value) === item.subcategory_id) || null}
                  onChange={(option) => onUpdate('subcategory_id', option?.value?.toString() || "")}
                  placeholder="Select subcategory"
                  disabled={disabled}
                  isClearable
                  isSearchable
                />
              </div>

              <div>
                <input type="hidden" name={`items[${index}][location_id]`} value={item.location_id} />
                <Combobox
                  label="Location"
                  options={locationOptions}
                  value={locationOptions.find(opt => String(opt.value) === item.location_id) || null}
                  onChange={(option) => onUpdate('location_id', option?.value?.toString() || "")}
                  placeholder="Select location"
                  disabled={disabled}
                  isClearable
                  isSearchable
                />
              </div>

              <div>
                <input type="hidden" name={`items[${index}][department_id]`} value={item.department_id} />
                <Combobox
                  label="Department"
                  options={departmentOptions}
                  value={departmentOptions.find(opt => String(opt.value) === item.department_id) || null}
                  onChange={(option) => onUpdate('department_id', option?.value?.toString() || "")}
                  placeholder="Select department"
                  disabled={disabled}
                  isClearable
                  isSearchable
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Edit({ purchaseOrder, staffList, locations, departments, subcategories }: EditPurchaseOrderPageProps) {
  const [items, setItems] = useState<PurchaseOrderItem[]>(
    purchaseOrder.items.map(item => ({
      id: item.id.toString(),
      name: item.name,
      description: item.description || "",
      quantity: item.quantity,
      amount: item.amount,
      subtotal: Number(item.subtotal) || (item.quantity * item.amount),
      subcategory_id: item.subcategory_id ? String(item.subcategory_id) : "",
      location_id: item.location_id ? String(item.location_id) : "",
      department_id: item.department_id ? String(item.department_id) : ""
    }))
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, errors } = useForm({
    title: purchaseOrder.title,
    po_number: purchaseOrder.po_number,
    purchase_date: purchaseOrder.purchase_date,
    staff_id: purchaseOrder.staff_id ? String(purchaseOrder.staff_id) : '',
    subtotal: Number(purchaseOrder.subtotal),
    discount: Number(purchaseOrder.discount),
    tax: Number(purchaseOrder.tax),
    shipping: Number(purchaseOrder.shipping),
    grand_total: Number(purchaseOrder.grand_total),
    notes: purchaseOrder.notes || '',
  });

  const staffOptions = useMemo<SelectOption[]>(() => 
    staffList.map(staff => ({
      label: staff.name,
      value: staff.id
    })), [staffList]
  );

  const locationOptions = useMemo<SelectOption[]>(() => 
    locations.map(location => ({
      label: location.name,
      value: location.id
    })), [locations]
  );

  const departmentOptions = useMemo<SelectOption[]>(() => 
    departments.map(department => ({
      label: department.name,
      value: department.id
    })), [departments]
  );

  const subcategoryOptions = useMemo<SelectOption[]>(() => 
    subcategories.map(subcategory => ({
      label: subcategory.name,
      value: subcategory.id
    })), [subcategories]
  );

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      id: Date.now().toString(),
      name: "",
      description: "",
      quantity: 1,
      amount: 0,
      subtotal: 0,
      subcategory_id: "",
      location_id: "",
      department_id: ""
    };
    setItems([...items, newItem]);
    // Auto-expand the new item
    setExpandedItems(prev => new Set([...prev, newItem.id]));
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const updateItem = (id: string, field: keyof PurchaseOrderItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Calculate subtotal if quantity or amount changed
        if (field === 'quantity' || field === 'amount') {
          updated.subtotal = updated.quantity * updated.amount;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Number(subtotal) - Number(data.discount) + Number(data.tax) + Number(data.shipping);
  }, [subtotal, data.discount, data.tax, data.shipping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare items data
    const itemsData = items.map((item, index) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      amount: item.amount,
      subtotal: Number(item.subtotal.toFixed(2)),
      subcategory_id: item.subcategory_id || null,
      location_id: item.location_id || null,
      department_id: item.department_id || null
    }));

    // Put with calculated values included
    router.put(`/purchase-orders/${purchaseOrder.id}`, {
      ...data,
      items: itemsData,
      subtotal: Number(subtotal.toFixed(2)),
      grand_total: Number(grandTotal.toFixed(2))
    }, {
      preserveScroll: true,
      onStart: () => setIsSubmitting(true),
      onFinish: () => setIsSubmitting(false)
    });
  };
  
  const processing = isSubmitting;

  return (
    <AppLayout>
      <PageMeta title={`Edit Purchase Order - ${purchaseOrder.po_number}`} />
      <main className="max-w-5xl">
        <PageBreadcrumb title={`Edit Purchase Order - ${purchaseOrder.po_number}`} subtitle="Asset Management" />
        
        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Purchase Order Information</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={data.title}
                      onChange={(e) => setData('title', e.target.value)}
                      placeholder="Enter purchase order title"
                      disabled={processing}
                      className="form-input"
                      required
                    />
                    <InputError message={errors.title} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      PO Number
                    </label>
                    <input
                      type="text"
                      name="po_number"
                      value={data.po_number}
                      disabled
                      readOnly
                      className="form-input bg-default-100"
                    />
                    <p className="mt-1 text-xs text-default-600">PO number cannot be changed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input type="hidden" name="purchase_date" value={data.purchase_date} />
                    <DatePicker
                      label="Purchase Date"
                      inputClassName='form-input'
                      value={data.purchase_date}
                      onChange={(dates, dateStr) => setData('purchase_date', dateStr)}
                      placeholder="Select purchase date"
                      disabled={processing}
                      error={errors.purchase_date}
                    />
                  </div>

                  <div>
                    <input type="hidden" name="staff_id" value={data.staff_id} />
                    <Combobox
                      label="Staff"
                      options={staffOptions}
                      value={staffOptions.find(opt => String(opt.value) === data.staff_id) || null}
                      onChange={(option) => setData('staff_id', option?.value?.toString() || "")}
                      placeholder="Search or select staff"
                      disabled={processing}
                      isClearable
                      isSearchable
                      error={errors.staff_id}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Order Items */}
          <div className="card">
            <div className="card-header">
              <div className="w-full flex items-center justify-between">
                <h6 className="card-title">Purchase Order Items</h6>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={processing}
                  className="btn btn-sm bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <Plus className="size-4 mr-2" />
                  Add Item
                </button>
              </div>
            </div>
            <div className="card-body">
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <PurchaseOrderItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      isExpanded={expandedItems.has(item.id)}
                      onToggleExpansion={() => toggleItemExpansion(item.id)}
                      onUpdate={(field, value) => updateItem(item.id, field, value)}
                      onRemove={() => removeItem(item.id)}
                      disabled={processing}
                      subcategoryOptions={subcategoryOptions}
                      locationOptions={locationOptions}
                      departmentOptions={departmentOptions}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-default-200 rounded-lg">
                  <p className="text-default-500">No items added yet. Click "Add Item" to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Pricing</h6>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Subtotal <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="subtotal"
                      step="0.01"
                      min="0"
                      value={Number(subtotal).toFixed(2)}
                      disabled
                      readOnly
                      className="form-input bg-default-100"
                    />
                    <p className="mt-1 text-xs text-default-600">Calculated from items: ${subtotal.toFixed(2)}</p>
                    <InputError message={errors.subtotal} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Discount <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="discount"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={data.discount}
                      onChange={(e) => setData('discount', parseFloat(e.target.value) || 0)}
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.discount} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Tax
                    </label>
                    <input
                      type="number"
                      name="tax"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={data.tax}
                      onChange={(e) => setData('tax', parseFloat(e.target.value) || 0)}
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.tax} />
                  </div>

                  <div>
                    <label className="block font-medium text-default-900 text-sm mb-2">
                      Shipping
                    </label>
                    <input
                      type="number"
                      name="shipping"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={data.shipping}
                      onChange={(e) => setData('shipping', parseFloat(e.target.value) || 0)}
                      disabled={processing}
                      className="form-input"
                    />
                    <InputError message={errors.shipping} />
                  </div>
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Grand Total <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="grand_total"
                    step="0.01"
                    min="0"
                    value={Number(grandTotal).toFixed(2)}
                    disabled
                    readOnly
                    className="form-input bg-default-100 font-semibold text-lg"
                  />
                  <p className="mt-1 text-xs text-default-600">Calculated: ${Number(grandTotal).toFixed(2)}</p>
                  <InputError message={errors.grand_total} />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title">Additional Information</h6>
            </div>
            <div className="card-body">
              <div>
                <label className="block font-medium text-default-900 text-sm mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  placeholder="Enter any additional notes"
                  disabled={processing}
                  rows={5}
                  className="form-input"
                />
                <InputError message={errors.notes} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/purchase-orders">
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
                  Processing...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Purchase Order
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}

