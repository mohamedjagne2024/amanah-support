<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use App\Traits\HasGoogleCloudStorage;

class Attachment extends Model
{
    use HasFactory, HasGoogleCloudStorage;

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? 'id', $value)->firstOrFail();
    }

    public function message()
    {
        return $this->hasOne(Message::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function scopeOrderByName($query)
    {
        $query->orderBy('name');
    }

    public function getCreatedAtAttribute($date)
    {
        return Carbon::parse($date)->format('Y-m-d H:i:s');
    }

    /**
     * Get the signed URL for the attachment.
     */
    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->path ? $this->getStorageUrl($this->path) : null,
        );
    }
}
