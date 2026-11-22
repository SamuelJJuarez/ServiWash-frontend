import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import RoleGuard from './components/auth/RoleGuard.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ClientesPage from './pages/ClientesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MaquinasPage from './pages/MaquinasPage.jsx';
import PosTicketPage from './pages/PosTicketPage.jsx';
import ServiciosPage from './pages/ServiciosPage.jsx';
import TicketsHistoryPage from './pages/TicketsHistoryPage.jsx';
import TurnosAdminPage from './pages/TurnosAdminPage.jsx';
import TurnosBoardPage from './pages/TurnosBoardPage.jsx';
import UsuariosAdminPage from './pages/UsuariosAdminPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tablero" element={<TurnosBoardPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="maquinas" element={<MaquinasPage />} />
          <Route path="servicios" element={<ServiciosPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="tickets/nuevo" element={<PosTicketPage />} />
          <Route path="tickets/historial" element={<TicketsHistoryPage />} />
          <Route path="turnos" element={<TurnosAdminPage />} />
          <Route
            path="usuarios"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <UsuariosAdminPage />
              </RoleGuard>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
