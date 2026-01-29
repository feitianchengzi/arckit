import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useCreateProject } from '@/hooks/useProjects';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProjectDialog({ open, onClose, onSuccess }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [error, setError] = useState('');
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 验证
    if (!name.trim()) {
      setError('请输入项目名称');
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
      });
      
      setName('');
      setGitUrl('');
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
            disabled={!name.trim() || !gitUrl.trim() || createProject.isPending}
          >
            创建
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
