import { Routes, Route, Navigate } from "react-router-dom"
import { RequireAuth } from "./components/RequireAuth"
import { Shell } from "./components/Shell"
import { Dashboard } from "./pages/Dashboard"
import { Vehicles } from "./pages/Vehicles"
import { RegisterVehicle } from "./pages/RegisterVehicle"
import { VehicleDetail } from "./pages/VehicleDetail"
import { Rides } from "./pages/Rides"
import { RideDetail } from "./pages/RideDetail"
import { Reports } from "./pages/Reports"
import { ReportDetail } from "./pages/ReportDetail"
import { Print } from "./pages/Print"

export default function App() {
  return (
    <RequireAuth>
      <Routes>
        <Route path="/print" element={<Print />} />
        <Route
          path="/*"
          element={
            <Shell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/rides" element={<Rides />} />
                <Route path="/rides/:id" element={<RideDetail />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/:id" element={<ReportDetail />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/vehicles/new" element={<RegisterVehicle />} />
                <Route path="/vehicles/:id" element={<VehicleDetail />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Shell>
          }
        />
      </Routes>
    </RequireAuth>
  )
}
