<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('faqs')->truncate();

        $faqs = [
            [
                'name' => 'How do I file an insurance claim?',
                'details' => 'You can file a claim online through your account portal, by calling our 24/7 claims hotline, or by visiting any of our branch offices. Make sure to have your policy number and relevant documents ready.'
            ],
            [
                'name' => 'How long does it take to process a claim?',
                'details' => 'Most claims are processed within 7-14 business days after receiving all required documentation. Complex claims may take longer. You can track your claim status through your online account.'
            ],
            [
                'name' => 'What documents do I need to submit a motor insurance claim?',
                'details' => 'You will need: a completed claim form, copy of your driving license, police report (for accidents), photos of the damage, and any repair estimates. Additional documents may be requested depending on the claim type.'
            ],
            [
                'name' => 'Can I pay my premium in installments?',
                'details' => 'Yes, we offer flexible payment plans for most insurance products. You can choose monthly, quarterly, or semi-annual payment options. A small processing fee may apply for installment payments.'
            ],
            [
                'name' => 'What is a No-Claim Discount (NCD)?',
                'details' => 'NCD is a discount on your motor insurance premium for each claim-free year. It starts at 25% after one year and can go up to 55% after five or more claim-free years. Making a claim will reset or reduce your NCD.'
            ],
            [
                'name' => 'How do I renew my insurance policy?',
                'details' => 'You can renew your policy online through your account, via our mobile app, or by contacting our customer service. We recommend renewing at least 2 weeks before expiry to ensure continuous coverage.'
            ],
            [
                'name' => 'What happens if my policy lapses?',
                'details' => 'If your policy lapses, you will not be covered for any incidents during the lapsed period. For motor insurance, driving without valid insurance is illegal. Contact us immediately to reinstate your coverage.'
            ],
            [
                'name' => 'Can I add additional drivers to my motor insurance?',
                'details' => 'Yes, you can add named drivers to your policy. Each additional driver may affect your premium based on their age, driving experience, and claims history. Contact us to add drivers to your policy.'
            ],
            [
                'name' => 'What is covered under comprehensive motor insurance?',
                'details' => 'Comprehensive coverage includes third-party liability, own damage from accidents, theft, fire, natural disasters, and personal accident benefits. Optional add-ons like windscreen coverage and roadside assistance are also available.'
            ],
            [
                'name' => 'How do I update my contact information?',
                'details' => 'You can update your contact details through your online account under "Profile Settings" or by contacting our customer service team. Keeping your information current ensures you receive important policy notifications.'
            ],
            [
                'name' => 'What should I do immediately after a car accident?',
                'details' => 'Ensure everyone\'s safety first, then document the scene with photos, exchange information with other parties, file a police report within 24 hours, and contact Amanah Insurance to report the incident as soon as possible.'
            ],
            [
                'name' => 'Does my travel insurance cover COVID-19?',
                'details' => 'Yes, our travel insurance plans include coverage for COVID-19 related medical expenses and trip cancellations. Please check your specific policy for coverage limits and conditions.'
            ],
            [
                'name' => 'How do I make a cashless claim at a hospital?',
                'details' => 'Present your Amanah health insurance card at any of our 500+ panel hospitals. The hospital will verify your coverage and bill us directly for eligible expenses. Pre-authorization may be required for certain procedures.'
            ],
            [
                'name' => 'Can I transfer my NCD to a new vehicle?',
                'details' => 'Yes, your NCD can be transferred to a new vehicle as long as the policy is in your name. Provide your previous policy details when insuring the new vehicle to retain your discount.'
            ],
            [
                'name' => 'What is the grace period for premium payment?',
                'details' => 'Most policies have a 30-day grace period after the due date. During this period, your coverage remains active, but we encourage timely payment to avoid any coverage gaps or policy cancellation.'
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::factory()->create([
                'name' => $faq['name'],
                'details' => $faq['details'],
            ]);
        }

    }
}
