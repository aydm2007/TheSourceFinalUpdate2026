import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient';

/**
 * Sovereign SaaS Super-Admin Dashboard (Monetized Edition)
 * Accessible ONLY via admin.agriasset.com
 */
const SaaSAdminDashboard = () => {
    const [tenants, setTenants] = useState([]);
    const [revenue, setRevenue] = useState(0);
    const [overdueAlerts, setOverdueAlerts] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated Fetching of Monetization Data
        setTimeout(() => {
            setTenants([
                { id: 1, name: 'Ministry of Agriculture - South', subdomain: 'moa-south', credit_limit: '50000.00', status: 'PAID' },
                { id: 2, name: 'AgriCorp Global', subdomain: 'agriglobal', credit_limit: '150000.00', status: 'OVERDUE' },
            ]);
            setRevenue(200000); // Aggregate Mock Revenue
            setOverdueAlerts(1); // 1 tenant overdue
            setLoading(false);
        }, 800);
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
            {/* Sovereign Overdue Alert Bar */}
            {overdueAlerts > 0 && (
                <div className="bg-red-600/90 border border-red-500 text-white px-6 py-3 rounded-lg mb-8 shadow-lg flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                        ⚠️ Sovereign Alert: {overdueAlerts} Institution(s) have overdue payments exceeding the grace period. 
                    </span>
                    <button className="bg-white text-red-600 px-4 py-1 rounded font-bold text-sm hover:bg-gray-100 transition-colors">
                        Review & Suspend
                    </button>
                </div>
            )}

            <header className="mb-10 flex justify-between items-center border-b border-gray-700 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        Sovereign Control Plane
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">Financial Operations & Tenant Management</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-2 rounded-lg font-semibold shadow-lg shadow-blue-500/30">
                    + Provision New Ministry
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl hover:border-emerald-500 transition-colors">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue (MRR)</h3>
                    <p className="text-3xl font-bold mt-2 text-emerald-400">${revenue.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl hover:border-blue-500 transition-colors">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Tenants</h3>
                    <p className="text-3xl font-bold mt-2 text-white">{tenants.length}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl hover:border-red-500 transition-colors">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Overdue Invoices</h3>
                    <p className="text-3xl font-bold mt-2 text-red-400">{overdueAlerts}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl hover:border-purple-500 transition-colors">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Storage Used</h3>
                    <p className="text-3xl font-bold mt-2 text-purple-400">4.2 TB</p>
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-gray-100">Institution Billing Status</h2>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-900 border-b border-gray-700 text-gray-300">
                            <th className="p-4 font-semibold">Institution Name</th>
                            <th className="p-4 font-semibold">Subdomain</th>
                            <th className="p-4 font-semibold">Credit Limit</th>
                            <th className="p-4 font-semibold">Billing Status</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map(tenant => (
                            <tr key={tenant.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                                <td className="p-4 font-medium">{tenant.name}</td>
                                <td className="p-4 text-blue-400">{tenant.subdomain}.agriasset.com</td>
                                <td className="p-4 text-emerald-400 font-mono">${tenant.credit_limit}</td>
                                <td className="p-4">
                                    {tenant.status === 'PAID' ? (
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">PAID</span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold animate-pulse">OVERDUE</span>
                                    )}
                                </td>
                                <td className="p-4 flex gap-3">
                                    <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
                                        View Invoice
                                    </button>
                                    <button className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
                                        Suspend
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SaaSAdminDashboard;
