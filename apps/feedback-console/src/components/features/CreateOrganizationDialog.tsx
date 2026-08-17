import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { organizationsApi } from '@/lib/api/endpoints/organizations';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateOrganizationDialog({ open, onClose, onSuccess }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await organizationsApi.create({
        name: name.trim(),
        description: description.trim()
      });
      
      setName('');
      setDescription('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      setError(err.message || '创建组织失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      title="新建组织"
    >
      <form onSubmit={handleSubmit} id="create-organization-form">
        <div className="space-y-4 py-4">
          <TextField
            label="组织名称 *"
            placeholder="输入组织名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
          
          <TextField
            label="组织描述"
            placeholder="输入组织描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t border-divider">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button 
            type="submit" 
            form="create-organization-form"
            loading={loading}
            disabled={!name.trim()}
          >
            创建
          </Button>
        </div>
      </form>
    </Dialog>
  );
}