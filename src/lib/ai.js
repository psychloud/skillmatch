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
    console.error('SumoPod API error response:', response.status, errorText);
    throw new Error(`Gagal memanggil AI SumoPod (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Format respons dari SumoPod tidak sesuai atau kosong.');
  }
  
  // Strip markdown fences jika ada
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
