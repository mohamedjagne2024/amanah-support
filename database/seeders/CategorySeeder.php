<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('categories')->truncate();
        Category::factory()->createMany([
            // Main Categories by Department
            // Department 1: Claims
            ['id' => 1, 'name' => 'Motor Insurance Claims', 'department_id' => 1],
            ['id' => 2, 'name' => 'Health Insurance Claims', 'department_id' => 1],
            ['id' => 3, 'name' => 'Property Insurance Claims', 'department_id' => 1],
            ['id' => 4, 'name' => 'Life Insurance Claims', 'department_id' => 1],

            // Department 2: Policy Services
            ['id' => 5, 'name' => 'New Policy', 'department_id' => 2],
            ['id' => 6, 'name' => 'Policy Renewal', 'department_id' => 2],
            ['id' => 7, 'name' => 'Policy Modification', 'department_id' => 2],
            ['id' => 8, 'name' => 'Policy Cancellation', 'department_id' => 2],

            // Department 3: Billing & Payments
            ['id' => 9, 'name' => 'Premium Payment', 'department_id' => 3],
            ['id' => 10, 'name' => 'Invoice Inquiry', 'department_id' => 3],
            ['id' => 11, 'name' => 'Refund Request', 'department_id' => 3],

            // Department 4: General Inquiries
            ['id' => 12, 'name' => 'Account Management', 'department_id' => 4],
            ['id' => 13, 'name' => 'Document Request', 'department_id' => 4],
            ['id' => 14, 'name' => 'Complaints', 'department_id' => 4],
            ['id' => 15, 'name' => 'General Questions', 'department_id' => 4],

            // Sub-categories for Motor Insurance Claims (parent_id: 1)
            ['id' => 16, 'name' => 'Accident Claim', 'parent_id' => 1],
            ['id' => 17, 'name' => 'Theft Claim', 'parent_id' => 1],
            ['id' => 18, 'name' => 'Third Party Claim', 'parent_id' => 1],
            ['id' => 19, 'name' => 'Windshield Damage', 'parent_id' => 1],

            // Sub-categories for Health Insurance Claims (parent_id: 2)
            ['id' => 20, 'name' => 'Hospitalization Claim', 'parent_id' => 2],
            ['id' => 21, 'name' => 'Outpatient Claim', 'parent_id' => 2],
            ['id' => 22, 'name' => 'Pharmacy Reimbursement', 'parent_id' => 2],
            ['id' => 23, 'name' => 'Pre-authorization Request', 'parent_id' => 2],

            // Sub-categories for Property Insurance Claims (parent_id: 3)
            ['id' => 24, 'name' => 'Fire Damage', 'parent_id' => 3],
            ['id' => 25, 'name' => 'Water Damage', 'parent_id' => 3],
            ['id' => 26, 'name' => 'Natural Disaster', 'parent_id' => 3],
            ['id' => 27, 'name' => 'Burglary/Theft', 'parent_id' => 3],

            // Sub-categories for Life Insurance Claims (parent_id: 4)
            ['id' => 28, 'name' => 'Death Benefit Claim', 'parent_id' => 4],
            ['id' => 29, 'name' => 'Maturity Benefit', 'parent_id' => 4],
            ['id' => 30, 'name' => 'Surrender Value', 'parent_id' => 4],

            // Sub-categories for New Policy (parent_id: 5)
            ['id' => 31, 'name' => 'Quote Request', 'parent_id' => 5],
            ['id' => 32, 'name' => 'Coverage Inquiry', 'parent_id' => 5],
            ['id' => 33, 'name' => 'Policy Application', 'parent_id' => 5],

            // Sub-categories for Policy Renewal (parent_id: 6)
            ['id' => 34, 'name' => 'Renewal Quote', 'parent_id' => 6],
            ['id' => 35, 'name' => 'Renewal Payment', 'parent_id' => 6],
            ['id' => 36, 'name' => 'Renewal Documentation', 'parent_id' => 6],

            // Sub-categories for Policy Modification (parent_id: 7)
            ['id' => 37, 'name' => 'Add/Remove Coverage', 'parent_id' => 7],
            ['id' => 38, 'name' => 'Update Personal Details', 'parent_id' => 7],
            ['id' => 39, 'name' => 'Change Beneficiary', 'parent_id' => 7],
            ['id' => 40, 'name' => 'Vehicle/Asset Change', 'parent_id' => 7],

            // Sub-categories for Policy Cancellation (parent_id: 8)
            ['id' => 41, 'name' => 'Cancellation Request', 'parent_id' => 8],
            ['id' => 42, 'name' => 'Refund Calculation', 'parent_id' => 8],

            // Sub-categories for Premium Payment (parent_id: 9)
            ['id' => 43, 'name' => 'Payment Method Change', 'parent_id' => 9],
            ['id' => 44, 'name' => 'Payment Schedule', 'parent_id' => 9],
            ['id' => 45, 'name' => 'Payment Failure', 'parent_id' => 9],

            // Sub-categories for Document Request (parent_id: 13)
            ['id' => 46, 'name' => 'Policy Certificate', 'parent_id' => 13],
            ['id' => 47, 'name' => 'No Claim Letter', 'parent_id' => 13],
            ['id' => 48, 'name' => 'Claim History', 'parent_id' => 13],
        ]);
    }
}
