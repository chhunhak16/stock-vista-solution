import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouse } from '@/context/WarehouseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useWarehouse();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    // Update must_set_password in profiles
    if (currentUser) {
      await supabase.from('profiles').update({ must_set_password: false }).eq('user_id', currentUser.user_id);
    }
    setSuccess('Password updated! Redirecting...');
    setTimeout(() => navigate('/'), 1500);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="bg-card p-8 rounded shadow-md w-96 space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Set New Password</h2>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center">{success}</div>}
        <div>
          <label className="block mb-1">New Password</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Confirm Password</label>
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating...' : 'Set Password'}</Button>
      </form>
    </div>
  );
};

export default SetPasswordPage; 