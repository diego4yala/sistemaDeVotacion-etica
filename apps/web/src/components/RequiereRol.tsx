import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Cargando } from '@/components/Estados';
import { useAuth } from '@/lib/auth';
import type { Rol } from '@/lib/tipos';

export const inicioPorRol = (rol: Rol) => (rol === 'COORDINADOR' ? '/coord' : '/alumno');

export function RequiereRol({ rol }: { rol: Rol }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (usuario.rol !== rol) return <Navigate to={inicioPorRol(usuario.rol)} replace />;
  return <Outlet />;
}
