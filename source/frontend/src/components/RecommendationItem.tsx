export function RecommendationItem({title, description}:{title: string, description: string}){
  return (
    <div className="px-4 py-3 rounded-2xl space-y-2 text-quaternary bg-[#EBF3F4]/40">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  );
}