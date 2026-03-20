interface BadgeProps {
  category: string;
}

// Colors mapped to the tag values used in the database
const colorMap: Record<string, string> = {
  Discussion: "bg-blue-100 text-blue-700",
  Tips: "bg-purple-100 text-purple-700",
  Career: "bg-green-100 text-green-700",
  "Show HN": "bg-orange-100 text-orange-700",
  News: "bg-cyan-100 text-cyan-700",
  Help: "bg-yellow-100 text-yellow-700",
};

export default function Badge({ category }: BadgeProps) {
  const colorClass = colorMap[category] ?? "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {category}
    </span>
  );
}
