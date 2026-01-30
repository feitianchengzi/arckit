import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, LoadingView, ErrorView, TextField } from '@/components/ui'
import { useOrganizationList } from '@/hooks/useOrganizations'
import { organizationsApi } from '@/lib/api/endpoints/organizations'

export default function InviteOrganizationPage() {
  const navigate = useNavigate()
  const params = useParams()
  const organizationId = Number(params.id!)

  const { data: organizations, isLoading, error } = useOrganizationList()
  const organization = organizations?.find(org => org.id === organizationId)

  const createInvite = useMutation({
    mutationFn: (input: { organization_id: number; role: 'member' | 'admin'; expires_in: number; max_uses?: number }) =>
      organizationsApi.createInvite(input),
  })

  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [expiresInHours, setExpiresInHours] = useState('24')
  const [maxUses, setMaxUses] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  if (isLoading) {
    return <LoadingView size="lg" text="加载组织信息..." />
  }

  if (error || !organization) {
    return <ErrorView title="加载失败" message="无法获取组织信息" />
  }

  const handleGenerate = async () => {
    setErrorMessage('')
    setInviteCode('')
    setInviteLink('')

    try {
      const expiresIn = parseInt(expiresInHours) || 0
      const input: { organization_id: number; role: 'member' | 'admin'; expires_in: number; max_uses?: number } = {
        organization_id: organizationId,
        role,
        expires_in: expiresIn,
      }

      if (maxUses.trim() !== '') {
        const maxUsesNum = parseInt(maxUses)
        if (!isNaN(maxUsesNum) && maxUsesNum > 0) {
          input.max_uses = maxUsesNum
        }
      }

      const invitation = await createInvite.mutateAsync(input)

      setInviteCode(invitation.invite_code)

      if (invitation.invite_link && invitation.invite_link.startsWith('http')) {
        setInviteLink(invitation.invite_link)
      } else {
        const baseUrl = window.location.origin
        const basePath = import.meta.env.BASE_URL || '/workshop/'
        const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
        setInviteLink(`${baseUrl}${normalizedBasePath}/join-organization/${invitation.invite_code}`)
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || '生成邀请失败，请重试')
    }
  }

  const handleCopy = async (type: 'code' | 'link') => {
    const text = type === 'code' ? inviteCode : inviteLink

    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      alert('复制失败，请手动复制')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900"
        >
          <BackIcon className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">邀请组织成员</h1>
          <p className="mt-1 text-gray-600">组织：{organization.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            成员角色
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
            disabled={createInvite.isPending}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary"
          >
            <option value="member">成员</option>
            <option value="admin">管理员</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            过期时间（小时）
          </label>
          <select
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(e.target.value)}
            disabled={createInvite.isPending}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary"
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
            disabled={createInvite.isPending}
            fullWidth
          />
        </div>

        <Button
          variant="primary"
          onClick={handleGenerate}
          loading={createInvite.isPending}
          fullWidth
        >
          {createInvite.isPending ? '生成中...' : '生成邀请'}
        </Button>

        {errorMessage && (
          <div className="bg-error-light border border-error rounded-md p-3">
            <p className="text-sm text-error">{errorMessage}</p>
          </div>
        )}

        {inviteCode && (
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                邀请码
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCopy('code')}
                >
                  {copied === 'code' ? '已复制' : '复制'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                邀请链接
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCopy('link')}
                >
                  {copied === 'link' ? '已复制' : '复制'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}
