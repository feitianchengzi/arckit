/**
 * Token 调试工具
 * 用于诊断 Token 刷新机制的问题
 */

import { getAuthInfo } from '@/lib/utils/tokenManager'

export function debugTokenStatus() {
  const authInfo = getAuthInfo()
  
  if (!authInfo) {
    console.log('❌ 没有找到认证信息')
    return
  }
  
  const now = Date.now()
  
  // Access Token 信息
  const accessTokenExpiresAt = authInfo.tokenObtainedAt + (authInfo.tokenExpiresIn * 1000)
  const accessTokenRemaining = Math.max(0, accessTokenExpiresAt - now)
  const accessTokenRemainingMinutes = Math.floor(accessTokenRemaining / 1000 / 60)
  
  // Refresh Token 信息
  let refreshTokenExpiresAt = 0
  let refreshTokenRemaining = 0
  let refreshTokenRemainingDays = 0
  
  if (authInfo.refreshTokenObtainedAt && authInfo.refreshExpiresIn) {
    refreshTokenExpiresAt = authInfo.refreshTokenObtainedAt + (authInfo.refreshExpiresIn * 1000)
    refreshTokenRemaining = Math.max(0, refreshTokenExpiresAt - now)
    refreshTokenRemainingDays = Math.floor(refreshTokenRemaining / 1000 / 60 / 60 / 24)
  }
  
  console.log('==================== Token 状态诊断 ====================')
  console.log('\n📋 当前时间:')
  console.log(`  ${new Date(now).toLocaleString('zh-CN')}`)
  console.log(`  时间戳: ${now}`)
  
  console.log('\n🔑 Access Token:')
  console.log(`  获取时间: ${new Date(authInfo.tokenObtainedAt).toLocaleString('zh-CN')}`)
  console.log(`  获取时间戳: ${authInfo.tokenObtainedAt}`)
  console.log(`  有效期: ${authInfo.tokenExpiresIn} 秒 (${authInfo.tokenExpiresIn / 60 / 60} 小时)`)
  console.log(`  过期时间: ${new Date(accessTokenExpiresAt).toLocaleString('zh-CN')}`)
  console.log(`  过期时间戳: ${accessTokenExpiresAt}`)
  console.log(`  剩余时间: ${accessTokenRemainingMinutes} 分钟`)
  console.log(`  是否过期: ${accessTokenRemaining <= 0 ? '是 ❌' : '否 ✅'}`)
  
  console.log('\n🔄 Refresh Token:')
  if (authInfo.refreshTokenObtainedAt && authInfo.refreshExpiresIn) {
    console.log(`  获取时间: ${new Date(authInfo.refreshTokenObtainedAt).toLocaleString('zh-CN')}`)
    console.log(`  获取时间戳: ${authInfo.refreshTokenObtainedAt}`)
    console.log(`  有效期: ${authInfo.refreshExpiresIn} 秒 (${authInfo.refreshExpiresIn / 60 / 60 / 24} 天)`)
    console.log(`  过期时间: ${new Date(refreshTokenExpiresAt).toLocaleString('zh-CN')}`)
    console.log(`  过期时间戳: ${refreshTokenExpiresAt}`)
    console.log(`  剩余时间: ${refreshTokenRemainingDays} 天`)
    console.log(`  是否过期: ${refreshTokenRemaining <= 0 ? '是 ❌' : '否 ✅'}`)
  } else {
    console.log(`  ❌ 缺少 Refresh Token 时间信息！`)
    console.log(`  refreshTokenObtainedAt: ${authInfo.refreshTokenObtainedAt || '未定义'}`)
    console.log(`  refreshExpiresIn: ${authInfo.refreshExpiresIn || '未定义'}`)
  }
  
  console.log('\n📊 完整认证信息:')
  console.log(JSON.stringify(authInfo, null, 2))
  
  console.log('\n💡 诊断结果:')
  if (!authInfo.refreshTokenObtainedAt || !authInfo.refreshExpiresIn) {
    console.log('  ⚠️ 检测到旧格式的认证信息，缺少 Refresh Token 时间字段')
    console.log('  ⚠️ 这会导致每次 API 请求都跳转到登录页')
    console.log('  ⚠️ 建议：清除 localStorage 并重新登录')
  } else if (refreshTokenRemaining <= 0) {
    console.log('  ❌ Refresh Token 已过期，需要重新登录')
  } else if (accessTokenRemaining <= 0) {
    console.log('  ⚠️ Access Token 已过期，但 Refresh Token 仍有效')
    console.log('  ⚠️ 下次 API 请求时会自动刷新')
  } else {
    console.log('  ✅ Access Token 和 Refresh Token 都有效')
  }
  
  console.log('\n========================================================')
  
  return {
    accessTokenExpired: accessTokenRemaining <= 0,
    refreshTokenExpired: refreshTokenRemaining <= 0,
    hasRefreshTokenInfo: !!(authInfo.refreshTokenObtainedAt && authInfo.refreshExpiresIn),
    accessTokenRemainingMinutes,
    refreshTokenRemainingDays,
  }
}

/**
 * 模拟 Access Token 即将过期（用于测试刷新机制）
 * 将 tokenObtainedAt 修改为 2 小时前，这样 Access Token 会被判定为即将过期
 */
export function simulateTokenExpiring() {
  const authInfo = getAuthInfo()
  
  if (!authInfo) {
    console.log('❌ 没有找到认证信息，无法模拟')
    return
  }
  
  console.log('⚠️ 开始模拟 Access Token 即将过期...')
  console.log('原始 Access Token 获取时间:', new Date(authInfo.tokenObtainedAt).toLocaleString('zh-CN'))
  console.log('原始 Refresh Token 获取时间:', new Date(authInfo.refreshTokenObtainedAt).toLocaleString('zh-CN'))
  
  // 将 tokenObtainedAt 修改为 1 小时 56 分钟前（剩余 4 分钟，会触发刷新）
  const now = Date.now()
  const simulatedObtainedAt = now - (authInfo.tokenExpiresIn * 1000) + (4 * 60 * 1000)
  
  // 关键：只修改 Access Token 的时间，不修改 Refresh Token 的时间
  authInfo.tokenObtainedAt = simulatedObtainedAt
  // 保持 Refresh Token 的时间不变
  // authInfo.refreshTokenObtainedAt 保持原值
  
  localStorage.setItem('auth_info', JSON.stringify(authInfo))
  
  // 清除旧的流程日志
  localStorage.removeItem('token_flow_log')
  
  // 记录流程日志
  logFlow('🧪 测试：模拟 Token 即将过期', {
    accessTokenSimulated: new Date(simulatedObtainedAt).toLocaleString('zh-CN'),
    refreshTokenOriginal: new Date(authInfo.refreshTokenObtainedAt).toLocaleString('zh-CN'),
    remainingMinutes: 4
  })
  
  // 保存测试日志到 localStorage，即使页面跳转也能看到
  const testLog = {
    action: 'simulateTokenExpiring',
    timestamp: now,
    accessTokenSimulated: simulatedObtainedAt,
    refreshTokenOriginal: authInfo.refreshTokenObtainedAt,
    message: 'Access Token 已模拟为即将过期（剩余4分钟），Refresh Token 保持不变'
  }
  localStorage.setItem('token_test_log', JSON.stringify(testLog))
  
  console.log('%c✅ 已修改 Access Token 获取时间为:', 'color: green; font-weight: bold', new Date(simulatedObtainedAt).toLocaleString('zh-CN'))
  console.log('%c✅ Refresh Token 时间保持不变:', 'color: green; font-weight: bold', new Date(authInfo.refreshTokenObtainedAt).toLocaleString('zh-CN'))
  console.log('%c💡 现在 Access Token 剩余约 4 分钟', 'color: orange; font-weight: bold')
  console.log('%c💡 Refresh Token 仍然有效（剩余约 30 天）', 'color: blue; font-weight: bold')
  console.log('%c💡 下次发起 API 请求时会自动触发刷新！', 'color: purple; font-weight: bold')
  console.log('')
  console.log('%c📝 测试步骤：', 'color: blue; font-size: 14px; font-weight: bold')
  console.log('1. 点击任何需要认证的操作（如查看项目列表、刷新页面）')
  console.log('2. 观察控制台输出，应该看到：')
  console.log('   🔄 请求拦截器：检测到 Access Token 即将过期，开始刷新')
  console.log('   ✅ 请求拦截器：Token 刷新成功')
  console.log('3. 运行 window.getFlowLog() 查看完整流程日志')
}

/**
 * 恢复正常的 token 时间（如果测试后想恢复）
 */
export function resetTokenTime() {
  console.log('🔄 正在重置 token 时间...')
  console.log('💡 建议：刷新页面或重新登录以获得正常的 token')
  
  // 清除并提示重新登录
  localStorage.removeItem('auth_info')
  console.log('✅ 已清除认证信息，请重新登录')
}

/**
 * 获取测试日志（即使页面跳转后也能看到）
 */
export function getTestLog() {
  const log = localStorage.getItem('token_test_log')
  const errorLog = localStorage.getItem('token_error_log')
  
  console.group('📋 Token 测试日志')
  
  if (log) {
    console.log('🧪 测试操作:')
    console.log(JSON.parse(log))
  } else {
    console.log('没有找到测试日志')
  }
  
  if (errorLog) {
    console.log('\n❌ 错误日志:')
    console.log(JSON.parse(errorLog))
  } else {
    console.log('\n没有错误日志')
  }
  
  console.groupEnd()
  
  return {
    testLog: log ? JSON.parse(log) : null,
    errorLog: errorLog ? JSON.parse(errorLog) : null
  }
}

/**
 * 清除测试日志
 */
export function clearTestLog() {
  localStorage.removeItem('token_test_log')
  localStorage.removeItem('token_error_log')
  localStorage.removeItem('token_flow_log')
  console.log('✅ 测试日志已清除')
}

/**
 * 记录流程日志（用于追踪整个 token 刷新和请求流程）
 */
export function logFlow(step: string, data?: any) {
  const timestamp = Date.now()
  const logEntry = {
    step,
    timestamp,
    time: new Date(timestamp).toLocaleTimeString('zh-CN'),
    data
  }
  
  // 获取现有日志
  const existingLog = localStorage.getItem('token_flow_log')
  const logs = existingLog ? JSON.parse(existingLog) : []
  
  // 添加新日志
  logs.push(logEntry)
  
  // 只保留最近 50 条
  if (logs.length > 50) {
    logs.shift()
  }
  
  // 保存
  localStorage.setItem('token_flow_log', JSON.stringify(logs))
  
  // 同时在控制台打印
  console.log(`📝 [${logEntry.time}] ${step}`, data || '')
}

/**
 * 获取完整流程日志
 */
export function getFlowLog() {
  const log = localStorage.getItem('token_flow_log')
  if (!log) {
    console.log('📋 没有流程日志')
    return []
  }
  
  const logs = JSON.parse(log)
  console.group('📋 完整流程日志')
  logs.forEach((entry: any, index: number) => {
    console.log(`${index + 1}. [${entry.time}] ${entry.step}`, entry.data || '')
  })
  console.groupEnd()
  
  return logs
}

// 挂载到 window 对象，方便在浏览器控制台调用
if (typeof window !== 'undefined') {
  (window as any).debugToken = debugTokenStatus;
  (window as any).simulateTokenExpiring = simulateTokenExpiring;
  (window as any).resetTokenTime = resetTokenTime;
  (window as any).getTestLog = getTestLog;
  (window as any).clearTestLog = clearTestLog;
  (window as any).logFlow = logFlow;
  (window as any).getFlowLog = getFlowLog
}

