/*
Copyright (C) 2023-2026 QuantumNous
*/
import {
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  UserCog,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type SidebarData } from '@/components/layout/types'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

export function useSidebarData(): SidebarData {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.auth.user?.role ?? ROLE.GUEST)
  const isAdmin = role >= ROLE.ADMIN

  const generalItems = [
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
    {
      title: t('nav.apiKeys'),
      url: '/apikeys',
      icon: KeyRound,
    },
  ]

  if (isAdmin) {
    generalItems.push({
      title: t('nav.logs'),
      url: '/logs',
      icon: ScrollText,
    })
  }

  const navGroups: SidebarData['navGroups'] = [
    {
      id: 'general',
      title: t('General'),
      items: generalItems,
    },
  ]

  if (isAdmin) {
    navGroups.push({
      id: 'admin',
      title: t('Admin'),
      items: [
        {
          title: t('nav.users', { defaultValue: '用户管理' }),
          url: '/users',
          icon: UserCog,
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
