<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'max:255',
                'email:rfc,filter',
                'not_regex:/[<>"\';\\\\]|(\-\-)|(\/\*)|(\bscript\b)/i',
            ],
            'password' => [
                'required',
                'string',
                'max:128',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Email address is too long.',
            'email.not_regex' => 'Please enter a valid email address.',
            'password.required' => 'Please enter your password.',
            'password.max' => 'Password is too long.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'email' => 'email address',
            'password' => 'password',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email') && is_string($this->email)) {
            $this->merge([
                'email' => strtolower(trim($this->email)),
            ]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $password = $this->input('password');
            if (! is_string($password) || $password === '') {
                return;
            }

            if (preg_match('/[<>"\']|(\-\-)|(\/\*)|(\bscript\b)/i', $password) === 1) {
                $validator->errors()->add(
                    'password',
                    'Please enter your password.',
                );
            }
        });
    }
}
