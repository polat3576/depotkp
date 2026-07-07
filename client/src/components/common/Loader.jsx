// Basit yükleniyor göstergesi.
export default function Loader({ label = 'Yükleniyor...' }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      <span className="ml-3 text-sm">{label}</span>
    </div>
  );
}
