<?php

namespace App\Http\Controllers;

use App\Models\FrontPage;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class FrontPagesController extends Controller
{


    public function page($slug)
    {
        $page = FrontPage::where('slug', $slug)->where('language', app()->getLocale())->first();

        $components = [
            'home' => 'front-pages/home',
            'contact' => 'front-pages/contact',
            'services' => 'front-pages/services',
            'privacy' => 'front-pages/privacy',
            'terms' => 'front-pages/terms',
            'footer' => 'front-pages/footer',
        ];
        if (empty($components[$slug])) {
            return abort(404);
        }
        return Inertia::render($components[$slug], [
            'title' => $page ? $page->title : 'Page Settings',e
            'page' => $page,
        ]);
    }

    public function update($slug)
    {
        $requests = Request::validate([
            'title' => ['nullable', 'max:150'],
            'slug' => ['nullable', 'max:50'],
            'is_active' => ['nullable'],
            'html' => ['nullable', 'array']
        ]);

        $page = FrontPage::where('slug', $slug)->where('language', app()->getLocale())->first();

        if (empty($page)) {
            $page = FrontPage::create([
                'title' => $requests['title'] ?? 'Home Page',
                'slug' => $slug,
                'is_active' => $requests['is_active'] ?? true,
                'language' => app()->getLocale(),
                'html' => $requests['html'] ?? [],
            ]);
        } else {
            $page->update([
                'title' => $requests['title'] ?? $page->title,
                'is_active' => $requests['is_active'] ?? $page->is_active,
                'html' => $requests['html'] ?? $page->html,
            ]);
        }

        return Redirect::back()->with('success', 'Page settings updated successfully.');
    }

    public function uploadImage()
    {
        $file_path = '';
        if (Request::hasFile('image')) {
            $image = Request::file('image');
            $file_path = $image->store('pages', ['disk' => 'public']);
        }
        return response()->json(['image' => $file_path ? '/storage/' . $file_path : '']);
    }
}
