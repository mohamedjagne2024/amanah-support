<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Support\Facades\Schema;

trait MultiTenant
{
    public static function bootMultiTenant(): void
    {
        static::creating(function ($model): void {
            if (auth()->check() && Schema::hasColumn($model->getTable(), 'created_user_id')) {
                $model->created_user_id = auth()->id();
            }
        });

        static::updating(function ($model): void {
            if (auth()->check() && Schema::hasColumn($model->getTable(), 'updated_user_id')) {
                $model->updated_user_id = auth()->id();
            }

            if (! auth()->check()) {
                return;
            }

            $user = auth()->user();

            // Track status changes for work orders and similar models
            if (Schema::hasColumn($model->getTable(), 'status') && $model->isDirty('status')) {
                $newStatus = $model->status;
                $oldStatus = $model->getOriginal('status');

                // Handle approval (status = 1)
                if ($newStatus === 1 && $oldStatus !== 1) {
                    if (Schema::hasColumn($model->getTable(), 'approved_user_id')) {
                        $model->approved_user_id = $user->id;
                    }
                    if (Schema::hasColumn($model->getTable(), 'approved_at')) {
                        $model->approved_at = now();
                    }
                    // Clear rejection fields when approving
                    if (Schema::hasColumn($model->getTable(), 'rejected_user_id')) {
                        $model->rejected_user_id = null;
                    }
                    if (Schema::hasColumn($model->getTable(), 'rejected_at')) {
                        $model->rejected_at = null;
                    }
                    // Clear completion fields when approving
                    if (Schema::hasColumn($model->getTable(), 'completed_user_id')) {
                        $model->completed_user_id = null;
                    }
                    if (Schema::hasColumn($model->getTable(), 'completed_at')) {
                        $model->completed_at = null;
                    }
                }

                // Handle completion (status = 3)
                if ($newStatus === 3 && $oldStatus !== 3) {
                    if (Schema::hasColumn($model->getTable(), 'completed_user_id')) {
                        $model->completed_user_id = $user->id;
                    }
                    if (Schema::hasColumn($model->getTable(), 'completed_at')) {
                        $model->completed_at = now();
                    }
                }

                // Handle rejection (status = 4)
                if ($newStatus === 4 && $oldStatus !== 4) {
                    if (Schema::hasColumn($model->getTable(), 'rejected_user_id')) {
                        $model->rejected_user_id = $user->id;
                    }
                    if (Schema::hasColumn($model->getTable(), 'rejected_at')) {
                        $model->rejected_at = now();
                    }
                    // Clear completion fields when rejecting
                    if (Schema::hasColumn($model->getTable(), 'completed_user_id')) {
                        $model->completed_user_id = null;
                    }
                    if (Schema::hasColumn($model->getTable(), 'completed_at')) {
                        $model->completed_at = null;
                    }
                }

                // Clear completion fields when status changes away from completed
                if ($oldStatus === 3 && $newStatus !== 3) {
                    if (Schema::hasColumn($model->getTable(), 'completed_user_id')) {
                        $model->completed_user_id = null;
                    }
                    if (Schema::hasColumn($model->getTable(), 'completed_at')) {
                        $model->completed_at = null;
                    }
                }
            }
        });
    }

    public function approve(?int $userId = null): self
    {
        if (Schema::hasColumn($this->getTable(), 'approved_user_id')) {
            $this->approved_user_id = $userId ?? auth()->id();
        }

        if (Schema::hasColumn($this->getTable(), 'approved_at')) {
            $this->approved_at = now();
        }

        $this->save();

        return $this;
    }

    public function reject(?int $userId = null): self
    {
        if (Schema::hasColumn($this->getTable(), 'rejected_user_id')) {
            $this->rejected_user_id = $userId ?? auth()->id();
        }

        if (Schema::hasColumn($this->getTable(), 'rejected_at')) {
            $this->rejected_at = now();
        }

        $this->save();

        return $this;
    }

    public function receive(?int $userId = null): self
    {
        if (Schema::hasColumn($this->getTable(), 'received_user_id')) {
            $this->received_user_id = $userId ?? auth()->id();
        }

        if (Schema::hasColumn($this->getTable(), 'received_at')) {
            $this->received_at = now();
        }

        $this->save();

        return $this;
    }

    public function complete(?int $userId = null): self
    {
        if (Schema::hasColumn($this->getTable(), 'completed_user_id')) {
            $this->completed_user_id = $userId ?? auth()->id();
        }

        if (Schema::hasColumn($this->getTable(), 'completed_at')) {
            $this->completed_at = now();
        }

        $this->save();

        return $this;
    }
}
