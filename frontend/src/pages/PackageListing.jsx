import { useState, useEffect } from 'react';
import { packagesAPI } from '../services/api';
import './PackageListing.css';

export function PackageListing() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ destination: '', page: 1 });

  useEffect(() => {
    loadPackages();
  }, [filters.page]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await packagesAPI.list(filters);
      setPackages(res.data.data.items);
    } catch (err) {
      console.error('Failed to load packages', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="packages-container">
      <h1>Explore Travel Packages</h1>
      {loading ? (
        <p>Loading packages...</p>
      ) : packages.length === 0 ? (
        <p>No packages found</p>
      ) : (
        <div className="packages-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className="package-card">
              <h3>{pkg.title}</h3>
              <p>{pkg.destination}</p>
              <p className="duration">{pkg.durationDays} days</p>
              <p className="price">₹{pkg.price}</p>
              <p className="description">{pkg.description}</p>
              <button className="book-btn">View Details</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
