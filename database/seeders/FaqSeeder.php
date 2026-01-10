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

        // English FAQs
        $englishFaqs = [
            [
                'name' => 'How do I file an insurance claim?',
                'details' => 'You can file a claim online through your account portal, by calling our 24/7 claims hotline, or by visiting any of our branch offices. Make sure to have your policy number and relevant documents ready.',
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
        ];

        // Arabic FAQs
        $arabicFaqs = [
            [
                'name' => 'كيف أقدم مطالبة تأمين؟',
                'details' => 'يمكنك تقديم مطالبة عبر الإنترنت من خلال بوابة حسابك، أو بالاتصال بخط المطالبات على مدار الساعة، أو بزيارة أي من فروعنا. تأكد من أن لديك رقم وثيقتك والمستندات ذات الصلة جاهزة.',
            ],
            [
                'name' => 'كم يستغرق معالجة المطالبة؟',
                'details' => 'تتم معالجة معظم المطالبات في غضون 7-14 يوم عمل بعد استلام جميع الوثائق المطلوبة. قد تستغرق المطالبات المعقدة وقتًا أطول. يمكنك تتبع حالة مطالبتك من خلال حسابك عبر الإنترنت.'
            ],
            [
                'name' => 'ما المستندات التي أحتاجها لتقديم مطالبة تأمين السيارات؟',
                'details' => 'ستحتاج إلى: نموذج مطالبة مكتمل، نسخة من رخصة القيادة، تقرير الشرطة (للحوادث)، صور للأضرار، وأي تقديرات للإصلاح. قد يُطلب منك مستندات إضافية حسب نوع المطالبة.'
            ],
            [
                'name' => 'هل يمكنني دفع قسط التأمين على أقساط؟',
                'details' => 'نعم، نوفر خطط دفع مرنة لمعظم منتجات التأمين. يمكنك اختيار خيارات الدفع الشهري أو الفصلي أو نصف السنوي. قد يتم تطبيق رسوم معالجة صغيرة على المدفوعات بالتقسيط.'
            ],
            [
                'name' => 'ما هو خصم عدم المطالبات (NCD)؟',
                'details' => 'خصم عدم المطالبات هو خصم على قسط تأمين سيارتك لكل سنة بدون مطالبات. يبدأ بنسبة 25% بعد سنة واحدة ويمكن أن يصل إلى 55% بعد خمس سنوات أو أكثر بدون مطالبات. تقديم مطالبة سيعيد تعيين أو يقلل من خصم عدم المطالبات الخاص بك.'
            ],
            [
                'name' => 'كيف أجدد وثيقة التأمين الخاصة بي؟',
                'details' => 'يمكنك تجديد وثيقتك عبر الإنترنت من خلال حسابك، أو عبر تطبيقنا للهاتف المحمول، أو بالاتصال بخدمة العملاء لدينا. نوصي بالتجديد قبل أسبوعين على الأقل من انتهاء الصلاحية لضمان التغطية المستمرة.'
            ],
            [
                'name' => 'ماذا يحدث إذا انتهت صلاحية وثيقتي؟',
                'details' => 'إذا انتهت صلاحية وثيقتك، فلن تكون مغطى لأي حوادث خلال فترة الانتهاء. بالنسبة لتأمين السيارات، القيادة بدون تأمين ساري المفعول غير قانونية. اتصل بنا فورًا لاستعادة تغطيتك.'
            ],
            [
                'name' => 'هل يمكنني إضافة سائقين إضافيين إلى تأمين سيارتي؟',
                'details' => 'نعم، يمكنك إضافة سائقين مسجلين إلى وثيقتك. قد يؤثر كل سائق إضافي على قسط التأمين الخاص بك بناءً على عمره وخبرته في القيادة وتاريخ مطالباته. اتصل بنا لإضافة سائقين إلى وثيقتك.'
            ],
        ];

        // Somali FAQs
        $somaliFaqs = [
            [
                'name' => 'Sideen u codsan karaa dacwad caymis ah?',
                'details' => 'Waxaad codsan kartaa dacwad online iyada oo loo marayo bogga akoonkaaga, adigoo wacaya khadka dacwadaha 24/7, ama adigoo booqanaya mid ka mid ah xafiisyadayada. Hubi inaad haysato nambarka boolisadaada iyo dukumentiyada muhiimka ah.',
            ],
            [
                'name' => 'Intee in le eg ayay qaadanaysaa in dacwad la habeeyo?',
                'details' => 'Dacwadaha badankoodu waxay habeeyaan 7-14 maalmood shaqo ka dib markii la helo dhammaan dukumentiyada loo baahan yahay. Dacwadaha adag waxay qaadan karaan waqti dheeraad ah. Waxaad raad raaci kartaa xaaladda dacwadaada iyada oo loo marayo akoonkaaga online-ka.'
            ],
            [
                'name' => 'Dukumentiyada maxay yihiin kuwa aan u baahanahay si aan u codsado dacwad caymiska gaariga?',
                'details' => 'Waxaad u baahan tahay: foomka dacwadda oo buuxa, koobi liisanka darawalka, warbixinta booliska (shilalka), sawirro waxyeelada, iyo qiyaas kasta oo dayactir ah. Dukumentiyo dheeraad ah ayaa laga yaabaa in la codsado iyadoo ku xiran nooca dacwadda.'
            ],
            [
                'name' => 'Miyaan bixin karaa caymiska qaybqaybyo?',
                'details' => 'Haa, waxaan bixinaa qorsheyo bixin oo dabacsan oo loogu talagalay alaabada caymiska badankooda. Waxaad dooran kartaa bixinta bishiiba, rubuc sannadeed, ama lix bilood. Khidmad yar oo habeyn ah ayaa laga yaabaa inay khuseyso bixinta qaybqaybta.'
            ],
            [
                'name' => 'Waa maxay Qiimo-dhimista Dacwad-la\'aanta (NCD)?',
                'details' => 'NCD waa qiimo-dhimis ku saabsan lacagta caymiska gaarigaaga sanad kasta oo aan dacwad lahayn. Waxay bilaabataa 25% ka dib hal sano waxayna gaari kartaa 55% ka dib shan sano ama ka badan oo aan dacwad lahayn. Codsashada dacwad waxay dib u dejin doontaa ama waxay yaraan doontaa NCD-gaaga.'
            ],
            [
                'name' => 'Sideen u cusbooneysiin karaa boolisadda caymiska?',
                'details' => 'Waxaad cusbooneysiin kartaa boolisadaada online iyada oo loo marayo akoonkaaga, iyada oo loo marayo app-ka mobilka, ama adigoo la xiriiraya adeegga macaamiisha. Waxaan ku talinay inaad cusbooneysiiso ugu yaraan 2 usbuuc ka hor inta aanay dhicin si loo hubiyo daahitaan joogto ah.'
            ],
            [
                'name' => 'Maxaa dhacaya haddii boolisaddaydu ay dhacdo?',
                'details' => 'Haddii boolisadaadu ay dhacdo, laguma daboolayo wax shil ah inta lagu jiro muddada dhacitaanka. Caymiska gaariga, wadista iyadoon aan lahayn caymis sax ah waa sharci darro. Nala soo xiriir isla markiiba si aad u soo celiso daahitaankaaga.'
            ],
            [
                'name' => 'Ma ku dari karaa darawalo dheeraad ah caymiska gaarigayga?',
                'details' => 'Haa, waxaad ku dari kartaa darawalo magac leh boolisadaada. Darawal kasta oo dheeraad ah wuxuu saameyn karaa lacagta adiga kuu gaar ah iyadoo ku saleysan da\'dooda, khibradda darawalka, iyo taariikhda dacwadaha. Nala soo xiriir si aad darawalo ugu darto boolisadaada.'
            ],
        ];

        // Create English FAQs
        foreach ($englishFaqs as $faq) {
            Faq::create([
                'name' => $faq['name'],
                'details' => $faq['details'],
                'language' => 'en',
                'status' => 1,
            ]);
        }

        // Create Arabic FAQs
        foreach ($arabicFaqs as $faq) {
            Faq::create([
                'name' => $faq['name'],
                'details' => $faq['details'],
                'language' => 'ar',
                'status' => 1,
            ]);
        }

        // Create Somali FAQs
        foreach ($somaliFaqs as $faq) {
            Faq::create([
                'name' => $faq['name'],
                'details' => $faq['details'],
                'language' => 'so',
                'status' => 1,
            ]);
        }
    }
}
