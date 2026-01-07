<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateGeneralSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'decimal_places' => $this->input('decimal_places') === '' ? null : $this->input('decimal_places'),
            'escalate_value' => $this->input('escalate_value') === '' ? null : $this->input('escalate_value'),
            'autoclose_value' => $this->input('autoclose_value') === '' ? null : $this->input('autoclose_value'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'timezone' => ['nullable', 'string', 'max:255'],
            'language' => ['nullable', 'string', 'max:255'],
            'date_format' => ['nullable', 'string', 'max:255'],
            'time_format' => ['nullable', 'string', 'max:255'],
            'currency_position' => ['nullable', 'string', 'max:255'],
            'thousand_sep' => ['nullable', 'string', 'max:10'],
            'decimal_sep' => ['nullable', 'string', 'max:10'],
            'decimal_places' => ['nullable', 'integer', 'min:0', 'max:10'],
            'currency' => ['nullable', 'string', 'max:10'],
            'required_ticket_fields' => ['nullable', 'array'],
            'required_ticket_fields.*' => ['string'],
            'email_notifications' => ['nullable', 'array'],
            'email_notifications.ticket_by_contact' => ['nullable', 'boolean'],
            'email_notifications.ticket_from_dashboard' => ['nullable', 'boolean'],
            'email_notifications.first_comment' => ['nullable', 'boolean'],
            'email_notifications.user_assigned' => ['nullable', 'boolean'],
            'email_notifications.status_priority_changes' => ['nullable', 'boolean'],
            'email_notifications.ticket_resolved' => ['nullable', 'boolean'],
            'email_notifications.new_user' => ['nullable', 'boolean'],
            'gcs_project_id' => ['nullable', 'string', 'max:255'],
            'gcs_key_file_path' => ['nullable', 'string', 'max:500'],
            'gcs_bucket' => ['nullable', 'string', 'max:255'],
            'gcs_path_prefix' => ['nullable', 'string', 'max:255'],
            'gcs_api_uri' => ['nullable', 'string', 'max:255', 'url'],
            'escalate_value' => ['nullable', 'numeric', 'min:0'],
            'escalate_unit' => ['nullable', 'string', 'in:minutes,hours,days'],
            'autoclose_value' => ['nullable', 'numeric', 'min:0'],
            'autoclose_unit' => ['nullable', 'string', 'in:minutes,hours,days'],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'decimal_places.integer' => 'The decimal places must be a number.',
            'decimal_places.min' => 'The decimal places must be at least 0.',
            'decimal_places.max' => 'The decimal places may not be greater than 10.',
        ];
    }
}
