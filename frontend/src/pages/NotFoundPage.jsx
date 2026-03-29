import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, #0d1f3c 0%, #080810 65%)' }}>
      <div className="text-center">
        <p className="font-syne font-extrabold text-[8rem] leading-none text-white/5 select-none">404</p>
        <p className="font-syne font-bold text-2xl -mt-8 mb-3">Page not found</p>
        <p className="text-muted text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-ghost">Go Back</button>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">Dashboard</button>
        </div>
      </div>
    </div>
  )
}
