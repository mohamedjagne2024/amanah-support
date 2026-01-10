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
    public function run()
    {
        DB::table('knowledge_base')->truncate();
        $types = Type::limit(5)->get();

        // English Knowledge Base Articles
        $englishKbItems = [
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
        ];

        // Arabic Knowledge Base Articles
        $arabicKbItems = [
            [
                'title' => 'كيفية تقديم مطالبة التأمين',
                'details' => '<h3>دليل خطوة بخطوة لتقديم مطالبة</h3><p>تقديم مطالبة تأمين مع أمانة للتأمين بسيط ومباشر:</p><ol><li><strong>الإبلاغ عن الحادث:</strong> اتصل بنا خلال 48 ساعة من الحادث عبر الهاتف أو البريد الإلكتروني أو من خلال بوابتك الإلكترونية.</li><li><strong>جمع الوثائق:</strong> اجمع جميع المستندات ذات الصلة بما في ذلك الصور وتقارير الشرطة (إن وجدت) والإيصالات.</li><li><strong>تقديم مطالبتك:</strong> أكمل نموذج المطالبة عبر الإنترنت أو قم بتحميله من موقعنا وإرساله مع المستندات الداعمة.</li><li><strong>مراجعة المطالبة:</strong> سيراجع فريق المطالبات لدينا طلبك خلال 3-5 أيام عمل.</li><li><strong>التسوية:</strong> بمجرد الموافقة، ستتم معالجة الدفع وفقًا لشروط وثيقتك.</li></ol><p>للمطالبات العاجلة، يرجى الاتصال بخط المطالبات على مدار الساعة.</p>',
            ],
            [
                'title' => 'فهم وثيقة تأمين السيارات الخاصة بك',
                'details' => '<h3>شرح تغطية تأمين السيارات</h3><p>توفر وثيقة تأمين السيارات الخاصة بك حماية شاملة لسيارتك:</p><ul><li><strong>المسؤولية تجاه الغير:</strong> تغطي الأضرار التي تلحق بالآخرين وممتلكاتهم في حادث تتسبب فيه.</li><li><strong>الأضرار الخاصة:</strong> تحمي سيارتك ضد الحوادث والسرقة والحريق والكوارث الطبيعية.</li><li><strong>الحوادث الشخصية:</strong> توفر تغطية للإصابات التي تلحق بك وبالركاب.</li><li><strong>تغطية الزجاج الأمامي:</strong> تغطي إصلاح أو استبدال الزجاج الأمامي التالف.</li></ul><p>راجع مستند وثيقتك للحصول على حدود التغطية والاستثناءات المحددة. اتصل بفريق الدعم لدينا لأي توضيحات.</p>',
            ],
            [
                'title' => 'تأمين المنزل: ما الذي يغطيه؟',
                'details' => '<h3>حماية منزلية شاملة</h3><p>يحمي تأمين أمانة للمنزل أهم أصولك:</p><ul><li><strong>تغطية المبنى:</strong> تغطي هيكل منزلك بما في ذلك الجدران والسقف والتركيبات الدائمة.</li><li><strong>تغطية المحتويات:</strong> تحمي ممتلكاتك بما في ذلك الأثاث والإلكترونيات والأغراض الشخصية.</li><li><strong>الكوارث الطبيعية:</strong> تغطية للفيضانات والزلازل والعواصف وغيرها من الأحداث الطبيعية.</li><li><strong>السرقة:</strong> حماية ضد الخسارة من السرقة أو محاولة السرقة.</li><li><strong>حماية المسؤولية:</strong> تغطي المسؤولية القانونية عن الإصابات التي تلحق بالزوار في ممتلكاتك.</li></ul><p>تتوفر إضافات للعناصر عالية القيمة ومعدات المكتب المنزلي والمزيد.</p>',
            ],
            [
                'title' => 'مزايا وتغطية تأمين السفر',
                'details' => '<h3>سافر براحة بال</h3><p>يوفر تأمين السفر لدينا حماية شاملة لرحلاتك:</p><ul><li><strong>حالات الطوارئ الطبية:</strong> تغطية للعلاج الطبي والاستشفاء والإجلاء الطارئ في الخارج.</li><li><strong>إلغاء الرحلة:</strong> تعويض عن النفقات غير القابلة للاسترداد في حالة إلغاء رحلتك.</li><li><strong>فقدان الأمتعة:</strong> تعويض عن الأمتعة المفقودة أو المسروقة أو المتأخرة.</li><li><strong>تأخير الرحلات:</strong> تغطية للنفقات الإضافية بسبب تأخير الرحلات.</li><li><strong>المسؤولية الشخصية:</strong> حماية ضد مطالبات الغير أثناء رحلتك.</li></ul><p>اشترِ تأمين السفر قبل 24 ساعة على الأقل من المغادرة للحصول على مزايا التغطية الكاملة.</p>',
            ],
        ];

        // Somali Knowledge Base Articles
        $somaliKbItems = [
            [
                'title' => 'Sida Loo Codsado Dacwad Caymis',
                'details' => '<h3>Hagitaan Tallaabo-tallaabo ah oo ku saabsan Codsashada Dacwad</h3><p>Codsashada dacwad caymis oo Caymiska Amanah waa fudud oo toos ah:</p><ol><li><strong>Ka warbixin Dhacdada:</strong> Nala soo xiriir 48 saacadood gudahood ka dib dhacdada iyada oo loo marayo taleefanka, iimaylka, ama bogga akoonkaaga.</li><li><strong>Ururi Dukumentiyada:</strong> Ururi dhammaan dukumentiyada muhiimka ah oo ay ku jiraan sawirro, warbixinno booliska (haddii ay khuseyso), iyo rasiidha.</li><li><strong>Soo Gudbi Dacwadaada:</strong> Buuxi foomka dacwadda online ama ka soo degso websaydhkeena oo ku gudbi dukumentiyada taageerada.</li><li><strong>Dib-u-eegista Dacwadda:</strong> Kooxdayada dacwadaha waxay dib u eegi doonaan codsigaaga 3-5 maalmood shaqo gudahood.</li><li><strong>Xallinta:</strong> Marka la oggolaado, lacag-bixinta waxaa la habeeyn doonaa sida ku cad shuruudaha boolisadaada.</li></ol><p>Dacwadaha degdegga ah, fadlan wac khadka dacwadaha 24/7.</p>',
            ],
            [
                'title' => 'Fahamka Boolisadda Caymiska Gaariga',
                'details' => '<h3>Sharaxaadda Daahitaanka Caymiska Gaariga</h3><p>Boolisadda caymiska gaarigaagu waxay bixisaa ilaalin dhamaystiran oo loogu talagalay gaarigaaga:</p><ul><li><strong>Mas\'uuliyadda Dhinaca Saddexaad:</strong> Waxay daboolaysaa dhaawacyada ay dadka kale iyo hantidoodu ka soo gaaraan shilka aad sabab u tahay.</li><li><strong>Dhaawaca Gaarka ah:</strong> Waxay ilaalinaysaa gaarigaaga ka hor shilalka, xatooyo, dab, iyo masiibooyin dabiici ah.</li><li><strong>Shilka Shakhsiyaadka:</strong> Waxay bixisaa daahitaan dhaawacyada ku dhaca adiga iyo rakaabka.</li><li><strong>Daahitaanka Daaqadda Hore:</strong> Waxay daboolaysaa dayactirka ama bedelaashada daaqadaha hore ee dhaawacmay.</li></ul><p>Dib u eeg dukumentiga boolisadaada xadka daahitaanka gaarka ah iyo meelaha aan ka mid ahayn. La xiriir kooxdayada taageerada wixii caddayn ah.</p>',
            ],
            [
                'title' => 'Caymiska Guriga: Maxaa Daboolaysan?',
                'details' => '<h3>Ilaalinta Guriga oo Dhamaystiran</h3><p>Caymiska Guriga ee Amanah wuxuu ilaalinayaa hantidaada ugu qiimaha badan:</p><ul><li><strong>Daahitaanka Dhismaha:</strong> Waxay daboolaysaa qaab-dhismeedka gurigaaga oo ay ku jiraan gidaarada, saqafka, iyo qalabka joogtada ah.</li><li><strong>Daahitaanka Waxyaabaha Ku Jira:</strong> Waxay ilaalinaysaa alaabadaada oo ay ku jiraan alaabta guriga, elektaroonigada, iyo alaabta shakhsiyeed.</li><li><strong>Masiibooyin Dabiici ah:</strong> Daahitaan daadad, dhulgariir, duufaano, iyo dhacdooyinka kale ee dabiiciga ah.</li><li><strong>Xatooyo:</strong> Ilaalin ka dhanka ah khasaaraha xatooyo ama isku dayga xatooyo.</li><li><strong>Ilaalinta Mas\'uuliyada:</strong> Waxay daboolaysaa mas\'uuliyadda sharciga ee dhaawacyada ay ka soo gaaraan martida hantidaada.</li></ul><p>Kordhinta dheeraadka ah ayaa loo heli karaa alaabta qiimaha sare, qalabka xafiiska guriga, iyo wax ka badan.</p>',
            ],
            [
                'title' => 'Faa\'iidooyinka iyo Daahitaanka Caymiska Safarka',
                'details' => '<h3>Ku Safar Nabad-galyo ah</h3><p>Caymiskayaga safarka wuxuu bixiyaa ilaalin dhamaystiran oo loogu talagalay safaradaada:</p><ul><li><strong>Xaaladaha Degdegga ah ee Caafimaadka:</strong> Daahitaan daaweynta caafimaadka, isbitaalka, iyo qaxitaanka degdegga ah dibadda.</li><li><strong>Joojinta Safarka:</strong> Magdhabid kharashyada aan la soo celin karin haddii safarkaaga la joojiyo.</li><li><strong>Boorsooyinka la Lumiyay:</strong> Magdhabid boorsooyinka la lumiyay, la xaday, ama la dib u dhigay.</li><li><strong>Dib-u-dhigida Duulimaadka:</strong> Daahitaan kharashyada dheeraadka ah ee ka dhasha dib-u-dhigida duulimaadka.</li><li><strong>Mas\'uuliyadda Shakhsiga:</strong> Ilaalin ka dhanka ah dacwadaha dhinaca saddexaad ee inta lagu jiro safarkaaga.</li></ul><p>Iibso caymiska safarka ugu yaraan 24 saacadood ka hor bixitaanka si aad u hesho faa\'iidooyinka daahitaanka buuxa.</p>',
            ],
        ];

        // Create English KB Items
        foreach ($englishKbItems as $item) {
            KnowledgeBase::create([
                'title' => $item['title'],
                'details' => $item['details'],
                'type_id' => $types->isNotEmpty() ? $types->random()->id : null,
                'language' => 'en',
            ]);
        }

        // Create Arabic KB Items
        foreach ($arabicKbItems as $item) {
            KnowledgeBase::create([
                'title' => $item['title'],
                'details' => $item['details'],
                'type_id' => $types->isNotEmpty() ? $types->random()->id : null,
                'language' => 'ar',
            ]);
        }

        // Create Somali KB Items
        foreach ($somaliKbItems as $item) {
            KnowledgeBase::create([
                'title' => $item['title'],
                'details' => $item['details'],
                'type_id' => $types->isNotEmpty() ? $types->random()->id : null,
                'language' => 'so',
            ]);
        }
    }
}
