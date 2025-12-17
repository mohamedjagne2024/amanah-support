<?php

namespace App\Http\Controllers;

use App\Models\KnowledgeBase;
use App\Models\Type;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class KnowledgeBaseController extends Controller {

    public function index() {
        return Inertia::render('kb/index', [
            'title' => 'Knowledge base',
            'filters' => Request::all('search'),
            'types' => Type::orderBy('name')->get()->map->only('id', 'name'),
            'knowledge_base' => KnowledgeBase::orderBy('title')
                ->filter(Request::only('search'))
                ->paginate(10)
                ->withQueryString()
                ->through(function ($knowledge_base) {
                    return [
                        'id' => $knowledge_base->id,
                        'title' => $knowledge_base->title,
                        'type' => $knowledge_base->type ? $knowledge_base->type->name : '',
                        'type_id' => $knowledge_base->type_id,
                        'details' => $knowledge_base->details
                    ];
                } ),
        ]);
    }

    public function store()
    {
        KnowledgeBase::create(
            Request::validate([
                'title' => ['required', 'max:150'],
                'type_id' => ['required'],
                'details' => ['required']
            ])
        );

        return Redirect::route('knowledge_base')->with('success', 'Knowledge base created.');
    }

    public function update(KnowledgeBase $knowledge_base)
    {
        $knowledge_base->update(
            Request::validate([
                'title' => ['required', 'max:150'],
                'type_id' => ['nullable'],
                'details' => ['required']
            ])
        );

        return Redirect::back()->with('success', 'Knowledge base updated.');
    }

    public function destroy(KnowledgeBase $knowledge_base)
    {
        $knowledge_base->delete();
        return Redirect::route('knowledge_base')->with('success', 'Knowledge base deleted.');
    }
}
