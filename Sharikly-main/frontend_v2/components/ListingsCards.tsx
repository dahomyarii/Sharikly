'use client'

import SharedListingCard from './ListingCard'

interface ListingCardProps {
  listing: any
}

export default function ListingCard({ listing }: ListingCardProps) {
  return <SharedListingCard listing={listing} />
}
