import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useOrganizationMembers } from '@/hooks/useOrganizations';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingView } from '@/components/ui/LoadingView';
import { ErrorView } from '@/components/ui/ErrorView';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/TextField';
import { organizationsApi } from '@/lib/api/endpoints/organizations';

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const organizationId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // 状态管理
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [maxUses, setMaxUses] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteError, setInviteError] = useState('');
  
  // 获取组织成员列表
  const {
    data: members,
    isLoading: isLoadingMembers,
    error: errorMembers
  } = useOrganizationMembers(organizationId);
  
  // 获取组织详情
  const { data: organizations, isLoading: isLoadingOrg, error: errorOrg } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsApi.list(false),
    staleTime: 5 * 60 * 1000
  });
  
  // 找到当前组织
  const organization = organizations?.find(org => org.id === organizationId);

  useEffect(() => {
    if (showEditDialog) {
      setEditName(organization?.name || '');
      setEditDescription(organization?.description || '');
    }
  }, [showEditDialog, organization?.name, organization?.description]);
  
  // 生成邀请码的mutation
  const createInviteMutation = useMutation({
    mutationFn: (input: { organization_id: number; role: 'member' | 'admin'; expires_in?: number; max_uses?: number }) => 
      organizationsApi.createInvite(input),
    onSuccess: (data) => {
      setInviteCode(data.invite_code);
      if (data.invite_link && data.invite_link.startsWith('http')) {
        setInviteLink(data.invite_link);
      } else {
        const baseUrl = window.location.origin;
        const basePath = import.meta.env.BASE_URL || '/workshop/';
        const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
        setInviteLink(`${baseUrl}${normalizedBasePath}/join-organization/${data.invite_code}`);
      }
      setInviteError('');
    },
    onError: (err: any) => {
      setInviteError(err.message || '生成邀请码失败');
    }
  });
  
  // 更新组织的mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: (input: { id: number; name: string; description?: string }) => 
      organizationsApi.update(input),
    onSuccess: () => {
      // 更新成功后刷新组织列表
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setShowEditDialog(false);
    },
    onError: (err: any) => {
      console.error('更新组织失败:', err);
    }
  });
  
  // 删除组织的mutation
  const deleteOrganizationMutation = useMutation({
    mutationFn: (orgId: number) => organizationsApi.delete(orgId),
    onSuccess: () => {
      // 删除成功后，使组织列表查询失效并导航到组织列表页面
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      navigate('/organizations');
    },
    onError: (err: any) => {
      console.error('删除组织失败:', err);
    }
  });
  
  // 处理生成邀请码
  const handleGenerateInvite = async () => {
    setInviteError('');
    setInviteCode('');
    setInviteLink('');
    const expiresIn = parseInt(expiresInHours) || 0;
    const input: { organization_id: number; role: 'member' | 'admin'; expires_in: number; max_uses?: number } = {
      organization_id: organizationId,
      role: inviteRole,
      expires_in: expiresIn
    };
    if (maxUses.trim() !== '') {
      const maxUsesNum = parseInt(maxUses);
      if (!isNaN(maxUsesNum) && maxUsesNum > 0) {
        input.max_uses = maxUsesNum;
      }
    }
    await createInviteMutation.mutateAsync({
      ...input
    });
  };
  
  // 处理删除组织
  const handleDeleteOrganization = async () => {
    await deleteOrganizationMutation.mutateAsync(organizationId);
  };

  if (errorMembers || errorOrg) {
    const errorMessage = errorMembers ? (errorMembers instanceof Error ? errorMembers.message : String(errorMembers)) : 
                        (errorOrg instanceof Error ? errorOrg.message : String(errorOrg));
    return <ErrorView message={errorMessage} />;
  }
  
  if (isLoadingMembers || isLoadingOrg) {
    return <LoadingView />;
  }

  return (
    <div className="p-6">
      <Card>
        <Card.Header className="flex items-center justify-between">
          <Card.Title className="text-2xl font-bold text-primary">组织详情</Card.Title>
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowEditDialog(true)}
              title="编辑组织"
              className="text-foreground-secondary"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              title="删除组织"
              className="text-red-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="mb-6">
            <p className="text-foreground-secondary">{organization?.description || '暂无描述，点击编辑按钮添加组织描述'}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium">组织成员</h3>
              <button
                onClick={() => setShowInviteDialog(true)}
                className="flex items-center justify-center p-2 rounded-md transition-colors text-foreground hover:bg-surface-hover"
                title="新增成员"
                aria-label="新增成员"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {members && members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar user={{ id: member.user_id, username: member.username, avatar: member.avatar }} size="sm" />
                    <div>
                      <p className="font-medium">{member.username}</p>
                      <p className="text-sm text-foreground-secondary capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground-secondary">暂无成员</p>
            )}
          </div>
        </Card.Content>
      </Card>
      
      {/* 邀请成员对话框 */}
      <Dialog 
        open={showInviteDialog} 
        onClose={() => setShowInviteDialog(false)}
        title="邀请成员"
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              成员角色
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
              disabled={createInviteMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:border-primary focus:ring-2 focus:ring-primary"
            >
              <option value="member">成员</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              过期时间（小时）
            </label>
            <select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              disabled={createInviteMutation.isPending}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:border-primary focus:ring-2 focus:ring-primary"
            >
              <option value="1">1 小时</option>
              <option value="6">6 小时</option>
              <option value="24">24 小时</option>
              <option value="72">3 天</option>
              <option value="168">7 天</option>
              <option value="0">永不过期</option>
            </select>
          </div>

          <div className="space-y-2">
            <TextField
              id="maxUses"
              label="邀请人数（可选）"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="留空则默认1人"
              helperText="不填写则默认1人，填写后该邀请码可被指定次数的人使用"
              disabled={createInviteMutation.isPending}
              fullWidth
            />
          </div>
          
          <Button 
            variant="primary" 
            onClick={handleGenerateInvite}
            loading={createInviteMutation.isPending}
            disabled={createInviteMutation.isPending}
            fullWidth
            size="sm"
          >
            生成邀请码
          </Button>
          
          {(inviteCode || inviteLink) && (
            <div className="space-y-3 pt-4 border-t border-divider">
              {inviteCode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    邀请码
                  </label>
                  <div className="flex gap-2 items-center min-w-0">
                    <input
                      type="text"
                      value={inviteCode}
                      readOnly
                      disabled
                      className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-md bg-surface-disabled font-mono text-foreground-secondary cursor-not-allowed"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(inviteCode)}
                    >
                      复制
                    </Button>
                  </div>
                </div>
              )}
              
              {inviteLink && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    邀请链接
                  </label>
                  <div className="flex gap-2 items-center min-w-0">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      disabled
                      className="flex-1 min-w-0 px-3 py-2 text-sm border border-border rounded-md bg-surface-disabled text-foreground-secondary cursor-not-allowed truncate"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(inviteLink)}
                    >
                      复制
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {inviteError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{inviteError}</p>
            </div>
          )}
        </div>
      </Dialog>
      
      {/* 编辑组织对话框 */}
      <Dialog 
        open={showEditDialog} 
        onClose={() => setShowEditDialog(false)}
        title="编辑组织"
      >
        <div className="space-y-4 py-4">
          <TextField 
            label="组织名称" 
            value={editName} 
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
          />
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-foreground">组织描述</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="px-3 py-2 text-base border rounded-md transition-colors bg-surface-elevated text-foreground placeholder:text-foreground-tertiary border-border focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            />
            <p className="text-sm text-foreground-secondary">添加组织描述</p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditDialog(false)}
            >
              取消
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                // 保存组织信息
                updateOrganizationMutation.mutate({
                  id: organizationId,
                  name: editName,
                  description: editDescription
                });
              }}
              loading={updateOrganizationMutation.isPending}
              disabled={updateOrganizationMutation.isPending}
            >
              保存
            </Button>
          </div>
        </div>
      </Dialog>
      
      {/* 删除组织对话框 */}
      <Dialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)}
        title="删除组织"
      >
        <div className="space-y-4 py-4">
          <p className="text-foreground-secondary">
            确定要删除此组织吗？此操作不可撤销，会删除组织下的所有项目和数据。
          </p>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteOrganizationMutation.isPending}
            >
              取消
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteOrganization}
              loading={deleteOrganizationMutation.isPending}
              disabled={deleteOrganizationMutation.isPending}
            >
              确认删除
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
