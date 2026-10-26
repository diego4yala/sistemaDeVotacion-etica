import { GraduationCap, LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export interface EnlaceNav {
  a: string;
  texto: string;
  fin?: boolean;
}

export function Layout({ enlaces, rolTexto, children }: { enlaces: EnlaceNav[]; rolTexto: string; children?: React.ReactNode }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-6">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <GraduationCap className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Electivos INF · PUCP</span>
          </div>
          <nav className="flex flex-1 gap-1 overflow-x-auto" aria-label="Navegación principal">
            {enlaces.map((e) => (
              <NavLink
                key={e.a}
                to={e.a}
                end={e.fin}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    isActive && 'bg-accent text-foreground',
                  )
                }
              >
                {e.texto}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight md:block">
              <div className="text-sm font-medium">{usuario ? `${usuario.nombres} ${usuario.apellidos}` : ''}</div>
              <div className="text-xs text-muted-foreground">
                {rolTexto} · {usuario?.codigo}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-8">
        {children}
        <Outlet />
      </main>
    </div>
  );
}
