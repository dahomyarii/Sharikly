import Link from "next/link";
import { Search, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button"

interface CTAButtonsProps {
  browseLinkHref?: string;
  listLinkHref?: string;
}

export default function CTAButtons({ 
  browseLinkHref = "/listings",
  listLinkHref = "/listings/new"
}: CTAButtonsProps) {
  return (
    <div className="space-y-3">
      <Link href={browseLinkHref}>
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg rounded-3xl py-5 shadow-lg hover:shadow-2xl transition-all duration-300">
          <Search className="h-5 w-5 mr-3" />
          Browse All Listings
        </Button>
      </Link>

      <Link href={listLinkHref}>
        <button className="w-full border-2 border-gray-400 text-gray-800 font-bold text-lg rounded-3xl py-5 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700 transition-all duration-300">
          <Plus className="h-5 w-5 mr-2 inline" />
          List an Item to Rent
        </button>
      </Link>
    </div>
  )
}
