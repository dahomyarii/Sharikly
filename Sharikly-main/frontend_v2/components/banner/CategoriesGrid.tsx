import Link from 'next/link';

interface CategoriesGridProps {
  categories: Array<{ id: number; name: string }>;
  getCategoryEmoji: (categoryName: string) => string;
}

export default function CategoriesGrid({ categories, getCategoryEmoji }: CategoriesGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories?.slice(0, 4).map((category: any) => (
        <Link
          key={category.id}
          href={`/listings?category=${category.id}`}
          className="group flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-amber-400 hover:shadow-lg hover:bg-amber-50 transition-all duration-300"
        >
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center group-hover:from-amber-200 group-hover:to-orange-200 transition-colors">
            <span className="text-xl">{getCategoryEmoji(category.name)}</span>
          </div>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-600 transition-colors">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  )
}
