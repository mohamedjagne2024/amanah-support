import { router, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { 
  Check, 
  Download, 
  FileSpreadsheet, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import PageMeta from "@/components/PageMeta";
import Combobox, { SelectOption } from "@/components/Combobox";

type PreviewRecord = {
  row: number;
  data: Record<string, any>;
  status: "valid" | "error" | "warning";
  errors?: string[];
};

type ImportPreviewData = {
  headers: string[];
  total_rows: number;
  preview_records: PreviewRecord[];
  valid_count: number;
  error_count: number;
  warning_count: number;
};

type ImportPageProps = {
  uploadedFile?: {
    path: string;
    name: string;
    size: number;
  };
  previewData?: ImportPreviewData;
};

const SYSTEM_FIELDS: Array<{ value: string; label: string; required: boolean }> = [
  { value: "name", label: "Name", required: true },
  { value: "skip", label: "Skip this column", required: false }
];

const SYSTEM_FIELD_OPTIONS: SelectOption[] = SYSTEM_FIELDS.map((field) => ({
  label: field.label,
  value: field.value
}));

export default function Import() {
  const props = usePage<{ props: ImportPageProps }>().props as unknown as ImportPageProps;
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUploadFile = useCallback(() => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    router.post("/categories/import/upload", formData, {
      onSuccess: () => {
        setCurrentStep(1);
      },
      onError: (errors) => {
        console.error("Upload error:", errors);
      },
      onFinish: () => {
        setIsUploading(false);
      }
    });
  }, [selectedFile]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFieldMappingChange = useCallback((excelColumn: string, systemField: string) => {
    setFieldMappings((prev) => ({
      ...prev,
      [excelColumn]: systemField
    }));
  }, []);

  const handleGeneratePreview = useCallback(() => {
    setIsProcessing(true);
    router.post(
      "/categories/import/preview",
      { mappings: fieldMappings },
      {
        onSuccess: () => {
          setCurrentStep(2);
        },
        onError: (errors) => {
          console.error("Preview error:", errors);
        },
        onFinish: () => {
          setIsProcessing(false);
        }
      }
    );
  }, [fieldMappings]);

  const handleConfirmImport = useCallback(() => {
    setIsProcessing(true);
    router.post(
      "/categories/import/execute",
      { mappings: fieldMappings },
      {
        onSuccess: () => {
          router.visit("/categories");
        },
        onFinish: () => {
          setIsProcessing(false);
        }
      }
    );
  }, [fieldMappings]);

  const handleCancel = useCallback(() => {
    router.visit("/categories");
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Auto-map fields based on common names
  const handleAutoMap = useCallback(() => {
    if (!props.previewData?.headers) return;

    const newMappings: Record<string, string> = {};
    props.previewData.headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "_");

      const match = SYSTEM_FIELDS.find((field) => {
        const normalizedField = field.value.toLowerCase().replace(/[^a-z0-9]/g, "_");
        return (
          normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)
        );
      });

      if (match) {
        newMappings[header] = match.value;
      }
    });

    setFieldMappings(newMappings);
  }, [props.previewData?.headers]);

  useEffect(() => {
    if (currentStep === 1 && props.previewData?.headers) {
      handleAutoMap();
    }
  }, [currentStep, props.previewData?.headers, handleAutoMap]);

  const isNameMapped = Object.values(fieldMappings).includes("name");

  const steps = ["Upload File", "Map Fields", "Preview & Import"];

  return (
    <AppLayout>
      <PageMeta title="Import Categories" />
      <main className="max-w-4xl pb-8">
        <PageBreadcrumb 
          title="Import Categories" 
          subtitle="Categories"
          subtitleUrl="/categories"
        />

        {/* Simple Step Indicator */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                currentStep === index 
                  ? "bg-primary text-white" 
                  : currentStep > index 
                    ? "bg-success/15 text-success" 
                    : "bg-default-100 text-default-500"
              }`}>
                {currentStep > index ? (
                  <Check className="size-3.5" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
                <span className="font-medium">{step}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="size-4 text-default-300" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload File */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Upload File</h6>
              </div>
              <div className="card-body space-y-5">
                {/* File Upload Area */}
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Select File <span className="text-danger">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`
                        cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
                        ${isDragOver 
                          ? "border-primary bg-primary/5" 
                          : "border-default-300 hover:border-primary/50 hover:bg-default-50"
                        }
                      `}
                    >
                      <Upload className={`size-10 mx-auto mb-3 ${isDragOver ? "text-primary" : "text-default-400"}`} />
                      <p className="text-default-700 font-medium mb-1">
                        Drop your file here, or <span className="text-primary">browse</span>
                      </p>
                      <p className="text-sm text-default-500">
                        Supports .xlsx, .xls, .csv (max 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-success/40 bg-success/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-success/15 rounded-lg">
                            <FileSpreadsheet className="size-6 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-default-800">{selectedFile.name}</p>
                            <p className="text-sm text-default-500">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="btn btn-sm btn-outline-dashed border-primary text-danger hover:bg-danger/10"
                        >
                          <X className="size-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="rounded-lg bg-default-50 border border-default-200 p-4 mt-3">
                  <h4 className="font-medium text-default-800 text-sm mb-2">Import Guidelines</h4>
                  <ul className="text-sm text-default-600 space-y-1">
                    <li>• First row should contain column headers</li>
                    <li>• "Name" is the only required field</li>
                    <li>• Duplicate category names will be skipped</li>
                  </ul>
                </div>

                {/* Template Download */}
                <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg mt-3">
                  <div>
                    <p className="font-medium text-default-800 text-sm">Need a template?</p>
                    <p className="text-sm text-default-500">Download our sample Excel file</p>
                  </div>
                  <a href="/templates/category-import-template.xlsx" download>
                    <button className="btn btn-sm border-default-200 text-default-700 hover:bg-default-50">
                      <Download className="size-4 mr-1.5" />
                      Download
                    </button>
                  </a>
                </div>
              </div>
              <div className="card-footer">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn border-default-200 text-default-700 hover:bg-default-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadFile}
                  disabled={!selectedFile || isUploading}
                  className="btn bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4 ml-1.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Map Fields */}
        {currentStep === 1 && props.previewData?.headers && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Map Columns</h6>
                <button
                  type="button"
                  onClick={handleAutoMap}
                  className="btn btn-sm border-primary text-primary hover:bg-primary/10"
                >
                  Auto-Map Fields
                </button>
              </div>
              <div className="card-body">
                {/* Validation Status */}
                <div className={`mb-5 p-3 rounded-lg flex items-center gap-2 ${
                  isNameMapped 
                    ? "bg-success/10 border border-success/20" 
                    : "bg-warning/10 border border-warning/20"
                }`}>
                  {isNameMapped ? (
                    <>
                      <CheckCircle2 className="size-4 text-success" />
                      <span className="text-sm font-medium text-success">Name field mapped - ready to continue</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-4 text-warning" />
                      <span className="text-sm font-medium text-warning">Map the "Name" field to continue</span>
                    </>
                  )}
                </div>

                {/* Mapping List */}
                <div className="space-y-3 mt-3">
                  {props.previewData.headers.map((header, index) => {
                    const mappedField = SYSTEM_FIELDS.find(
                      (f) => f.value === fieldMappings[header]
                    );
                    const selectedOption = SYSTEM_FIELD_OPTIONS.find(
                      (opt) => opt.value === fieldMappings[header]
                    );
                    
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-default-50 border border-default-200">
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <FileSpreadsheet className="size-4 text-default-400" />
                          <span className="font-medium text-default-800 text-sm truncate">{header}</span>
                        </div>
                        <ArrowRight className="size-4 text-default-300 shrink-0" />
                        <div className="flex-1 max-w-xs">
                          <Combobox
                            options={SYSTEM_FIELD_OPTIONS}
                            value={selectedOption || null}
                            onChange={(option) =>
                              handleFieldMappingChange(header, option?.value?.toString() || "")
                            }
                            placeholder="Select field..."
                            isClearable
                            isSearchable
                          />
                        </div>
                        {mappedField?.required && (
                          <span className="text-xs font-medium text-danger bg-danger/10 px-2 py-0.5 rounded shrink-0">
                            Required
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="card-footer">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn border-default-200 text-default-700 hover:bg-default-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={isProcessing || !isNameMapped}
                  className="btn bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Preview
                      <ArrowRight className="size-4 ml-1.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Import */}
        {currentStep === 2 && props.previewData && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="flex gap-2">
              <div className="card flex-1 p-4 text-center">
                <p className="text-3xl font-bold text-default-700">{props.previewData.total_rows}</p>
                <p className="text-sm text-default-500 mt-1">Total Records</p>
              </div>
              <div className="card flex-1 p-4 text-center">
                <p className="text-3xl font-bold text-success">{props.previewData.valid_count}</p>
                <p className="text-sm text-default-500 mt-1">Ready to Import</p>
              </div>
              <div className="card flex-1 p-4 text-center">
                <p className="text-3xl font-bold text-danger">{props.previewData.error_count}</p>
                <p className="text-sm text-default-500 mt-1">Will be Skipped</p>
              </div>
            </div>

            {/* Error Notice */}
            {props.previewData.error_count > 0 && (
              <div className="card p-4 flex items-center gap-3 border-danger/30 bg-danger/5">
                <AlertCircle className="size-5 text-danger shrink-0" />
                <p className="text-sm text-danger">
                  <span className="font-medium">{props.previewData.error_count} record(s)</span> have validation errors and will be skipped during import.
                </p>
              </div>
            )}

            {/* Preview Table */}
            <div className="card">
              <div className="card-header">
                <h6 className="card-title">Preview (First 10 Records)</h6>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full divide-y divide-default-200 dark:divide-white/14">
                    <thead className="bg-default-150">
                      <tr className="text-default-600">
                        <th className="py-3 px-3.5 text-start text-sm font-medium w-20">Row</th>
                        <th className="py-3 px-3.5 text-start text-sm font-medium w-28">Status</th>
                        <th className="py-3 px-3.5 text-start text-sm font-medium">Name</th>
                        <th className="py-3 px-3.5 text-start text-sm font-medium">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-default-200 dark:divide-white/14">
                      {props.previewData.preview_records.slice(0, 10).map((record, index) => (
                        <tr key={index} className="text-default-800">
                          <td className="py-2.5 px-3.5 text-sm text-default-500">{record.row}</td>
                          <td className="py-2.5 px-3.5">
                            {record.status === "valid" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded bg-success/15 text-success">
                                <CheckCircle2 className="size-3.5" /> Valid
                              </span>
                            ) : record.status === "error" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded bg-danger/15 text-danger">
                                <AlertCircle className="size-3.5" /> Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded bg-warning/15 text-warning">
                                <AlertCircle className="size-3.5" /> Warning
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-sm font-medium text-default-800">
                            {record.data.name || <span className="text-default-400 font-normal italic">No name provided</span>}
                          </td>
                          <td className="py-2.5 px-3.5">
                            {record.errors && record.errors.length > 0 ? (
                              <ul className="space-y-1">
                                {record.errors.map((error, i) => (
                                  <li key={i} className="text-sm text-danger">• {error}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-sm text-default-500">No issues</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn border-default-200 text-default-700 hover:bg-default-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isProcessing || props.previewData.valid_count === 0}
                  className="btn bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import {props.previewData.valid_count} Categor{props.previewData.valid_count !== 1 ? 'ies' : 'y'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}

