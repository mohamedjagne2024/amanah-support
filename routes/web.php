<?php

declare(strict_types=1);

use Laravel\Fortify\Features;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProfileInformationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ContactsController;
use App\Http\Controllers\ImagesController;
use App\Http\Controllers\ImapController;
use App\Http\Controllers\OrganizationsController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\FaqsController;
use App\Http\Controllers\KnowledgeBaseController;
use App\Http\Controllers\PendingUsersController;
use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\PrioritiesController;
use App\Http\Controllers\StatusesController;
use App\Http\Controllers\DepartmentsController;
use App\Http\Controllers\FilterController;
use App\Http\Controllers\TypesController;
use App\Http\Controllers\EmailTemplatesController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\TicketsController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CronJobsController;
use App\Http\Controllers\FrontPagesController;
use App\Http\Controllers\PageController;

Route::prefix('/')->group(static function (Router $router): void {
    $router->middleware('auth')->group(static function (Router $router): void {
        $router->get('/', [DashboardController::class, 'index'])->name('home');

        if (Features::enabled(Features::updateProfileInformation())) {
            $router->get('/profile', [ProfileInformationController::class, 'show']);
        }

        /** Ticket Functions */
        $router->get('tickets', [TicketsController::class, 'index'])
            ->name('tickets')
            ->middleware('auth');

        Route::post('ticket/csv/import', [TicketsController::class, 'csvImport'])->name('ticket.csv.import')
            ->middleware('auth');

        Route::get('ticket/csv/export', [TicketsController::class, 'csvExport'])->name('ticket.csv.export')
            ->middleware('auth');

        Route::get('tickets/create', [TicketsController::class, 'create'])
            ->name('tickets.create')
            ->middleware('auth');

        Route::post('tickets', [TicketsController::class, 'store'])
            ->name('tickets.store')
            ->middleware('auth');

        Route::get('tickets/{uid}', [TicketsController::class, 'edit'])
            ->name('tickets.edit')
            ->middleware('auth');

        Route::post('tickets/{ticket}', [TicketsController::class, 'update'])
            ->name('tickets.update')
            ->middleware('auth');

        Route::delete('tickets/{ticket}', [TicketsController::class, 'destroy'])
            ->name('tickets.destroy')
            ->middleware('auth');

        Route::put('tickets/{ticket}/restore', [TicketsController::class, 'restore'])
            ->name('tickets.restore')
            ->middleware('auth');

        Route::post('ticket/comment', [TicketsController::class, 'newComment'])
            ->name('ticket.comment')
            ->middleware('auth');

        /** Contact Functions */
        Route::get('notes', [NotesController::class, 'index'])
            ->name('notes')
            ->middleware('auth');

        Route::post('notes/{id?}', [NotesController::class, 'saveNote'])
            ->name('notes.save')
            ->middleware('auth');

        Route::delete('notes/{note?}', [NotesController::class, 'delete'])
            ->name('notes.delete')
            ->middleware('auth');

        Route::get('contacts', [ContactsController::class, 'index'])
            ->name('contacts')
            ->middleware('auth');

        Route::get('contacts/create', [ContactsController::class, 'create'])
            ->name('contacts.create')
            ->middleware('auth');

        Route::post('contacts', [ContactsController::class, 'store'])
            ->name('contacts.store')
            ->middleware('auth');

        Route::get('contacts/{contact}/edit', [ContactsController::class, 'edit'])
            ->name('contacts.edit')
            ->middleware('auth');

        Route::put('contacts/{contact}', [ContactsController::class, 'update'])
            ->name('contacts.update')
            ->middleware('auth');

        Route::delete('contacts/{contact}', [ContactsController::class, 'destroy'])
            ->name('contacts.destroy')
            ->middleware('auth');

        Route::put('contacts/{contact}/restore', [ContactsController::class, 'restore'])
            ->name('contacts.restore')
            ->middleware('auth');

        /** Contact Functions */
        Route::get('settings/categories', [CategoriesController::class, 'index'])
            ->name('categories')
            ->middleware('auth');

        Route::get('settings/categories/create', [CategoriesController::class, 'create'])
            ->name('categories.create')
            ->middleware('auth');

        Route::post('settings/categories', [CategoriesController::class, 'store'])
            ->name('categories.store')
            ->middleware('auth');

        Route::get('settings/categories/{category}/edit', [CategoriesController::class, 'edit'])
            ->name('categories.edit')
            ->middleware('auth');

        Route::put('settings/categories/{category}', [CategoriesController::class, 'update'])
            ->name('categories.update')
            ->middleware('auth');

        Route::delete('settings/categories/{category}', [CategoriesController::class, 'destroy'])
            ->name('categories.destroy')
            ->middleware('auth');
        Route::put('settings/categories/{category}/restore', [CategoriesController::class, 'restore'])
            ->name('categories.restore')
            ->middleware('auth');


        /** Chat functions */
        // Chat
        Route::get('chat', [ChatController::class, 'index'])
            ->name('chat')
            ->middleware('auth');

        Route::get('chat/{id}', [ChatController::class, 'chat'])
            ->name('chat.current')
            ->middleware('auth');

        Route::get('chat/create', [ChatController::class, 'create'])
            ->name('chat.create')
            ->middleware('auth');

        Route::post('chat/message', [ChatController::class, 'newMessage'])
            ->name('chat.message')
            ->middleware('auth');

        Route::post('chat', [ChatController::class, 'store'])
            ->name('chat.store')
            ->middleware('auth');

        Route::get('chat/{chat}/edit', [ChatController::class, 'edit'])
            ->name('chat.edit')
            ->middleware('auth');

        Route::put('chat/{chat}', [ChatController::class, 'update'])
            ->name('chat.update')
            ->middleware('auth');

        Route::delete('chat/{chat}', [ChatController::class, 'destroy'])
            ->name('chat.destroy')
            ->middleware('auth');

        Route::put('chat/{chat}/restore', [ChatController::class, 'restore'])
            ->name('chat.restore')
            ->middleware('auth');

        /** Priorities functions */
        Route::get('settings/priorities', [PrioritiesController::class, 'index'])
            ->name('priorities')
            ->middleware('auth');

        Route::get('settings/priorities/create', [PrioritiesController::class, 'create'])
            ->name('priorities.create')
            ->middleware('auth');

        Route::post('settings/priorities', [PrioritiesController::class, 'store'])
            ->name('priorities.store')
            ->middleware('auth');

        Route::get('settings/priorities/{priority}/edit', [PrioritiesController::class, 'edit'])
            ->name('priorities.edit')
            ->middleware('auth');

        Route::put('settings/priorities/{priority}/restore', [PrioritiesController::class, 'restore'])
            ->name('priorities.restore')
            ->middleware('auth');

        Route::delete('settings/priorities/{priority}', [PrioritiesController::class, 'destroy'])
            ->name('priorities.destroy')
            ->middleware('auth');

    // End - Priorities

        /** Faq Route */
        Route::get('faqs', [FaqsController::class, 'index'])
            ->name('faqs')
            ->middleware('auth');

        Route::get('faqs/create', [FaqsController::class, 'create'])
            ->name('faqs.create')
            ->middleware('auth');

        Route::post('faqs', [FaqsController::class, 'store'])
            ->name('faqs.store')
            ->middleware('auth');

        Route::get('faqs/{faq}/edit', [FaqsController::class, 'edit'])
            ->name('faqs.edit')
            ->middleware('auth');

        Route::put('faqs/{faq}', [FaqsController::class, 'update'])
            ->name('faqs.update')
            ->middleware('auth');

        Route::delete('faqs/{faq}', [FaqsController::class, 'destroy'])
            ->name('faqs.destroy')
            ->middleware('auth');

        Route::put('faqs/{faq}/restore', [FaqsController::class, 'restore'])
            ->name('faqs.restore')
            ->middleware('auth');

        /** Knowledge base */
        Route::get('knowledge_base', [KnowledgeBaseController::class, 'index'])
            ->name('knowledge_base')
            ->middleware('auth');

        Route::get('knowledge_base/create', [KnowledgeBaseController::class, 'create'])
            ->name('knowledge_base.create')
            ->middleware('auth');

        Route::post('knowledge_base', [KnowledgeBaseController::class, 'store'])
            ->name('knowledge_base.store')
            ->middleware('auth');

        Route::get('knowledge_base/{knowledge_base}/edit', [KnowledgeBaseController::class, 'edit'])
            ->name('knowledge_base.edit')
            ->middleware('auth');

        Route::post('knowledge_base/{knowledge_base}', [KnowledgeBaseController::class, 'update'])
            ->name('knowledge_base.update')
            ->middleware('auth');

        Route::delete('knowledge_base/{knowledge_base}', [KnowledgeBaseController::class, 'destroy'])
            ->name('knowledge_base.destroy')
            ->middleware('auth');


        /** Status Routing */
        // Statuses
        Route::get('settings/statuses', [StatusesController::class, 'index'])
            ->name('statuses')
            ->middleware('auth');

        Route::get('settings/statuses/create', [StatusesController::class, 'create'])
            ->name('statuses.create')
            ->middleware('auth');

        Route::post('settings/statuses', [StatusesController::class, 'store'])
            ->name('statuses.store')
            ->middleware('auth');

        Route::get('settings/statuses/{status}/edit', [StatusesController::class, 'edit'])
            ->name('statuses.edit')
            ->middleware('auth');

        Route::put('settings/statuses/{status}', [StatusesController::class, 'update'])
            ->name('statuses.update')
            ->middleware('auth');

        Route::put('settings/statuses/{status}/restore', [StatusesController::class, 'restore'])
            ->name('statuses.restore')
            ->middleware('auth');

        Route::delete('settings/statuses/{status}', [StatusesController::class, 'destroy'])
            ->name('statuses.destroy')
            ->middleware('auth');
        // End - Statuses



        // Departments
        Route::get('settings/departments', [DepartmentsController::class, 'index'])
            ->name('departments')
            ->middleware('auth');

        Route::get('settings/departments/create', [DepartmentsController::class, 'create'])
            ->name('departments.create')
            ->middleware('auth');

        Route::post('settings/departments', [DepartmentsController::class, 'store'])
            ->name('departments.store')
            ->middleware('auth');

        Route::get('settings/departments/{department}/edit', [DepartmentsController::class, 'edit'])
            ->name('departments.edit')
            ->middleware('auth');

        Route::put('settings/departments/{department}/restore', [DepartmentsController::class, 'restore'])
            ->name('departments.restore')
            ->middleware('auth');

        Route::get('settings/filter/customers', [FilterController::class, 'customers'])
            ->name('filter.customers')
            ->middleware('auth');

        Route::get('settings/filter/assignees', [FilterController::class, 'assignees'])
            ->name('filter.assignees')
            ->middleware('auth');

        Route::get('settings/filter/users_except_customer', [FilterController::class, 'usersExceptCustomer'])
            ->name('filter.users_except_customer')
            ->middleware('auth');

        Route::put('settings/departments/{department}', [DepartmentsController::class, 'update'])
            ->name('departments.update')
            ->middleware('auth');

        Route::delete('settings/departments/{department}', [DepartmentsController::class, 'destroy'])
            ->name('departments.destroy')
            ->middleware('auth');
        // End - Departments

        // Types
        Route::get('settings/types', [TypesController::class, 'index'])
            ->name('types')
            ->middleware('auth');

        Route::get('settings/types/create', [TypesController::class, 'create'])
            ->name('types.create')
            ->middleware('auth');

        Route::post('settings/types', [TypesController::class, 'store'])
            ->name('types.store')
            ->middleware('auth');

        Route::get('settings/types/{type}/edit', [TypesController::class, 'edit'])
            ->name('types.edit')
            ->middleware('auth');

        Route::put('settings/types/{type}', [TypesController::class, 'update'])
            ->name('types.update')
            ->middleware('auth');
        Route::put('settings/types/{type}/restore', [TypesController::class, 'restore'])
            ->name('types.restore')
            ->middleware('auth');

        Route::delete('settings/types/{type}', [TypesController::class, 'destroy'])
            ->name('types.destroy')
            ->middleware('auth');
        // End - Types

        // Email Templates
        Route::get('settings/templates', [EmailTemplatesController::class, 'index'])
            ->name('templates')
            ->middleware('auth');

        Route::get('settings/templates/{emailTemplate}/edit', [EmailTemplatesController::class, 'edit'])
            ->name('templates.edit')
            ->middleware('auth');

        Route::put('settings/templates/{emailTemplate}', [EmailTemplatesController::class, 'update'])
            ->name('templates.update')
            ->middleware('auth');
        // End - Email Template

        // Pending Users
        Route::get('users/pending', [PendingUsersController::class, 'index'])
            ->name('pending_users')
            ->middleware('auth');
        Route::get('users/pending/active/{id}', [PendingUsersController::class, 'active'])
            ->name('pending.active')
            ->middleware('auth');
        Route::get('users/pending/decline/{id}', [PendingUsersController::class, 'decline'])
            ->name('pending.decline')
            ->middleware('auth');

        // Customers
        Route::get('customers/{user}/edit', [CustomersController::class, 'edit'])
            ->name('customers.edit')
            ->middleware('auth');

        Route::get('customers', [CustomersController::class, 'index'])
            ->name('customers')
            ->middleware('auth');

        Route::put('customers/{user}', [CustomersController::class, 'update'])
            ->name('customers.update')
            ->middleware('auth');

        Route::get('customers/create', [CustomersController::class, 'create'])
            ->name('customers.create')
            ->middleware('auth');

        Route::post('customers', [CustomersController::class, 'store'])
            ->name('customers.store')
            ->middleware('auth');

        Route::delete('customers/{user}', [CustomersController::class, 'destroy'])
            ->name('customers.destroy')
            ->middleware('auth');

        Route::put('customers/{user}/restore', [CustomersController::class, 'restore'])
            ->name('customers.restore')
            ->middleware('auth');


        // Organizations

        Route::get('organizations', [OrganizationsController::class, 'index'])
            ->name('organizations')
            ->middleware('auth');

        Route::get('organizations/create', [OrganizationsController::class, 'create'])
            ->name('organizations.create')
            ->middleware('auth');

        Route::post('organizations', [OrganizationsController::class, 'store'])
            ->name('organizations.store')
            ->middleware('auth');

        Route::get('organizations/{organization}/edit', [OrganizationsController::class, 'edit'])
            ->name('organizations.edit')
            ->middleware('auth');

        Route::put('organizations/{organization}', [OrganizationsController::class, 'update'])
            ->name('organizations.update')
            ->middleware('auth');

        Route::delete('organizations/{organization}', [OrganizationsController::class, 'destroy'])
            ->name('organizations.destroy')
            ->middleware('auth');

        Route::put('organizations/{organization}/restore', [OrganizationsController::class, 'restore'])
            ->name('organizations.restore')
            ->middleware('auth');

        /** Front Page Setup */
        Route::get('front_pages/{slug}', [FrontPagesController::class, 'page'])
            ->name('front_pages.page')
            ->middleware('auth');

        Route::put('front_pages/{slug}', [FrontPagesController::class, 'update'])
            ->name('front_pages.update')
            ->middleware('auth');

        Route::post('/upload/image', [FrontPagesController::class, 'uploadImage'])
            ->name('upload.image')
            ->middleware('auth');

        // Reports
        Route::get('reports', [ReportsController::class, 'index'])
            ->name('reports')
            ->middleware('auth');

        Route::post('/cke/image', [ImagesController::class, 'ckeImageUpload'])
            ->name('cke.image');

        Route::get('/img/{path}', [ImagesController::class, 'show'])
            ->where('path', '.*')
            ->name('image');

        // Public Chat
        Route::post('chat/init', [ChatController::class, 'init'])
            ->name('chat.init');

        Route::get('chat/getConversation/{id}/{contact_id}', [ChatController::class, 'getConversation'])
            ->name('chat.conversation');

        Route::post('chat/sendMessage', [ChatController::class, 'sendPublicMessage'])
            ->name('chat.send_message');

        /** Language Selector  */
        Route::post('/language/{language}', [DashboardController::class, 'setLocale'])
            ->name('language');

        /** Site Front-Landing */
        Route::get('/', [HomeController::class, 'index'])
            ->name('home');

        Route::get('terms-of-services', [PageController::class, 'terms'])
            ->name('terms_service');

        Route::get('privacy', [PageController::class, 'privacy'])
            ->name('privacy');

        Route::get('contact', [PageController::class, 'contact'])
            ->name('contact');

        Route::get('services', [PageController::class, 'services'])
            ->name('services');

        Route::post('contact', [PageController::class, 'contactPost'])
            ->name('contact.send');

        Route::get('faq', [PageController::class, 'faq'])
            ->name('faq');

        Route::get('team', [PageController::class, 'team'])
            ->name('team');

        Route::get('kb', [PageController::class, 'kb'])
            ->name('kb');

        Route::get('kb/{kb_item}', [PageController::class, 'kbDetails'])
            ->name('kb.details');

        Route::get('blog/type/{typeId}', [PageController::class, 'blogByType'])
            ->name('blog.by_type');

        Route::get('kb/type/{typeId}', [PageController::class, 'kbByType'])
            ->name('kb.by_type');

        Route::get('blog', [PageController::class, 'blog'])
            ->name('blog');

        Route::get('blog/{post}', [PageController::class, 'blogDetails'])
            ->name('blog.details');

        // IMAP Custom
        Route::get('/cron/imap/direct/run', [ImapController::class, 'run'])->name('cron.imap.run');
        Route::get('/cron/piping', [CronJobsController::class, 'piping'])->name('cron.piping');
        Route::get('/cron/queue_work', [CronJobsController::class, 'queueWork'])->name('cron.queue_work');


        $router->get('/settings/general', [SettingsController::class, 'general'])->name('settings.general');
        $router->put('/settings/general', [SettingsController::class, 'update'])->name('settings.general.update');
        $router->get('/settings/user-management', [SettingsController::class, 'userManagement'])->name('settings.user-management');
        $router->post('/settings/users', [SettingsController::class, 'store'])->name('settings.users.store');
        $router->post('/settings/users/{user}/roles', [SettingsController::class, 'assignRoles'])->name('settings.users.assign-roles');
        $router->post('/settings/users/{user}/permissions', [SettingsController::class, 'assignPermissions'])->name('settings.users.assign-permissions');
        $router->post('/settings/users/{user}/roles-and-permissions', [SettingsController::class, 'assignRolesAndPermissions'])->name('settings.users.assign-roles-and-permissions');
        $router->get('/settings/roles-permissions', [SettingsController::class, 'rolesPermissions'])->name('settings.roles-permissions');
        $router->resource('/settings', SettingsController::class);

        // Roles and Permissions Management
        $router->get('/roles', [RoleController::class, 'index'])->name('roles.index');
        $router->post('/roles', [RoleController::class, 'store'])->name('roles.store');
        $router->put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        $router->delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        $router->get('/permissions', [PermissionController::class, 'index'])->name('permissions.index');
    });
});
