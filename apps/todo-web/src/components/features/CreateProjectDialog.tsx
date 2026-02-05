import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useCreateProject } from '@/hooks/useProjects';
import { useOrganizationList } from '@/hooks/useOrganizations';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedOrganizationId?: number | null;
}

export function CreateProjectDialog({ open, onClose, onSuccess, selectedOrganizationId }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [error, setError] = useState('');
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const createProject = useCreateProject();
  const { data: organizations = [], isLoading: orgLoading } = useOrganizationList();
  
  useEffect(() => {
    if (typeof selectedOrganizationId === 'number') {
      setOrganizationId(selectedOrganizationId);
      return
    }
    if (organizations.length > 0) {
      setOrganizationId(organizations[0].id);
      return
    }
    setOrganizationId(null);
  }, [selectedOrganizationId, organizations.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 验证
    if (!name.trim()) {
      setError('请输入项目名称');
      return;
    }

    if (typeof organizationId !== 'number') {
      setError('请先选择组织');
      return;
    }
    
    if (!gitUrl.trim()) {
      setError('请输入 Git 地址');
      return;
    }
    
    // 简单的 URL 验证
    try {
      new URL(gitUrl);
    } catch {
      setError('请输入有效的 Git 地址');
      return;
    }
    
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        git_url: gitUrl.trim(),
        organization_id: organizationId,
      });
      
      setName('');
      setGitUrl('');
      setOrganizationId(typeof selectedOrganizationId === 'number' ? selectedOrganizationId : organizationId);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(err.response?.data?.message || '创建项目失败');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      title="新建项目"
    >
      <form onSubmit={handleSubmit} id="create-project-form">
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1">所属组织</label>
            {orgLoading ? (
              <div className="text-xs text-foreground-secondary">加载组织列表...</div>
            ) : (
              <select
                value={organizationId ?? ''}
                onChange={(e) => setOrganizationId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={createProject.isPending || organizations.length === 0}
              >
                {organizations.map((org: any) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            )}
          </div>
          
          <TextField
            label="项目名称 *"
            placeholder="例如：待办管理系统"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={createProject.isPending}
            helperText="项目的显示名称"
          />
          
          <TextField
            label="Git 地址 *"
            placeholder="https://github.com/username/repo"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            required
            disabled={createProject.isPending}
            helperText="项目的 Git 仓库地址"
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
            disabled={createProject.isPending}
          >
            取消
          </Button>
          <Button 
            type="submit" 
            form="create-project-form"
            loading={createProject.isPending}
            disabled={!name.trim() || !gitUrl.trim() || typeof organizationId !== 'number' || createProject.isPending}
          >
            创建
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
