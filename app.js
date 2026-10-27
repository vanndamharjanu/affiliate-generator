// State & Storage Keys
const STORAGE_KEY_API = "pas_affiliate_gemini_api_key";
const STORAGE_KEY_MODEL = "pas_affiliate_gemini_model";
const STORAGE_KEY_CUSTOM_MODEL = "pas_affiliate_gemini_custom_model";
const STORAGE_KEY_AUTO_FALLBACK = "pas_affiliate_gemini_auto_fallback";
const STORAGE_KEY_DISCOVERED_MODELS = "pas_affiliate_gemini_discovered_models";
const STORAGE_KEY_HISTORY = "pas_affiliate_history_v1";

const DEFAULT_FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
];

let currentState = {
  affiliateUrl: "",
  productInfo: "",
  imageBase64: null,
  imageMimeType: null,
  analysis: null, // { productSummary, niche, targetAudience, buyerPersona, problems: [] }
  generatedContents: {}, // keyed by problem index
  activeProblemIndex: null,
};

// DOM Elements
const apiPanel = document.getElementById("apiPanel");
const toggleApiModalBtn = document.getElementById("toggleApiModalBtn");
const closeApiPanelBtn = document.getElementById("closeApiPanelBtn");
const apiKeyInput = document.getElementById("apiKeyInput");
const modelSelect = document.getElementById("modelSelect");
const customModelRow = document.getElementById("customModelRow");
const customModelInput = document.getElementById("customModelInput");
const autoFallbackCheckbox = document.getElementById("autoFallbackCheckbox");
const syncModelsBtn = document.getElementById("syncModelsBtn");
const apiModelStatus = document.getElementById("apiModelStatus");
const apiHeaderBtnText = document.getElementById("apiHeaderBtnText");
const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
const apiStatusDot = document.getElementById("apiStatusDot");

const analyzeForm = document.getElementById("analyzeForm");
const affiliateUrlInput = document.getElementById("affiliateUrl");
const detectUrlBtn = document.getElementById("detectUrlBtn");
const urlDetectStatus = document.getElementById("urlDetectStatus");
const productInfoInput = document.getElementById("productInfo");

const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const dropZonePrompt = document.getElementById("dropZonePrompt");
const imagePreviewWrapper = document.getElementById("imagePreviewWrapper");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");
const analyzeBtn = document.getElementById("analyzeBtn");

const analysisSection = document.getElementById("analysisSection");
const nicheOverview = document.getElementById("nicheOverview");
const scheduleDaySelect = document.getElementById("scheduleDaySelect");
const scheduleNicheSelect = document.getElementById("scheduleNicheSelect");
const scheduleRealtimeBanner = document.getElementById("scheduleRealtimeBanner");
const scheduleDayBehavior = document.getElementById("scheduleDayBehavior");
const scheduleGrid = document.getElementById("scheduleGrid");
const contentToneSelect = document.getElementById("contentTone");
const pronounStyleSelect = document.getElementById("pronounStyle");
const storyDepthSelect = document.getElementById("storyDepth");
const problemsList = document.getElementById("problemsList");

const contentSection = document.getElementById("contentSection");
const selectedProblemLabel = document.getElementById("selectedProblemLabel");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const toastEl = document.getElementById("toast");

// ============================================================================
// BANK DATA JAM UPLOAD TERBAIK AFFILIATE INDONESIA (WIB)
// Berdasarkan Niche Audiens x Pola Hari (Senin-Minggu) x Algoritma Platform
// ============================================================================
const INDONESIAN_DAYS = [
  { index: 0, name: "Minggu", group: "sunday", mood: "Hari Rebahan & Puncak Checkout Keranjang Shopee sebelum masuk kerja/sekolah hari Senin." },
  { index: 1, name: "Senin", group: "weekday", mood: "Awal minggu sibuk. Audiens cari pelarian stres kerja di jam makan siang & rebahan malam." },
  { index: 2, name: "Selasa", group: "weekday", mood: "Ritme harian paling stabil. Jam istirahat siang & prime time malam punya rasio baca utas tertinggi." },
  { index: 3, name: "Rabu", group: "weekday", mood: "Pertengahan minggu (Hump Day). Mood belanja impulsif mulai naik di sore & malam hari." },
  { index: 4, name: "Kamis", group: "weekday", mood: "Persiapan akhir pekan. Audiens aktif cari rekomendasi produk di malam hari (20:00+)." },
  { index: 5, name: "Jumat", group: "friday", mood: "Pola unik Indonesia: Istirahat siang lebih panjang (momen Jumatan) & malam TGIF bergeser lebih larut." },
  { index: 6, name: "Sabtu", group: "saturday", mood: "Pagi lebih santai, siang-sore banyak aktivitas luar rumah, lalu aktif kembali di malam minggu." },
];

const AFFILIATE_POSTING_SCHEDULE_DB = {
  home_living: {
    label: "🏠 Home Living, Kebersihan & Dapur (Ibu Rumah Tangga)",
    keywords: ["rumah", "dapur", "kebersihan", "kerak", "kamar mandi", "masak", "sapu", "pel", "bunda", "moms", "ibu rumah tangga", "home", "living", "laundry", "setrika", "panci", "wajan", "rak", "organizer"],
    audienceHabit: "Ibu rumah tangga beres urus rumah/masak pagi sekitar pukul 09:00, rebahan siang pukul 13:00, dan santai malam pukul 19:30–21:30.",
    schedules: {
      weekday: {
        threads: [
          { start: "09:00", end: "10:30", label: "Selesai kerjaan rumah pagi (Rebahan pagi)" },
          { start: "13:00", end: "14:15", label: "Jam istirahat siang sambil scroll" },
          { start: "19:30", end: "21:15", label: "🔥 Prime Time: Santai malam keluarga" },
        ],
        tiktok: [
          { start: "08:45", end: "10:15", label: "Cari inspirasi beres-beres & resep" },
          { start: "12:30", end: "14:00", label: "Scroll FYP siang hari" },
          { start: "19:00", end: "21:00", label: "🔥 Prime Time: Checkout keranjang kuning" },
        ],
        facebook: [
          { start: "08:30", end: "10:30", label: "🔥 Emak-emak aktif di Grup/Beranda FB" },
          { start: "13:00", end: "14:30", label: "Rame diskusi & komentar siang" },
          { start: "19:15", end: "21:00", label: "Santai malam baca cerita panjang" },
        ],
        whatsapp: [
          { start: "07:30", end: "09:00", label: "Cek WA grup sekolah/komplek pagi" },
          { start: "12:30", end: "13:30", label: "Buka Status WA sambil istirahat" },
          { start: "19:30", end: "20:45", label: "🔥 Prime Time Status & Saluran WA" },
        ],
      },
      friday: {
        threads: [
          { start: "09:00", end: "10:30", label: "Beres masak pagi" },
          { start: "13:00", end: "14:30", label: "Siang tenang pasca Jumatan" },
          { start: "20:00", end: "21:45", label: "🔥 Prime Time Jumat Malam" },
        ],
        tiktok: [
          { start: "09:00", end: "10:30", label: "Pemanasan FYP Jumat pagi" },
          { start: "13:00", end: "14:30", label: "Siang santai scroll video" },
          { start: "19:30", end: "21:30", label: "🔥 Prime Time: Persiapan beres rumah weekend" },
        ],
        facebook: [
          { start: "08:30", end: "10:30", label: "Aktif pagi di beranda FB" },
          { start: "13:15", end: "14:45", label: "🔥 Ramai interaksi siang Jumat" },
          { start: "19:30", end: "21:15", label: "Malam santai" },
        ],
        whatsapp: [
          { start: "08:00", end: "09:30", label: "Jumat berkah / sapaan pagi" },
          { start: "13:00", end: "14:00", label: "Cek Status WA siang" },
          { start: "19:30", end: "21:00", label: "🔥 Prime Time WA Malam" },
        ],
      },
      saturday: {
        threads: [
          { start: "08:30", end: "10:00", label: "Pagi akhir pekan sambil beberes" },
          { start: "13:30", end: "15:00", label: "Siang santai di rumah" },
          { start: "20:00", end: "21:45", label: "🔥 Malam minggu santai" },
        ],
        tiktok: [
          { start: "08:30", end: "10:30", label: "Cari alat kebersihan weekend" },
          { start: "13:00", end: "14:30", label: "Siang rebahan" },
          { start: "19:30", end: "21:30", label: "🔥 Prime Time Malam Minggu" },
        ],
        facebook: [
          { start: "08:00", end: "10:00", label: "🔥 Pagi akhir pekan ramai di FB" },
          { start: "13:30", end: "15:00", label: "Siang santai" },
          { start: "19:30", end: "21:00", label: "Malam keluarga" },
        ],
        whatsapp: [
          { start: "08:00", end: "09:30", label: "Cek Status WA Sabtu pagi" },
          { start: "13:00", end: "14:30", label: "Siang akhir pekan" },
          { start: "19:30", end: "21:00", label: "🔥 Prime Time WA" },
        ],
      },
      sunday: {
        threads: [
          { start: "09:00", end: "11:00", label: "Minggu pagi beres-beres rumah" },
          { start: "13:30", end: "15:00", label: "Rebahan Minggu siang" },
          { start: "19:15", end: "21:15", label: "🔥 Puncak Checkout sebelum hari Senin" },
        ],
        tiktok: [
          { start: "09:00", end: "11:00", label: "FYP Minggu pagi" },
          { start: "13:00", end: "15:00", label: "Scroll siang di rumah" },
          { start: "19:00", end: "21:15", label: "🔥 Prime Time Checkout Minggu Malam" },
        ],
        facebook: [
          { start: "08:30", end: "10:30", label: "Minggu pagi santai" },
          { start: "13:00", end: "15:00", label: "🔥 Siang ramai ibu-ibu di rumah" },
          { start: "19:00", end: "21:00", label: "Malam persiapan Senin" },
        ],
        whatsapp: [
          { start: "08:30", end: "10:00", label: "Status WA Minggu pagi" },
          { start: "13:00", end: "14:30", label: "Siang rebahan" },
          { start: "19:00", end: "20:45", label: "🔥 Prime Time Minggu Malam" },
        ],
      },
    },
    platformTips: {
      threads: "Gunakan cerita keluhan beres-beres rumah yang bikin pegel, lalu pancing komentar dengan tanya kebiasaan Bunda lain.",
      tiktok: "Upload 30 menit sebelum jam ramai. Tampilkan visual 'Before-After' kotor vs bersih di 3 detik pertama.",
      facebook: "Sangat kuat di FB Pro & Grup Rumah Tangga. Gunakan cerita 2-3 paragraf, taruh link di komentar paling akhir.",
      whatsapp: "Pasang Status WA gambar/video hasil bersihnya dulu, baru 3 menit kemudian pasang status ke-2 berisi link Shopee.",
    },
  },

  beauty_fashion: {
    label: "💄 Skincare, Makeup, Fashion & OOTD",
    keywords: ["skincare", "makeup", "wajah", "jerawat", "glowing", "baju", "hijab", "jilbab", "celana", "sepatu", "tas", "ootd", "fashion", "parfum", "body", "serum", "moisturizer", "sunscreen", "lip", "dress", "kemeja"],
    audienceHabit: "Audiens aktif saat siap-siap pagi (07:00), jam makan siang sambil cari racun OOTD (12:00), dan puncak galau/skincare routine malam (20:00–22:30).",
    schedules: {
      weekday: {
        threads: [
          { start: "07:15", end: "08:30", label: "Commuting / siap-siap pagi" },
          { start: "12:00", end: "13:15", label: "Istirahat makan siang cari racun" },
          { start: "20:00", end: "22:15", label: "🔥 Prime Time: Me-time & skincare malam" },
        ],
        tiktok: [
          { start: "11:45", end: "13:15", label: "Jam makan siang (Spill OOTD/Makeup)" },
          { start: "16:45", end: "18:00", label: "Jam pulang kerja/kuliah" },
          { start: "19:30", end: "22:00", label: "🔥 Prime Time: Rawan impulsif checkout" },
        ],
        facebook: [
          { start: "09:00", end: "10:30", label: "Pagi menjelang siang" },
          { start: "12:30", end: "13:45", label: "Istirahat siang" },
          { start: "19:30", end: "21:30", label: "🔥 Prime Time malam" },
        ],
        whatsapp: [
          { start: "07:30", end: "08:45", label: "Cek HP pagi" },
          { start: "12:15", end: "13:15", label: "Jam makan siang" },
          { start: "20:00", end: "21:30", label: "🔥 Prime Time Status WA" },
        ],
      },
      friday: {
        threads: [
          { start: "07:30", end: "08:45", label: "Jumat pagi semangat weekend" },
          { start: "11:45", end: "13:30", label: "Istirahat siang panjang" },
          { start: "20:30", end: "23:00", label: "🔥 Prime Time TGIF (Belanja buat weekend)" },
        ],
        tiktok: [
          { start: "11:30", end: "13:30", label: "Siang Jumat cari outfit" },
          { start: "17:00", end: "18:30", label: "Pulang kerja TGIF" },
          { start: "20:00", end: "22:45", label: "🔥 Prime Time Jumat Malam" },
        ],
        facebook: [
          { start: "09:30", end: "11:00", label: "Pagi Jumat" },
          { start: "13:00", end: "14:30", label: "Siang Jumat" },
          { start: "20:00", end: "22:00", label: "🔥 Malam akhir pekan" },
        ],
        whatsapp: [
          { start: "12:00", end: "13:30", label: "Siang Jumat" },
          { start: "17:00", end: "18:15", label: "Sore pulang kerja" },
          { start: "20:00", end: "21:45", label: "🔥 Prime Time WA" },
        ],
      },
      saturday: {
        threads: [
          { start: "09:30", end: "11:00", label: "Sabtu pagi siap-siap jalan" },
          { start: "15:30", end: "17:00", label: "Sore santai" },
          { start: "20:30", end: "22:45", label: "🔥 Malam minggu scroll utas" },
        ],
        tiktok: [
          { start: "09:30", end: "11:30", label: "GRWM (Get Ready With Me) Sabtu pagi" },
          { start: "15:00", end: "16:30", label: "Sore akhir pekan" },
          { start: "20:00", end: "22:30", label: "🔥 Prime Time Malam Minggu" },
        ],
        facebook: [
          { start: "09:00", end: "11:00", label: "Sabtu pagi" },
          { start: "14:00", end: "15:30", label: "Siang akhir pekan" },
          { start: "19:45", end: "21:30", label: "🔥 Malam minggu" },
        ],
        whatsapp: [
          { start: "09:00", end: "10:30", label: "Pagi akhir pekan" },
          { start: "16:00", end: "17:30", label: "Sore santai" },
          { start: "20:00", end: "21:30", label: "🔥 Prime Time Status WA" },
        ],
      },
      sunday: {
        threads: [
          { start: "10:00", end: "11:30", label: "Minggu pagi santai" },
          { start: "14:00", end: "16:00", label: "Rebahan Minggu sore" },
          { start: "19:30", end: "22:00", label: "🔥 Puncak Checkout Skincare/Outfit Senin" },
        ],
        tiktok: [
          { start: "10:00", end: "12:00", label: "Minggu siang rebahan" },
          { start: "15:00", end: "17:00", label: "Sore di rumah" },
          { start: "19:00", end: "21:45", label: "🔥 Prime Time Checkout Minggu Malam" },
        ],
        facebook: [
          { start: "09:30", end: "11:00", label: "Minggu pagi" },
          { start: "13:30", end: "15:30", label: "Minggu siang" },
          { start: "19:30", end: "21:30", label: "🔥 Minggu malam" },
        ],
        whatsapp: [
          { start: "09:30", end: "11:00", label: "Minggu pagi" },
          { start: "15:00", end: "16:30", label: "Minggu sore" },
          { start: "19:30", end: "21:00", label: "🔥 Prime Time Minggu Malam" },
        ],
      },
    },
    platformTips: {
      threads: "Angkat cerita jujur masalah kulit/susahnya cari ukuran baju yang pas di badan, hindari bahasa promosi katalog.",
      tiktok: "Tunjukkan tekstur/pemakaian langsung di kulit atau try-on baju di cahaya terang pada 3 detik pertama.",
      facebook: "Fokus pada perbandingan awetnya bahan atau penghematan uang dibanding beli produk mahal.",
      whatsapp: "Gunakan foto cermin/real-pict pemakaian pribadi agar kontak WA langsung percaya.",
    },
  },

  parenting_kids: {
    label: "🍼 Parenting, Bayi, MPASI & Mainan Anak",
    keywords: ["bayi", "anak", "balita", "mpasi", "popok", "mainan", "edukasi", "stroller", "botol susu", "asi", "bumil", "hamil", "parenting", "sekolah anak"],
    audienceHabit: "Orang tua/Bunda punya waktu luang saat anak tidur siang (13:00–14:30) dan setelah anak tidur malam (20:30–22:30).",
    schedules: {
      weekday: {
        threads: [
          { start: "08:30", end: "10:00", label: "Anak sudah mandi & sarapan" },
          { start: "13:00", end: "14:30", label: "🔥 Jam anak tidur siang (Bunda scroll HP)" },
          { start: "20:30", end: "22:15", label: "🔥 Prime Time: Anak sudah tidur malam" },
        ],
        tiktok: [
          { start: "08:30", end: "10:00", label: "Pagi cari ide MPASI / aktivitas anak" },
          { start: "12:45", end: "14:15", label: "Jam tidur siang anak" },
          { start: "20:00", end: "22:00", label: "🔥 Prime Time: Me-time Bunda belanja" },
        ],
        facebook: [
          { start: "08:30", end: "10:00", label: "Pagi aktif di grup parenting FB" },
          { start: "13:00", end: "14:30", label: "🔥 Siang sambil nidurin anak" },
          { start: "20:00", end: "21:45", label: "Malam santai" },
        ],
        whatsapp: [
          { start: "07:30", end: "09:00", label: "Pagi setelah antar anak sekolah" },
          { start: "13:00", end: "14:00", label: "Siang istirahat" },
          { start: "20:15", end: "21:30", label: "🔥 Prime Time Status WA" },
        ],
      },
      friday: {
        threads: [
          { start: "08:30", end: "10:00", label: "Jumat pagi" },
          { start: "13:00", end: "14:30", label: "Jam tidur siang anak" },
          { start: "20:30", end: "22:30", label: "🔥 Prime Time Jumat Malam" },
        ],
        tiktok: [
          { start: "08:30", end: "10:00", label: "Pagi Jumat" },
          { start: "13:00", end: "14:30", label: "Siang Jumat" },
          { start: "20:00", end: "22:15", label: "🔥 Prime Time Malam" },
        ],
        facebook: [
          { start: "08:30", end: "10:30", label: "Pagi Jumat" },
          { start: "13:15", end: "14:45", label: "Siang Jumat" },
          { start: "20:00", end: "21:45", label: "🔥 Malam santai" },
        ],
        whatsapp: [
          { start: "08:00", end: "09:30", label: "Pagi Jumat" },
          { start: "13:00", end: "14:15", label: "Siang" },
          { start: "20:15", end: "21:30", label: "🔥 Prime Time WA" },
        ],
      },
      saturday: {
        threads: [
          { start: "08:00", end: "09:30", label: "Sabtu pagi sebelum jalan keluarga" },
          { start: "13:30", end: "15:00", label: "Anak tidur siang" },
          { start: "20:30", end: "22:30", label: "🔥 Malam setelah anak tidur" },
        ],
        tiktok: [
          { start: "08:00", end: "09:30", label: "Sabtu pagi" },
          { start: "13:00", end: "14:30", label: "Siang akhir pekan" },
          { start: "20:15", end: "22:15", label: "🔥 Prime Time Sabtu Malam" },
        ],
        facebook: [
          { start: "08:00", end: "09:30", label: "Sabtu pagi" },
          { start: "13:30", end: "15:00", label: "Siang" },
          { start: "20:00", end: "21:45", label: "🔥 Sabtu Malam" },
        ],
        whatsapp: [
          { start: "08:00", end: "09:30", label: "Pagi akhir pekan" },
          { start: "13:30", end: "14:30", label: "Siang" },
          { start: "20:00", end: "21:30", label: "🔥 Prime Time WA" },
        ],
      },
      sunday: {
        threads: [
          { start: "08:30", end: "10:00", label: "Minggu pagi" },
          { start: "13:30", end: "15:00", label: "Jam tidur siang anak" },
          { start: "20:00", end: "22:00", label: "🔥 Puncak Checkout kebutuhan anak mingguan" },
        ],
        tiktok: [
          { start: "08:30", end: "10:00", label: "Minggu pagi" },
          { start: "13:00", end: "14:30", label: "Siang di rumah" },
          { start: "19:45", end: "21:45", label: "🔥 Prime Time Minggu Malam" },
        ],
        facebook: [
          { start: "08:30", end: "10:00", label: "Minggu pagi" },
          { start: "13:00", end: "15:00", label: "Minggu siang" },
          { start: "19:45", end: "21:30", label: "🔥 Minggu malam" },
        ],
        whatsapp: [
          { start: "08:30", end: "10:00", label: "Minggu pagi" },
          { start: "13:30", end: "14:30", label: "Minggu siang" },
          { start: "19:45", end: "21:15", label: "🔥 Prime Time WA" },
        ],
      },
    },
    platformTips: {
      threads: "Ceritakan drama nyata ngurus anak (GTM, rewel, tantrum) dengan nada empati sesama orang tua.",
      tiktok: "Tampilkan reaksi anak saat pakai produk/mainan tanpa wajah anak harus selalu terlihat penuh jika menjaga privasi.",
      facebook: "Komentar emak-emak di FB sangat hidup jika di akhir post utama ditanya 'Anak Bunda di rumah gini juga gak?'",
      whatsapp: "Sangat efektif karena teman di kontak WA biasanya tahu usia anak Anda dan punya kebutuhan serupa.",
    },
  },

  gadget_otomotif: {
    label: "🔧 Elektronik, Gadget, Otomotif & Pertukangan (Bapak-bapak)",
    keywords: ["mobil", "motor", "helm", "oli", "obeng", "bor", "tukang", "alat", "kabel", "charger", "tws", "headset", "hp", "laptop", "elektronik", "lampu", "led", "pompa", "bapak", "otomotif", "speaker"],
    audienceHabit: "Audiens pria/bapak-bapak aktif pagi sambil ngopi (06:30–08:00), jam istirahat kerja (12:00), dan begadang malam (20:30–23:00).",
    schedules: {
      weekday: {
        threads: [
          { start: "06:45", end: "08:00", label: "Ngopi pagi sebelum berangkat kerja" },
          { start: "11:45", end: "13:00", label: "Jam istirahat makan siang kantor" },
          { start: "20:30", end: "22:45", label: "🔥 Prime Time: Santai malam / ngopi di teras" },
        ],
        tiktok: [
          { start: "11:45", end: "13:00", label: "Istirahat siang" },
          { start: "17:00", end: "18:15", label: "Pulang kerja" },
          { start: "20:00", end: "22:45", label: "🔥 Prime Time: Bapak-bapak keracunan alat" },
        ],
        facebook: [
          { start: "07:00", end: "08:15", label: "Cek FB sambil ngopi pagi" },
          { start: "12:00", end: "13:15", label: "Istirahat siang" },
          { start: "20:00", end: "22:30", label: "🔥 Prime Time Grup/Beranda Bapak-bapak FB" },
        ],
        whatsapp: [
          { start: "07:00", end: "08:15", label: "Cek grup WA pagi" },
          { start: "12:00", end: "13:00", label: "Istirahat siang" },
          { start: "20:00", end: "21:45", label: "🔥 Prime Time WA Malam" },
        ],
      },
      friday: {
        threads: [
          { start: "07:00", end: "08:15", label: "Ngopi Jumat pagi" },
          { start: "13:00", end: "14:15", label: "🔥 Selesai Sholat Jumat & makan siang" },
          { start: "20:30", end: "23:15", label: "🔥 Prime Time Jumat Malam (Begadang)" },
        ],
        tiktok: [
          { start: "10:45", end: "11:30", label: "Menjelang istirahat Jumat" },
          { start: "13:00", end: "14:15", label: "Setelah Jumatan" },
          { start: "20:15", end: "23:00", label: "🔥 Prime Time TGIF Malam" },
        ],
        facebook: [
          { start: "07:00", end: "08:30", label: "Pagi Jumat" },
          { start: "13:00", end: "14:30", label: "🔥 Selesai Jumatan ramai buka FB" },
          { start: "20:30", end: "23:00", label: "🔥 Malam Sabtu" },
        ],
        whatsapp: [
          { start: "07:00", end: "08:15", label: "Pagi Jumat" },
          { start: "13:00", end: "14:00", label: "Setelah Jumatan" },
          { start: "20:15", end: "22:00", label: "🔥 Prime Time WA" },
        ],
      },
      saturday: {
        threads: [
          { start: "07:30", end: "09:30", label: "🔥 Sabtu pagi (Waktu ngoprek/cuci motor/mobil)" },
          { start: "13:00", end: "14:30", label: "Siang santai" },
          { start: "20:30", end: "23:00", label: "🔥 Malam minggu" },
        ],
        tiktok: [
          { start: "07:30", end: "09:30", label: "Pagi akhir pekan cari alat oprek" },
          { start: "13:00", end: "14:30", label: "Siang" },
          { start: "20:00", end: "22:45", label: "🔥 Prime Time Sabtu Malam" },
        ],
        facebook: [
          { start: "07:30", end: "09:30", label: "🔥 Pagi ngopi & baca diskusi grup" },
          { start: "13:30", end: "15:00", label: "Siang" },
          { start: "20:00", end: "22:30", label: "Malam minggu" },
        ],
        whatsapp: [
          { start: "07:30", end: "09:00", label: "Sabtu pagi" },
          { start: "13:00", end: "14:30", label: "Siang" },
          { start: "20:00", end: "21:45", label: "🔥 Prime Time WA" },
        ],
      },
      sunday: {
        threads: [
          { start: "07:30", end: "09:30", label: "Minggu pagi beres-beres garasi/rumah" },
          { start: "13:30", end: "15:00", label: "Minggu siang" },
          { start: "20:00", end: "22:30", label: "🔥 Puncak Checkout Minggu Malam" },
        ],
        tiktok: [
          { start: "08:00", end: "10:00", label: "Minggu pagi" },
          { start: "13:00", end: "15:00", label: "Minggu siang" },
          { start: "19:30", end: "22:15", label: "🔥 Prime Time Minggu Malam" },
        ],
        facebook: [
          { start: "07:30", end: "09:30", label: "Minggu pagi" },
          { start: "13:30", end: "15:00", label: "Minggu siang" },
          { start: "19:30", end: "22:00", label: "🔥 Prime Time FB" },
        ],
        whatsapp: [
          { start: "08:00", end: "09:30", label: "Minggu pagi" },
          { start: "13:30", end: "15:00", label: "Minggu siang" },
          { start: "19:30", end: "21:30", label: "🔥 Prime Time WA" },
        ],
      },
    },
    platformTips: {
      threads: "Bahas dari sisi fungsi praktis, hemat biaya servis/tukang, dan spesifikasi nyata yang gak kaleng-kaleng.",
      tiktok: "Langsung demokan fungsi alat pada 3 detik pertama (misal: semprotan kencang, bor langsung tembus, lampu terang).",
      facebook: "Bapak-bapak di FB suka tulisan bergaya pengalaman pribadi yang ngasih tips teknis gratis sebelum spill alat.",
      whatsapp: "Cocok di-share ke grup WA hobi/komunitas/bapak-bapak komplek dengan bahasa santai.",
    },
  },

  anak_kos_pekerja: {
    label: "🎒 Kebutuhan Anak Kos, Dekorasi Kamar & Pekerja/WFC",
    keywords: ["kos", "kost", "kamar", "meja", "kursi", "ergonomis", "kantor", "kerja", "kuliah", "mahasiswa", "praktis", "portable", "lipat", "sprei", "bantal", "kasur", "kipas", "lampu tidur", "colokan"],
    audienceHabit: "Aktif saat commuting pagi (07:30), makan siang (12:00), pulang kerja (17:30), dan jam begadang anak kos/pekerja (21:00–23:30).",
    schedules: {
      weekday: {
        threads: [
          { start: "07:30", end: "08:45", label: "Di KRL/Transjakarta/ojol berangkat kerja" },
          { start: "12:00", end: "13:15", label: "Makan siang bareng teman kantor/kampus" },
          { start: "20:45", end: "23:00", label: "🔥 Prime Time: Rebahan di kamar kos" },
        ],
        tiktok: [
          { start: "12:00", end: "13:15", label: "Jam makan siang" },
          { start: "17:15", end: "18:30", label: "Perjalanan pulang kerja/kuliah" },
          { start: "20:30", end: "23:00", label: "🔥 Prime Time: Scroll FYP sebelum tidur" },
        ],
        facebook: [
          { start: "12:00", end: "13:15", label: "Istirahat siang" },
          { start: "17:30", end: "18:45", label: "Sore pulang kerja" },
          { start: "20:00", end: "22:15", label: "🔥 Prime Time malam" },
        ],
        whatsapp: [
          { start: "07:30", end: "08:30", label: "Pagi berangkat aktivitas" },
          { start: "12:00", end: "13:00", label: "Jam makan siang" },
          { start: "20:15", end: "21:45", label: "🔥 Prime Time Status WA" },
        ],
      },
      friday: {
        threads: [
          { start: "07:30", end: "08:45", label: "Jumat pagi" },
          { start: "11:45", end: "13:30", label: "Istirahat siang Jumat" },
          { start: "21:00", end: "23:30", label: "🔥 Prime Time Begadang Jumat Malam" },
        ],
        tiktok: [
          { start: "11:45", end: "13:30", label: "Siang Jumat" },
          { start: "17:00", end: "18:30", label: "Pulang kerja TGIF" },
          { start: "20:30", end: "23:15", label: "🔥 Prime Time Jumat Malam" },
        ],
        facebook: [
          { start: "12:00", end: "13:30", label: "Siang Jumat" },
          { start: "17:30", end: "19:00", label: "Sore Jumat" },
          { start: "20:30", end: "22:30", label: "🔥 Jumat malam" },
        ],
        whatsapp: [
          { start: "12:00", end: "13:15", label: "Siang Jumat" },
          { start: "17:30", end: "18:30", label: "Sore pulang kerja" },
          { start: "20:30", end: "22:00", label: "🔥 Prime Time WA" },
        ],
      },
      saturday: {
        threads: [
          { start: "09:30", end: "11:00", label: "Bangun siang akhir pekan" },
          { start: "15:00", end: "16:30", label: "Sore di kos" },
          { start: "21:00", end: "23:30", label: "🔥 Malam minggu" },
        ],
        tiktok: [
          { start: "09:30", end: "11:30", label: "Sabtu pagi menjelang siang" },
          { start: "15:00", end: "16:30", label: "Sabtu sore" },
          { start: "20:30", end: "23:15", label: "🔥 Prime Time Malam Minggu" },
        ],
        facebook: [
          { start: "09:30", end: "11:00", label: "Sabtu pagi" },
          { start: "15:00", end: "16:30", label: "Sabtu sore" },
          { start: "20:00", end: "22:30", label: "🔥 Malam minggu" },
        ],
        whatsapp: [
          { start: "09:30", end: "11:00", label: "Sabtu pagi" },
          { start: "16:00", end: "17:30", label: "Sabtu sore" },
          { start: "20:00", end: "22:00", label: "🔥 Prime Time WA" },
        ],
      },
      sunday: {
        threads: [
          { start: "10:00", end: "11:30", label: "Minggu pagi beres kamar kos" },
          { start: "14:00", end: "16:00", label: "Minggu siang" },
          { start: "20:00", end: "22:30", label: "🔥 Puncak Checkout sebelum Senin" },
        ],
        tiktok: [
          { start: "10:00", end: "12:00", label: "Minggu siang" },
          { start: "14:30", end: "16:30", label: "Minggu sore" },
          { start: "19:30", end: "22:15", label: "🔥 Prime Time Minggu Malam" },
        ],
        facebook: [
          { start: "10:00", end: "11:30", label: "Minggu pagi" },
          { start: "14:00", end: "16:00", label: "Minggu siang" },
          { start: "19:30", end: "22:00", label: "🔥 Minggu malam" },
        ],
        whatsapp: [
          { start: "09:30", end: "11:00", label: "Minggu pagi" },
          { start: "15:00", end: "16:30", label: "Minggu sore" },
          { start: "19:30", end: "21:30", label: "🔥 Prime Time WA" },
        ],
      },
    },
    platformTips: {
      threads: "Threads & X adalah sarang utama pekerja & anak kos. Gunakan gaya curhat relatable soal capek kerja atau sempitnya kamar kos.",
      tiktok: "Tunjukkan betapa ringkas, hemat tempat, dan hemat listriknya barang tersebut untuk ukuran kamar kos.",
      facebook: "Cocok dibagikan dengan sudut pandang penghematan pengeluaran bulanan.",
      whatsapp: "Sangat pas untuk status malam hari saat teman-teman kos/kantor sedang rebahan.",
    },
  },

  kuliner_fnb: {
    label: "🍜 Kuliner, Cemilan Viral, Kopi & Bahan Makanan",
    keywords: ["makanan", "cemilan", "snack", "pedas", "basreng", "keripik", "kopi", "minuman", "coklat", "kue", "roti", "sambal", "bumbu", "frozen", "kuliner", "lapar", "ngemil", "teh", "matcha"],
    audienceHabit: "Dipicu oleh jam biologis lapar & ngantuk: menjelang makan siang (11:00), jam ngantuk kantor sore (15:00–16:30), dan lapar tengah malam (20:30–22:30).",
    schedules: {
      weekday: {
        threads: [
          { start: "11:00", end: "12:30", label: "🔥 Jam perut mulai keroncongan siang" },
          { start: "15:15", end: "16:45", label: "🔥 Jam ngantuk sore (Cari teman ngemil/kopi)" },
          { start: "20:30", end: "22:30", label: "🔥 Jam rawan lapar tengah malam" },
        ],
        tiktok: [
          { start: "10:45", end: "12:15", label: "Menjelang makan siang" },
          { start: "15:00", end: "16:30", label: "Jam ngemil sore" },
          { start: "20:00", end: "22:30", label: "🔥 Prime Time: Racun kuliner malam" },
        ],
        facebook: [
          { start: "10:30", end: "12:00", label: "Ibu-ibu cari ide lauk/cemilan siang" },
          { start: "15:00", end: "16:30", label: "Sore santai" },
          { start: "19:30", end: "21:30", label: "🔥 Malam santai" },
        ],
        whatsapp: [
          { start: "11:00", end: "12:15", label: "Menjelang makan siang" },
          { start: "15:15", end: "16:30", label: "Jam ngemil sore" },
          { start: "20:00", end: "21:30", label: "🔥 Prime Time Status WA" },
        ],
      },
      friday: {
        threads: [
          { start: "10:45", end: "11:45", label: "Sebelum istirahat Jumat" },
          { start: "15:00", end: "16:45", label: "Sore Jumat cari stok cemilan weekend" },
          { start: "20:30", end: "23:00", label: "🔥 Lapar malam TGIF" },
        ],
        tiktok: [
          { start: "11:00", end: "13:00", label: "Siang Jumat" },
          { start: "15:00", end: "16:45", label: "Sore Jumat" },
          { start: "20:00", end: "22:45", label: "🔥 Prime Time Jumat Malam" },
        ],
        facebook: [
          { start: "10:30", end: "11:45", label: "Pagi menjelang siang" },
          { start: "15:00", end: "16:30", label: "Sore Jumat" },
          { start: "19:45", end: "21:45", label: "🔥 Malam akhir pekan" },
        ],
        whatsapp: [
          { start: "11:00", end: "12:00", label: "Siang Jumat" },
          { start: "15:30", end: "16:45", label: "Sore Jumat" },
          { start: "20:00", end: "21:30", label: "🔥 Prime Time WA" },
        ],
      },
      saturday: {
        threads: [
          { start: "10:30", end: "12:00", label: "Sabtu siang" },
          { start: "15:30", end: "17:00", label: "Sore akhir pekan" },
          { start: "20:30", end: "23:00", label: "🔥 Malam minggu cari cemilan nonton" },
        ],
        tiktok: [
          { start: "10:30", end: "12:30", label: "Sabtu siang" },
          { start: "15:00", end: "17:00", label: "Sore akhir pekan" },
          { start: "20:00", end: "22:45", label: "🔥 Prime Time Malam Minggu" },
        ],
        facebook: [
          { start: "10:00", end: "11:30", label: "Sabtu pagi-siang" },
          { start: "15:00", end: "16:30", label: "Sabtu sore" },
          { start: "19:30", end: "21:30", label: "🔥 Malam minggu" },
        ],
        whatsapp: [
          { start: "10:30", end: "12:00", label: "Sabtu siang" },
          { start: "15:30", end: "17:00", label: "Sabtu sore" },
          { start: "20:00", end: "21:30", label: "🔥 Prime Time WA" },
        ],
      },
      sunday: {
        threads: [
          { start: "10:30", end: "12:30", label: "Minggu siang di rumah" },
          { start: "15:00", end: "16:45", label: "Minggu sore" },
          { start: "19:45", end: "22:00", label: "🔥 Stok cemilan/kopi buat kerja besok Senin" },
        ],
        tiktok: [
          { start: "10:30", end: "12:30", label: "Minggu siang" },
          { start: "15:00", end: "16:45", label: "Minggu sore" },
          { start: "19:30", end: "22:00", label: "🔥 Prime Time Minggu Malam" },
        ],
        facebook: [
          { start: "10:00", end: "12:00", label: "Minggu siang" },
          { start: "15:00", end: "16:30", label: "Minggu sore" },
          { start: "19:30", end: "21:30", label: "🔥 Minggu malam" },
        ],
        whatsapp: [
          { start: "10:30", end: "12:00", label: "Minggu siang" },
          { start: "15:30", end: "16:45", label: "Minggu sore" },
          { start: "19:30", end: "21:15", label: "🔥 Prime Time WA" },
        ],
      },
    },
    platformTips: {
      threads: "Deskripsikan tekstur, wangi, dan rasa secara jujur (misal: pedas daun jeruknya gak pahit, bumbunya medok).",
      tiktok: "Gunakan suara ASMR kunyahan/tuangan bumbu di 3 detik pertama saat jam rawan lapar.",
      facebook: "Tunjukkan porsi kemasan yang besar/worth-it untuk dimakan rame-rame bareng keluarga.",
      whatsapp: "Posting foto close-up makanan di Status WA tepat jam 11:30 siang atau 20:30 malam bikin kontak langsung nanya beli di mana.",
    },
  },

  kesehatan_olahraga: {
    label: "🏃 Kesehatan, Suplemen, Olahraga & Personal Care",
    keywords: ["sehat", "vitamin", "suplemen", "olahraga", "gym", "lari", "sepatu lari", "diet", "langsing", "pegal", "nyeri", "pijat", "koyo", "minyak", "tidur", "insomnia", "madu", "herbal", "gigi", "mulut"],
    audienceHabit: "Aktif pagi saat motivasi sehat tinggi (06:00–07:30) dan malam saat badan terasa pegal/lelah setelah beraktivitas (19:30–21:30).",
    schedules: {
      weekday: {
        threads: [
          { start: "06:00", end: "07:30", label: "🔥 Pagi hari (Mood hidup sehat & olahraga)" },
          { start: "12:00", end: "13:15", label: "Istirahat siang" },
          { start: "19:45", end: "21:45", label: "🔥 Prime Time: Badan mulai pegal/lelah kerja" },
        ],
        tiktok: [
          { start: "06:00", end: "07:30", label: "Pagi hari" },
          { start: "12:00", end: "13:00", label: "Siang hari" },
          { start: "19:30", end: "21:30", label: "🔥 Prime Time: Cari solusi keluhan badan" },
        ],
        facebook: [
          { start: "06:30", end: "08:00", label: "Pagi hari" },
          { start: "12:30", end: "14:00", label: "Siang hari" },
          { start: "19:30", end: "21:15", label: "🔥 Malam santai" },
        ],
        whatsapp: [
          { start: "06:30", end: "07:45", label: "Status pagi olahraga/sehat" },
          { start: "12:15", end: "13:15", label: "Siang" },
          { start: "19:30", end: "21:00", label: "🔥 Prime Time WA" },
        ],
      },
      friday: {
        threads: [
          { start: "06:00", end: "07:30", label: "Jumat pagi olahraga" },
          { start: "13:00", end: "14:15", label: "Siang Jumat" },
          { start: "20:00", end: "22:00", label: "🔥 Badan remuk setelah seminggu kerja" },
        ],
        tiktok: [
          { start: "06:00", end: "07:30", label: "Jumat pagi" },
          { start: "13:00", end: "14:15", label: "Siang Jumat" },
          { start: "19:30", end: "22:00", label: "🔥 Prime Time Jumat Malam" },
        ],
        facebook: [
          { start: "06:30", end: "08:00", label: "Jumat pagi" },
          { start: "13:00", end: "14:30", label: "Siang Jumat" },
          { start: "19:30", end: "21:30", label: "🔥 Jumat malam" },
        ],
        whatsapp: [
          { start: "06:30", end: "08:00", label: "Jumat pagi" },
          { start: "13:00", end: "14:00", label: "Siang Jumat" },
          { start: "19:30", end: "21:15", label: "🔥 Prime Time WA" },
        ],
      },
      saturday: {
        threads: [
          { start: "06:00", end: "08:30", label: "🔥 Sabtu pagi (Waktu lari pagi / olahraga)" },
          { start: "13:30", end: "15:00", label: "Siang istirahat" },
          { start: "20:00", end: "22:00", label: "Malam minggu" },
        ],
        tiktok: [
          { start: "06:00", end: "08:30", label: "🔥 Pagi olahraga akhir pekan" },
          { start: "13:00", end: "14:30", label: "Siang" },
          { start: "19:30", end: "21:45", label: "Prime Time Malam" },
        ],
        facebook: [
          { start: "06:30", end: "08:30", label: "Sabtu pagi sehat" },
          { start: "13:30", end: "15:00", label: "Siang" },
          { start: "19:30", end: "21:30", label: "🔥 Sabtu malam" },
        ],
        whatsapp: [
          { start: "06:30", end: "08:30", label: "Status pagi olahraga" },
          { start: "13:00", end: "14:30", label: "Siang" },
          { start: "19:30", end: "21:15", label: "🔥 Prime Time WA" },
        ],
      },
      sunday: {
        threads: [
          { start: "06:00", end: "08:30", label: "🔥 Minggu pagi CFD / olahraga" },
          { start: "13:30", end: "15:00", label: "Minggu siang" },
          { start: "19:30", end: "21:30", label: "🔥 Persiapan stamina masuk hari Senin" },
        ],
        tiktok: [
          { start: "06:00", end: "08:30", label: "Minggu pagi CFD" },
          { start: "13:00", end: "15:00", label: "Minggu siang" },
          { start: "19:15", end: "21:30", label: "🔥 Prime Time Minggu Malam" },
        ],
        facebook: [
          { start: "06:30", end: "08:30", label: "Minggu pagi" },
          { start: "13:30", end: "15:00", label: "Minggu siang" },
          { start: "19:30", end: "21:15", label: "🔥 Minggu malam" },
        ],
        whatsapp: [
          { start: "06:30", end: "08:30", label: "Minggu pagi" },
          { start: "13:30", end: "15:00", label: "Minggu siang" },
          { start: "19:30", end: "21:00", label: "🔥 Prime Time WA" },
        ],
      },
    },
    platformTips: {
      threads: "Mulai dari keluhan badan yang sering disepelekan (misal: gampang masuk angin, pinggang pegal duduk lama, susah tidur).",
      tiktok: "Hindari klaim medis berlebihan agar tidak terkena pelanggaran TikTok; fokus pada rasa nyaman/segar setelah pemakaian.",
      facebook: "Edukasi ringan tentang kebiasaan sehat sangat sering di-share ulang oleh warga Facebook.",
      whatsapp: "Ceritakan perubahan yang dirasakan badan sendiri atau keluarga di rumah.",
    },
  },
};

const PLATFORM_META = {
  threads: { icon: "🧵", name: "Threads & X" },
  tiktok: { icon: "🎵", name: "TikTok Video" },
  facebook: { icon: "📘", name: "Facebook" },
  whatsapp: { icon: "💬", name: "WhatsApp" },
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadApiConfig();
  initScheduleSelectors();
  renderHistory();
  setupEventListeners();
});

function getSavedDiscoveredModels() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_DISCOVERED_MODELS) || "[]");
  } catch {
    return [];
  }
}

function renderDiscoveredModelsInDropdown(models = []) {
  const existingGroup = document.getElementById("discoveredModelsGroup");
  if (existingGroup) existingGroup.remove();

  if (!models.length) return;

  const group = document.createElement("optgroup");
  group.id = "discoveredModelsGroup";
  group.label = "✅ Model Terdeteksi Aktif di API Key Anda";

  // Put already-existing static options check so we still let them appear in discovered or avoid duplicate confusion
  models.forEach((m) => {
    // Only add to discovered group if not already in standard options, OR add all discovered so user sees what's verified
    const existsInStatic = Array.from(modelSelect.querySelectorAll("option")).some(
      (opt) => opt.value === m.id
    );
    if (!existsInStatic) {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.displayName || m.id} (${m.id})`;
      group.appendChild(opt);
    }
  });

  if (group.children.length > 0) {
    modelSelect.insertBefore(group, modelSelect.firstChild);
  }
}

function getEffectiveSelectedModel() {
  const selected = localStorage.getItem(STORAGE_KEY_MODEL) || "gemini-2.5-flash-lite";
  if (selected === "custom") {
    return (localStorage.getItem(STORAGE_KEY_CUSTOM_MODEL) || "gemini-3.8-flash").trim();
  }
  return selected;
}

function parseApiKeys(rawKeyStr = "") {
  return rawKeyStr
    .split(/[\s,;]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function updateHeaderBadge(activeModel) {
  if (!apiHeaderBtnText) return;
  const keys = parseApiKeys(localStorage.getItem(STORAGE_KEY_API) || "");
  if (!keys.length) {
    apiHeaderBtnText.textContent = "Pengaturan API Key";
    return;
  }
  const modelLabel = activeModel || getEffectiveSelectedModel();
  const keyBadge = keys.length > 1 ? ` (${keys.length} Key)` : "";
  apiHeaderBtnText.textContent = `API: ${modelLabel}${keyBadge}`;
}

function loadApiConfig() {
  const savedKey = localStorage.getItem(STORAGE_KEY_API) || "";
  const savedModel = localStorage.getItem(STORAGE_KEY_MODEL) || "gemini-2.5-flash-lite";
  const savedCustomModel = localStorage.getItem(STORAGE_KEY_CUSTOM_MODEL) || "";
  const savedAutoFallback = localStorage.getItem(STORAGE_KEY_AUTO_FALLBACK);
  const discovered = getSavedDiscoveredModels();

  renderDiscoveredModelsInDropdown(discovered);

  apiKeyInput.value = savedKey;

  // Ensure savedModel exists in dropdown, otherwise fallback or add it
  const hasOption = Array.from(modelSelect.options).some((opt) => opt.value === savedModel);
  if (hasOption) {
    modelSelect.value = savedModel;
  } else if (savedModel) {
    modelSelect.value = "custom";
    customModelInput.value = savedModel;
  }

  if (savedCustomModel && !customModelInput.value) {
    customModelInput.value = savedCustomModel;
  }

  if (customModelRow) {
    customModelRow.classList.toggle("hidden", modelSelect.value !== "custom");
  }

  if (autoFallbackCheckbox) {
    autoFallbackCheckbox.checked = savedAutoFallback === null ? true : savedAutoFallback === "true";
  }

  if (savedKey) {
    apiStatusDot.classList.add("connected");
    apiPanel.classList.add("hidden");
  } else {
    apiStatusDot.classList.remove("connected");
    apiPanel.classList.remove("hidden");
  }

  updateHeaderBadge();
}

async function syncModelsFromApiKey(silent = false) {
  const keys = parseApiKeys(apiKeyInput.value.trim() || localStorage.getItem(STORAGE_KEY_API) || "");
  if (!keys.length) {
    if (!silent && apiModelStatus) {
      apiModelStatus.textContent = "⚠️ Masukkan API Key terlebih dahulu untuk mengecek daftar model.";
      apiModelStatus.style.color = "#dc2626";
    }
    return [];
  }

  if (syncModelsBtn) {
    syncModelsBtn.disabled = true;
    syncModelsBtn.textContent = "⏳ Mengecek Model...";
  }
  if (!silent && apiModelStatus) {
    apiModelStatus.textContent = "Menghubungi Google AI Studio untuk mengecek model yang aktif di API Key Anda...";
    apiModelStatus.style.color = "#64748b";
  }

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keys[0])}`
    );
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    const rawModels = Array.isArray(data.models) ? data.models : [];

    // Filter generative text/multimodal Gemini models
    const validModels = rawModels
      .filter((m) => {
        const name = m.name || "";
        const methods = m.supportedGenerationMethods || [];
        const isGemini = name.startsWith("models/gemini-");
        const canGenerate = methods.includes("generateContent");
        const isSpecializedNonText =
          name.includes("-tts") ||
          name.includes("-image") ||
          name.includes("embedding") ||
          name.includes("aqa") ||
          name.includes("robotics") ||
          name.includes("computer-use");
        return isGemini && canGenerate && !isSpecializedNonText;
      })
      .map((m) => ({
        id: m.name.replace(/^models\//, ""),
        displayName: m.displayName || m.name.replace(/^models\//, ""),
      }));

    localStorage.setItem(STORAGE_KEY_DISCOVERED_MODELS, JSON.stringify(validModels));
    renderDiscoveredModelsInDropdown(validModels);

    if (apiModelStatus) {
      const modelIds = validModels.map((m) => m.id).slice(0, 8).join(", ");
      apiModelStatus.textContent = `✅ API Key Valid! Terdeteksi ${validModels.length} model aktif (contoh: ${modelIds}).`;
      apiModelStatus.style.color = "#16a34a";
    }
    if (!silent) {
      showToast(`✅ Berhasil memuat ${validModels.length} model dari API Key!`);
    }
    return validModels;
  } catch (err) {
    if (!silent && apiModelStatus) {
      apiModelStatus.textContent = `❌ Gagal mengecek model: ${err.message}`;
      apiModelStatus.style.color = "#dc2626";
    }
    return [];
  } finally {
    if (syncModelsBtn) {
      syncModelsBtn.disabled = false;
      syncModelsBtn.textContent = "🔄 Cek & Muat Model dari API Key";
    }
  }
}

function setupEventListeners() {
  toggleApiModalBtn.addEventListener("click", () => {
    apiPanel.classList.toggle("hidden");
  });

  closeApiPanelBtn.addEventListener("click", () => {
    apiPanel.classList.add("hidden");
  });

  modelSelect.addEventListener("change", () => {
    if (customModelRow) {
      customModelRow.classList.toggle("hidden", modelSelect.value !== "custom");
      if (modelSelect.value === "custom") {
        customModelInput.focus();
      }
    }
  });

  if (syncModelsBtn) {
    syncModelsBtn.addEventListener("click", () => {
      syncModelsFromApiKey(false);
    });
  }

  saveApiKeyBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const customModel = customModelInput ? customModelInput.value.trim() : "";
    const autoFallback = autoFallbackCheckbox ? autoFallbackCheckbox.checked : true;

    if (!key) {
      alert("Silakan masukkan Gemini API Key dari Google AI Studio terlebih dahulu.");
      return;
    }
    if (model === "custom" && !customModel) {
      alert("Silakan ketik kode model custom (misal: gemini-3.8-flash).");
      customModelInput.focus();
      return;
    }

    localStorage.setItem(STORAGE_KEY_API, key);
    localStorage.setItem(STORAGE_KEY_MODEL, model);
    localStorage.setItem(STORAGE_KEY_CUSTOM_MODEL, customModel);
    localStorage.setItem(STORAGE_KEY_AUTO_FALLBACK, String(autoFallback));

    // Sync available models in background when saving key
    await syncModelsFromApiKey(true);
    loadApiConfig();
    showToast("✅ Konfigurasi API Key & Model berhasil disimpan!");
  });

  // Auto-extract slug when pasting Shopee URL
  affiliateUrlInput.addEventListener("input", () => {
    const url = affiliateUrlInput.value.trim();
    const extracted = extractProductNameFromShopeeUrl(url);
    if (extracted && !productInfoInput.value.trim()) {
      productInfoInput.value = extracted;
      urlDetectStatus.textContent = "✅ Nama produk berhasil dibaca otomatis dari link!";
      urlDetectStatus.style.color = "#16a34a";
    }
  });

  detectUrlBtn.addEventListener("click", handleDetectShortUrl);

  // Image Upload & Paste
  dropZone.addEventListener("click", (e) => {
    if (e.target === removeImageBtn) return;
    imageInput.click();
  });

  imageInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  });

  removeImageBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearImage();
  });

  // Global Ctrl+V paste for screenshot
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          showToast("📷 Screenshot produk berhasil ditempel!");
        }
      }
    }
  });

  // Form Submit: Step 1 -> Analyze Problems
  analyzeForm.addEventListener("submit", handleAnalyzeSubmit);

  // Tabs switching
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${target}`).classList.add("active");
    });
  });

  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Hapus semua riwayat analisis dari browser ini?")) {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
      renderHistory();
    }
  });
}

// Extract readable product name if URL has Shopee slug (e.g. shopee.co.id/Nama-Produk-i.123.456)
function extractProductNameFromShopeeUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    const path = decodeURIComponent(url.pathname);
    // Match standard Shopee product slug: /Nama-Produk-i.shopid.itemid
    const slugMatch = path.match(/^\/([^/]+)-i\.\d+\.\d+/);
    if (slugMatch && slugMatch[1]) {
      return slugMatch[1].replace(/-/g, " ").trim();
    }
    return null;
  } catch {
    return null;
  }
}

async function handleDetectShortUrl() {
  const url = affiliateUrlInput.value.trim();
  if (!url) {
    urlDetectStatus.textContent = "Masukkan link Shopee terlebih dahulu.";
    urlDetectStatus.style.color = "#dc2626";
    return;
  }

  // First try direct slug extraction
  const directExtract = extractProductNameFromShopeeUrl(url);
  if (directExtract) {
    productInfoInput.value = directExtract;
    urlDetectStatus.textContent = "✅ Nama produk berhasil diekstrak dari URL!";
    urlDetectStatus.style.color = "#16a34a";
    return;
  }

  // If short link (s.shopee.co.id or shp.ee), try unshortening via public CORS API
  detectUrlBtn.disabled = true;
  detectUrlBtn.textContent = "Mendeteksi...";
  urlDetectStatus.textContent = "Mencoba membuka redirect link affiliate...";
  urlDetectStatus.style.color = "#64748b";

  try {
    const resp = await fetch(`https://unshorten.me/json/${encodeURIComponent(url)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data.resolved_url) {
        const resolvedName = extractProductNameFromShopeeUrl(data.resolved_url);
        if (resolvedName) {
          productInfoInput.value = resolvedName;
          urlDetectStatus.textContent = "✅ Berhasil mendeteksi nama produk dari link pendek!";
          urlDetectStatus.style.color = "#16a34a";
          return;
        }
      }
    }
    urlDetectStatus.textContent =
      "ℹ️ Link pendek terproteksi Shopee. Silakan ketik singkat nama produknya atau Paste (Ctrl+V) screenshot produk di bawah.";
    urlDetectStatus.style.color = "#d97706";
  } catch {
    urlDetectStatus.textContent =
      "ℹ️ Silakan ketik singkat nama produknya atau Paste (Ctrl+V) screenshot produk di bawah.";
    urlDetectStatus.style.color = "#d97706";
  } finally {
    detectUrlBtn.disabled = false;
    detectUrlBtn.textContent = "Deteksi Link";
  }
}

function processImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(.*);base64/);
    currentState.imageBase64 = base64;
    currentState.imageMimeType = mimeMatch ? mimeMatch[1] : file.type;

    imagePreview.src = dataUrl;
    dropZonePrompt.classList.add("hidden");
    imagePreviewWrapper.classList.remove("hidden");

    // If productInfo is still empty, set a placeholder so form validation passes when image is provided
    if (!productInfoInput.value.trim()) {
      productInfoInput.value = "(Analisis dari Screenshot Produk Shopee terlampir)";
    }
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  currentState.imageBase64 = null;
  currentState.imageMimeType = null;
  imageInput.value = "";
  imagePreview.src = "";
  imagePreviewWrapper.classList.add("hidden");
  dropZonePrompt.classList.remove("hidden");
}

// Gemini API Helper (with Multi-Key & Auto-Fallback Model Support)
async function callGeminiJson(promptText, includeImage = false) {
  const rawApiKeys = localStorage.getItem(STORAGE_KEY_API) || "";
  const apiKeys = parseApiKeys(rawApiKeys);
  const primaryModel = getEffectiveSelectedModel();
  const autoFallback = localStorage.getItem(STORAGE_KEY_AUTO_FALLBACK) !== "false";

  if (!apiKeys.length) {
    apiPanel.classList.remove("hidden");
    apiKeyInput.focus();
    throw new Error("Silakan masukkan Gemini API Key terlebih dahulu di panel Pengaturan API Key.");
  }

  const parts = [{ text: promptText }];
  if (includeImage && currentState.imageBase64 && currentState.imageMimeType) {
    parts.push({
      inline_data: {
        mime_type: currentState.imageMimeType,
        data: currentState.imageBase64,
      },
    });
  }

  // Build ordered unique list of candidate models
  const discoveredIds = getSavedDiscoveredModels()
    .map((m) => m.id)
    .filter((id) => id.includes("flash"));
  const candidateModels = [primaryModel];

  if (autoFallback) {
    [...DEFAULT_FALLBACK_MODELS, ...discoveredIds].forEach((m) => {
      if (m && !candidateModels.includes(m)) {
        candidateModels.push(m);
      }
    });
  }

  let lastErrorMsg = "";

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const currentKey = apiKeys[keyIdx];

    for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
      const currentModel = candidateModels[modelIdx];
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${encodeURIComponent(
        currentKey
      )}`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP Error ${response.status}`;
          lastErrorMsg = `[${currentModel}] ${errMsg}`;

          // Check if error is retriable via fallback model or next API key (429 Quota, 404 Not Found, 400 Invalid Model, 503 Overloaded)
          const isQuotaOrOverload = response.status === 429 || response.status === 503 || response.status === 500;
          const isModelUnsupported =
            response.status === 404 ||
            (response.status === 400 && /model|not found|not supported/i.test(errMsg));

          if (autoFallback && (isQuotaOrOverload || isModelUnsupported)) {
            console.warn(`Fallback dari ${currentModel} (Status ${response.status}): ${errMsg}`);
            continue;
          }

          // If invalid API key (401/403) and user has multiple keys, break model loop to try next key
          if ((response.status === 401 || response.status === 403) && keyIdx < apiKeys.length - 1) {
            break;
          }

          throw new Error(`Gagal memanggil Gemini API: ${lastErrorMsg}`);
        }

        const result = await response.json();
        const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastErrorMsg = `[${currentModel}] Respons AI kosong.`;
          if (autoFallback) continue;
          throw new Error("Respons AI kosong. Coba ulangi lagi.");
        }

        // Clean possible markdown code fences before parsing JSON
        const cleanedJson = rawText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();

        const parsed = JSON.parse(cleanedJson);

        // Notify user if fallback model or backup key was used
        updateHeaderBadge(currentModel);
        if (currentModel !== primaryModel || keyIdx > 0) {
          const keyInfo = keyIdx > 0 ? ` (Key Cadangan #${keyIdx + 1})` : "";
          showToast(`⚡ Otomatis beralih ke model: ${currentModel}${keyInfo}`);
        }

        return parsed;
      } catch (err) {
        lastErrorMsg = err.message || String(err);
        if (!autoFallback) {
          throw err;
        }
      }
    }
  }

  throw new Error(
    `Semua model/kuota API Key sedang mencapai batas limit.\nDetail terakhir: ${lastErrorMsg}\n\nTips: Coba masukkan API Key dari project baru di Pengaturan API Key.`
  );
}

// STEP 1: Analyze Product -> Output Buyer Problems & Niche
async function handleAnalyzeSubmit(e) {
  e.preventDefault();
  const affiliateUrl = affiliateUrlInput.value.trim();
  const productInfo = productInfoInput.value.trim();

  if (!affiliateUrl || !productInfo) {
    alert("Mohon isi Link Affiliate dan Nama/Deskripsi Produk.");
    return;
  }

  currentState.affiliateUrl = affiliateUrl;
  currentState.productInfo = productInfo;
  currentState.generatedContents = {};
  currentState.activeProblemIndex = null;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "⏳ Sedang Menganalisis Masalah Pembeli & Niche...";
  contentSection.classList.add("hidden");

  const prompt = `
Anda adalah pakar riset pasar e-commerce dan copywriter affiliate Indonesia (spesialis formula Problem-Agitate-Solution / PAS).

Data Input Pengguna:
- Link Affiliate Shopee: ${affiliateUrl}
- Informasi Produk / Ulasan: ${productInfo}
${currentState.imageBase64 ? "- Terdapat gambar screenshot produk/ulasan terlampir. Baca detail nama produk, manfaat, dan keluhan pembeli dari gambar tersebut." : ""}

Tugas Anda:
Analisis produk ini dari sudut pandang MASALAH PEMBELI (Pain Points) sebelum mereka memutuskan membeli produk ini, serta identifikasi niche pasarnya.

Kembalikan HANYA format JSON valid dengan struktur persis berikut:
{
  "productName": "Nama produk yang jelas dan ringkas",
  "niche": "Kategori / Niche spesifik (contoh: Home Living & Kebersihan Rumah / Ibu Rumah Tangga)",
  "nicheCategory": "Pilih SATU kode kategori paling relevan dari daftar ini: home_living | beauty_fashion | parenting_kids | gadget_otomotif | anak_kos_pekerja | kuliner_fnb | kesehatan_olahraga",
  "targetAudience": "Siapa pembeli paling potensial produk ini (contoh: Ibu rumah tangga, anak kos, pekerja sibuk)",
  "buyerTrigger": "Alasan emosional terkuat kenapa orang akhirnya checkout produk ini",
  "bestTimeInsight": "1 kalimat tajam tentang momen harian kapan pembeli produk ini paling sering merasakan masalah tersebut dan rawan checkout",
  "problems": [
    {
      "id": 1,
      "title": "Judul masalah pembeli yang spesifik & relatable",
      "emotion": "Emosi utama (contoh: Kesal / Capek / Malu / Khawatir / Boros Waktu)",
      "description": "Gambaran situasi nyata keluhan sehari-hari yang dialami pembeli sebelum tahu produk ini (2-3 kalimat).",
      "contentAngle": "Sudut pandang (hook/angle) bagaimana membahas masalah ini menjadi konten yang memancing interaksi."
    }
  ]
}
Berikan tepat 4 masalah pembeli ("problems") yang paling tajam, realistis, dan berbeda sudut pandang. Gunakan Bahasa Indonesia yang natural.
`.trim();

  try {
    const analysisData = await callGeminiJson(prompt, true);
    currentState.analysis = analysisData;
    renderAnalysisResult(analysisData);
    saveToHistory();
    analysisSection.classList.remove("hidden");
    analysisSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    alert(err.message);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "🔍 1. Analisis Masalah Pembeli & Niche";
  }
}

function renderAnalysisResult(data) {
  nicheOverview.innerHTML = `
    <div><strong>Produk Terdeteksi:</strong> ${escapeHtml(data.productName || currentState.productInfo)}</div>
    <div class="niche-grid">
      <div class="niche-item">
        <strong>🎯 Niche Pasar</strong>
        ${escapeHtml(data.niche || "-")}
      </div>
      <div class="niche-item">
        <strong>👥 Target Pembeli</strong>
        ${escapeHtml(data.targetAudience || "-")}
      </div>
      <div class="niche-item">
        <strong>⚡ Pemicu Checkout</strong>
        ${escapeHtml(data.buyerTrigger || "-")}
      </div>
    </div>
  `;

  // Pilih otomatis kategori niche dan hari ini untuk Bank Data Jam Upload
  const detectedCategory =
    data.nicheCategory && AFFILIATE_POSTING_SCHEDULE_DB[data.nicheCategory]
      ? data.nicheCategory
      : detectNicheCategoryFromText(
          `${data.productName || ""} ${data.niche || ""} ${data.targetAudience || ""} ${currentState.productInfo || ""}`
        );

  if (scheduleNicheSelect) {
    scheduleNicheSelect.value = detectedCategory;
  }
  if (scheduleDaySelect) {
    scheduleDaySelect.value = String(new Date().getDay());
  }
  renderScheduleRecommendation();

  problemsList.innerHTML = "";
  (data.problems || []).forEach((prob, idx) => {
    const card = document.createElement("div");
    card.className = "problem-card";
    card.id = `problem-card-${idx}`;
    card.innerHTML = `
      <div>
        <div class="problem-header">
          <span class="problem-title">${idx + 1}. ${escapeHtml(prob.title)}</span>
          <span class="problem-emotion">${escapeHtml(prob.emotion || "Pain Point")}</span>
        </div>
        <p class="problem-desc" style="margin-top: 8px;">${escapeHtml(prob.description)}</p>
        <div class="problem-angle" style="margin-top: 8px;">
          <strong>💡 Sudut Pandang Konten:</strong> ${escapeHtml(prob.contentAngle)}
        </div>
      </div>
      <div>
        <button type="button" class="btn btn-primary btn-sm generate-content-btn" data-index="${idx}">
          ✨ Buat Konten dari Masalah Ini (Threads, X, TikTok, FB, WA)
        </button>
      </div>
    `;
    problemsList.appendChild(card);
  });

  document.querySelectorAll(".generate-content-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.getAttribute("data-index"), 10);
      handleGenerateContentForProblem(index, btn);
    });
  });
}

// ============================================================================
// FUNGSI BANK DATA JAM UPLOAD TERBAIK (PER NICHE, HARI INI & PLATFORM)
// ============================================================================
function initScheduleSelectors() {
  if (!scheduleDaySelect || !scheduleNicheSelect) return;

  const todayIdx = new Date().getDay();
  scheduleDaySelect.innerHTML = "";
  // Urutkan mulai dari Senin (1..6) lalu Minggu (0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  orderedDays.forEach((dayIdx) => {
    const dayObj = INDONESIAN_DAYS.find((d) => d.index === dayIdx);
    const opt = document.createElement("option");
    opt.value = String(dayIdx);
    opt.textContent = dayIdx === todayIdx ? `📍 Hari Ini (${dayObj.name})` : `Hari ${dayObj.name}`;
    if (dayIdx === todayIdx) opt.selected = true;
    scheduleDaySelect.appendChild(opt);
  });

  scheduleNicheSelect.innerHTML = "";
  Object.entries(AFFILIATE_POSTING_SCHEDULE_DB).forEach(([key, nicheObj]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = nicheObj.label;
    scheduleNicheSelect.appendChild(opt);
  });

  scheduleDaySelect.addEventListener("change", () => {
    renderScheduleRecommendation();
    refreshActiveTabTimeBanners();
  });

  scheduleNicheSelect.addEventListener("change", () => {
    renderScheduleRecommendation();
    refreshActiveTabTimeBanners();
  });
}

function detectNicheCategoryFromText(text = "") {
  const lower = text.toLowerCase();
  let bestKey = "home_living";
  let bestScore = 0;

  for (const [key, nicheObj] of Object.entries(AFFILIATE_POSTING_SCHEDULE_DB)) {
    let score = 0;
    for (const kw of nicheObj.keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  return bestKey;
}

function parseTimeToMinutes(hhmm = "00:00") {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

function formatDurationMinutes(diffMin) {
  if (diffMin <= 0) return "sekarang";
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  if (h > 0 && m > 0) return `${h} jam ${m} menit lagi`;
  if (h > 0) return `${h} jam lagi`;
  return `${m} menit lagi`;
}

function renderScheduleRecommendation() {
  if (!scheduleGrid || !scheduleDaySelect || !scheduleNicheSelect) return;

  const selectedDayIdx = parseInt(scheduleDaySelect.value, 10);
  const selectedNicheKey = scheduleNicheSelect.value || "home_living";

  const dayMeta = INDONESIAN_DAYS.find((d) => d.index === selectedDayIdx) || INDONESIAN_DAYS[1];
  const nicheData =
    AFFILIATE_POSTING_SCHEDULE_DB[selectedNicheKey] || AFFILIATE_POSTING_SCHEDULE_DB.home_living;
  const daySchedule = nicheData.schedules[dayMeta.group] || nicheData.schedules.weekday;

  const now = new Date();
  const isTodaySelected = selectedDayIdx === now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowClockStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  // Cari apakah saat ini sedang Live Prime Time atau slot terdekat berikutnya
  let activeLivePlatforms = [];
  let nearestUpcoming = null; // { platformName, slot, diffMin }

  Object.entries(PLATFORM_META).forEach(([platKey, platMeta]) => {
    const slots = daySchedule[platKey] || [];
    slots.forEach((slot) => {
      const startMin = parseTimeToMinutes(slot.start);
      const endMin = parseTimeToMinutes(slot.end);
      if (isTodaySelected) {
        if (nowMinutes >= startMin && nowMinutes <= endMin) {
          activeLivePlatforms.push(`${platMeta.icon} ${platMeta.name} (${slot.start}–${slot.end})`);
        } else if (startMin > nowMinutes) {
          const diff = startMin - nowMinutes;
          if (!nearestUpcoming || diff < nearestUpcoming.diffMin) {
            nearestUpcoming = {
              platformName: `${platMeta.icon} ${platMeta.name}`,
              slot,
              diffMin: diff,
            };
          }
        }
      }
    });
  });

  if (isTodaySelected) {
    if (activeLivePlatforms.length > 0) {
      scheduleRealtimeBanner.className = "schedule-realtime-banner";
      scheduleRealtimeBanner.innerHTML = `
        <div>
          🟢 <strong>WAKTU EMAS SEKARANG (${nowClockStr} WIB):</strong> Saat ini sedang masuk jam aktif upload untuk
          <strong>${activeLivePlatforms.join(", ")}</strong>!
        </div>
        <span>🔥 Siap Posting Sekarang</span>
      `;
    } else if (nearestUpcoming) {
      scheduleRealtimeBanner.className = "schedule-realtime-banner status-upcoming";
      scheduleRealtimeBanner.innerHTML = `
        <div>
          ⏳ <strong>Status Jam Sekarang (${nowClockStr} WIB):</strong> Jam emas terdekat berikutnya hari ini adalah
          <strong>${nearestUpcoming.platformName} pukul ${nearestUpcoming.slot.start}–${nearestUpcoming.slot.end} WIB</strong>
          (${formatDurationMinutes(nearestUpcoming.diffMin)}).
        </div>
        <span>⚡ Siapkan Draf Konten</span>
      `;
    } else {
      scheduleRealtimeBanner.className = "schedule-realtime-banner status-upcoming";
      scheduleRealtimeBanner.innerHTML = `
        <div>
          🌙 <strong>Status Jam Sekarang (${nowClockStr} WIB):</strong> Jam prime time hari ini hampir selesai. Anda tetap bisa posting untuk audiens begadang atau jadwalkan untuk <strong>jam pagi besok</strong>!
        </div>
      `;
    }
  } else {
    scheduleRealtimeBanner.className = "schedule-realtime-banner status-upcoming";
    scheduleRealtimeBanner.innerHTML = `
      <div>
        📅 <strong>Mode Perencanaan Jadwal (Hari ${dayMeta.name}):</strong> Menampilkan rekomendasi jam upload terbaik untuk hari <strong>${dayMeta.name}</strong>.
      </div>
    `;
  }

  const aiInsight = currentState.analysis?.bestTimeInsight
    ? `<br/><strong>💡 Insight Produk Ini:</strong> ${escapeHtml(currentState.analysis.bestTimeInsight)}`
    : "";

  scheduleDayBehavior.innerHTML = `
    <strong>📊 Pola Audiens Hari ${dayMeta.name}:</strong> ${escapeHtml(dayMeta.mood)}<br/>
    <strong>🎯 Kebiasaan Niche:</strong> ${escapeHtml(nicheData.audienceHabit)}
    ${aiInsight}
  `;

  scheduleGrid.innerHTML = "";
  Object.entries(PLATFORM_META).forEach(([platKey, platMeta]) => {
    const slots = daySchedule[platKey] || [];
    const tip = nicheData.platformTips?.[platKey] || "";

    // Cek apakah platform ini sedang live sekarang
    let isPlatformLive = false;
    let nextSlotIdx = -1;
    if (isTodaySelected) {
      slots.forEach((slot, idx) => {
        const sMin = parseTimeToMinutes(slot.start);
        const eMin = parseTimeToMinutes(slot.end);
        if (nowMinutes >= sMin && nowMinutes <= eMin) {
          isPlatformLive = true;
        } else if (sMin > nowMinutes && nextSlotIdx === -1) {
          nextSlotIdx = idx;
        }
      });
    }

    const slotsHtml = slots
      .map((slot, idx) => {
        const sMin = parseTimeToMinutes(slot.start);
        const eMin = parseTimeToMinutes(slot.end);
        const isLive = isTodaySelected && nowMinutes >= sMin && nowMinutes <= eMin;
        const isNext = isTodaySelected && !isLive && idx === nextSlotIdx;
        const rowClass = isLive ? "active-slot" : isNext ? "next-slot" : "";
        const badgePrefix = isLive ? "🟢 " : isNext ? "⏳ " : "🕒 ";

        return `
          <div class="time-slot-item ${rowClass}">
            <span class="time-slot-clock">${badgePrefix}${escapeHtml(slot.start)} – ${escapeHtml(slot.end)} WIB</span>
            <span class="time-slot-label">${escapeHtml(slot.label)}</span>
          </div>
        `;
      })
      .join("");

    const card = document.createElement("div");
    card.className = "schedule-card";
    card.innerHTML = `
      <div>
        <div class="schedule-card-head">
          <span class="schedule-platform-name">${platMeta.icon} ${platMeta.name}</span>
          <span class="schedule-prime-tag ${isPlatformLive ? "live-now" : ""}">
            ${isPlatformLive ? "🟢 LIVE SEKARANG" : `Hari ${dayMeta.name}`}
          </span>
        </div>
        <div class="time-slots-list" style="margin-top: 8px;">
          ${slotsHtml}
        </div>
      </div>
      <div class="schedule-card-tip">
        <strong>Tips Algoritma:</strong> ${escapeHtml(tip)}
      </div>
    `;
    scheduleGrid.appendChild(card);
  });
}

function createPlatformTimeBanner(platformKey) {
  const selectedDayIdx = scheduleDaySelect ? parseInt(scheduleDaySelect.value, 10) : new Date().getDay();
  const selectedNicheKey = scheduleNicheSelect ? scheduleNicheSelect.value : "home_living";
  const dayMeta = INDONESIAN_DAYS.find((d) => d.index === selectedDayIdx) || INDONESIAN_DAYS[1];
  const nicheData =
    AFFILIATE_POSTING_SCHEDULE_DB[selectedNicheKey] || AFFILIATE_POSTING_SCHEDULE_DB.home_living;
  const daySchedule = nicheData.schedules[dayMeta.group] || nicheData.schedules.weekday;
  const slots = daySchedule[platformKey] || [];
  const platMeta = PLATFORM_META[platformKey] || { icon: "⏰", name: platformKey };
  const tip = nicheData.platformTips?.[platformKey] || "";

  const slotStrings = slots.map((s) => `<strong>${escapeHtml(s.start)}–${escapeHtml(s.end)} WIB</strong> (${escapeHtml(s.label)})`).join(" &bull; ");

  return `
    <div class="platform-time-banner" data-platform-banner="${platformKey}">
      <div>
        <div>⏰ <strong>Jam Upload Terbaik ${platMeta.icon} ${platMeta.name} (Hari ${dayMeta.name}):</strong> ${slotStrings}</div>
        <div style="font-size: 0.79rem; margin-top: 3px; opacity: 0.9;">💡 <em>${escapeHtml(tip)}</em></div>
      </div>
    </div>
  `;
}

function refreshActiveTabTimeBanners() {
  ["threads", "tiktok", "facebook", "whatsapp"].forEach((platKey) => {
    const existing = document.querySelector(`[data-platform-banner="${platKey}"]`);
    if (existing) {
      existing.outerHTML = createPlatformTimeBanner(platKey);
    }
  });
}

// STEP 2: Generate Multi-Platform Content from Selected Buyer Problem
async function handleGenerateContentForProblem(problemIndex, buttonEl) {
  const analysis = currentState.analysis;
  if (!analysis || !analysis.problems[problemIndex]) return;

  const selectedProblem = analysis.problems[problemIndex];
  const tone = contentToneSelect.value;
  const pronounStyle = pronounStyleSelect?.value || "Aku - Kalian (Santai & Akrab)";
  const storyDepth = parseInt(storyDepthSelect?.value || "3", 10);
  const affiliateUrl = currentState.affiliateUrl;

  document.querySelectorAll(".problem-card").forEach((c) => c.classList.remove("active"));
  const activeCard = document.getElementById(`problem-card-${problemIndex}`);
  if (activeCard) activeCard.classList.add("active");

  const originalBtnText = buttonEl.textContent;
  buttonEl.disabled = true;
  buttonEl.textContent = "⏳ Sedang Meracik Alur Cerita & Konten...";

  const prompt = `
Anda adalah warga medsos Indonesia asli (bukan bot AI) yang jago bikin utas cerita di Threads, X (Twitter), FB, dan TikTok yang terasa 100% ketikan manusia asli, organik, dan soft-selling halus.

Konteks Produk & Masalah yang Dipilih:
- Nama Produk: ${analysis.productName}
- Niche & Target Audiens: ${analysis.niche} (${analysis.targetAudience})
- Link Affiliate Shopee: ${affiliateUrl}
- Masalah Pembeli yang Diangkat: "${selectedProblem.title}" — ${selectedProblem.description}
- Sudut Pandang (Angle): ${selectedProblem.contentAngle}
- Gaya Bahasa: ${tone}
- Kata Ganti / Sapaan Wajib: ${pronounStyle} (Gunakan secara konsisten, JANGAN pakai kata "Anda")
- Jumlah Komentar/Balasan Cerita Sebelum Link: ${storyDepth} komentar cerita + 1 komentar penutup berisi link (Total ${storyDepth + 1} komentar/balasan).

ATURAN KERAS ANTI "AI SLOP" (WAJIB DITAATI AGAR TIDAK TERLIHAT SEPERTI KETIKAN CHATGPT/AI):
1. DAFTAR KATA TERLARANG (JANGAN PERNAH GUNAKAN):
   - Dilarang pakai kata/frasa terjemahan kaku seperti: "Pernahkah Anda", "Bayangkan", "Di tengah kesibukan", "Namun jangan khawatir", "Solusi tepat", "Mengubah permainan (game changer)", "Ucapkan selamat tinggal pada", "Tidak dapat dipungkiri", "Mari kita bahas", "Temukan rahasianya", "Hadir sebagai solusi", "Dapatkan segera", "Solusi terbaik".
2. TANDA BACA & FORMAT MANUSIA ASLI:
   - JANGAN gunakan tanda strip panjang / em-dash ("—") karena itu ciri khas AI. Gunakan koma, titik, atau kurung biasa saja.
   - JANGAN banjir emoji di tiap ujung kalimat (maksimal 1 emoji per post, atau tanpa emoji di Threads/X agar terlihat seperti ketikan organik).
   - Gunakan bahasa lisan sehari-hari netizen Indonesia yang mengalir natural (contoh kata sambung natural: "padahal", "mana", "jujur", "kemarin sempet", "eh ternyata", "lumayan banget", "gak", "beneran", "awalnya agak ragu").
3. ATURAN KHUSUS BATAS KARAKTER THREADS & X (TWITTER):
   - Agar 1 utas di bagian "threads" bisa langsung dipakai di Threads DAN X (Twitter versi gratis), SETIAP bagian pada "threads" ("mainPost", setiap item di "storyReplies", dan "affiliateReply") WAJIB ringkas dan MAKSIMAL 260 KARAKTER per bagian (termasuk link di bagian terakhir)!
   - Sedangkan untuk "facebook" boleh lebih panjang (1-2 paragraf mengalir per bagian).
4. ATURAN ANTI "ARGH UJUNG-UJUNGNYA AFFILIATE":
   - Jangan memuji produk secara berlebihan/lebay. Ceritakan secara jujur dan masuk akal, termasuk ekspektasi awal yang biasa saja tapi ternyata terbantu banget.
   - Untuk Threads/X & Facebook, gunakan alur bertahap (Multi-Step Storytelling):
     * POST UTAMA: Murni curhat/cerita/keresahan sehari-hari yang bikin pembaca ngerasa "lah sama banget", diakhiri pertanyaan santai atau kalimat yang bikin orang lanjut baca komentar/utas. (TANPA merek & TANPA link).
     * KOMENTAR/BALASAN CERITA (Buat tepat ${storyDepth} bagian berurutan di array "storyReplies" / "storyComments"):
       - Bagian awal: Cerita drama/kesalnya waktu masih pakai cara lama yang capek/gagal.
       - Bagian tengah: Bagikan tips praktis gratis dulu biar pembaca dapat manfaat, lalu ceritakan momen waktu akhirnya nyobain pakai alat/produk ini dan detail perubahan kecil yang paling kerasa.
     * KOMENTAR/BALASAN TERAKHIR ("affiliateReply" / "affiliateComment"): Masuk dengan santai seolah sekadar ninggalin jejak buat yang butuh, contoh: "Oiya sebelum pada nanya beli di mana kayak kemarin, aku pakainya yang ini yaa: ${affiliateUrl} (kemarin ambil di toko itu soalnya review fotonya asli semua)."
5. Untuk TikTok: Berikan Ide Visual sederhana (tanpa harus tampil muka kalau gak mau), Hook 3 detik pertama yang langsung nyentil masalah dengan bahasa lisan, Script Voiceover ngobrol santai, serta Caption + Hashtag.
6. Untuk WhatsApp: Berikan versi Status WA singkat yang bikin kepo, dan versi cerita akrab untuk Grup/Saluran WA (pakai format *tebal* khas WA seperlunya) + link ${affiliateUrl}.

Kembalikan HANYA JSON valid dengan struktur persis berikut:
{
  "threads": {
    "mainPost": "Postingan utama Threads & X (Maks 260 karakter, 100% relatable/curhat masalah, tanpa link)",
    "storyReplies": [
      "Balasan ke-1 (Maks 260 karakter, lanjutan cerita/agitasi masalah)",
      "Balasan ke-2 (Maks 260 karakter, tips/titik balik menemukan solusi nyata)"
    ],
    "affiliateReply": "Balasan terakhir (Maks 260 karakter, soft-selling kasual + link affiliate ${affiliateUrl})"
  },
  "tiktok": {
    "visualIdea": "Ide visual pengambilan video sederhana tanpa ribet",
    "hook3Sec": "Kalimat Hook 3 detik pertama (teks video & voiceover)",
    "voiceoverScript": "Naskah voiceover lengkap dengan gaya bercerita natural (Problem -> Cerita -> Solusi -> CTA halus)",
    "captionHashtags": "Caption TikTok menarik + 5 hashtag relevan"
  },
  "facebook": {
    "mainPost": "Postingan utama Facebook (Storytelling yang memancing warga FB berkomentar, tanpa link)",
    "storyComments": [
      "Komentar ke-1 (Lanjutan cerita pengalaman pribadi / kesalahan yang sering dilakukan)",
      "Komentar ke-2 (Penjelasan solusi & hasil nyata setelah pakai alat/produk tersebut)"
    ],
    "affiliateComment": "Komentar terakhir (Spill produk secara santai & bersahabat + link affiliate ${affiliateUrl})"
  },
  "whatsapp": {
    "statusText": "Teks singkat penasaran untuk Status WA + link ${affiliateUrl}",
    "broadcastText": "Teks cerita akrab untuk grup/saluran/japri WA dengan format *tebal* khas WA + link ${affiliateUrl}"
  }
}
Pastikan jumlah item di dalam array "storyReplies" (Threads & X) dan "storyComments" (Facebook) masing-masing berjumlah tepat ${storyDepth} item!
`.trim();

  try {
    const contentData = await callGeminiJson(prompt, false);
    currentState.generatedContents[problemIndex] = contentData;
    currentState.activeProblemIndex = problemIndex;

    renderGeneratedContent(selectedProblem, contentData);
    saveToHistory();

    contentSection.classList.remove("hidden");
    contentSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    alert(err.message);
  } finally {
    buttonEl.disabled = false;
    buttonEl.textContent = originalBtnText;
  }
}

function renderGeneratedContent(problem, content) {
  selectedProblemLabel.innerHTML = `Berdasarkan Masalah: <strong>"${escapeHtml(problem.title)}"</strong>`;

  // 1. Threads & X (Main Post + Multi-step Story Replies + Final Soft-Sell Affiliate Reply)
  const threadsReplies = Array.isArray(content.threads?.storyReplies)
    ? content.threads.storyReplies
    : [];
  const threadsAffiliate = content.threads?.affiliateReply || content.threads?.firstReply || "";
  const mainThreadText = content.threads?.mainPost || "";

  let threadsHtml = createPlatformTimeBanner("threads");
  threadsHtml += createCopyBlock(
    `🧵 Post Utama Threads & X (${mainThreadText.length}/280 kar — Tanpa Link)`,
    mainThreadText
  );
  threadsReplies.forEach((replyText, idx) => {
    const len = (replyText || "").length;
    threadsHtml += createCopyBlock(
      `💬 Balasan Utas ke-${idx + 1} (${len}/280 kar — Alur Cerita & Value)`,
      replyText
    );
  });
  threadsHtml += createCopyBlock(
    `🔗 Balasan Terakhir / ke-${threadsReplies.length + 1} (${threadsAffiliate.length}/280 kar — Soft-Selling + Link)`,
    threadsAffiliate
  );
  document.getElementById("tab-threads").innerHTML = threadsHtml;

  // 2. TikTok
  document.getElementById("tab-tiktok").innerHTML = `
    ${createPlatformTimeBanner("tiktok")}
    ${createCopyBlock("🎥 Ide Visual Video", content.tiktok?.visualIdea)}
    ${createCopyBlock("⚡ Hook 3 Detik Pertama (Teks Layar / Ucapan)", content.tiktok?.hook3Sec)}
    ${createCopyBlock("🎙️ Script Voiceover Lengkap (Storytelling PAS)", content.tiktok?.voiceoverScript)}
    ${createCopyBlock("📝 Caption & Hashtag TikTok", content.tiktok?.captionHashtags)}
  `;

  // 3. Facebook (Main Post + Multi-step Story Comments + Final Soft-Sell Affiliate Comment)
  const fbComments = Array.isArray(content.facebook?.storyComments)
    ? content.facebook.storyComments
    : [];
  const fbAffiliate = content.facebook?.affiliateComment || content.facebook?.firstComment || "";

  let fbHtml = createPlatformTimeBanner("facebook");
  fbHtml += createCopyBlock(
    "📘 Postingan Utama Facebook (Storytelling Pemicu Interaksi — Tanpa Link)",
    content.facebook?.mainPost
  );
  fbComments.forEach((commentText, idx) => {
    fbHtml += createCopyBlock(
      `💬 Komentar ke-${idx + 1} (Lanjutan Cerita & Solusi — Tanpa Link)`,
      commentText
    );
  });
  fbHtml += createCopyBlock(
    `🔗 Komentar Terakhir / ke-${fbComments.length + 1} (Spill Santai + Link Affiliate)`,
    fbAffiliate
  );
  document.getElementById("tab-facebook").innerHTML = fbHtml;

  // 4. WhatsApp
  document.getElementById("tab-whatsapp").innerHTML = `
    ${createPlatformTimeBanner("whatsapp")}
    ${createCopyBlock("📱 Caption Status WhatsApp", content.whatsapp?.statusText)}
    ${createCopyBlock("📢 Pesan Grup / Saluran / Broadcast WhatsApp", content.whatsapp?.broadcastText)}
  `;

  // Attach copy button listeners
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-copy");
      navigator.clipboard.writeText(text).then(() => {
        showToast("✅ Konten berhasil disalin!");
      });
    });
  });
}

function createCopyBlock(title, text = "") {
  const safeTitle = escapeHtml(title);
  const safeText = escapeHtml(text);
  const attrText = escapeAttr(text);
  return `
    <div class="content-block">
      <div class="content-block-header">
        <span class="content-block-title">${safeTitle}</span>
        <button type="button" class="btn btn-secondary btn-xs copy-btn" data-copy="${attrText}">
          📋 Salin Teks
        </button>
      </div>
      <div class="content-pre">${safeText}</div>
    </div>
  `;
}

// LocalStorage History (No Database Required)
function saveToHistory() {
  if (!currentState.analysis) return;
  const list = getHistory();
  const entry = {
    id: Date.now(),
    timestamp: new Date().toLocaleString("id-ID"),
    affiliateUrl: currentState.affiliateUrl,
    productInfo: currentState.productInfo,
    analysis: currentState.analysis,
    generatedContents: currentState.generatedContents,
    activeProblemIndex: currentState.activeProblemIndex,
  };

  // Deduplicate by affiliateUrl + productName if updating existing session
  const existingIdx = list.findIndex(
    (item) =>
      item.affiliateUrl === entry.affiliateUrl &&
      item.analysis?.productName === entry.analysis?.productName
  );
  if (existingIdx !== -1) {
    list.splice(existingIdx, 1);
  }

  list.unshift(entry);
  const trimmed = list.slice(0, 15); // Keep latest 15 analyses
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
  renderHistory();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || "[]");
  } catch {
    return [];
  }
}

function renderHistory() {
  const list = getHistory();
  if (!list.length) {
    historyList.innerHTML = `<p class="empty-state">Belum ada riwayat analisis.</p>`;
    return;
  }

  historyList.innerHTML = "";
  list.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `
      <div class="history-item-info">
        <strong>${escapeHtml(item.analysis?.productName || item.productInfo)}</strong>
        <span>${escapeHtml(item.analysis?.niche || "")} &bull; ${escapeHtml(item.timestamp)}</span>
      </div>
      <button type="button" class="btn btn-outline btn-xs">Buka Kembali</button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      affiliateUrlInput.value = item.affiliateUrl || "";
      productInfoInput.value = item.productInfo || "";
      currentState.affiliateUrl = item.affiliateUrl;
      currentState.productInfo = item.productInfo;
      currentState.analysis = item.analysis;
      currentState.generatedContents = item.generatedContents || {};
      currentState.activeProblemIndex = item.activeProblemIndex;

      renderAnalysisResult(item.analysis);
      analysisSection.classList.remove("hidden");

      if (
        item.activeProblemIndex !== null &&
        item.generatedContents &&
        item.generatedContents[item.activeProblemIndex]
      ) {
        const prob = item.analysis.problems[item.activeProblemIndex];
        renderGeneratedContent(prob, item.generatedContents[item.activeProblemIndex]);
        contentSection.classList.remove("hidden");
      } else {
        contentSection.classList.add("hidden");
      }

      analysisSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    historyList.appendChild(row);
  });
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 2500);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str = "") {
  return escapeHtml(str).replace(/\n/g, "&#10;");
}

