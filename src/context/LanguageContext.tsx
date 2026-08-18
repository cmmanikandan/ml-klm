import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand
    brand_name: 'MANIKANDAN',
    brand_tagline: 'LATHE — WELDING WORKS',
    shop_title: 'Manikandan Lathe',
    shop_sub: 'Welding, Metal Fabrication & Precision Lathe Works',
    shop_location: 'Kallimandhayam, Tamil Nadu',

    // Nav
    nav_home: 'Home',
    nav_products: 'Products',
    nav_call: 'Call Shop',
    nav_orders: 'Orders',
    nav_profile: 'Profile',
    nav_search: 'Search',
    nav_wishlist: 'Wishlist',
    nav_notifications: 'Notifications',
    nav_admin: 'Admin Panel',
    nav_pos: 'Counter POS',

    // Greetings
    greeting_morning: 'Good Morning',
    greeting_afternoon: 'Good Afternoon',
    greeting_evening: 'Good Evening',

    // Search
    search_placeholder: 'Search gates, grills, roofing, Kallapai, ARC welding...',
    search_title: 'Search Products',
    search_recent: 'Recent Searches',
    search_suggested: 'Popular Categories',
    search_no_results: 'No products found',
    search_no_results_sub: 'Try searching for gates, grills, roofing, or ARC welding works',
    search_clear: 'Clear',

    // Home Sections
    categories_title: 'Shop by Category',
    popular_categories: 'Popular Categories',
    new_products: 'New Products',
    best_selling: 'Best Selling',
    recommended: 'Recommended For You',
    recently_viewed: 'Recently Viewed',
    view_all: 'View All',
    view_details: 'View Details',

    // Product Details
    specifications: 'Product Specifications',
    materials: 'Materials Used',
    available_sizes: 'Available Sizes & Custom Options',
    description: 'Description',
    category: 'Category',
    call_shop: 'Call Shop',
    whatsapp_enquiry: 'WhatsApp Enquiry',
    place_enquiry: 'Send Enquiry / Order Request',
    in_wishlist: 'Saved to Wishlist',
    add_wishlist: 'Add to Wishlist',
    share_product: 'Share Product',
    price_hidden_notice: 'Price provided upon enquiry review',

    // Enquiry
    enquiry_title: 'Product Enquiry & Order Request',
    enquiry_subtitle: 'Fill requirements below. Admin will review and provide exact price and delivery date.',
    enquiry_product: 'Selected Product',
    enquiry_qty: 'Quantity Required',
    enquiry_size: 'Preferred Size / Dimensions',
    enquiry_notes: 'Custom Requirements / Notes',
    enquiry_location: 'Customer City / Pickup Location',
    enquiry_submit: 'Submit Enquiry',
    enquiry_submitting: 'Submitting Enquiry...',
    enquiry_success: 'Enquiry Submitted Successfully!',
    enquiry_id: 'Enquiry Reference ID',
    enquiry_whatsapp_msg: 'Hi Manikandan Lathe, I submitted an enquiry for',

    // Order & Timeline
    orders_title: 'My Orders & Enquiries',
    active_orders: 'Active Orders',
    completed_orders: 'Completed Orders',
    enquiries_tab: 'Enquiries',
    order_id: 'Order ID',
    expected_delivery: 'Completion & Direct Shop Pickup Date',
    order_status: 'Order Status',
    timeline_enquiry: 'Enquiry Submitted',
    timeline_accepted: 'Accepted',
    timeline_confirmed: 'Order Confirmed',
    timeline_processing: 'In Fabrication / Machining',
    timeline_ready: 'Ready for Shop Counter Pickup',
    timeline_delivery: 'Ready for Shop Counter Pickup',
    timeline_delivered: 'Completed & Handed Over',
    timeline_rejected: 'Enquiry Rejected',

    // Payments
    payment_required: 'Payment Action Required',
    pay_now: 'Pay Now via Razorpay',
    view_upi_qr: 'View UPI QR Code',
    cash_payment: 'Cash Payment',
    payment_status: 'Payment Status',
    advance_amount: 'Advance Paid / Required',
    total_amount: 'Total Agreed Price',
    remaining_amount: 'Balance Amount Due',
    payment_success: 'Payment Completed Successfully!',
    payment_pending: 'Payment Pending',

    // POS & Counter Billing
    pos_title: 'Workshop Counter POS & Billing',
    pos_subtitle: 'Instant bill generation for counter sales, lathe turning & welding jobs',
    counter_sale: 'Counter Sale',
    custom_machining_item: 'Custom Lathe / Repair Job',
    add_custom_item: '+ Add Custom Lathe Work',
    item_name_placeholder: 'e.g. Tractor Shaft Lathe Turning / Bush Fitting',
    customer_details: 'Customer Details',
    customer_name: 'Customer Name',
    customer_phone: 'Mobile Phone',
    customer_town: 'Village / Town',
    billing_summary: 'Bill Summary',
    subtotal: 'Subtotal',
    discount: 'Discount (₹)',
    gst_toggle: 'Tax Invoice (GST 18%)',
    gst_tax: 'GST (18%)',
    non_gst_estimate: 'Workshop Estimate (Non-GST)',
    grand_total: 'Grand Total',
    advance_received: 'Advance Received (₹)',
    balance_payable: 'Balance Due (₹)',
    payment_mode: 'Payment Mode',
    mode_cash: 'Cash at Counter',
    mode_upi: 'UPI / GPay / PhonePe',
    mode_razorpay: 'Razorpay Online Link',
    generate_bill: 'Generate & Save Bill',
    print_thermal: 'Print 3-Inch Slip',
    print_invoice: 'Print Full A4 Bill',
    send_whatsapp: 'Send WhatsApp Bill',
    scan_to_pay_qr: 'Scan Counter UPI QR to Pay',
    upi_scan_instruction: 'Scan with GPay, PhonePe, Paytm or BHIM UPI',

    // Invoice
    invoice_title: 'TAX INVOICE',
    estimate_title: 'ESTIMATE / WORK ORDER',
    invoice_number: 'Invoice No',
    invoice_date: 'Date',
    bill_to: 'Bill To / Customer',
    serial_no: 'S.No',
    item_description: 'Item & Job Description',
    hsn_sac: 'HSN/SAC',
    rate: 'Rate (₹)',
    amount: 'Amount (₹)',
    amount_in_words: 'Amount in Words',
    terms_conditions: 'Terms & Conditions',
    terms_1: 'All fabricated items are direct workshop counter pickup only.',
    terms_2: 'Goods once sold or fabricated to custom sizes cannot be returned.',
    authorized_signatory: 'For MANIKANDAN LATHE',
    proprietor_sign: 'Authorized Signatory',

    // Feedback
    feedback_title: 'How was your experience?',
    feedback_subtitle: 'Rate your completed order from Manikandan Lathe',
    rating_label: 'Your Rating',
    feedback_comment: 'Comments / Review (Optional)',
    submit_feedback: 'Submit Review',
    feedback_thank_you: 'Thank you for your valuable feedback!',

    // Profile & Wizard
    onboarding_welcome: 'Welcome to Manikandan Lathe',
    onboarding_choose_lang: 'Choose your preferred language',
    onboarding_lang_subtitle: 'Everything will be displayed in your selected language',
    onboarding_details_title: 'Enter Required Profile Details',
    full_name: 'Full Name',
    mobile_number: 'Mobile Phone Number',
    email_address: 'Email Address',
    address: 'Address / Location',
    city_area: 'City / Area',
    save_profile: 'Complete Profile & Continue',
    profile_title: 'My Account',
    my_details: 'My Details',
    my_wishlist: 'My Wishlist',
    my_enquiries: 'My Enquiries',
    my_orders: 'My Orders',
    language_setting: 'App Language',
    help_contact: 'Help & Contact Shop',
    logout: 'Logout',
    edit_profile: 'Edit Profile',
    save_changes: 'Save Changes',

    // Actions & General
    loading: 'Loading...',
    error_generic: 'Something went wrong. Please try again.',
    success_updated: 'Updated successfully',
    close: 'Close',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm'
  },
  ta: {
    // Brand
    brand_name: 'மணிகண்டன்',
    brand_tagline: 'லேத் — வெல்டிங் வேலைகள்',
    shop_title: 'மணிகண்டன் லேத்',
    shop_sub: 'வெல்டிங், மெட்டல் ஃபேப்ரிகேஷன் மற்றும் துல்லிய லேத் பட்டறை வேலைகள்',
    shop_location: 'கள்ளிமந்தையம், தமிழ்நாடு',

    // Nav
    nav_home: 'முகப்பு',
    nav_products: 'பொருட்கள்',
    nav_call: 'கடைக்கு அழைக்க',
    nav_orders: 'ஆர்டர்கள்',
    nav_profile: 'சுயவிவரம்',
    nav_search: 'தேடுக',
    nav_wishlist: 'விருப்பப் பட்டியல்',
    nav_notifications: 'அறிவிப்புகள்',
    nav_admin: 'நிர்வாக பேனல்',
    nav_pos: 'கவுண்டர் பில்லிங் (POS)',

    // Greetings
    greeting_morning: 'காலை வணக்கம்',
    greeting_afternoon: 'மதிய வணக்கம்',
    greeting_evening: 'மாலை வணக்கம்',

    // Search
    search_placeholder: 'நாற்காலிகள், கேட், கிரில், கலப்பை, ரூஃபிங் தேடுக...',
    search_title: 'பொருட்களைத் தேடுக',
    search_recent: 'சமீபத்திய தேடல்கள்',
    search_suggested: 'பிரபலமான பிரிவுகள்',
    search_no_results: 'பொருட்கள் எதுவும் கிடைக்கவில்லை',
    search_no_results_sub: 'நாற்காலிகள், கேட், கிரில், கலப்பை அல்லது லேத் வேலைகளைத் தேடிப் பாருங்கள்',
    search_clear: 'அழி',

    // Home Sections
    categories_title: 'பிரிவுகள்',
    popular_categories: 'பிரபலமான பிரிவுகள்',
    new_products: 'புதிய பொருட்கள்',
    best_selling: 'அதிகம் விற்பனையானவை',
    recommended: 'உங்களுக்கான பரிந்துரை',
    recently_viewed: 'சமீபத்தில் பார்த்தவை',
    view_all: 'அனைத்தையும் பார்',
    view_details: 'விவரங்களை பார்',

    // Product Details
    specifications: 'பொருள் விவரக்குறிப்புகள்',
    materials: 'பயன்படுத்தப்பட்ட பொருட்கள்',
    available_sizes: 'கிடைக்கும் அளவுகள்',
    description: 'விளக்கம்',
    category: 'பிரிவு',
    call_shop: 'கடைக்கு அழைக்க',
    whatsapp_enquiry: 'வாட்ஸ்அப் விசாரணை',
    place_enquiry: 'விசாரணை / ஆர்டர் அனுப்ப',
    in_wishlist: 'விருப்பப் பட்டியலில் உள்ளது',
    add_wishlist: 'விருப்பப் பட்டியலில் சேர்',
    share_product: 'பகிர்க',
    price_hidden_notice: 'விசாரணைக்குப் பிறகு சரியான விலை விவரம் தெரிவிக்கப்படும்',

    // Enquiry
    enquiry_title: 'பொருள் விசாரணை மற்றும் ஆர்டர் படிவம்',
    enquiry_subtitle: 'உங்கள் தேவைகளை கீழே பதிவு செய்யவும். நிர்வாகி பரிசீலித்து சரியான விலையை அறிவிப்பார்.',
    enquiry_product: 'தேர்ந்தெடுக்கப்பட்ட பொருள்',
    enquiry_qty: 'தேவையான எண்ணிக்கை',
    enquiry_size: 'விருப்பமான அளவு / அளவீடுகள்',
    enquiry_notes: 'சிறப்பு தேவைகள் / குறிப்புகள்',
    enquiry_location: 'வாடிக்கையாளர் ஊர் / கடையில் பெற (Pickup) இடம்',
    enquiry_submit: 'விசாரணையை அனுப்புக',
    enquiry_submitting: 'அனுப்பப்படுகிறது...',
    enquiry_success: 'விசாரணை வெற்றிகரமாக அனுப்பப்பட்டது!',
    enquiry_id: 'விசாரணை எண்',
    enquiry_whatsapp_msg: 'வணக்கம் மணிகண்டன் லேத், நான் பின்வரும் பொருளுக்கு விசாரணை செய்துள்ளேன்:',

    // Order & Timeline
    orders_title: 'என் ஆர்டர்கள் மற்றும் விசாரணைகள்',
    active_orders: 'செயலில் உள்ள ஆர்டர்கள்',
    completed_orders: 'நிறைவடைந்த ஆர்டர்கள்',
    enquiries_tab: 'விசாரணைகள்',
    order_id: 'ஆர்டர் எண்',
    expected_delivery: 'தயாராகும் & கடையில் பெற (Pickup) தேதி',
    order_status: 'ஆர்டர் நிலை',
    timeline_enquiry: 'விசாரணை சமர்ப்பிக்கப்பட்டது',
    timeline_accepted: 'ஏற்கப்பட்டது',
    timeline_confirmed: 'ஆர்டர் உறுதி செய்யப்பட்டது',
    timeline_processing: 'பட்டறையில் தயாரிப்பில் / வெல்டிங்கில் உள்ளது',
    timeline_ready: 'பட்டறையில் பெற (Pickup) தயார்',
    timeline_delivery: 'பட்டறையில் பெற (Pickup) தயார்',
    timeline_delivered: 'நிறைவடைந்து ஒப்படைக்கப்பட்டது',
    timeline_rejected: 'விசாரணை நிராகரிக்கப்பட்டது',

    // Payments
    payment_required: 'கட்டணம் செலுத்த அறிவிப்பு',
    pay_now: 'ரேஸர்பே மூலம் ஆன்லைனில் செலுத்த',
    view_upi_qr: 'UPI QR குறியீட்டைப் பார்',
    cash_payment: 'நேரடி ரொக்கப் பணம்',
    payment_status: 'கட்டண நிலை',
    advance_amount: 'செலுத்திய முன்பணம் (Advance)',
    total_amount: 'மொத்த ஒப்பந்த தொகை',
    remaining_amount: 'செலுத்த வேண்டிய மீதித் தொகை',
    payment_success: 'கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது!',
    payment_pending: 'கட்டணம் நிலுவையில் உள்ளது',

    // POS & Counter Billing
    pos_title: 'பட்டறை கவுண்டர் பில்லிங் (POS)',
    pos_subtitle: 'கடை கவுண்டர் விற்பனை, லேத் டர்னிங் & வெல்டிங் வேலைகளுக்கு உடனடி ரசீது தயாரிப்பு',
    counter_sale: 'கவுண்டர் நேரடி விற்பனை',
    custom_machining_item: 'தனிப்பயன் லேத் / பழுது வேலை',
    add_custom_item: '+ புதிய லேத் வேலை சேர்க்க',
    item_name_placeholder: 'எ.கா: டிராக்டர் ஷாப்ட் லேத் டர்னிங் / புஷ் மாட்டுதல்',
    customer_details: 'வாடிக்கையாளர் விபரம்',
    customer_name: 'வாடிக்கையாளர் பெயர்',
    customer_phone: 'மொபைல் எண்',
    customer_town: 'ஊர் / கிராமம்',
    billing_summary: 'கட்டண விபரம்',
    subtotal: 'கூட்டுத்தொகை',
    discount: 'தள்ளுபடி (₹)',
    gst_toggle: 'வரி ரசீது (GST 18%)',
    gst_tax: 'ஜி.எஸ்.டி (18%)',
    non_gst_estimate: 'பட்டறை மதிப்பீடு (Non-GST)',
    grand_total: 'மொத்த நிகர தொகை',
    advance_received: 'பெற்ற முன்பணம் (₹)',
    balance_payable: 'மீதி செலுத்த வேண்டிய தொகை (₹)',
    payment_mode: 'பணம் செலுத்திய முறை',
    mode_cash: 'நேரடி ரொக்கம்',
    mode_upi: 'கூகிள் பே / போன்பே (UPI)',
    mode_razorpay: 'ரேஸர்பே ஆன்லைன் லிங்க்',
    generate_bill: 'பில் தயாரித்து சேமிக்க',
    print_thermal: '3-இன்ச் ரசீது அச்சிடு',
    print_invoice: 'முழு A4 பில் அச்சிடு',
    send_whatsapp: 'வாட்ஸ்அப்பில் ரசீது அனுப்பு',
    scan_to_pay_qr: 'கட்டணம் செலுத்த QR ஸ்கேன் செய்யவும்',
    upi_scan_instruction: 'GPay, PhonePe, Paytm அல்லது BHIM UPI மூலம் ஸ்கேன் செய்யவும்',

    // Invoice
    invoice_title: 'வரி ரசீது (TAX INVOICE)',
    estimate_title: 'மதிப்பீட்டு பில் (ESTIMATE)',
    invoice_number: 'ரசீது எண்',
    invoice_date: 'தேதி',
    bill_to: 'வாடிக்கையாளர் முகவரி',
    serial_no: 'வ.எண்',
    item_description: 'பொருள் / வேலை விவரம்',
    hsn_sac: 'HSN/SAC',
    rate: 'விலை (₹)',
    amount: 'தொகை (₹)',
    amount_in_words: 'தொகை எழுத்தால்',
    terms_conditions: 'விதிமுறைகள் & நிபந்தனைகள்',
    terms_1: 'தயாரிக்கப்பட்ட அனைத்து பொருட்களும் பட்டறையிலேயே நேரடியாக பெற்றுக்கொள்ள வேண்டும்.',
    terms_2: 'வாடிக்கையாளர் அளவுக்கு ஏற்ப செய்யப்பட்ட பொருட்கள் திரும்பப் பெறப்பட மாட்டாது.',
    authorized_signatory: 'மணிகண்டன் லேத் பட்டறைக்காக',
    proprietor_sign: 'அங்கீகரிக்கப்பட்ட கையொப்பம்',

    // Feedback
    feedback_title: 'உங்கள் அனுபவம் எப்படி இருந்தது?',
    feedback_subtitle: 'மணிகண்டன் லேத் சேவைக்கு மதிப்பெண் வழங்குக',
    rating_label: 'உங்கள் மதிப்பீடு',
    feedback_comment: 'கருத்துகள் (விருப்பத்தின்பேரில்)',
    submit_feedback: 'மதிப்பீட்டைச் சமர்ப்பி',
    feedback_thank_you: 'உங்கள் மதிப்புமிக்க கருத்துக்களுக்கு நன்றி!',

    // Profile & Wizard
    onboarding_welcome: 'மணிகண்டன் லேத் நிறுவனத்திற்கு நல்வரவு',
    onboarding_choose_lang: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    onboarding_lang_subtitle: 'செயலி முழுதும் உங்கள் விருப்ப மொழியில் காட்சிப்படுத்தப்படும்',
    onboarding_details_title: 'தேவையான சுயவிவர விவரங்களைப் பதிவு செய்க',
    full_name: 'முழு பெயர்',
    mobile_number: 'மொபைல் எண்',
    email_address: 'மின்னஞ்சல் முகவரி',
    address: 'முகவரி / இருப்பிடம்',
    city_area: 'நகரம் / பகுதி',
    save_profile: 'சுயவிவரத்தைப் பதிவு செய்து தொடர்க',
    profile_title: 'என் கணக்கு',
    my_details: 'என் விவரங்கள்',
    my_wishlist: 'என் விருப்பப் பட்டியல்',
    my_enquiries: 'என் விசாரணைகள்',
    my_orders: 'என் ஆர்டர்கள்',
    language_setting: 'செயலி மொழி',
    help_contact: 'உதவி மற்றும் தொடர்பு',
    logout: 'வெளியேறு',
    edit_profile: 'சுயவிவரத்தைத் திருத்து',
    save_changes: 'மாற்றங்களைச் சேமி',

    // Actions & General
    loading: 'ஏற்றப்படுகிறது...',
    error_generic: 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
    success_updated: 'வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
    close: 'மூடு',
    back: 'பின்செல்',
    cancel: 'ரத்து செய்',
    confirm: 'உறுதி செய்'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('ml_language');
    return (saved === 'ta' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ml_language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
