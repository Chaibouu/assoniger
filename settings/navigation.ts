export interface ChildrenItem {
  title: string;
  path: string;
}
export interface NavigationItem {
  title: string;
  icon: string;
  path: string;
  children?: ChildrenItem[];
}


export  const adminNavigation  : NavigationItem[]  = [

    {
      title: 'Dashboard',
      icon: 'material-symbols:dashboard',
      path: '/admin',
    },
    {
      title: 'Paramètres',
      icon: 'material-symbols:settings',
      path: '/dashboard/settings',
    },
    {
      title: 'Pages',
      icon: 'eos-icons:admin',
      path: '#',
      children: [
        {
          title: 'Client',
          path: '/dashboard/client',
        },
        {
          title: 'Server',
          path: '/dashboard/server',
        },
      ],
    },



  ];
export  const managerNavigation : NavigationItem[] = [

    {
      title: 'Dashboard',
      icon: 'material-symbols:dashboard',
      path: '/dashboard',
      children: [
        {
          title: 'eCommerce',
          path: '/dashboard',
        },
      ],
    },
    {
      title: 'Créer un évènement',
      icon: 'material-symbols:event',
      path: '/dashboard/create-event',
    },
    {
      title: 'Mes évènement',
      icon: 'mdi:events',
      path: '/dashboard/events',
    },
    {
      title: 'Calendar',
      icon: 'ion:calendar',
      path: '/dashboard/calendar',
    },
    {
      title: 'Profile',
      icon: 'ion:person',
      path: '/dashboard/profile',
    },
    {
      title: 'Forms',
      icon: 'ion:document-text',
      path: '/dashboard/forms',
      children: [
        {
          title: 'Form Elements',
          path: '/dashboard/forms/form-elements',
        },
        {
          title: 'Form Layout',
          path: '/dashboard/forms/form-layout',
        },
      ],
    },
    {
      title: 'Tables',
      icon: 'ion:grid-outline',
      path: '/dashboard/tables',
    },
    {
      title: 'Settings',
      icon: 'ion:settings',
      path: '/dashboard/settings',
    },
    {
      title: 'Chart',
      icon: 'ion:stats-chart',
      path: '/dashboard/chart',
    },
    {
      title: 'UI Elements',
      icon: 'ion:apps',
      path: '/dashboard/ui',
      children: [
        {
          title: 'Alerts',
          path: '/dashboard/ui/alerts',
        },
        {
          title: 'Buttons',
          path: '/dashboard/ui/buttons',
        },
      ],
    },
  ];
export  const collaboratorsNavigation :NavigationItem[] = [

    {
      title: 'Dashboards',
      icon: 'material-symbols:dashboard',
      path: '/dashboard',
      children: [
        {
          title: 'eCommerce',
          path: '/dashboard',
        },
      ],
    },
    {
      title: 'Créer un évènement',
      icon: 'material-symbols:event',
      path: '/dashboard/create-event',
    },
    {
      title: 'Calendar',
      icon: 'ion:calendar',
      path: '/dashboard/calendar',
    },
    {
      title: 'Profile',
      icon: 'ion:person',
      path: '/dashboard/profile',
    },
    {
      title: 'Forms',
      icon: 'ion:document-text',
      path: '/dashboard/forms',
      children: [
        {
          title: 'Form Elements',
          path: '/dashboard/forms/form-elements',
        },
        {
          title: 'Form Layout',
          path: '/dashboard/forms/form-layout',
        },
      ],
    },
    {
      title: 'Tables',
      icon: 'ion:grid-outline',
      path: '/dashboard/tables',
    },
    {
      title: 'Settings',
      icon: 'ion:settings',
      path: '/dashboard/settings',
    },
    {
      title: 'Chart',
      icon: 'ion:stats-chart',
      path: '/dashboard/chart',
    },
    {
      title: 'UI Elements',
      icon: 'ion:apps',
      path: '/dashboard/ui',
      children: [
        {
          title: 'Alerts',
          path: '/dashboard/ui/alerts',
        },
        {
          title: 'Buttons',
          path: '/dashboard/ui/buttons',
        },
      ],
    },
  ];
  
  