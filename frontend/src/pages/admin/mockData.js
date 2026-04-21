export const mockBookings = [
  {
    id: 'BK001', customerName: 'Sarah Johnson', customerId: 'CU001', packageName: 'Paris Romance Package',
    packageId: 'PK001', agentId: 'AG001', agentName: 'Michael Chen', status: 'confirmed', date: '2026-04-15', amount: 2499,
    destination: 'Paris, France', travelers: 2,
  },
  {
    id: 'BK002', customerName: 'David Martinez', customerId: 'CU002', packageName: 'Tokyo Adventure',
    packageId: 'PK002', agentId: 'AG002', agentName: 'Emily Watson', status: 'pending', date: '2026-05-20', amount: 3299,
    destination: 'Tokyo, Japan', travelers: 1,
  },
  {
    id: 'BK003', customerName: 'Emma Williams', customerId: 'CU003', packageName: 'Bali Beach Retreat',
    packageId: 'PK003', agentId: null, agentName: null, status: 'pending', date: '2026-06-10', amount: 1899,
    destination: 'Bali, Indonesia', travelers: 3,
  },
  {
    id: 'BK004', customerName: 'James Brown', customerId: 'CU004', packageName: 'Swiss Alps Skiing',
    packageId: 'PK004', agentId: 'AG001', agentName: 'Michael Chen', status: 'confirmed', date: '2026-04-25', amount: 4199,
    destination: 'Swiss Alps', travelers: 4,
  },
  {
    id: 'BK005', customerName: 'Olivia Davis', customerId: 'CU005', packageName: 'Maldives Luxury',
    packageId: 'PK005', agentId: 'AG003', agentName: 'Sophia Lee', status: 'completed', date: '2026-03-10', amount: 5999,
    destination: 'Maldives', travelers: 2,
  },
];

export const mockPackages = [
  { id: 'PK001', name: 'Paris Romance Package', destination: 'Paris, France', duration: '7 Days / 6 Nights', price: 2499, featured: true, active: true, bookingsCount: 47, rating: 4.8 },
  { id: 'PK002', name: 'Tokyo Adventure', destination: 'Tokyo, Japan', duration: '10 Days / 9 Nights', price: 3299, featured: true, active: true, bookingsCount: 38, rating: 4.9 },
  { id: 'PK003', name: 'Bali Beach Retreat', destination: 'Bali, Indonesia', duration: '5 Days / 4 Nights', price: 1899, featured: false, active: true, bookingsCount: 62, rating: 4.7 },
  { id: 'PK004', name: 'Swiss Alps Skiing', destination: 'Swiss Alps', duration: '8 Days / 7 Nights', price: 4199, featured: true, active: true, bookingsCount: 29, rating: 4.9 },
];

export const mockAgents = [
  { id: 'AG001', name: 'Michael Chen', email: 'michael.chen@travelsphere.com', phone: '+1 (555) 123-4567', status: 'active', packagesCount: 8, bookingsHandled: 127, revenue: 284300, rating: 4.9 },
  { id: 'AG002', name: 'Emily Watson', email: 'emily.watson@travelsphere.com', phone: '+1 (555) 234-5678', status: 'active', packagesCount: 6, bookingsHandled: 98, revenue: 201500, rating: 4.8 },
  { id: 'AG003', name: 'Sophia Lee', email: 'sophia.lee@travelsphere.com', phone: '+1 (555) 345-6789', status: 'pending', packagesCount: 3, bookingsHandled: 43, revenue: 96500, rating: 4.6 },
];

export const mockCustomers = [
  { id: 'CU001', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1 555-0101', totalBookings: 4, totalSpent: 10999, status: 'active', joinedDate: '2025-05-10' },
  { id: 'CU002', name: 'David Martinez', email: 'david@example.com', phone: '+1 555-0102', totalBookings: 3, totalSpent: 7599, status: 'active', joinedDate: '2025-08-03' },
  { id: 'CU003', name: 'Emma Williams', email: 'emma@example.com', phone: '+1 555-0103', totalBookings: 1, totalSpent: 1899, status: 'inactive', joinedDate: '2026-01-22' },
];

export const mockPayments = [
  { id: 'TXN001', bookingId: 'BK001', customerName: 'Sarah Johnson', amount: 2499, status: 'completed', method: 'Card', date: '2026-03-01' },
  { id: 'TXN002', bookingId: 'BK002', customerName: 'David Martinez', amount: 3299, status: 'pending', method: 'UPI', date: '2026-03-05' },
  { id: 'TXN003', bookingId: 'BK003', customerName: 'Emma Williams', amount: 1899, status: 'failed', method: 'Card', date: '2026-03-06' },
  { id: 'TXN004', bookingId: 'BK004', customerName: 'James Brown', amount: 4199, status: 'refunded', method: 'NetBanking', date: '2026-03-08' },
];

export const mockTickets = [
  { id: 'TKT001', customerName: 'Sarah Johnson', subject: 'Need date change', priority: 'high', status: 'open', assignedTo: null, createdAt: '2026-03-10' },
  { id: 'TKT002', customerName: 'David Martinez', subject: 'Payment confirmation delay', priority: 'urgent', status: 'in-progress', assignedTo: 'Michael Chen', createdAt: '2026-03-11' },
  { id: 'TKT003', customerName: 'Emma Williams', subject: 'Invoice request', priority: 'low', status: 'resolved', assignedTo: 'Emily Watson', createdAt: '2026-03-09' },
];

export const revenueData = [
  { month: 'Jan', revenue: 156000, bookings: 45 },
  { month: 'Feb', revenue: 189000, bookings: 52 },
  { month: 'Mar', revenue: 212000, bookings: 61 },
  { month: 'Apr', revenue: 247000, bookings: 68 },
  { month: 'May', revenue: 221000, bookings: 58 },
  { month: 'Jun', revenue: 266000, bookings: 74 },
];

export const packagePopularityData = [
  { name: 'Bali', bookings: 62 },
  { name: 'Paris', bookings: 47 },
  { name: 'Tokyo', bookings: 38 },
  { name: 'Swiss Alps', bookings: 29 },
];

export const agentPerformanceData = [
  { name: 'Michael', revenue: 284300, bookings: 127 },
  { name: 'Emily', revenue: 201500, bookings: 98 },
  { name: 'Sophia', revenue: 96500, bookings: 43 },
];
