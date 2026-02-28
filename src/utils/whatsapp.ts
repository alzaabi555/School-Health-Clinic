/**
 * دالة لإرسال رسالة واتساب عبر تطبيق الويندوز (Electron) أو المتصفح
 * @param {string} phone - رقم هاتف المستلم (ولي الأمر)
 * @param {string} message - نص الرسالة المراد إرسالها
 */
export const sendWhatsAppOnWindows = (phone: string, message: string) => {
    if (!phone) {
        alert('يرجى توفير رقم الهاتف');
        return;
    }

    // 1. تنظيف الرقم من أي رموز وتجهيزه (تنسيق عُمان كمثال)
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
    else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

    // 2. ترميز النص ليكون صالحاً للاستخدام داخل الرابط
    const encodedMessage = encodeURIComponent(message);

    // 3. رابط البروتوكول المخصص لفتح برنامج الواتساب المثبت على نظام الويندوز
    const whatsappURI = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;

    // 4. تنفيذ الأمر في بيئة الويندوز (Electron) أو المتصفح
    // قمنا بضبط electron-main.js لاعتراض window.open وتوجيهه للنظام مباشرة
    // لذلك هذا السطر سيعمل بامتياز في Electron (يفتح التطبيق) وفي المتصفح (يفتح واتساب ويب)
    
    // نحاول فتح التطبيق أولاً
    try {
        // في Electron، هذا سيفتح التطبيق ولن يفتح نافذة بيضاء بفضل التعديل في electron-main.js
        window.open(whatsappURI, '_blank');
    } catch (e) {
        // حل احتياطي في حال كنت تختبر الكود على متصفح عادي قبل بناء نسخة الويندوز
        window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`, '_blank');
    }
};
