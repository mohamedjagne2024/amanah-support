<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\MultiTenant;

class Ticket extends Model
{
    use HasFactory, MultiTenant;

    protected $fillable = [
        'uid',
        'subject',
        'status',
        'open',
        'due',
        'close',
        'response',
        'user_id',
        'contact_id',
        'client_type',
        'email',
        'created_user_id',
        'location',
        'priority',
        'contact_id',
        'region_id',
        'category_id',
        'sub_category_id',
        'assigned_to',
        'type_id',
        'details',
        'review_id',
        'source',
        'tags',
        'impact_level',
        'urgency_level',
        'estimated_hours',
        'actual_hours',
        'message_id',
        'in_reply_to',
        'parent_id',
    ];

    /**
     * Static priority values
     */
    public const PRIORITIES = [
        'low' => 'Low',
        'medium' => 'Medium',
        'high' => 'High',
        'urgent' => 'Urgent',
    ];

    /**
     * Static status values
     */
    public const STATUSES = [
        'open' => 'Open',
        'pending' => 'Pending',
        'resolved' => 'Resolved',
        'closed' => 'Closed',
        'waiting_on_customer' => 'Waiting on Customer',
    ];

    /**
     * Get the priority label
     */
    public function getPriorityLabelAttribute(): string
    {
        return self::PRIORITIES[$this->priority] ?? 'N/A';
    }

    /**
     * Get the status label
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? 'N/A';
    }

    /**
     * Check if the ticket is closed
     */
    public function getIsClosedAttribute(): bool
    {
        return $this->status === 'closed';
    }

    protected static function booted()
    {

        static::created(function ($ticket) {
            if (!$ticket->uid) {
                $ticket->uid = (string) (100000 + $ticket->id);
                $ticket->saveQuietly();
            }
        });

        static::deleting(function ($ticket) {
            $ticket->comments()->delete();
            $ticket->attachments()->delete();
            $ticket->reviews()->delete();
        });
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? 'id', $value)->firstOrFail();
    }

    public function scopeOrderBySubject($query)
    {
        $query->orderBy('subject');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_user_id');
    }



    public function review()
    {
        return $this->belongsTo(Review::class, 'review_id');
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function ticketEntries()
    {
        return $this->hasMany(TicketEntry::class, 'ticket_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }



    public function region()
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function ticketType()
    {
        return $this->belongsTo(Type::class, 'type_id');
    }

    public function contact()
    {
        return $this->belongsTo(User::class, 'contact_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function parent()
    {
        return $this->belongsTo(Ticket::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Ticket::class, 'parent_id');
    }

    public function subCategory()
    {
        return $this->belongsTo(Category::class, 'sub_category_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'ticket_id');
    }

    public function getDueAttribute($date)
    {
        return Carbon::parse($date)->format('Y-m-d');
    }

    public function scopeByContact($query, $id)
    {
        if (!empty($id)) {
            $query->where('contact_id', $id);
        }
    }

    public function scopeByUser($query, $id)
    {
        if (!empty($id)) {
            $query->where('user_id', $id);
        }
    }

    public function scopeByAssign($query, $id)
    {
        if (!empty($id)) {
            $query->where('assigned_to', $id);
        }
    }

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $assignedIds = User::where('first_name', 'like', '%' . $search . '%')->orWhere('last_name', 'like', '%' . $search . '%')->pluck('id');
            $query
                ->where('subject', 'like', '%' . $search . '%')
                ->orWhere('uid', 'like', '%' . $search . '%')
                ->orWhere('status', 'like', '%' . $search . '%')
                ->orWhere('priority', 'like', '%' . $search . '%')
                ->orWhereIn('assigned_to', $assignedIds)
                ->orWhereIn('user_id', $assignedIds);
        })->when($filters['priority'] ?? null, function ($query, $priority) {
            $query->where('priority', $priority);
        })->when($filters['status'] ?? null, function ($query, $status) {
            $query->where('status', $status);
        })->when($filters['category_id'] ?? null, function ($query, $status) {
            $query->where('category_id', $status);
        })->when($filters['region_id'] ?? null, function ($query, $status) {
            $query->where('region_id', $status);
        });
    }
}
