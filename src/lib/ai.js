// src/lib/ai.js
export async function generateQuiz(category, jobTitle) {
  const prompt = `
Kamu adalah HR specialist berpengalaman di UMKM Indonesia. Buat 5 soal screening kerja untuk posisi ${jobTitle} kategori ${category}.

Aturan WAJIB:
- Soal harus berupa skenario praktis yang benar-benar terjadi di tempat kerja, BUKAN soal matematika atau teori
- Contoh soal yang BENAR: "Atasan meminta kamu membuat laporan penjualan bulanan di Excel dengan pivot table. Langkah pertama yang kamu lakukan adalah..."
- Contoh soal yang SALAH: "Berapakah hasil dari 15% x 200.000?"
- Setiap soal harus spesifik ke kategori ${category}, bukan soal umum
- Gunakan konteks nyata UMKM Indonesia (toko, outlet, kantor kecil, gudang, dsb)
- Bahasa Indonesia yang natural, bukan formal kaku
- 4 pilihan jawaban yang masuk akal, hanya 1 yang paling benar

Return ONLY a JSON array, no explanation:
[{ "question": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_answer": "a" }]
`;

  // Gunakan proxy path (/api-sumopod) yang mengarah ke https://ai.sumopod.com/v1/chat/completions
  const endpoint = '/api-sumopod/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUMOPOD_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API error response:', response.status, errorText);
    throw new Error(`Gagal memproses soal otomatis (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Format respons soal tidak sesuai atau kosong.');
  }
  
  // Strip markdown fences jika ada
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function formatJobDescription(rawDescription, jobTitle, category) {
  if (!rawDescription || !rawDescription.trim()) {
    return '';
  }

  const prompt = `
Kamu adalah asisten HR UMKM Indonesia. Rapikan deskripsi lowongan kerja mentah berikut untuk posisi ${jobTitle} (kategori: ${category}).

Aturan WAJIB:
- Format menjadi string terstruktur dan ringkas dengan bagian:
  📍 Lokasi: ...
  💰 Gaji: ...
  🎯 Kualifikasi: ...
  📝 Deskripsi Singkat: ...
- Jika suatu bagian tidak disebutkan dalam teks mentah, lewati/jangan tulis bagian tersebut sama sekali
- Gunakan teks polos dengan emoji icon per baris sesuai di atas, JANGAN gunakan format markdown seperti bold (**), bullet points (-), heading (#), dsb
- Maksimal 5 baris total
- Bahasa Indonesia yang rapi dan profesional

Deskripsi mentah:
"${rawDescription}"

Return ONLY the plain formatted text, no introduction or explanation:
`;

  const endpoint = '/api-sumopod/v1/chat/completions';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUMOPOD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.5
      })
    });

    if (!response.ok) {
      console.warn('formatJobDescription API failed, fallback to raw description');
      return rawDescription;
    }

    const data = await response.json();
    const formatted = data?.choices?.[0]?.message?.content?.trim();
    return formatted || rawDescription;
  } catch (err) {
    console.warn('formatJobDescription error, fallback to raw description:', err);
    return rawDescription;
  }
}
