<?php

declare(strict_types=1);

use Laravel\Fortify\Features;
use Illuminate\Routing\Router;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProfileInformationController;
use App\Http\Controllers\HomeController;
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

$router->prefix('/')->group(static function (Router $router): void {
    $router->get('/', [HomeController::class, 'index'])->name('home');
    $router->middleware('auth')->group(static function (Router $router): void {
        $router->get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        if (Features::enabled(Features::updateProfileInformation())) {
            $router->get('profile', [ProfileInformationController::class, 'show']);
        }

        /** Ticket Functions */
        $router->get('tickets', [TicketsController::class, 'index'])
            ->name('tickets')
            ->middleware('auth');

        $router->post('ticket/csv/import', [TicketsController::class, 'csvImport'])->name('ticket.csv.import')
            ->middleware('auth');

        $router->get('ticket/csv/export', [TicketsController::class, 'csvExport'])->name('ticket.csv.export')
            ->middleware('auth');

        $router->get('tickets/create', [TicketsController::class, 'create'])
            ->name('tickets.create')
            ->middleware('auth');

        $router->post('tickets', [TicketsController::class, 'store'])
            ->name('tickets.store')
            ->middleware('auth');

        $router->post('tickets/bulk-delete', [TicketsController::class, 'bulkDelete'])
            ->name('tickets.bulk-delete')
            ->middleware('auth');

        $router->get('tickets/{uid}', [TicketsController::class, 'show'])
            ->name('tickets.show')
            ->middleware('auth');

        $router->get('tickets/{uid}/edit', [TicketsController::class, 'edit'])
            ->name('tickets.edit')
            ->middleware('auth');

        $router->post('tickets/{ticket}', [TicketsController::class, 'update'])
            ->name('tickets.update')
            ->middleware('auth');

        $router->delete('tickets/{uid}', [TicketsController::class, 'destroy'])
            ->name('tickets.destroy')
            ->middleware('auth');

        $router->put('tickets/{ticket}/restore', [TicketsController::class, 'restore'])
            ->name('tickets.restore')
            ->middleware('auth');

        $router->post('ticket/comment', [TicketsController::class, 'newComment'])
            ->name('ticket.comment')
            ->middleware('auth');

        $router->post('tickets/{ticket}/comment', [TicketsController::class, 'addComment'])
            ->name('tickets.comment')
            ->middleware('auth');

        /** Contact Functions */
        $router->get('notes', [NotesController::class, 'index'])
            ->name('notes')
            ->middleware('auth');

        $router->post('notes/{id?}', [NotesController::class, 'saveNote'])
            ->name('notes.save')
            ->middleware('auth');

        $router->delete('notes/{note?}', [NotesController::class, 'delete'])
            ->name('notes.delete')
            ->middleware('auth');

        /** Contact Functions */
        $router->get('settings/categories', [CategoriesController::class, 'index'])
            ->name('categories')
            ->middleware('auth');

        $router->get('settings/categories/create', [CategoriesController::class, 'create'])
            ->name('categories.create')
            ->middleware('auth');

        $router->post('settings/categories', [CategoriesController::class, 'store'])
            ->name('categories.store')
            ->middleware('auth');

        $router->get('settings/categories/{category}/edit', [CategoriesController::class, 'edit'])
            ->name('categories.edit')
            ->middleware('auth');

        $router->put('settings/categories/{category}', [CategoriesController::class, 'update'])
            ->name('categories.update')
            ->middleware('auth');

        $router->post('settings/categories/bulk-delete', [CategoriesController::class, 'bulkDelete'])
            ->name('categories.bulk-delete')
            ->middleware('auth');

        $router->delete('settings/categories/{category}', [CategoriesController::class, 'destroy'])
            ->name('categories.destroy')
            ->middleware('auth');
        $router->put('settings/categories/{category}/restore', [CategoriesController::class, 'restore'])
            ->name('categories.restore')
            ->middleware('auth');


        /** Chat functions */
        // Chat
        $router->get('chat', [ChatController::class, 'index'])
            ->name('chat')
            ->middleware('auth');

        $router->get('chat/{id}', [ChatController::class, 'chat'])
            ->name('chat.current')
            ->middleware('auth');

        $router->get('chat/create', [ChatController::class, 'create'])
            ->name('chat.create')
            ->middleware('auth');

        $router->post('chat/message', [ChatController::class, 'newMessage'])
            ->name('chat.message')
            ->middleware('auth');

        $router->post('chat', [ChatController::class, 'store'])
            ->name('chat.store')
            ->middleware('auth');

        $router->get('chat/{chat}/edit', [ChatController::class, 'edit'])
            ->name('chat.edit')
            ->middleware('auth');

        $router->put('chat/{chat}', [ChatController::class, 'update'])
            ->name('chat.update')
            ->middleware('auth');

        $router->delete('chat/{chat}', [ChatController::class, 'destroy'])
            ->name('chat.destroy')
            ->middleware('auth');

        $router->put('chat/{chat}/restore', [ChatController::class, 'restore'])
            ->name('chat.restore')
            ->middleware('auth');

        /** Priorities functions */
        $router->get('settings/priorities', [PrioritiesController::class, 'index'])
            ->name('priorities')
            ->middleware('auth');

        $router->get('settings/priorities/create', [PrioritiesController::class, 'create'])
            ->name('priorities.create')
            ->middleware('auth');

        $router->post('settings/priorities', [PrioritiesController::class, 'store'])
            ->name('priorities.store')
            ->middleware('auth');

        $router->get('settings/priorities/{priority}/edit', [PrioritiesController::class, 'edit'])
            ->name('priorities.edit')
            ->middleware('auth');

        $router->put('settings/priorities/{priority}/restore', [PrioritiesController::class, 'restore'])
            ->name('priorities.restore')
            ->middleware('auth');

        $router->delete('settings/priorities/{priority}', [PrioritiesController::class, 'destroy'])
            ->name('priorities.destroy')
            ->middleware('auth');

    // End - Priorities

        /** Faq Route */
        $router->get('faqs', [FaqsController::class, 'index'])
            ->name('faqs')
            ->middleware('auth');

        $router->get('faqs/create', [FaqsController::class, 'create'])
            ->name('faqs.create')
            ->middleware('auth');

        $router->post('faqs', [FaqsController::class, 'store'])
            ->name('faqs.store')
            ->middleware('auth');

        $router->get('faqs/{faq}/edit', [FaqsController::class, 'edit'])
            ->name('faqs.edit')
            ->middleware('auth');

        $router->put('faqs/{faq}', [FaqsController::class, 'update'])
            ->name('faqs.update')
            ->middleware('auth');

        $router->delete('faqs/{faq}', [FaqsController::class, 'destroy'])
            ->name('faqs.destroy')
            ->middleware('auth');

        $router->put('faqs/{faq}/restore', [FaqsController::class, 'restore'])
            ->name('faqs.restore')
            ->middleware('auth');

        /** Knowledge base */
        $router->get('knowledge_base', [KnowledgeBaseController::class, 'index'])
            ->name('knowledge_base')
            ->middleware('auth');

        $router->get('knowledge_base/create', [KnowledgeBaseController::class, 'create'])
            ->name('knowledge_base.create')
            ->middleware('auth');

        $router->post('knowledge_base', [KnowledgeBaseController::class, 'store'])
            ->name('knowledge_base.store')
            ->middleware('auth');

        $router->get('knowledge_base/{knowledge_base}/edit', [KnowledgeBaseController::class, 'edit'])
            ->name('knowledge_base.edit')
            ->middleware('auth');

        $router->post('knowledge_base/{knowledge_base}', [KnowledgeBaseController::class, 'update'])
            ->name('knowledge_base.update')
            ->middleware('auth');

        $router->delete('knowledge_base/{knowledge_base}', [KnowledgeBaseController::class, 'destroy'])
            ->name('knowledge_base.destroy')
            ->middleware('auth');


        /** Status Routing */
        // Statuses
        $router->get('settings/statuses', [StatusesController::class, 'index'])
            ->name('statuses')
            ->middleware('auth');

        $router->get('settings/statuses/create', [StatusesController::class, 'create'])
            ->name('statuses.create')
            ->middleware('auth');

        $router->post('settings/statuses', [StatusesController::class, 'store'])
            ->name('statuses.store')
            ->middleware('auth');

        $router->get('settings/statuses/{status}/edit', [StatusesController::class, 'edit'])
            ->name('statuses.edit')
            ->middleware('auth');

        $router->put('settings/statuses/{status}', [StatusesController::class, 'update'])
            ->name('statuses.update')
            ->middleware('auth');

        $router->put('settings/statuses/{status}/restore', [StatusesController::class, 'restore'])
            ->name('statuses.restore')
            ->middleware('auth');

        $router->delete('settings/statuses/{status}', [StatusesController::class, 'destroy'])
            ->name('statuses.destroy')
            ->middleware('auth');
        // End - Statuses



        // Departments
        $router->get('settings/departments', [DepartmentsController::class, 'index'])
            ->name('departments')
            ->middleware('auth');

        $router->get('settings/departments/create', [DepartmentsController::class, 'create'])
            ->name('departments.create')
            ->middleware('auth');

        $router->post('settings/departments', [DepartmentsController::class, 'store'])
            ->name('departments.store')
            ->middleware('auth');

        $router->get('settings/departments/{department}/edit', [DepartmentsController::class, 'edit'])
            ->name('departments.edit')
            ->middleware('auth');

        $router->put('settings/departments/{department}/restore', [DepartmentsController::class, 'restore'])
            ->name('departments.restore')
            ->middleware('auth');

        $router->get('settings/filter/customers', [FilterController::class, 'customers'])
            ->name('filter.customers')
            ->middleware('auth');

        $router->get('settings/filter/assignees', [FilterController::class, 'assignees'])
            ->name('filter.assignees')
            ->middleware('auth');

        $router->get('settings/filter/users_except_customer', [FilterController::class, 'usersExceptCustomer'])
            ->name('filter.users_except_customer')
            ->middleware('auth');

        $router->put('settings/departments/{department}', [DepartmentsController::class, 'update'])
            ->name('departments.update')
            ->middleware('auth');

        $router->post('settings/departments/bulk-delete', [DepartmentsController::class, 'bulkDelete'])
            ->name('departments.bulk-delete')
            ->middleware('auth');

        $router->delete('settings/departments/{department}', [DepartmentsController::class, 'destroy'])
            ->name('departments.destroy')
            ->middleware('auth');
        // End - Departments

        // Types
        $router->get('settings/types', [TypesController::class, 'index'])
            ->name('types')
            ->middleware('auth');

        $router->get('settings/types/create', [TypesController::class, 'create'])
            ->name('types.create')
            ->middleware('auth');

        $router->post('settings/types', [TypesController::class, 'store'])
            ->name('types.store')
            ->middleware('auth');

        $router->get('settings/types/{type}/edit', [TypesController::class, 'edit'])
            ->name('types.edit')
            ->middleware('auth');

        $router->put('settings/types/{type}', [TypesController::class, 'update'])
            ->name('types.update')
            ->middleware('auth');
        $router->put('settings/types/{type}/restore', [TypesController::class, 'restore'])
            ->name('types.restore')
            ->middleware('auth');

        $router->delete('settings/types/{type}', [TypesController::class, 'destroy'])
            ->name('types.destroy')
            ->middleware('auth');
        // End - Types

        // Email Templates
        $router->get('settings/templates', [EmailTemplatesController::class, 'index'])
            ->name('templates')
            ->middleware('auth');

        $router->get('settings/templates/{emailTemplate}/edit', [EmailTemplatesController::class, 'edit'])
            ->name('templates.edit')
            ->middleware('auth');

        $router->put('settings/templates/{emailTemplate}', [EmailTemplatesController::class, 'update'])
            ->name('templates.update')
            ->middleware('auth');
        // End - Email Template

        // Pending Users
        $router->get('users/pending', [PendingUsersController::class, 'index'])
            ->name('pending_users')
            ->middleware('auth');
        $router->get('users/pending/active/{id}', [PendingUsersController::class, 'active'])
            ->name('pending.active')
            ->middleware('auth');
        $router->get('users/pending/decline/{id}', [PendingUsersController::class, 'decline'])
            ->name('pending.decline')
            ->middleware('auth');

        // Customers
        $router->get('customers/{user}/edit', [CustomersController::class, 'edit'])
            ->name('customers.edit')
            ->middleware('auth');

        $router->get('customers', [CustomersController::class, 'index'])
            ->name('customers')
            ->middleware('auth');

        $router->put('customers/{user}', [CustomersController::class, 'update'])
            ->name('customers.update')
            ->middleware('auth');

        $router->get('customers/create', [CustomersController::class, 'create'])
            ->name('customers.create')
            ->middleware('auth');

        $router->post('customers', [CustomersController::class, 'store'])
            ->name('customers.store')
            ->middleware('auth');

        $router->delete('customers/{user}', [CustomersController::class, 'destroy'])
            ->name('customers.destroy')
            ->middleware('auth');

        $router->put('customers/{user}/restore', [CustomersController::class, 'restore'])
            ->name('customers.restore')
            ->middleware('auth');


        // Organizations

        $router->get('organizations', [OrganizationsController::class, 'index'])
            ->name('organizations')
            ->middleware('auth');

        $router->get('organizations/create', [OrganizationsController::class, 'create'])
            ->name('organizations.create')
            ->middleware('auth');

        $router->post('organizations', [OrganizationsController::class, 'store'])
            ->name('organizations.store')
            ->middleware('auth');

        $router->get('organizations/{organization}/edit', [OrganizationsController::class, 'edit'])
            ->name('organizations.edit')
            ->middleware('auth');

        $router->put('organizations/{organization}', [OrganizationsController::class, 'update'])
            ->name('organizations.update')
            ->middleware('auth');

        $router->delete('organizations/{organization}', [OrganizationsController::class, 'destroy'])
            ->name('organizations.destroy')
            ->middleware('auth');

        $router->put('organizations/{organization}/restore', [OrganizationsController::class, 'restore'])
            ->name('organizations.restore')
            ->middleware('auth');

        /** Front Page Setup */
        $router->get('front_pages/{slug}', [FrontPagesController::class, 'page'])
            ->name('front_pages.page')
            ->middleware('auth');

        $router->put('front_pages/{slug}', [FrontPagesController::class, 'update'])
            ->name('front_pages.update')
            ->middleware('auth');

        $router->post('/upload/image', [FrontPagesController::class, 'uploadImage'])
            ->name('upload.image')
            ->middleware('auth');

        // Reports
        $router->get('reports', [ReportsController::class, 'index'])
            ->name('reports')
            ->middleware('auth');

        $router->post('/cke/image', [ImagesController::class, 'ckeImageUpload'])
            ->name('cke.image');

        $router->get('/img/{path}', [ImagesController::class, 'show'])
            ->where('path', '.*')
            ->name('image');

        // Public Chat
        $router->post('chat/init', [ChatController::class, 'init'])
            ->name('chat.init');

        $router->get('chat/getConversation/{id}/{contact_id}', [ChatController::class, 'getConversation'])
            ->name('chat.conversation');

        $router->post('chat/sendMessage', [ChatController::class, 'sendPublicMessage'])
            ->name('chat.send_message');

        /** Site Front-Landing */
        // Note: The '/' route is defined at the top of the file, outside this auth middleware group

        $router->get('terms-of-services', [PageController::class, 'terms'])
            ->name('terms_service');

        $router->get('privacy', [PageController::class, 'privacy'])
            ->name('privacy');

        $router->get('contact', [PageController::class, 'contact'])
            ->name('contact');

        $router->get('services', [PageController::class, 'services'])
            ->name('services');

        $router->post('contact', [PageController::class, 'contactPost'])
            ->name('contact.send');

        $router->get('faq', [PageController::class, 'faq'])
            ->name('faq');

        $router->get('team', [PageController::class, 'team'])
            ->name('team');

        $router->get('kb', [PageController::class, 'kb'])
            ->name('kb');

        $router->get('kb/{kb_item}', [PageController::class, 'kbDetails'])
            ->name('kb.details');

        $router->get('blog/type/{typeId}', [PageController::class, 'blogByType'])
            ->name('blog.by_type');

        $router->get('kb/type/{typeId}', [PageController::class, 'kbByType'])
            ->name('kb.by_type');

        $router->get('blog', [PageController::class, 'blog'])
            ->name('blog');

        $router->get('blog/{post}', [PageController::class, 'blogDetails'])
            ->name('blog.details');

        // IMAP Custom
        $router->get('/cron/imap/direct/run', [ImapController::class, 'run'])->name('cron.imap.run');
        $router->get('/cron/piping', [CronJobsController::class, 'piping'])->name('cron.piping');
        $router->get('/cron/queue_work', [CronJobsController::class, 'queueWork'])->name('cron.queue_work');


        $router->get('/settings/general', [SettingsController::class, 'general'])->name('settings.general');
        $router->get('/settings/smtp', [SettingsController::class, 'smtp'])->name('settings.smtp');
        $router->get('/settings/pusher', [SettingsController::class, 'pusher'])->name('settings.pusher');
        $router->put('/settings/general', [SettingsController::class, 'update'])->name('settings.general.update');
        $router->put('/settings/smtp', [SettingsController::class, 'updateSmtp'])->name('settings.smtp.update');
        $router->put('/settings/pusher', [SettingsController::class, 'updatePusher'])->name('settings.pusher.update');
        $router->post('/settings/pusher/test', [SettingsController::class, 'testPusherConnection'])->name('settings.pusher.test');
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
