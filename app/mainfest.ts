import type { MetadataRoute } from 'next'

// ★ 「export default function manifest()」 というこの形が絶対に必要です！
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'スマート家計簿',
    short_name: '家計簿',
    description: 'サクサク入力できるカード型UIの家計簿アプリ',
    start_url: '/',
    display: 'standalone', // 💡これがあることで、スマホでアドレスバーが綺麗に消えます！
    background_color: '#f9fafb',
    theme_color: '#10b981',
    icons: [
      {
        src: 'https://cdn-icons-png.flaticon.com/512/2454/2454261.png', // ひとまず仮のアイコン画像URLです
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}