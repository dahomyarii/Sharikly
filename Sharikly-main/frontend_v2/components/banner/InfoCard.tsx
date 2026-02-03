interface InfoCardProps {
  icon?: any;
  label: string;
  value: string;
  colorClass?: string;
}

export default function InfoCard({ 
  label, 
  value,
  colorClass = "from-blue-50 to-blue-100"
}: InfoCardProps) {
  return (
    <div className={`flex items-center gap-4 bg-gradient-to-r ${colorClass} rounded-2xl p-6 border border-gray-200 hover:border-amber-400 transition-all duration-300 hover:shadow-lg`}>
      <div className="flex-shrink-0 w-8 h-8 text-xl">
        {colorClass.includes('amber') ? '🎯' : '⏰'}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-600">{value}</p>
      </div>
    </div>
  )
}
