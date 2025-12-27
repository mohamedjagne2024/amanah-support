<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class ContactsController extends Controller
{
    /**
     * Display the contact management page.
     */
    public function index(): Response
    {
        Gate::authorize('contacts.view');

        $search = request()->query('search');
        $sortBy = request()->string('sort_by')->value();
        $sortDirection = request()->string('sort_direction')->value();
        $perPage = request()->integer('per_page', 10);

        $allowedSortColumns = ['name', 'email', 'created_at'];
        $allowedSortDirections = ['asc', 'desc'];

        $validSortBy = in_array($sortBy, $allowedSortColumns, true) ? $sortBy : 'name';
        $validSortDirection = in_array($sortDirection, $allowedSortDirections, true) ? $sortDirection : 'asc';

        $contacts = User::with(['roles', 'organization'])
            ->role('contact')
            ->when($search, static function ($query, string $term): void {
                $query->where(static function ($subQuery) use ($term): void {
                    $subQuery
                        ->where('name', 'like', '%' . $term . '%')
                        ->orWhere('email', 'like', '%' . $term . '%')
                        ->orWhere('phone', 'like', '%' . $term . '%')
                        ->orWhere('city', 'like', '%' . $term . '%');
                });
            })
            ->orderBy($validSortBy, $validSortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(static function (User $user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'city' => $user->city,
                    'country' => $user->country?->name,
                    'country_id' => $user->country_id,
                    'organization_id' => $user->organization_id,
                    'organization' => $user->organization?->name,
                    'photo' => $user->photo_path,
                    'created_at' => $user->created_at?->toDateString(),
                ];
            });



        $countries = Country::all()
            ->map(static function (Country $country): array {
                return [
                    'id' => $country->id,
                    'name' => $country->name,
                ];
            });

        $organizations = Organization::orderBy('name')
            ->get()
            ->map(static function (Organization $organization): array {
                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                ];
            });

        return Inertia::render('contact/index', [
            'title' => 'Contacts',
            'contacts' => $contacts,
            'countries' => $countries,
            'organizations' => $organizations,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy ?: null,
                'sort_direction' => $sortDirection ?: null,
            ],
        ]);
    }

    /**
     * Store a newly created contact.
     */
    public function store(): RedirectResponse
    {
        Gate::authorize('contacts.create');

        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:25'],
            'email' => ['required', 'string', 'max:50', 'email', Rule::unique('users')],
            'password' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'organization_id' => ['nullable', 'exists:organizations,id'],
        ]);

        $photoPath = null;
        if (Request::file('photo')) {
            $photoPath = '/files/' . Request::file('photo')->store('users', ['disk' => 'file_uploads']);
        }

        /** @var User */
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'] ?? null,
            'address' => $validated['address'] ?? null,
            'country_id' => $validated['country_id'] ?? null,
            'organization_id' => $validated['organization_id'] ?? null,
            'photo_path' => $photoPath,
            'password' => !empty($validated['password'])
                ? Hash::make($validated['password'])
                : Hash::make(Str::random(16)),
        ]);

        // Assign the contact role
        $user->assignRole('contact');

        return redirect()
            ->route('contacts')
            ->with('success', 'Contact created successfully.');
    }

    /**
     * Update the specified contact.
     */
    public function update(User $user): RedirectResponse
    {
        Gate::authorize('contacts.edit');

        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:25'],
            'email' => ['required', 'string', 'max:50', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'organization_id' => ['nullable', 'exists:organizations,id'],
            'photo' => ['nullable', 'image'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'],
            'city' => $validated['city'] ?? null,
            'address' => $validated['address'] ?? null,
            'country_id' => $validated['country_id'] ?? null,
            'organization_id' => $validated['organization_id'] ?? null,
        ]);

        if (Request::file('photo')) {
            if (!empty($user->photo_path) && File::exists(public_path($user->photo_path))) {
                File::delete(public_path($user->photo_path));
            }
            $user->update([
                'photo_path' => '/files/' . Request::file('photo')->store('users', ['disk' => 'file_uploads']),
            ]);
        }

        if (!empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }


        return redirect()
            ->back()
            ->with('success', 'Contact updated successfully.');
    }

    /**
     * Delete the specified contact.
     */
    public function destroy(User $user): RedirectResponse
    {
        Gate::authorize('contacts.delete');

        $user->delete();

        return redirect()
            ->route('contacts')
            ->with('success', 'Contact deleted successfully.');
    }

    /**
     * Restore the specified contact.
     */
    public function restore(User $user): RedirectResponse
    {
        Gate::authorize('contacts.edit');

        $user->restore();

        return redirect()
            ->back()
            ->with('success', 'Contact restored successfully.');
    }
}
