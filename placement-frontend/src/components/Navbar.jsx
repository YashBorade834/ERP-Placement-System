export default function Navbar({ user }) {
  return (
    <div className="h-16 bg-white shadow flex items-center justify-between px-6">

      {/* 🔷 LEFT */}
      <h2 className="text-lg font-semibold text-gray-700">
        Placement & Alumni System
      </h2>

      {/* 🔷 RIGHT */}
      <div className="flex items-center gap-4">
        
        <span className="text-gray-600">
          {user.name} ({user.role})
        </span>

        <button className="bg-purple-600 text-white px-3 py-1 rounded">
          Logout
        </button>

      </div>
    </div>
  );
}