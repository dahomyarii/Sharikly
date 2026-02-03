import { Search } from 'lucide-react';

interface SearchSectionProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export default function SearchSection({ 
  onSearch,
  placeholder = "Search by item, location..."
}: SearchSectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-lg font-bold text-gray-900">
        What are you looking for?
      </label>
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
        <div className="relative flex items-center bg-white rounded-3xl shadow-lg border-2 border-gray-200 group-focus-within:border-amber-400 transition duration-300 overflow-hidden hover:border-gray-300 hover:shadow-xl">
          <Search className="absolute left-6 h-6 w-6 text-gray-400" />
          <input
            aria-label="Search listings"
            type="search"
            placeholder={placeholder}
            onChange={(e) => onSearch?.(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const query = (e.target as HTMLInputElement).value
                if (query) {
                  window.location.href = `/listings?q=${encodeURIComponent(query)}`
                }
              }
            }}
            className="w-full pl-16 pr-6 py-4 text-gray-800 placeholder-gray-400 text-base focus:outline-none bg-transparent"
          />
        </div>
      </div>
    </div>
  )
}
