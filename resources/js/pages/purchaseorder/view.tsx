import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Download, Pencil, Printer, Trash2 } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import { ConfirmDialog } from "@/components/Dialog";

type PurchaseOrderItem = {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  amount: number;
  subtotal: number;
  subcategory: {
    id: number;
    name: string;
    category: {
      id: number;
      name: string;
    } | null;
  } | null;
  location: {
    id: number;
    name: string;
  } | null;
  department: {
    id: number;
    name: string;
  } | null;
};

type PurchaseOrder = {
  id: number;
  po_number: string;
  title: string;
  purchase_date: string;
  staff: {
    id: number;
    name: string;
  } | null;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  grand_total: number;
  notes: string | null;
  status: number;
  created_user: {
    id: number;
    name: string;
  } | null;
  updated_user: {
    id: number;
    name: string;
  } | null;
  approved_user: {
    id: number;
    name: string;
  } | null;
  rejected_user: {
    id: number;
    name: string;
  } | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ViewPurchaseOrderPageProps = {
  purchaseOrder: PurchaseOrder;
};

const STATUS_LOOKUP: Record<number, { label: string; className: string }> = {
  0: { label: "Pending", className: "bg-warning/15 text-warning" },
  2: { label: "Approved", className: "bg-success/15 text-success" },
  3: { label: "Rejected", className: "bg-danger/15 text-danger" },
  4: { label: "Received", className: "bg-info/15 text-info" }
};

export default function View({ purchaseOrder }: ViewPurchaseOrderPageProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const status = STATUS_LOOKUP[purchaseOrder.status] ?? STATUS_LOOKUP[0];

  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    router.delete(`/purchase-orders/${purchaseOrder.id}`, {
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      },
      onSuccess: () => {
        router.visit('/purchase-orders');
      }
    });
  };

  const handleDownloadPDF = () => {
    console.log('Download PDF');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <PageMeta title="Purchase Order" />
      <main>
        <div className="flex items-center md:justify-between flex-wrap gap-2 mb-4 print:hidden">
          <h4 className="text-default-900 text-lg font-semibold">Purchase Order</h4>
          <div className="flex items-center gap-3">
            <Menu as="div" className="relative inline-flex">
              <MenuButton className="btn border border-default-200 text-default-700 hover:bg-default-100 btn-sm">
                Actions
              </MenuButton>
              <MenuItems
                anchor="bottom end"
                className="w-48 origin-top-right rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] z-50 focus:outline-none"
              >
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      href={`/purchase-orders/${purchaseOrder.id}/edit`}
                      className={`flex items-center gap-2 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${
                        focus ? 'bg-default-150' : ''
                      }`}
                    >
                      <Pencil className="size-4" /> Edit
                    </Link>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleDownloadPDF}
                      className={`w-full text-left flex items-center gap-2 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${
                        focus ? 'bg-default-150' : ''
                      }`}
                    >
                      <Download className="size-4" /> Download PDF
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handlePrint}
                      className={`w-full text-left flex items-center gap-2 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${
                        focus ? 'bg-default-150' : ''
                      }`}
                    >
                      <Printer className="size-4" /> Print
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleOpenDeleteDialog}
                      className={`w-full text-left flex items-center gap-2 py-1.5 font-medium px-3 text-danger rounded cursor-pointer ${
                        focus ? 'bg-danger/10' : ''
                      }`}
                    >
                      <Trash2 className="size-4" /> Delete
                    </button>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>

        {/* A4 Invoice Container */}
        <div className="card w-[210mm] min-h-[297mm] mx-auto print:shadow-none print:rounded-none print:w-full print:max-w-full print:m-0 print:border-none print:bg-transparent">
          {/* Invoice Header */}
          <div className="card-header !min-h-0 !py-6 !px-8 print:border-none print:px-0">
            <div className="flex justify-between items-start w-full">
              <div>
                <h1 className="text-3xl font-bold text-default-800">
                  PURCHASE ORDER
                </h1>
                <p className="text-sm text-default-600 mt-1">
                  Amanah Insurance Assets
                </p>
              </div>
              <span className={`py-1 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded ${status.className}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="card-body !p-8 print:p-0">
            {/* PO Details */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1">
                <p className="text-sm font-medium text-default-600 mb-3">
                  Purchase Order Details
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium min-w-25">PO Number:</span>
                    <span className="text-sm text-default-700">{purchaseOrder.po_number}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium min-w-25">Date:</span>
                    <span className="text-sm text-default-700">{purchaseOrder.purchase_date}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium min-w-25">Staff:</span>
                    <span className="text-sm text-default-700">{purchaseOrder.staff?.name ?? 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-default-600 mb-3">
                  Additional Information
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium min-w-25">Title:</span>
                    <span className="text-sm text-default-700">{purchaseOrder.title}</span>
                  </div>
                  {purchaseOrder.created_user && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium min-w-25">Created By:</span>
                      <span className="text-sm text-default-700">{purchaseOrder.created_user.name}</span>
                    </div>
                  )}
                  {purchaseOrder.approved_user && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium min-w-25">Approved By:</span>
                      <span className="text-sm text-default-700">{purchaseOrder.approved_user.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h6 className="card-title mb-4">Items</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">#</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Item Name</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Description</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Quantity</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Unit Price</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-default-500">
                          No items found
                        </td>
                      </tr>
                    ) : (
                      purchaseOrder.items.map((item, index) => (
                        <tr key={item.id} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{index + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm text-default-800">{item.name}</p>
                            {item.subcategory && (
                              <p className="text-xs text-default-600">
                                {item.subcategory.category?.name 
                                  ? `${item.subcategory.category.name} / ${item.subcategory.name}`
                                  : item.subcategory.name
                                }
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-default-600">
                              {item.description || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm text-default-700">
                            ${Number(item.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-default-800">
                            ${Number(item.subtotal).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-6">
              <div className="flex justify-end">
                <div className="min-w-75">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-default-600">Subtotal:</span>
                      <span className="text-sm font-medium text-default-800">
                        ${Number(purchaseOrder.subtotal).toFixed(2)}
                      </span>
                    </div>
                    {purchaseOrder.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-default-600">Discount:</span>
                        <span className="text-sm font-medium text-danger">
                          -${Number(purchaseOrder.discount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {purchaseOrder.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-default-600">Tax:</span>
                        <span className="text-sm font-medium text-default-800">
                          ${Number(purchaseOrder.tax).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {purchaseOrder.shipping > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-default-600">Shipping:</span>
                        <span className="text-sm font-medium text-default-800">
                          ${Number(purchaseOrder.shipping).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <hr className="border-default-200" />
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-default-800">Grand Total:</span>
                      <span className="text-lg font-bold text-primary">
                        ${Number(purchaseOrder.grand_total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {purchaseOrder.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2 text-default-800">
                  Notes:
                </h3>
                <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-sm whitespace-pre-wrap text-default-700">
                    {purchaseOrder.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Footer */}
          <div className="card-footer !py-3.5 !px-8 print:border-none print:px-0">
            <span className="text-xs text-default-500">
              Created: {purchaseOrder.created_at || 'N/A'}
            </span>
            {purchaseOrder.updated_at && (
              <span className="text-xs text-default-500">
                Last Updated: {purchaseOrder.updated_at}
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDeleteDialog();
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description={`Are you sure you want to delete the purchase order "${purchaseOrder.po_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="lg"
      />
    </AppLayout>
  );
}
