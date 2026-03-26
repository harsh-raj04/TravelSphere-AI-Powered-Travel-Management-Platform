import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function PlanTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destination: '',
    fromDate: '',
    travelers: 2,
    budget: '',
  });

  const onSubmit = (e) => {
    e.preventDefault();
    navigate('/discover');
  };

  return (
    <div className="py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary">Plan a Trip</h1>
      <Card variant="premium" className="p-6">
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
          <Input label="Destination" placeholder="e.g. Manali" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <Input type="date" label="Travel Date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
          <Input type="number" label="Travelers" value={form.travelers} onChange={(e) => setForm({ ...form, travelers: e.target.value })} />
          <Input type="number" label="Budget (₹)" placeholder="50000" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>Cancel</Button>
            <Button type="submit">Find Packages</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
