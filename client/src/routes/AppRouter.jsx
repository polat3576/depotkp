import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute.jsx';
import Layout from '../components/layout/Layout.jsx';
import LoginPage from '../pages/Login/LoginPage.jsx';
import RegisterPage from '../pages/Register/RegisterPage.jsx';
import DashboardPage from '../pages/Dashboard/DashboardPage.jsx';
import ProductsPage from '../pages/Products/ProductsPage.jsx';
import ProductFormPage from '../pages/Products/ProductFormPage.jsx';
import StockEntryPage from '../pages/StockEntry/StockEntryPage.jsx';
import InventoryPage from '../pages/Inventory/InventoryPage.jsx';
import ReportsPage from '../pages/Reports/ReportsPage.jsx';
import SuppliersPage from '../pages/Suppliers/SuppliersPage.jsx';
import UsersPage from '../pages/Users/UsersPage.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Korumalı alan: Layout içinde sayfalar */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/stock" element={<StockEntryPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
