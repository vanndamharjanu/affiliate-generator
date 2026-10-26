// State & Storage Keys
const STORAGE_KEY_API = "pas_affiliate_gemini_api_key";
const STORAGE_KEY_MODEL = "pas_affiliate_gemini_model";
const STORAGE_KEY_HISTORY = "pas_affiliate_history_v1";

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

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadApiConfig();
  renderHistory();
  setupEventListeners();
});

function loadApiConfig() {
  const savedKey = localStorage.getItem(STORAGE_KEY_API) || "";
  const savedModel = localStorage.getItem(STORAGE_KEY_MODEL) || "gemini-2.5-flash";
  apiKeyInput.value = savedKey;
  modelSelect.value = savedModel;

  if (savedKey) {
    apiStatusDot.classList.add("connected");
    apiPanel.classList.add("hidden");
  } else {
    apiStatusDot.classList.remove("connected");
    apiPanel.classList.remove("hidden");
  }
}

function setupEventListeners() {
  toggleApiModalBtn.addEventListener("click", () => {
    apiPanel.classList.toggle("hidden");
  });

  closeApiPanelBtn.addEventListener("click", () => {
    apiPanel.classList.add("hidden");
  });

  saveApiKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    if (!key) {
      alert("Silakan masukkan Gemini API Key dari Google AI Studio terlebih dahulu.");
      return;
    }
    localStorage.setItem(STORAGE_KEY_API, key);
    localStorage.setItem(STORAGE_KEY_MODEL, model);
    loadApiConfig();
    showToast("API Key berhasil disimpan di browser!");
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

// Gemini API Helper
async function callGeminiJson(promptText, includeImage = false) {
  const apiKey = localStorage.getItem(STORAGE_KEY_API);
  const model = localStorage.getItem(STORAGE_KEY_MODEL) || "gemini-2.5-flash";

  if (!apiKey) {
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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

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
    throw new Error(`Gagal memanggil Gemini API: ${errMsg}`);
  }

  const result = await response.json();
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Respons AI kosong. Coba ulangi lagi.");
  }

  return JSON.parse(rawText);
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
  "targetAudience": "Siapa pembeli paling potensial produk ini (contoh: Ibu rumah tangga, anak kos, pekerja sibuk)",
  "buyerTrigger": "Alasan emosional terkuat kenapa orang akhirnya checkout produk ini",
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
          ✨ Buat Konten dari Masalah Ini (Threads, TikTok, FB, WA)
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
  buttonEl.textContent = "⏳ Sedang Meracik Alur Cerita & Konten 4 Platform...";

  const prompt = `
Anda adalah warga medsos Indonesia asli (bukan bot AI) yang jago bikin utas cerita di Threads, FB, dan TikTok yang terasa 100% ketikan manusia asli, organik, dan soft-selling halus.

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
   - JANGAN banjir emoji di tiap ujung kalimat (maksimal 1 emoji per post, atau tanpa emoji di Threads agar terlihat seperti ketikan organik).
   - Gunakan bahasa lisan sehari-hari netizen Indonesia yang mengalir natural (contoh kata sambung natural: "padahal", "mana", "jujur", "kemarin sempet", "eh ternyata", "lumayan banget", "gak", "beneran", "awalnya agak ragu").
3. ATURAN ANTI "ARGH UJUNG-UJUNGNYA AFFILIATE":
   - Jangan memuji produk secara berlebihan/lebay. Ceritakan secara jujur dan masuk akal, termasuk ekspektasi awal yang biasa saja tapi ternyata terbantu banget.
   - Untuk Threads & Facebook, gunakan alur bertahap (Multi-Step Storytelling):
     * POST UTAMA: Murni curhat/cerita/keresahan sehari-hari yang bikin pembaca ngerasa "lah sama banget", diakhiri pertanyaan santai atau kalimat yang bikin orang lanjut baca komentar. (TANPA merek & TANPA link).
     * KOMENTAR/BALASAN CERITA (Buat tepat ${storyDepth} bagian berurutan di array "storyReplies" / "storyComments"):
       - Bagian awal: Cerita drama/kesalnya waktu masih pakai cara lama yang capek/gagal.
       - Bagian tengah: Bagikan tips praktis gratis dulu biar pembaca dapat manfaat, lalu ceritakan momen waktu akhirnya nyobain pakai alat/produk ini dan detail perubahan kecil yang paling kerasa.
     * KOMENTAR/BALASAN TERAKHIR ("affiliateReply" / "affiliateComment"): Masuk dengan santai seolah sekadar ninggalin jejak buat yang butuh, contoh: "Oiya sebelum pada nanya beli di mana kayak kemarin, aku pakainya yang ini yaa: ${affiliateUrl} (kemarin ambil di toko itu soalnya review fotonya asli semua)."
4. Untuk TikTok: Berikan Ide Visual sederhana (tanpa harus tampil muka kalau gak mau), Hook 3 detik pertama yang langsung nyentil masalah dengan bahasa lisan, Script Voiceover ngobrol santai, serta Caption + Hashtag.
5. Untuk WhatsApp: Berikan versi Status WA singkat yang bikin kepo, dan versi cerita akrab untuk Grup/Saluran WA (pakai format *tebal* khas WA seperlunya) + link ${affiliateUrl}.

Kembalikan HANYA JSON valid dengan struktur persis berikut:
{
  "threads": {
    "mainPost": "Postingan utama Threads (100% relatable/curhat masalah, tanpa jualan & tanpa link)",
    "storyReplies": [
      "Balasan ke-1 (Lanjutan cerita/agitasi masalah)",
      "Balasan ke-2 (Tips/titik balik menemukan solusi nyata)"
    ],
    "affiliateReply": "Balasan terakhir (Soft-selling kasual + link affiliate ${affiliateUrl})"
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
Pastikan jumlah item di dalam array "storyReplies" (Threads) dan "storyComments" (Facebook) masing-masing berjumlah tepat ${storyDepth} item!
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

  // 1. Threads (Main Post + Multi-step Story Replies + Final Soft-Sell Affiliate Reply)
  const threadsReplies = Array.isArray(content.threads?.storyReplies)
    ? content.threads.storyReplies
    : [];
  const threadsAffiliate = content.threads?.affiliateReply || content.threads?.firstReply || "";

  let threadsHtml = createCopyBlock(
    "🧵 Postingan Utama Threads (Pemicu Masalah & Diskusi — Tanpa Link)",
    content.threads?.mainPost
  );
  threadsReplies.forEach((replyText, idx) => {
    threadsHtml += createCopyBlock(
      `💬 Balasan Utas ke-${idx + 1} (Alur Cerita & Value — Tanpa Link)`,
      replyText
    );
  });
  threadsHtml += createCopyBlock(
    `🔗 Balasan Terakhir / ke-${threadsReplies.length + 1} (Soft-Selling Halus + Link Affiliate)`,
    threadsAffiliate
  );
  document.getElementById("tab-threads").innerHTML = threadsHtml;

  // 2. TikTok
  document.getElementById("tab-tiktok").innerHTML = `
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

  let fbHtml = createCopyBlock(
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

