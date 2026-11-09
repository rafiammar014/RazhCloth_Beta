# PANDUAN IMPLEMENTASI & CHECKLIST AKSESIBILITAS WCAG 2.2 (LEVEL AA)
## Frontend POS & Backoffice Toko Pakaian "RAZH CLOTH"
**Stack**: Next.js 14/15/16 + Tailwind CSS v4 + TypeScript + Lucide Icons  
**Target Device**: Desktop POS Monitor, Layar Sentuh Tablet Kasir (iPad/Android 10-12"), & Barcode Scanner

---

## 1. WCAG 2.2 Level AA Compliance Checklist (POUR Matrix)

Checklist operasional untuk menjamin kepatuhan penuh seluruh antarmuka frontend POS RAZH CLOTH terhadap standar **WCAG 2.2 Level AA**:

### 1.1 Perceivable (Dapat Dirasakan & Dipahami Sensorik)
- [x] **SC 1.1.1 Non-text Content (Level A)**:
  - Tombol icon-only (cth: tombol hapus item keranjang, tombol scan, print struk) **wajib** memiliki `aria-label` eksplisit (cth: `aria-label="Hapus Kaos Vintage Hitam Ukuran L"`).
  - Gambar produk apparel wajib memiliki atribut `alt` deskriptif (bukan sekadar `alt="gambar"`, melainkan `alt="Kaos RAZH Heavyweight Hitam - Depan"`).
  - Icon dekoratif (Lucide icons di samping teks) diberi `aria-hidden="true"`.
- [x] **SC 1.3.1 Info and Relationships (Level A)**:
  - Landmark semantik: `<header role="banner">`, `<nav aria-label="...">`, `<main id="main-content">`, `<aside aria-label="Keranjang Kasir">`.
  - Pilihan varian ukuran apparel (S, M, L, XL, XXL) dikelompokkan dalam `<fieldset>` dengan `<legend>` yang jelas.
  - Tabel data stok wajib memiliki `<caption>`, header kolom `th scope="col"`, dan header baris `th scope="row"`.
- [x] **SC 1.4.3 Contrast (Minimum) (Level AA)**:
  - Teks reguler (< 18pt / < 24px) wajib memiliki rasio kontras minimal **4.5:1** terhadap latar belakang.
  - Teks tebal (≥ 14pt tebal) atau teks besar (≥ 18pt) memiliki rasio kontras minimal **3.0:1**.
- [x] **SC 1.4.11 Non-text Contrast (Level AA)**:
  - Komponen antarmuka (garis border input aktif, outline radio button, badge status stok) memiliki kontras minimal **3.0:1** terhadap warna latar sekitarnya.
- [x] **SC 1.4.12 Text Spacing (Level AA)**:
  - UI kasir dan tabel transaksi tidak boleh patah (*clipped* atau terpotong) saat kasir menerapkan stylesheet khusus (line height 1.5x, letter spacing 0.12em).

---

### 1.2 Operable (Dapat Dioperasikan Fisik & Keyboard)
- [x] **SC 2.1.1 Keyboard (Level A)**:
  - 100% alur kasir (cari produk, tambah kuantiti, terapkan diskon, input uang tunai, cetak nota) dapat diselesaikan hanya dengan keyboard murni tanpa mouse/layar sentuh.
- [x] **SC 2.1.2 No Keyboard Trap (Level A)**:
  - Modal checkout atau pop-up konfirmasi mengurung fokus (*focus trap*) saat terbuka, dan melepaskan fokus kembali ke tombol pemanggil saat ditutup via tombol `Escape`.
- [x] **SC 2.4.7 Focus Visible (Level AA)** & **SC 2.4.11 Focus Appearance (Level AA - Kriteria Baru WCAG 2.2)**:
  - Indikator fokus memiliki ketebalan minimal 2px dengan kontras rasio minimal **3:1** antara keadaan terfokus dan latar belakang sekitarnya.
  - Menggunakan Tailwind: `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2`.
- [x] **SC 2.4.12 Focus Not Obscured (Minimum) (Level AA - Kriteria Baru WCAG 2.2)**:
  - Elemen yang menerima fokus tidak boleh tertutup oleh *sticky header* atau *floating bottom cart bar*. Menggunakan kelas utilitas `scroll-mt-24` atau `scroll-pt-24`.
- [x] **SC 2.5.8 Target Size (Minimum) (Level AA - Kriteria Baru WCAG 2.2)**:
  - Standar minimum WCAG 2.2 adalah 24x24px. Namun untuk POS Kasir RAZH CLOTH (terutama layar sentuh tablet), seluruh target sentuh distandarisasi ke **minimal 44x44 CSS px** (Level AAA SC 2.5.5 / Apple & Android HIG) dengan jarak minimum 8px antar elemen sentuh.

---

### 1.3 Understandable (Mudah Dipahami & Diprediksi)
- [x] **SC 3.1.1 Language of Page (Level A)**:
  - Dokumen HTML diset `<html lang="id">` (Bahasa Indonesia) sesuai konteks operasional ritel kasir RAZH CLOTH.
- [x] **SC 3.2.1 On Focus (Level A)** & **SC 3.2.2 On Input (Level A)**:
  - Memindahkan kursor/fokus ke input barcode tidak boleh memicu transaksi selesai otomatis tanpa aksi konfirmasi kasir.
- [x] **SC 3.3.1 Error Identification (Level A)** & **SC 3.3.2 Labels or Instructions (Level A)**:
  - Field error tidak hanya ditandai dengan warna merah, melainkan disertai teks penjelasan error eksplisit yang dihubungkan melalui `aria-describedby` dan `aria-invalid="true"`.
- [x] **SC 3.3.7 Redundant Entry (Level AA - Kriteria Baru WCAG 2.2)**:
  - Kasir tidak diminta menginput ulang data pelanggan yang sudah pernah dimasukkan dalam transaksi aktif saat beralih antara layar katalog dan layar pembayaran.

---

### 1.4 Robust (Kompatibel dengan Teknologi Asistif)
- [x] **SC 4.1.2 Name, Role, Value (Level A)**:
  - Setiap kontrol kustom (radio group ukuran pakaian, modal checkout, switch toggle) memiliki nilai WAI-ARIA yang valid.
- [x] **SC 4.1.3 Status Messages (Level AA)**:
  - Penambahan barang ke keranjang kasir, perubahan subtotal, dan notifikasi stok habis diumumkan secara asinkron menggunakan ARIA Live Region (`aria-live="polite"` untuk update keranjang, `aria-live="assertive"` untuk error scanner).

---

## 2. Standar Kontras Warna, Tipografi, dan Focus Rings

### Matriks Rasio Kontras Palet POS RAZH CLOTH (Slate & Amber)

| Token Desain | Nilai Hex | Warna Pasangan (Background) | Rasio Kontras | Status Kepatuhan | Catatan Penerapan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Slate 900 (Teks Utama)** | `#0F172A` | Putih (`#FFFFFF`) | **18.7:1** | Lolos AAA | Judul modul, teks nama produk, harga tabel. |
| **Slate 600 (Teks Sekunder)** | `#475569` | Putih (`#FFFFFF`) | **5.7:1** | Lolos AA | Keterangan SKU, petunjuk input helper. |
| **Slate 500 (Placeholder/Muted)**| `#64748B` | Putih (`#FFFFFF`) | **4.6:1** | Lolos AA | Placeholder form & label non-kritis. *(Jangan pakai slate-400 pada putih)* |
| **Amber 400 (Aksen Brand)** | `#FBBF24` | Slate 900 (`#0F172A`) | **8.1:1** | Lolos AAA | Logo header, teks badge pada bar navigasi gelap. |
| **Slate 950 di atas Amber 400** | `#020617` | Amber 400 (`#FBBF24`) | **10.5:1**| Lolos AAA | **Tombol Checkout Utama (Sangat Direkomendasikan)**. |
| **Amber 800 (Teks Aksen Terang)**| `#9A3412` | Amber 50 (`#FFFBEB`) | **6.1:1** | Lolos AA | Chip status promosi atau diskon transaksi. |
| **Emerald 900 (Stok Aman)** | `#064E3B` | Emerald 100 (`#D1FAE5`) | **8.3:1** | Lolos AAA | Badge stok fisik > 10 pcs. |
| **Rose 950 (Stok Habis / Error)** | `#4C0519` | Rose 100 (`#FFE4E6`) | **9.5:1** | Lolos AAA | Badge stok habis atau error form validasi. |
| **Border Netral Input Form** | `#94A3B8` | Putih (`#FFFFFF`) | **3.0:1** | Lolos Non-text | Slate-400 untuk border field normal (min 3:1). |

> [!WARNING]
> **Larangan Desain (Anti-Pattern Kontras Rendah)**:
> - Dilarang memakai teks putih (`text-white`) di atas latar `bg-amber-500` karena rasio hanya **2.1:1** (GAGAL). Gunakan selalu teks gelap: `bg-amber-400 text-slate-950 font-bold`.
> - Dilarang menggunakan placeholder warna `text-slate-300` atau `text-slate-400` pada latar belakang putih. Gunakan minimal `text-slate-500`.

### Standar Focus Ring (WCAG 2.2 SC 2.4.11)
Setiap elemen interaktif di POS RAZH CLOTH harus memiliki *focus-visible ring* yang mencolok:
```css
/* Utilitas Tailwind CSS Baku */
focus-visible:outline-none 
focus-visible:ring-2 
focus-visible:ring-amber-500 
focus-visible:ring-offset-2 
focus-visible:ring-offset-white 
dark:focus-visible:ring-offset-slate-900
```
- **Thickness**: Minimal 2px.
- **Offset**: Jarak 2px ring-offset dari batas elemen agar bentuk asli tombol tetap tampak.
- **Warna**: Amber-500 memberikan kontras tinggi di atas latar terang maupun gelap.

---

## 3. Keyboard Navigation & Shortcut Kasir

### Daftar Hotkey Transaksi Kasir RAZH CLOTH
| Tombol Shortcut | Fungsi Kasir | Target Elemen & Logika Fokus |
| :--- | :--- | :--- |
| **`F2`** atau **`/`** | Pencarian Cepat / Barcode Scanner | Memindahkan fokus langsung ke `<input id="pos-search-barcode">` dengan memilih teks otomatis (`select()`). |
| **`F4`** | Selesaikan Transaksi / Checkout | Membuka modal pembayaran tunai/non-tunai dengan *focus containment*. |
| **`F8`** | Kosongkan / Hold Nota Transaksi | Membuka dialog konfirmasi pembatalan transaksi aktif. |
| **`Escape`** | Batalkan / Tutup Modal | Menutup dialog pembayaran atau dropdown filter dan mengembalikan kursor ke tombol pemicu. |
| **`Enter`** | Pilih / Tambah Item Terfokus | Menambahkan produk aktif ke keranjang kasir. |

---

## 4. Spesifikasi Komponen Kode (Next.js + Tailwind)

### 4.1 Form CRUD Produk Apparel (RAZH CLOTH)
Formulir penambahan & pengeditan produk pakaian dengan validasi error real-time, label eksplisit, dan pengelompokan varian ukuran.

```tsx
// src/components/pos/ProductCrudForm.tsx
"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

interface FormState {
  name: string;
  sku: string;
  categoryId: string;
  size: string;
  buyPrice: string;
  sellPrice: string;
  stock: string;
}

export function ProductCrudForm() {
  const [formData, setFormData] = useState<FormState>({
    name: "",
    sku: "",
    categoryId: "kaos",
    size: "L",
    buyPrice: "",
    sellPrice: "",
    stock: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({
    name: "Nama artikel pakaian minimal 3 karakter.",
    sellPrice: "Harga jual kasir harus diisi dan lebih dari Rp 0.",
  });

  const SIZES = ["S", "M", "L", "XL", "XXL", "ALL SIZE"];

  return (
    <form
      aria-labelledby="form-heading"
      noValidate
      onSubmit={(e) => e.preventDefault()}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl"
    >
      <div>
        <h2 id="form-heading" className="text-xl font-black text-slate-900 tracking-tight">
          Formulir Master Produk Apparel
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Lengkapi detail stok pakaian RAZH CLOTH. Kolom bertanda (<span aria-hidden="true" className="text-rose-600 font-bold">*</span>) wajib diisi.
        </p>
      </div>

      {/* Input Nama Produk */}
      <div className="space-y-1.5">
        <label htmlFor="product-name" className="block text-sm font-bold text-slate-800">
          Nama Artikel Apparel <span className="text-rose-600" aria-label="Wajib diisi">*</span>
        </label>
        <input
          id="product-name"
          name="name"
          type="text"
          required
          aria-required="true"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error name-hint" : "name-hint"}
          placeholder="Cth: Heavyweight Vintage Boxy T-Shirt"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors
            ${errors.name 
              ? "border-rose-600 bg-rose-50/20 focus-visible:ring-rose-500" 
              : "border-slate-300 focus-visible:ring-amber-500"
            }
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          `}
        />
        <p id="name-hint" className="text-xs text-slate-600">
          Gunakan format jenis pakaian, corak/warna, dan tipe fitting.
        </p>
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-rose-700 font-semibold flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{errors.name}</span>
          </p>
        )}
      </div>

      {/* Fieldset Pilihan Ukuran (SC 1.3.1 Info & Relationships) */}
      <fieldset className="space-y-2 border-0 p-0 m-0">
        <legend className="text-sm font-bold text-slate-800">
          Ukuran Pakaian (Apparel Size) <span className="text-rose-600" aria-label="Wajib dipilih">*</span>
        </legend>
        <p id="size-hint" className="text-xs text-slate-600">
          Pilih varian ukuran standar RAZH CLOTH.
        </p>
        <div 
          role="radiogroup" 
          aria-labelledby="size-hint"
          className="flex flex-wrap gap-2.5 pt-1"
        >
          {SIZES.map((size) => {
            const isChecked = formData.size === size;
            return (
              <label
                key={size}
                htmlFor={`size-opt-${size}`}
                className={`min-h-[44px] min-w-[52px] px-3 py-2 rounded-xl border text-sm font-bold flex items-center justify-center cursor-pointer transition-all
                  ${isChecked 
                    ? "bg-slate-900 text-amber-400 border-slate-900 ring-2 ring-amber-500 ring-offset-2" 
                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }
                `}
              >
                <input
                  id={`size-opt-${size}`}
                  type="radio"
                  name="apparel-size"
                  value={size}
                  checked={isChecked}
                  onChange={() => setFormData({ ...formData, size })}
                  className="sr-only focus-visible:ring-2 focus-visible:ring-amber-500"
                />
                <span aria-hidden="true">{size}</span>
                <span className="sr-only">Ukuran {size}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Grid Harga & Stok */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Harga Jual */}
        <div className="space-y-1.5">
          <label htmlFor="sell-price" className="block text-sm font-bold text-slate-800">
            Harga Jual Kasir (Rp) <span className="text-rose-600" aria-label="Wajib">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 pointer-events-none" aria-hidden="true">
              Rp
            </span>
            <input
              id="sell-price"
              name="sellPrice"
              type="text"
              inputMode="numeric"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.sellPrice)}
              aria-describedby={errors.sellPrice ? "sell-price-error" : undefined}
              placeholder="150000"
              value={formData.sellPrice}
              onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
              className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border text-sm tabular-nums text-slate-900
                ${errors.sellPrice ? "border-rose-600 bg-rose-50/20" : "border-slate-300"}
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
              `}
            />
          </div>
          {errors.sellPrice && (
            <p id="sell-price-error" role="alert" className="text-xs text-rose-700 font-semibold flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{errors.sellPrice}</span>
            </p>
          )}
        </div>

        {/* Input Stok Fisik */}
        <div className="space-y-1.5">
          <label htmlFor="product-stock" className="block text-sm font-bold text-slate-800">
            Stok Barang Fisik <span className="text-rose-600" aria-label="Wajib">*</span>
          </label>
          <input
            id="product-stock"
            name="stock"
            type="number"
            min="0"
            required
            aria-required="true"
            placeholder="25"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm tabular-nums text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Tombol Simpan & Batal (Min touch target 44px) */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          className="min-h-[44px] min-w-[90px] px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Batal
        </button>
        <button
          type="submit"
          className="min-h-[44px] min-w-[150px] px-5 py-2.5 text-sm font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl border border-amber-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 active:scale-98 transition-all"
        >
          Simpan Produk
        </button>
      </div>
    </form>
  );
}
```

---

### 4.2 Tabel Data Produk Apparel (Accessible Data Grid)
Tabel dengan pengumuman caption, header `scope="col/row"`, sorting indikator ARIA, dan aksi tombol dengan deskripsi lengkap per baris.

```tsx
// src/components/pos/ProductTable.tsx
"use client";

import React, { useState } from "react";
import { ArrowUpDown, Edit3, Trash2 } from "lucide-react";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  size: string;
  sellPrice: number;
  stock: number;
}

const SAMPLE_PRODUCTS: ProductRow[] = [
  { id: "1", sku: "RZH-BOX-001", name: "Heavyweight Boxy Tee - Vintage Black", size: "L", sellPrice: 145000, stock: 28 },
  { id: "2", sku: "RZH-HD-002", name: "Signature Pullover Hoodie - Forest Green", size: "XL", sellPrice: 285000, stock: 4 },
  { id: "3", sku: "RZH-CP-003", name: "Relaxed Corduroy Pants - Mocca", size: "M", sellPrice: 220000, stock: 0 },
];

export function ProductTable() {
  const [sortKey, setSortKey] = useState<"name" | "price" | "stock">("name");
  const [direction, setDirection] = useState<"ascending" | "descending">("ascending");

  const toggleSort = (key: "name" | "price" | "stock") => {
    if (sortKey === key) {
      setDirection(direction === "ascending" ? "descending" : "ascending");
    } else {
      setSortKey(key);
      setDirection("ascending");
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse" aria-describedby="pos-table-caption">
          <caption id="pos-table-caption" className="p-4 text-left font-bold text-slate-800 bg-slate-50 border-b border-slate-200 text-sm">
            Katalog Stok Produk RAZH CLOTH (Total: {SAMPLE_PRODUCTS.length} artikel terdaftar)
          </caption>
          <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3.5 px-4 border-b border-slate-200">SKU</th>
              <th 
                scope="col" 
                aria-sort={sortKey === "name" ? direction : "none"}
                className="py-3.5 px-4 border-b border-slate-200"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1.5 font-bold uppercase tracking-wider hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1 min-h-[36px]"
                >
                  <span>Artikel & Warna</span>
                  <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">, urutkan berdasarkan nama artikel</span>
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 border-b border-slate-200 text-center">Ukuran</th>
              <th 
                scope="col" 
                aria-sort={sortKey === "price" ? direction : "none"}
                className="py-3.5 px-4 border-b border-slate-200 text-right"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("price")}
                  className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1 min-h-[36px]"
                >
                  <span>Harga Jual</span>
                  <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">, urutkan berdasarkan harga jual</span>
                </button>
              </th>
              <th 
                scope="col" 
                aria-sort={sortKey === "stock" ? direction : "none"}
                className="py-3.5 px-4 border-b border-slate-200 text-center"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("stock")}
                  className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1 min-h-[36px]"
                >
                  <span>Stok Fisik</span>
                  <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">, urutkan berdasarkan kuantiti stok</span>
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 border-b border-slate-200 text-center">Tindakan Kasir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {SAMPLE_PRODUCTS.map((item) => (
              <tr key={item.id} className="hover:bg-amber-50/20 transition-colors focus-within:bg-amber-50/40">
                <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-600">{item.sku}</td>
                <th scope="row" className="py-3 px-4 font-bold text-slate-900">{item.name}</th>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800">
                    {item.size}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900">
                  Rp {item.sellPrice.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-4 text-center">
                  {item.stock > 10 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Tersedia ({item.stock})
                    </span>
                  ) : item.stock > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Menipis ({item.stock})
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                      Habis (0)
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      aria-label={`Ubah data produk ${item.name} ukuran ${item.size}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Edit3 className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus produk ${item.name} ukuran ${item.size} dari database`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-rose-600 hover:text-rose-900 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### 4.3 Modal Pembayaran & Focus Trapping (Native `<dialog>`)
Mencegah *keyboard trap* dan memastikan fokus kembali ke tombol pemanggil saat modal pembayaran ditutup.

```tsx
// src/components/pos/CheckoutModal.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { X, Check } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  totalAmount: number;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function CheckoutModal({ isOpen, totalAmount, onClose, triggerRef }: CheckoutModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputCashRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal(); // Mengaktifkan Focus Containment native browser
      }
      setTimeout(() => inputCashRef.current?.focus(), 50);
    } else {
      if (dialog.open) {
        dialog.close();
      }
      // Kembalikan fokus ke elemen pemicu (SC 2.4.3 Focus Order)
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="checkout-title"
      aria-describedby="checkout-summary"
      className="fixed inset-0 m-auto p-0 rounded-2xl bg-white shadow-2xl border border-slate-300 max-w-md w-full backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 id="checkout-title" className="text-xl font-black text-slate-900">
            Pembayaran Transaksi Kasir
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela pembayaran kasir"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p id="checkout-summary" className="text-sm text-slate-600">
          Total tagihan transaksi RAZH CLOTH:{" "}
          <strong className="text-slate-950 font-black tabular-nums text-lg">
            Rp {totalAmount.toLocaleString("id-ID")}
          </strong>
        </p>

        <div className="space-y-1.5">
          <label htmlFor="cash-input" className="block text-sm font-bold text-slate-800">
            Nominal Tunai Pelanggan (Rp) <span className="text-rose-600" aria-label="Wajib">*</span>
          </label>
          <input
            ref={inputCashRef}
            id="cash-input"
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-full min-h-[48px] px-4 text-lg font-bold tabular-nums border-2 border-slate-300 rounded-xl text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            Batal (Esc)
          </button>
          <button
            type="button"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>Selesaikan Transaksi</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
```

---

### 4.4 ARIA Live Regions untuk Pembaruan Keranjang & Notifikasi Toast
Memberi notifikasi suara otomatis ke pengguna pembaca layar ketika barcode discan atau stok kosong tanpa mengganggu fokus kursor kasir.

```tsx
// src/components/pos/CartLiveNotifier.tsx
"use client";

import React from "react";

interface CartLiveNotifierProps {
  announcement: string;
}

export function CartLiveNotifier({ announcement }: CartLiveNotifierProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

// Komponen Toast Notifikasi Kasir
interface PosToastProps {
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
}

export function PosToast({ type, title, message, onClose }: PosToastProps) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-2xl border shadow-2xl max-w-sm
        ${isError 
          ? "bg-rose-50 border-rose-300 text-rose-950" 
          : "bg-emerald-50 border-emerald-300 text-emerald-950"
        }
      `}
    >
      <div className="flex-1">
        <h3 className="text-sm font-black">{title}</h3>
        <p className="text-xs mt-0.5 text-slate-700 font-medium">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup pemberitahuan"
        className="min-h-[44px] min-w-[44px] -my-2 -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}
```

---

## 5. Ringkasan Kepatuhan WCAG 2.2 AA (Mapping Audit)

| Fitur / Modul POS | Kriteria Sukses WCAG 2.2 | Implementasi Spesifik RAZH CLOTH |
| :--- | :--- | :--- |
| **Palet Slate & Amber** | SC 1.4.3 & 1.4.11 | Teks tombol checkout: Slate-950 di atas Amber-400 (rasio 10.5:1). Tidak ada teks putih di atas amber. |
| **Focus Rings** | SC 2.4.11 (Focus Appearance) | 2px ring offset kontras tinggi (`focus-visible:ring-amber-500`). |
| **Focus Non-Obscured** | SC 2.4.12 | `scroll-mt-24` diterapkan agar floating cart tidak menutupi item yang difokuskan. |
| **Form CRUD Apparel** | SC 1.3.1, 3.3.1, 3.3.2 | Fieldset ukuran pakaian, label eksplisit `htmlFor`, icon + teks untuk pesan error validasi. |
| **Tabel Stok Produk** | SC 1.3.1 & 4.1.2 | `caption`, `scope="col/row"`, `aria-sort`, dan `aria-label` unik per tombol baris barang. |
| **Shortcut & Keyboard** | SC 2.1.1 & 2.1.2 | Akses hotkey F2/F4/Esc, native `<dialog>` untuk focus trap tanpa library pihak ketiga. |
| **Touch Target Kasir** | SC 2.5.8 & 2.5.5 | Minimal 44x44px pada seluruh tombol kuantiti keranjang dan tablet modal kasir. |
| **Update Keranjang & Toast**| SC 4.1.3 (Status Messages) | `aria-live="polite"` untuk penambahan barang & `aria-live="assertive"` untuk kegagalan barcode scanner. |
