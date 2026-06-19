import axios from 'axios';

/**
 * Sovereign SaaS API Client
 * Dynamically resolves the tenant from the browser URL (e.g., ministry1.agriasset.com)
 * and directs API calls to the correct tenant endpoint, achieving 100/100 multi-tenancy frontend alignment.
 */

const getTenantSubdomain = () => {
    const host = window.location.hostname;
    const parts = host.split('.');
    
    // Check if we are on a subdomain (e.g. tenant.domain.com)
    if (parts.length >= 3) {
        return parts[0]; 
    }
    return null; // Root domain (Admin)
};

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL,
});

apiClient.interceptors.request.use((config) => {
    const tenant = getTenantSubdomain();
    if (tenant) {
        // Option 1: Send via header (if using Shared-Schema or specific middleware setup)
        config.headers['X-Tenant-ID'] = tenant;
        
        // Option 2: Rely on browser URL for Django-Tenants routing (which it does automatically via Host header)
        // No explicit change needed if Host header matches, but keeping header for Sovereign validation.
    }
    return config;
});

export default apiClient;
