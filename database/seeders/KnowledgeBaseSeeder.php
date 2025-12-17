<?php

namespace Database\Seeders;

use App\Models\KnowledgeBase;
use App\Models\Type;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KnowledgeBaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run() {
        DB::table('knowledge_base')->truncate();
        $types = Type::limit(5)->get();

        $kbItems = [
            [
                'title' => 'How to File an Insurance Claim',
                'details' => '<h3>Step-by-Step Guide to Filing a Claim</h3><p>Filing an insurance claim with Amanah Insurance is simple and straightforward:</p><ol><li><strong>Report the Incident:</strong> Contact us within 48 hours of the incident via phone, email, or through your online portal.</li><li><strong>Gather Documentation:</strong> Collect all relevant documents including photos, police reports (if applicable), and receipts.</li><li><strong>Submit Your Claim:</strong> Complete the claim form online or download it from our website and submit with supporting documents.</li><li><strong>Claim Review:</strong> Our claims team will review your submission within 3-5 business days.</li><li><strong>Settlement:</strong> Once approved, payment will be processed according to your policy terms.</li></ol><p>For urgent claims, please call our 24/7 claims hotline.</p>',
            ],
            [
                'title' => 'Understanding Your Motor Insurance Policy',
                'details' => '<h3>Motor Insurance Coverage Explained</h3><p>Your motor insurance policy provides comprehensive protection for your vehicle:</p><ul><li><strong>Third-Party Liability:</strong> Covers damages to other people and their property in an accident you cause.</li><li><strong>Own Damage:</strong> Protects your vehicle against accidents, theft, fire, and natural disasters.</li><li><strong>Personal Accident:</strong> Provides coverage for injuries to you and your passengers.</li><li><strong>Windscreen Coverage:</strong> Covers repair or replacement of damaged windscreens.</li></ul><p>Review your policy document for specific coverage limits and exclusions. Contact our support team for any clarifications.</p>',
            ],
            [
                'title' => 'Home Insurance: What\'s Covered?',
                'details' => '<h3>Comprehensive Home Protection</h3><p>Amanah Home Insurance protects your most valuable asset:</p><ul><li><strong>Building Coverage:</strong> Covers the structure of your home including walls, roof, and permanent fixtures.</li><li><strong>Contents Coverage:</strong> Protects your belongings including furniture, electronics, and personal items.</li><li><strong>Natural Disasters:</strong> Coverage for floods, earthquakes, storms, and other natural events.</li><li><strong>Theft & Burglary:</strong> Protection against loss from theft or attempted theft.</li><li><strong>Liability Protection:</strong> Covers legal liability for injuries to visitors on your property.</li></ul><p>Additional riders are available for high-value items, home office equipment, and more.</p>',
            ],
            [
                'title' => 'Travel Insurance Benefits and Coverage',
                'details' => '<h3>Travel with Peace of Mind</h3><p>Our travel insurance provides comprehensive protection for your journeys:</p><ul><li><strong>Medical Emergencies:</strong> Coverage for medical treatment, hospitalization, and emergency evacuation abroad.</li><li><strong>Trip Cancellation:</strong> Reimbursement for non-refundable expenses if your trip is cancelled.</li><li><strong>Lost Baggage:</strong> Compensation for lost, stolen, or delayed luggage.</li><li><strong>Flight Delays:</strong> Coverage for additional expenses due to flight delays.</li><li><strong>Personal Liability:</strong> Protection against third-party claims during your trip.</li></ul><p>Purchase travel insurance at least 24 hours before departure for full coverage benefits.</p>',
            ],
            [
                'title' => 'How to Renew Your Insurance Policy',
                'details' => '<h3>Easy Policy Renewal Process</h3><p>Renewing your Amanah Insurance policy is quick and convenient:</p><ol><li><strong>Online Renewal:</strong> Log in to your account and click "Renew Policy" to complete the process in minutes.</li><li><strong>Auto-Renewal:</strong> Enable auto-renewal to ensure continuous coverage without manual intervention.</li><li><strong>Payment Options:</strong> Pay via credit card, bank transfer, or monthly installments.</li><li><strong>Early Renewal Discount:</strong> Renew 30 days before expiry to receive a 5% discount.</li></ol><p>We recommend renewing at least 2 weeks before your policy expires to avoid any coverage gaps.</p>',
            ],
            [
                'title' => 'Understanding No-Claim Discount (NCD)',
                'details' => '<h3>Maximize Your Savings with NCD</h3><p>The No-Claim Discount rewards safe drivers with premium reductions:</p><table><tr><th>Years Without Claims</th><th>NCD Percentage</th></tr><tr><td>1 Year</td><td>25%</td></tr><tr><td>2 Years</td><td>30%</td></tr><tr><td>3 Years</td><td>38.33%</td></tr><tr><td>4 Years</td><td>45%</td></tr><tr><td>5+ Years</td><td>55%</td></tr></table><p><strong>Important:</strong> Making a claim will affect your NCD. Consider the claim amount versus your accumulated discount before filing small claims.</p>',
            ],
            [
                'title' => 'Life Insurance: Types and Benefits',
                'details' => '<h3>Secure Your Family\'s Future</h3><p>Amanah offers various life insurance products to meet your needs:</p><ul><li><strong>Term Life Insurance:</strong> Affordable coverage for a specific period, ideal for income protection.</li><li><strong>Whole Life Insurance:</strong> Lifetime coverage with cash value accumulation.</li><li><strong>Investment-Linked Plans:</strong> Combines insurance protection with investment opportunities.</li><li><strong>Critical Illness Coverage:</strong> Lump sum payment upon diagnosis of specified critical illnesses.</li></ul><p>Our financial advisors can help you choose the right coverage based on your family\'s needs and financial goals.</p>',
            ],
            [
                'title' => 'What to Do After a Car Accident',
                'details' => '<h3>Immediate Steps After an Accident</h3><p>Follow these steps if you\'re involved in a motor accident:</p><ol><li><strong>Ensure Safety:</strong> Move to a safe location if possible and turn on hazard lights.</li><li><strong>Check for Injuries:</strong> Call emergency services if anyone is injured.</li><li><strong>Document the Scene:</strong> Take photos of all vehicles, damage, and the accident location.</li><li><strong>Exchange Information:</strong> Get details from all parties including names, IC numbers, and insurance information.</li><li><strong>File a Police Report:</strong> Required within 24 hours for insurance claims.</li><li><strong>Contact Amanah Insurance:</strong> Report the incident to us as soon as possible.</li></ol><p>Keep a copy of our emergency contact card in your vehicle for quick reference.</p>',
            ],
            [
                'title' => 'Health Insurance Claim Process',
                'details' => '<h3>Making Health Insurance Claims Simple</h3><p>Amanah Health Insurance offers hassle-free claims:</p><h4>Cashless Claims (Panel Hospitals)</h4><p>Simply present your insurance card at any of our 500+ panel hospitals for direct billing.</p><h4>Reimbursement Claims</h4><ol><li>Pay for treatment and collect all receipts and medical reports.</li><li>Submit the claim form within 30 days of treatment.</li><li>Include original receipts, medical reports, and referral letters.</li><li>Claims are processed within 14 working days.</li></ol><p>For pre-authorization requirements on major procedures, contact our health claims team 48 hours in advance.</p>',
            ],
            [
                'title' => 'Insurance Exclusions: What\'s Not Covered',
                'details' => '<h3>Understanding Policy Exclusions</h3><p>While our policies provide comprehensive coverage, certain situations are typically excluded:</p><ul><li><strong>Pre-existing Conditions:</strong> Medical conditions that existed before policy inception.</li><li><strong>Intentional Acts:</strong> Losses caused deliberately by the policyholder.</li><li><strong>War & Terrorism:</strong> Losses arising from war, invasion, or terrorist activities.</li><li><strong>Nuclear Risks:</strong> Damage from nuclear reactions or radiation.</li><li><strong>Wear and Tear:</strong> Normal depreciation and gradual deterioration.</li><li><strong>Illegal Activities:</strong> Losses occurring during illegal activities.</li></ul><p>Always read your policy document carefully. Contact us if you need clarification on any exclusions.</p>',
            ],
            [
                'title' => 'How to Update Your Policy Information',
                'details' => '<h3>Keeping Your Policy Up to Date</h3><p>It\'s important to keep your insurance information current:</p><h4>What You Can Update Online:</h4><ul><li>Contact information (phone, email, address)</li><li>Payment method and bank details</li><li>Beneficiary information</li><li>Communication preferences</li></ul><h4>Updates Requiring Documentation:</h4><ul><li>Vehicle modifications or change of vehicle</li><li>Change of property address</li><li>Sum insured adjustments</li><li>Adding or removing coverage</li></ul><p>Log in to your account or contact our customer service team to make updates. Some changes may affect your premium.</p>',
            ],
            [
                'title' => 'Business Insurance Solutions',
                'details' => '<h3>Protect Your Business with Amanah</h3><p>We offer comprehensive coverage for businesses of all sizes:</p><ul><li><strong>Property Insurance:</strong> Protects your business premises, equipment, and inventory.</li><li><strong>Public Liability:</strong> Coverage for third-party bodily injury or property damage claims.</li><li><strong>Professional Indemnity:</strong> Protection against claims of professional negligence.</li><li><strong>Employee Benefits:</strong> Group health, life, and personal accident coverage for your team.</li><li><strong>Business Interruption:</strong> Compensation for lost income during covered disruptions.</li><li><strong>Cyber Insurance:</strong> Protection against data breaches and cyber attacks.</li></ul><p>Our business insurance specialists can create a customized package for your specific industry needs.</p>',
            ],
        ];

        foreach ($kbItems as $item) {
            KnowledgeBase::factory()->create([
                'title' => $item['title'],
                'details' => $item['details'],
                'type_id' => $types->random()->id
            ]);
        }


    }
}
