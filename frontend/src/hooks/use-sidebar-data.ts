/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import {
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type SidebarData } from '@/components/layout/types'

/**
 * Root navigation groups for MicrosoftAltManager admin console.
 */
export function useSidebarData(): SidebarData {
  const { t } = useTranslation()

  return {
    navGroups: [
      {
        id: 'general',
        title: t('General'),
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
          {
            title: t('nav.apiKeys'),
            url: '/apikeys',
            icon: KeyRound,
          },
          {
            title: t('nav.logs'),
            url: '/logs',
            icon: ScrollText,
          },
        ],
      },
      {
        id: 'admin',
        title: t('Admin'),
        items: [
          {
            title: t('nav.settings'),
            url: '/settings',
            icon: Settings,
          },
        ],
      },
    ],
  }
}
