/*
Copyright (C) 2023-2026 QuantumNous
*/
import {
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  UserCog,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type SidebarData } from '@/components/layout/types'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

export function useSidebarData(): SidebarData {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.auth.user?.role ?? ROLE.GUEST)
  const isAdmin = role >= ROLE.ADMIN

  const navGroups: SidebarData['navGroups'] = [
    {
      id: 'workspace',
      title: t('nav.workspace', { defaultValue: '工作台' }),
      items: [
        {
          title: t('nav.dashboard'),
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: t('nav.accounts'),
          url: '/accounts',
          icon: Users,
        },
      ],
    },
    {
      id: 'integration',
      title: t('nav.integration', { defaultValue: '集成' }),
      items: [
        {
          title: t('nav.apiKeys'),
          url: '/apikeys',
          icon: KeyRound,
        },
      ],
    },
  ]

  if (isAdmin) {
    navGroups.push({
      id: 'management',
      title: t('nav.management', { defaultValue: '管理' }),
      items: [
        {
          title: t('nav.users', { defaultValue: '用户管理' }),
          url: '/users',
          icon: UserCog,
        },
        {
          title: t('nav.logs'),
          url: '/logs',
          icon: ScrollText,
        },
        {
          title: t('nav.settings'),
          url: '/settings',
          icon: Settings,
        },
      ],
    })
  }

  return { navGroups }
}
