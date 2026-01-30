// src/components/ResultsDisplay.tsx

type CalculationResults = { [key: string]: { value: number | string; label: string } };

export default function ResultsDisplay({ results }: { results: CalculationResults | null }) {
  if (!results) return null;
  
  return (
    <div className="space-y-3 pt-4 border-t border-gray-600 mt-4 animate-fade-in">
        {Object.entries(results).map(([key, item]) => (
            <div key={key} className="flex items-center">
                <label className="w-48 text-left mr-4 font-bold text-gray-300">
                    {item.label}
                </label>
                <p className="font-mono text-white text-lg">
                    {typeof item.value === 'number' 
                        ? item.value.toLocaleString(undefined, { maximumFractionDigits: 6 }) 
                        : item.value}
                </p>
            </div>
        ))}
    </div>
  );
}