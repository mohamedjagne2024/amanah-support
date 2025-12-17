<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class FaqsController extends Controller {

    public function index() {
        return Inertia::render('faqs/index', [
            'title' => 'FAQs',
            'filters' => Request::all('search'),
            'faqs' => Faq::orderBy('name')
                ->filter(Request::only('search'))
                ->paginate(10)
                ->withQueryString()
                ->through(function ($faq) {
                    return [
                        'id' => $faq->id,
                        'name' => $faq->name,
                        'status' => $faq->status,
                        'details' => $faq->details,
                    ];
                } ),
        ]);
    }

    public function store()
    {
        Faq::create(
            Request::validate([
                'name' => ['required', 'max:150'],
                'status' => ['nullable'],
                'details' => ['required']
            ])
        );

        return Redirect::route('faqs')->with('success', 'Faq created.');
    }

    public function update(Faq $faq)
    {
        $faq->update(
            Request::validate([
                'name' => ['required', 'max:150'],
                'status' => ['nullable'],
                'details' => ['required']
            ])
        );

        return Redirect::back()->with('success', 'Faq updated.');
    }

    public function destroy(Faq $faq) {
        $faq->delete();
        return Redirect::route('faqs')->with('success', 'Faq deleted.');
    }
}
