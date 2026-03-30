import { useState } from 'react';
import { User, Bell, Shield, Palette, Globe } from 'lucide-react';

export function AdminSettings() {
  const [settings, setSettings] = useState({
    companyName: 'TravelSphere',
    email: 'admin@travelsphere.com',
    phone: '+91 90000 00000',
    address: 'Mumbai, India',
    emailNotifications: true,
    pushNotifications: true,
    bookingAlerts: true,
    paymentAlerts: true,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en',
  });

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your admin panel preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500 text-white rounded-lg mb-1"><User className="w-5 h-5" /><span className="font-medium">General</span></button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg mb-1"><Bell className="w-5 h-5" /><span className="font-medium">Notifications</span></button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg mb-1"><Shield className="w-5 h-5" /><span className="font-medium">Security</span></button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg mb-1"><Palette className="w-5 h-5" /><span className="font-medium">Appearance</span></button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"><Globe className="w-5 h-5" /><span className="font-medium">Localization</span></button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">General Settings</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label><input type="text" value={settings.companyName} onChange={(e) => handleChange('companyName', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Email</label><input type="email" value={settings.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label><input type="tel" value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Address</label><textarea value={settings.address} onChange={(e) => handleChange('address', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none" /></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Localization</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label><select value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"><option value="INR">INR - Indian Rupee</option><option value="USD">USD - US Dollar</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label><select value={settings.timezone} onChange={(e) => handleChange('timezone', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"><option value="Asia/Kolkata">Asia/Kolkata</option><option value="America/Los_Angeles">America/Los_Angeles</option></select></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
