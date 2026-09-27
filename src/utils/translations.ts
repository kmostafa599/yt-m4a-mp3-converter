export type Language = 'en' | 'ar';

export interface Translations {
  appName: string;
  appBadge: string;
  appSubtitle: string;
  pasteLabel: string;
  inputPlaceholder: string;
  pasteBtn: string;
  fetchBtn: string;
  fetchingBtn: string;
  selectQuality: string;
  generateBtn: string;
  generatingBtn: string;
  readyTitle: string;
  savedSub: string;
  playBtn: string;
  pauseBtn: string;
  shareAudioBtn: string;
  shareAppBtn: string;
  madeWithLove: string;
  shareAppMessage: string;
  missingLinkTitle: string;
  missingLinkBody: string;
  errorTitle: string;
  successTitle: string;
  successBody: (sizeMb: string) => string;
  qualityOptions: {
    '128k': string;
    '192k': string;
    '256k': string;
    '320k': string;
  };
  status: {
    preparing: string;
    downloading: string;
    ready: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'SonicCraft',
    appBadge: 'SUPER FAST & EASY AUDIO DOWNLOADER',
    appSubtitle: 'Grab high quality audio from any YouTube video in seconds!',
    pasteLabel: 'Paste any video link here 👇',
    inputPlaceholder: 'https://www.youtube.com/watch?v=...',
    pasteBtn: 'Paste',
    fetchBtn: 'Get Audio',
    fetchingBtn: 'Getting video...',
    selectQuality: 'Choose your audio quality:',
    generateBtn: 'Save MP3 to Device',
    generatingBtn: 'Preparing your MP3...',
    readyTitle: 'Your Audio is Ready! 🎉',
    savedSub: 'Saved to device Files',
    playBtn: 'Play',
    pauseBtn: 'Pause',
    shareAudioBtn: 'Send Audio',
    shareAppBtn: 'Share App with Friends 🚀',
    madeWithLove: 'Made with ❤️ by Kareem Mostafa',
    shareAppMessage: 'Check out SonicCraft by Kareem Mostafa! Easily download high quality audio from any YouTube video in seconds 🎵🔥',
    missingLinkTitle: 'Oops!',
    missingLinkBody: 'Please paste a YouTube link first 😊',
    errorTitle: 'Could not get audio',
    successTitle: 'Saved Successfully! 🥳',
    successBody: (sizeMb) => `Audio saved to your Files folder (${sizeMb} MB)`,
    qualityOptions: {
      '128k': '128kbps • Standard',
      '192k': '192kbps • Good Quality',
      '256k': '256kbps • Super Clear',
      '320k': '320kbps • Studio HD Quality 🌟',
    },
    status: {
      preparing: 'Getting track ready...',
      downloading: 'Downloading your audio file...',
      ready: 'Done! Your file is ready.',
    },
  },
  ar: {
    appName: 'سونيك كرافت',
    appBadge: 'أسرع وأسهل برنامج لتنزيل الصوت',
    appSubtitle: 'حمّل أي مقطع صوتي من يوتيوب بأعلى جودة بثواني معدودة!',
    pasteLabel: 'ضع رابط الفيديو هنا 👇',
    inputPlaceholder: 'https://www.youtube.com/watch?v=...',
    pasteBtn: 'لصق',
    fetchBtn: 'هات الصوت',
    fetchingBtn: 'جاري التحضير...',
    selectQuality: 'اختر جودة الصوت اللي تحبها:',
    generateBtn: 'احفظ MP3 على جهازك',
    generatingBtn: 'جاري تحضير ملف الـ MP3...',
    readyTitle: 'ملفك الصوتي جاهز! 🎉',
    savedSub: 'تم الحفظ في ملفات الجهاز',
    playBtn: 'تشغيل',
    pauseBtn: 'إيقاف',
    shareAudioBtn: 'أرسل الصوت',
    shareAppBtn: 'شارِك التطبيق مع صحابك 🚀',
    madeWithLove: 'صُنع بـ ❤️ بواسطة كريم مصطفى',
    shareAppMessage: 'جرب تطبيق SonicCraft لكريم مصطفى! حمّل أي صوت من يوتيوب بأعلى جودة بثواني وبدون إعلانات 🎵🔥',
    missingLinkTitle: 'يا هلا!',
    missingLinkBody: 'يرجى وضع رابط فيديو يوتيوب أولاً 😊',
    errorTitle: 'تعذر جلب الصوت',
    successTitle: 'تم الحفظ بنجاح! 🥳',
    successBody: (sizeMb) => `تم حفظ الملف الصوتي في مجلد المستندات (${sizeMb} ميجابايت)`,
    qualityOptions: {
      '128k': '128kbps • جودة عادية',
      '192k': '192kbps • جودة ممتازة',
      '256k': '256kbps • صوت واضح جداً',
      '320k': '320kbps • أعلى جودة استوديو 🌟',
    },
    status: {
      preparing: 'جاري تجهيز المقطع الصوتي...',
      downloading: 'جاري التنزيل لملفات جهازك...',
      ready: 'جاهز! تم التنزيل بنجاح.',
    },
  },
};
