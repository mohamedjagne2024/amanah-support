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
            'purchase_order_number' => ['nullable', 'integer', 'min:1'],
            'fcm_server_key' => ['nullable', 'string', 'max:255'],
            'email_type' => ['nullable', 'string', 'max:50'],
            'email_from' => ['nullable', 'email', 'max:255'],
            'email_from_name' => ['nullable', 'string', 'max:255'],
            'email_username' => ['nullable', 'string', 'max:255'],
            'email_password' => ['nullable', 'string', 'max:255'],
            'email_host' => ['nullable', 'string', 'max:255'],
            'email_port' => ['nullable', 'string', 'max:10'],
            'email_security' => ['nullable', 'string', 'max:50'],
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
