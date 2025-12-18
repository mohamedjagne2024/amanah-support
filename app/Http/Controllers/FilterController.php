<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Request;
use Spatie\Permission\Models\Role;

class FilterController extends Controller {
    //
    public function contacts(){
        $contactRole = Role::where('name', 'contact')->first();
        $contacts = User::where('role_id', $contactRole ? $contactRole->id: 0)
            ->filter(Request::only('search'))
            ->limit(6)
            ->get()
            ->map
            ->only('id', 'name');

        return response()->json($contacts);
    }

    public function assignees(){

        $search = Request::input('search');
        $assignees = [];
        if(!empty($search)){
            $ticketAssignees = Ticket::whereHas('assignedTo', function($q) use ($search){
                $q->where('first_name', 'like', '%'.$search.'%')
                    ->orWhere('last_name', 'like', '%'.$search.'%');
            })->with('assignedTo:id,first_name,last_name')->select('assigned_to')->groupBy('assigned_to')->limit(5)->get();
        }else{
            $ticketAssignees = Ticket::whereHas('assignedTo')->with('assignedTo:id,first_name,last_name')->select('assigned_to')->groupBy('assigned_to')->limit(5)->get();
        }

        foreach ($ticketAssignees as $ticketAssignee){
            $assignees[] = ['id' => $ticketAssignee->assignedTo['id'], 'name' => $ticketAssignee->assignedTo['first_name'].' '.$ticketAssignee->assignedTo['last_name']];
        }

        return response()->json($assignees);
    }

    public function usersExceptContact(){
        $contactRole = Role::where('name', 'contact')->first();
        $contacts = User::where('role_id', '!=', $contactRole ? $contactRole->id : 0)
            ->filter(Request::only('search'))
            ->limit(6)
            ->get()
            ->map
            ->only('id', 'name');
        return response()->json($contacts);
    }
}
