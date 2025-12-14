<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class EmailTemplatesController extends Controller {

    public function index(){
        Gate::authorize('email_template.view');
        
        $filters = Request::only(['search', 'sort_by', 'sort_direction']);
        
        $query = EmailTemplate::query();
        
        // Apply search filter
        if ($search = Request::input('search')) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('details', 'like', '%' . $search . '%')
                  ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }
        
        // Apply sorting
        $sortBy = Request::input('sort_by', 'name');
        $sortDirection = Request::input('sort_direction', 'asc');
        
        // Only allow sorting by valid columns
        if (in_array($sortBy, ['name', 'slug', 'id'])) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }
        
        $perPage = Request::input('perPage', 10);
        
        return Inertia::render('email-template/index', [
            'templates' => $query->paginate($perPage)->withQueryString()->through(function ($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'details' => $template->details,
                    'slug' => $template->slug,
                    'html' => $template->html,
                ];
            }),
            'filters' => $filters,
        ]);
    }

    public function edit(EmailTemplate $emailTemplate){
        Gate::authorize('email_template.edit');
        
        return Inertia::render('email-template/edit', [
            'template' => [
                'id' => $emailTemplate->id,
                'name' => $emailTemplate->name,
                'details' => $emailTemplate->details,
                'slug' => $emailTemplate->slug,
                'html' => $emailTemplate->html,
            ],
        ]);
    }

    public function update(EmailTemplate $emailTemplate) {
        Gate::authorize('email_template.edit');
        
        if (config('app.demo')) {
            return Redirect::back()->with('error', 'Updating template are not allowed for the live demo.');
        }
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:255'],
            'html' => ['required', 'string'],
        ]);
        
        $emailTemplate->update($validated);

        return Redirect::back()->with('success', 'Email template updated successfully.');
    }
}

