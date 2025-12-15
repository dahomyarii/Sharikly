// frontend/app/page.tsx
'use client'
import useSWR from 'swr'
import axios from 'axios'
import ListingCard from '../components/ListingCard'
import { useLocale } from '../components/LocaleProvider'

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api'
const fetcher = (url: string) => axios.get(url).then((r) => r.data)

export default function Home() {
  const { data, error } = useSWR(`${API}/listings/`, fetcher)
  const listings = data?.results ?? data ?? []
  const { t } = useLocale()

  return (
    <div>
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold mb-4">{t('hero_title')}</h1>
            <p className="text-gray-600 mb-6">{t('hero_sub')}</p>
            <div className="flex gap-3">
              <a href="/listings/new" className="px-5 py-3 bg-black text-white rounded-full">{t('list_item')}</a>
              <a href="#browse" className="px-5 py-3 border rounded-full">{t('browse')}</a>
            </div>
          </div>
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden border">
            <img src="/hero.jpg" alt="Hero" className="object-cover w-full h-full" />
          </div>
        </div>
      </section>

      <section id="browse" className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-semibold mb-4">Popular near you</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full text-gray-500">No listings yet.</div>
          ) : (
            listings.map((l: any) => <ListingCard key={l.id} listing={l} />)
          )}
        </div>
      </section>
    </div>
  )
}
