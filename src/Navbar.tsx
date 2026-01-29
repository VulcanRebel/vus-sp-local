// src/Navbar.tsx
export default function Navbar() {
  return (
    <div className="flex justify-between items-center p-4 text-white bg-gray-900 border-b border-gray-700">
      <div className="text-left flex items-center">
        {/* Placeholder */}
        <a href="#" onClick={(e) => e.preventDefault()} className="mr-4 hover:text-blue-400 text-sm">
          Info
        </a>

        {/* Main Link */}
        <a href="/" className="ml-4 mr-4 font-bold text-blue-400 hover:text-blue-300 text-lg">
          Standard Procedures
        </a>

        {/* Placeholder */}
        <a href="#" onClick={(e) => e.preventDefault()} className="ml-4 mr-4 hover:text-blue-400 text-sm">
          Resources
        </a>
      </div>

      {/* Local Mode Badge */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span className="text-xs font-mono text-gray-400 uppercase tracking-widest border border-gray-600 px-2 py-1 rounded">
          Local System
        </span>
      </div>
    </div>
  );
}