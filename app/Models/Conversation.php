<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'contact_id',
        'region_id',
    ];

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? 'id', $value)->firstOrFail();
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'contact_id');
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    public function participant()
    {
        return $this->hasOne(Participant::class);
    }

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->whereHas('creator', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        });

        $query->when($filters['region_id'] ?? null, function ($query, $regionId) {
            $query->where('region_id', $regionId);
        });
    }
}
